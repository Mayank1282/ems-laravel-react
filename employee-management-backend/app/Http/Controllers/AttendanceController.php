<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\AttendanceSetting;
use App\Models\Employee;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AttendanceController extends Controller
{
    use ApiResponse;

    /**
     * Get (or lazily create) today's attendance row for the current user.
     */
    private function todayRecord(): Attendance
    {
        return Attendance::firstOrCreate(
            ['user_id' => auth()->id(), 'work_date' => now()->toDateString()],
            ['status' => 'off', 'worked_seconds' => 0, 'break_seconds' => 0]
        );
    }

    private function settings(): AttendanceSetting
    {
        return AttendanceSetting::current();
    }

    /**
     * Required minutes for the current user: their personal shift overrides the global default.
     */
    private function requiredMinutesForUser(): int
    {
        $employee = Employee::where('user_id', auth()->id())->first();
        if ($employee && $employee->shift_required_minutes) {
            return (int) $employee->shift_required_minutes;
        }
        return $this->settings()->required_minutes;
    }

    private function respond(Attendance $attendance, string $message = 'OK'): JsonResponse
    {
        return $this->success($attendance->summary($this->requiredMinutesForUser()), $message);
    }

    /** Admins are not tracked — no attendance record is ever created for them. */
    private function notTracked(): bool
    {
        return auth()->user()->isAdmin();
    }

    /**
     * Current status for today's tracker.
     */
    public function today(): JsonResponse
    {
        if ($this->notTracked()) return $this->success(null, 'Not tracked.');
        return $this->respond($this->todayRecord(), 'Attendance fetched.');
    }

    /**
     * Start / resume work. Called automatically when the employee logs in.
     * Safe to call repeatedly — only resumes when currently off.
     */
    public function clockIn(): JsonResponse
    {
        if ($this->notTracked()) return $this->success(null, 'Not tracked.');
        $a = $this->todayRecord();

        if ($a->status === 'off') {
            $a->session_start_at = now();
            $a->first_clock_in_at = $a->first_clock_in_at ?? now();
            $a->status = 'working';
            $a->save();
        }

        return $this->respond($a, 'Clocked in.');
    }

    /**
     * Pause work and start a break.
     */
    public function startBreak(): JsonResponse
    {
        if ($this->notTracked()) return $this->success(null, 'Not tracked.');
        $a = $this->todayRecord();

        if ($a->status === 'working' && $a->session_start_at) {
            $a->worked_seconds += now()->diffInSeconds($a->session_start_at, true);
            $a->session_start_at = null;
            $a->break_start_at = now();
            $a->status = 'on_break';
            $a->save();
        }

        return $this->respond($a, 'Break started.');
    }

    /**
     * End break and resume work.
     */
    public function endBreak(): JsonResponse
    {
        if ($this->notTracked()) return $this->success(null, 'Not tracked.');
        $a = $this->todayRecord();

        if ($a->status === 'on_break' && $a->break_start_at) {
            $a->break_seconds += now()->diffInSeconds($a->break_start_at, true);
            $a->break_start_at = null;
            $a->session_start_at = now();
            $a->status = 'working';
            $a->save();
        }

        return $this->respond($a, 'Break ended.');
    }

    /**
     * Clock out (also triggered on logout). Banks any running session/break.
     */
    public function clockOut(): JsonResponse
    {
        if ($this->notTracked()) return $this->success(null, 'Not tracked.');
        $a = $this->todayRecord();

        if ($a->status === 'working' && $a->session_start_at) {
            $a->worked_seconds += now()->diffInSeconds($a->session_start_at, true);
        } elseif ($a->status === 'on_break' && $a->break_start_at) {
            $a->break_seconds += now()->diffInSeconds($a->break_start_at, true);
        }

        $a->session_start_at = null;
        $a->break_start_at = null;
        $a->status = 'off';
        $a->save();

        return $this->respond($a, 'Clocked out.');
    }

    /**
     * Read the work schedule (any authenticated user).
     */
    public function getSettings(): JsonResponse
    {
        $s = $this->settings();

        return $this->success([
            'work_start_time'  => substr($s->work_start_time, 0, 5),
            'work_end_time'    => substr($s->work_end_time, 0, 5),
            'required_minutes' => $s->required_minutes,
            'required_hours'   => round($s->required_minutes / 60, 2),
            'currency'         => $s->currency ?? 'USD',
        ], 'Settings fetched.');
    }

    /**
     * Update company settings (admin only — guarded by route middleware).
     */
    public function updateSettings(Request $request): JsonResponse
    {
        $data = $request->validate([
            'work_start_time'  => ['required', 'date_format:H:i'],
            'work_end_time'    => ['required', 'date_format:H:i', 'after:work_start_time'],
            'required_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'currency'         => ['sometimes', 'string', 'in:USD,INR,EUR,GBP,JPY,AUD,CAD,AED,SGD'],
        ]);

        $s = $this->settings();
        $s->update($data);

        return $this->success([
            'work_start_time'  => substr($s->work_start_time, 0, 5),
            'work_end_time'    => substr($s->work_end_time, 0, 5),
            'required_minutes' => $s->required_minutes,
            'required_hours'   => round($s->required_minutes / 60, 2),
            'currency'         => $s->currency ?? 'USD',
        ], 'Settings updated.');
    }

    /**
     * Admin: list today's attendance for all users.
     */
    public function index(Request $request): JsonResponse
    {
        $date = $request->query('date', now()->toDateString());
        $required = $this->settings()->required_minutes;

        $paginator = Attendance::with('user:id,name,email,role')
            ->where('work_date', $date)
            ->whereHas('user', fn ($q) => $q->where('role', '!=', 'admin')) // admins are not tracked
            ->paginate(10);

        $rows = collect($paginator->items())->map(function (Attendance $a) use ($required) {
            $worked = $a->liveWorkedSeconds();
            return [
                'id'               => $a->id,
                'user'             => $a->user,
                'status'           => $a->status,
                'first_clock_in_at'=> optional($a->first_clock_in_at)->toIso8601String(),
                'worked_seconds'   => $worked,
                'break_seconds'    => $a->liveBreakSeconds(),
                'official_seconds' => min($worked, $required * 60),
                'overtime_seconds' => max(0, $worked - $required * 60),
            ];
        });

        return $this->success([
            'date'             => $date,
            'required_minutes' => $required,
            'records'          => $rows,
            'meta'             => [
                'current_page' => $paginator->currentPage(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
                'total'        => $paginator->total(),
            ],
        ], 'Attendance list fetched.');
    }
}
