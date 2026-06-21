<?php

namespace App\Http\Controllers;

use App\Models\Employee;
use App\Models\Overtime;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class OvertimeController extends Controller
{
    use ApiResponse;

    /** Per-hour pay derived from the employee's monthly salary. */
    private function hourlyRate(Employee $employee): float
    {
        $salary = (float) $employee->salary;
        if ($salary <= 0) return 0;
        $dailyHours = $employee->shift_required_minutes ? $employee->shift_required_minutes / 60 : 8;
        return ($salary / 30) / max(1, $dailyHours);
    }

    private function dailyHours(Employee $employee): float
    {
        return $employee->shift_required_minutes ? $employee->shift_required_minutes / 60 : 8;
    }

    /**
     * List overtime. Employees see their own (view only); staff see everyone's.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Overtime::with(['user:id,name,email,role', 'reviewer:id,name'])->latest('work_date');

        if (!$request->user()->isStaff()) {
            $query->where('user_id', $request->user()->id);
        } else {
            $query->whereHas('user', fn ($q) => $q->where('role', '!=', 'admin')); // admins not enlisted
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        return $this->paginate($query->paginate(10), null, 'Overtime records fetched.');
    }

    /**
     * Record overtime for an employee (HR/admin only).
     * Weekend work may be compensated as cash or comp-off leave;
     * weekday overtime is cash only.
     */
    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'user_id'      => ['required', 'exists:users,id'],
            'work_date'    => ['required', 'date'],
            'hours'        => ['required', 'numeric', 'min:0.5', 'max:24'],
            'compensation' => ['required', 'in:cash,leave'],
            'note'         => ['nullable', 'string', 'max:255'],
        ]);

        $employee = Employee::where('user_id', $data['user_id'])->first();
        if (!$employee) {
            return $this->error('This user is not an employee.', 422);
        }

        $date = Carbon::parse($data['work_date']);
        $isWeekend = $date->isWeekend();

        // Comp-off leave is only allowed for weekend / extra-day work.
        if ($data['compensation'] === 'leave' && !$isWeekend) {
            return $this->error('Comp-off leave is only available for weekend (extra-day) work. Use cash for weekday overtime.', 422);
        }

        $hours = (float) $data['hours'];
        $amount = 0;
        $leaveDays = 0;

        if ($data['compensation'] === 'cash') {
            $amount = round($this->hourlyRate($employee) * $hours, 2);
        } else {
            $leaveDays = round($hours / $this->dailyHours($employee), 1);
        }

        $ot = Overtime::create([
            'user_id'      => $data['user_id'],
            'work_date'    => $date->toDateString(),
            'is_weekend'   => $isWeekend,
            'hours'        => $hours,
            'compensation' => $data['compensation'],
            'amount'       => $amount,
            'currency'     => \App\Models\AttendanceSetting::current()->currency ?? 'USD',
            'leave_days'   => $leaveDays,
            'note'         => $data['note'] ?? null,
            'status'       => 'approved', // HR records it directly
            'reviewed_by'  => auth()->id(),
            'reviewed_at'  => now(),
        ]);

        return $this->created(
            $ot->load('user:id,name,email,role'),
            $data['compensation'] === 'cash'
                ? "Overtime recorded · cash {$amount} added (paid in next payroll)."
                : "Overtime recorded · {$leaveDays} comp-off day(s) granted."
        );
    }

    public function update(Request $request, Overtime $overtime): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected,pending'],
        ]);
        $overtime->update([
            'status'      => $data['status'],
            'reviewed_by' => auth()->id(),
            'reviewed_at' => now(),
        ]);

        return $this->success($overtime->load('user:id,name,email,role'), "Overtime {$data['status']}.");
    }

    public function destroy(Overtime $overtime): JsonResponse
    {
        $overtime->delete();
        return $this->noContent('Overtime record removed.');
    }
}
