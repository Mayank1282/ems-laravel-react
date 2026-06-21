<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Models\Overtime;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class LeaveController extends Controller
{
    use ApiResponse;

    const ANNUAL_QUOTA = 12;   // base casual leaves per year
    const MONTHLY_CASUAL = 2;  // casual leaves allowed per month
    const MAX_CARRY_FORWARD = 6; // at most half the quota carries to next year

    /** Casual days consumed (approved + pending) in a given year. */
    private function usedInYear(int $userId, int $year): float
    {
        return (float) Leave::where('user_id', $userId)
            ->where('status', '!=', 'rejected')
            ->whereYear('start_date', $year)
            ->sum('casual_days');
    }

    /**
     * Leaves carried into $year from the previous year:
     * min(unused last year, 6). Recurses a few years back so chained
     * carry-forward stays accurate, with a depth guard.
     */
    private function carryForwardInto(int $userId, int $year, int $depth = 0): float
    {
        if ($depth > 5) return 0;
        $prevQuota = self::ANNUAL_QUOTA + $this->carryForwardInto($userId, $year - 1, $depth + 1);
        $prevUnused = max(0, $prevQuota - $this->usedInYear($userId, $year - 1));
        return min($prevUnused, self::MAX_CARRY_FORWARD);
    }

    /**
     * Compute a user's casual-leave balance, including carry-forward.
     */
    private function balanceFor(int $userId): array
    {
        $year  = now()->year;
        $month = now()->month;

        $carry = $this->carryForwardInto($userId, $year);
        $annualQuota = self::ANNUAL_QUOTA + $carry;

        $yearUsed = $this->usedInYear($userId, $year);
        $monthUsed = (float) Leave::where('user_id', $userId)
            ->where('status', '!=', 'rejected')
            ->whereYear('start_date', $year)
            ->whereMonth('start_date', $month)
            ->sum('casual_days');

        // Comp-off earned from approved weekend overtime, minus what's been used.
        $compEarned = (float) Overtime::where('user_id', $userId)
            ->where('status', 'approved')
            ->where('compensation', 'leave')
            ->sum('leave_days');
        $compUsed = (float) Leave::where('user_id', $userId)
            ->where('status', '!=', 'rejected')
            ->sum('comp_off_days');
        $compAvailable = max(0, $compEarned - $compUsed);

        return [
            'base_quota'          => self::ANNUAL_QUOTA,
            'carried_forward'     => $carry,
            'annual_quota'        => $annualQuota,
            'monthly_casual'      => self::MONTHLY_CASUAL,
            'casual_used_year'    => $yearUsed,
            'casual_used_month'   => $monthUsed,
            'casual_left_year'    => max(0, $annualQuota - $yearUsed),
            'casual_left_month'   => max(0, self::MONTHLY_CASUAL - $monthUsed),
            'comp_off_available'  => $compAvailable,
        ];
    }

    public function balance(): JsonResponse
    {
        return $this->success($this->balanceFor(auth()->id()), 'Leave balance fetched.');
    }

    /**
     * Exact dates a user already has booked (pending/approved).
     * Uses the stored `dates` list when present, else expands start..end.
     */
    private function bookedSet(int $userId): array
    {
        $leaves = Leave::where('user_id', $userId)
            ->whereIn('status', ['pending', 'approved'])
            ->get(['start_date', 'end_date', 'dates']);

        $dates = [];
        foreach ($leaves as $l) {
            if (is_array($l->dates) && count($l->dates)) {
                $dates = array_merge($dates, $l->dates);
            } else {
                $d = $l->start_date->copy();
                while ($d->lte($l->end_date)) {
                    $dates[] = $d->toDateString();
                    $d->addDay();
                }
            }
        }

        return array_values(array_unique($dates));
    }

    /**
     * Dates the user already has booked (pending/approved) — the UI disables
     * these in the calendar. Rejected leaves free their dates.
     */
    public function bookedDates(): JsonResponse
    {
        return $this->success($this->bookedSet(auth()->id()), 'Booked dates fetched.');
    }

    /**
     * List leaves. Employees see their own; staff see everyone's.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Leave::with(['user:id,name,email,role', 'reviewer:id,name'])->latest();

        if (!auth()->user()->isStaff()) {
            $query->where('user_id', auth()->id());
        } else {
            // Admins are never enlisted as leave-takers.
            $query->whereHas('user', fn ($q) => $q->where('role', '!=', 'admin'));
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        return $this->paginate($query->paginate(10), null, 'Leaves fetched.');
    }

    /**
     * Apply for leave. Days are auto-classified casual (free) vs paid (deducted)
     * based on the remaining monthly/annual casual quota.
     */
    public function apply(Request $request): JsonResponse
    {
        $data = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date'   => ['required', 'date', 'after_or_equal:start_date'],
            'half_day'   => ['sometimes', 'boolean'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_time'   => ['nullable', 'date_format:H:i', 'after:start_time'],
            'reason'     => ['nullable', 'string', 'max:500'],
        ]);

        $start = Carbon::parse($data['start_date']);
        $end   = Carbon::parse($data['end_date']);
        $halfDay = (bool) ($data['half_day'] ?? false);
        if ($halfDay) $end = $start->copy();

        // All calendar dates in the requested range.
        $rangeDates = [];
        $d = $start->copy();
        while ($d->lte($end)) { $rangeDates[] = $d->toDateString(); $d->addDay(); }

        // Overlap is allowed — already-booked days are skipped (this becomes an "add-on" leave).
        $booked = $this->bookedSet(auth()->id());
        $freeDates = array_values(array_diff($rangeDates, $booked));
        $skipped = count($rangeDates) - count($freeDates);

        if (empty($freeDates)) {
            return $this->error('All selected dates are already booked.', 422);
        }

        $isAddon = $skipped > 0;
        $days = $halfDay ? 0.5 : count($freeDates);

        $balance = $this->balanceFor(auth()->id());
        // Order: free casual quota → earned comp-off → paid (deducted).
        $casualAllowed = min($balance['casual_left_month'], $balance['casual_left_year']);
        $casualDays = min($days, $casualAllowed);
        $remaining  = round($days - $casualDays, 1);
        $compDays   = min($remaining, $balance['comp_off_available']);
        $paidDays   = round($remaining - $compDays, 1);

        $leave = Leave::create([
            'user_id'       => auth()->id(),
            'start_date'    => min($freeDates),
            'end_date'      => max($freeDates),
            'dates'         => $freeDates,
            'is_addon'      => $isAddon,
            'half_day'      => $halfDay,
            'start_time'    => $halfDay ? ($data['start_time'] ?? null) : null,
            'end_time'      => $halfDay ? ($data['end_time'] ?? null) : null,
            'days'          => $days,
            'casual_days'   => $casualDays,
            'comp_off_days' => $compDays,
            'paid_days'     => $paidDays,
            'reason'        => $data['reason'] ?? null,
            'status'        => 'pending',
        ]);

        $parts = [];
        if ($casualDays > 0) $parts[] = "{$casualDays} casual";
        if ($compDays > 0)   $parts[] = "{$compDays} comp-off";
        if ($paidDays > 0)   $parts[] = "{$paidDays} paid (deductible)";

        $msg = ($isAddon ? 'Add-on leave applied. ' : 'Leave applied. ')
            . (count($parts) ? implode(' + ', $parts) . ' day(s).' : '')
            . ($skipped > 0 ? " {$skipped} already-booked day(s) skipped." : '');

        return $this->created($leave->load('user:id,name,email,role'), $msg);
    }

    /**
     * Approve or reject a leave (staff only — guarded by route middleware).
     */
    public function review(Request $request, Leave $leave): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
        ]);

        $leave->update([
            'status'      => $data['status'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return $this->success(
            $leave->load(['user:id,name,email,role', 'reviewer:id,name']),
            "Leave {$data['status']}."
        );
    }

    public function destroy(Leave $leave): JsonResponse
    {
        // Employees can cancel their own pending leaves.
        if (!auth()->user()->isStaff() && $leave->user_id !== auth()->id()) {
            return $this->error('Unauthorized.', 403);
        }
        $leave->delete();

        return $this->noContent('Leave removed.');
    }
}
