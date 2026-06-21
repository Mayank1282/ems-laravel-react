<?php

namespace App\Http\Controllers;

use App\Models\AttendanceSetting;
use App\Models\Employee;
use App\Models\Increment;
use App\Models\Leave;
use App\Models\Overtime;
use App\Models\Payroll;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SalaryController extends Controller
{
    use ApiResponse;

    /**
     * This year's anniversary date for an employee (hire month/day, current year).
     */
    private function anniversary(Employee $e): ?Carbon
    {
        if (!$e->hire_date) return null;
        return Carbon::parse($e->hire_date)->setYear(now()->year);
    }

    /**
     * Has the employee already been incremented for the current anniversary year?
     */
    private function incrementedThisYear(Employee $e): bool
    {
        return $e->increments()
            ->whereYear('effective_date', now()->year)
            ->exists();
    }

    /**
     * Staff overview: every employee with salary + increment status.
     */
    public function overview(): JsonResponse
    {
        $paginator = Employee::with('user:id,name,email,role')
            ->whereHas('user', fn ($q) => $q->where('role', '!=', 'admin')) // admins are never enlisted
            ->orderBy('first_name')
            ->paginate(10);

        $rows = collect($paginator->items())->map(function (Employee $e) {
            $anniv = $this->anniversary($e);
            // Has the employee completed at least one full year of service?
            $completedYear = $e->hire_date && Carbon::parse($e->hire_date)->lte(now()->copy()->subYear());
            $eligible = $completedYear && $anniv && now()->gte($anniv);
            $inc = $e->increments()->whereYear('effective_date', now()->year)->latest()->first();
            $done = (bool) $inc;

            return [
                'id'              => $e->id,
                'employee_code'   => $e->employee_code,
                'name'            => $e->full_name,
                'email'           => $e->user?->email,
                'role'            => $e->user?->role,
                'job_title'       => $e->job_title,
                'hire_date'       => optional($e->hire_date)->toDateString(),
                'salary'          => (float) $e->salary,
                'anniversary'     => optional($anniv)->toDateString(),
                'completed_year'  => $completedYear,    // 1 year of service done
                'eligible'        => $eligible,         // anniversary reached → can increment
                'increment_due'   => $eligible && !$done,
                'incremented'     => $done,
                'increment_amount'=> $inc ? (float) $inc->amount : null,
                'increment_edited'=> $inc ? (bool) $inc->edited : false,
                // Months that already have a payslip (disabled in the picker until deleted).
                'payslip_months'  => Payroll::where('employee_id', $e->id)
                    ->pluck('period_month')->map(fn ($d) => Carbon::parse($d)->format('Y-m'))->values(),
            ];
        });

        return $this->paginate($paginator, $rows, 'Salary overview fetched.');
    }

    /**
     * Apply a yearly increment (staff only). Effective from the anniversary;
     * if processed late, back-pay arrears are computed for the delayed months.
     */
    public function addIncrement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id'    => ['required', 'exists:employees,id'],
            'amount'         => ['required', 'numeric', 'min:1'],
            'effective_date' => ['nullable', 'date'],
            'note'           => ['nullable', 'string', 'max:255'],
        ]);

        $employee = Employee::findOrFail($data['employee_id']);

        // Increments are only allowed once the employee has completed one full year.
        if (!$employee->hire_date || Carbon::parse($employee->hire_date)->gt(now()->copy()->subYear())) {
            return $this->error('Increment is only available after the employee completes 1 year of service.', 422);
        }

        // Only one increment per anniversary year.
        if ($this->incrementedThisYear($employee)) {
            return $this->error('This employee has already been incremented this year. Next increment is available next year.', 422);
        }

        $effective = isset($data['effective_date'])
            ? Carbon::parse($data['effective_date'])
            : ($this->anniversary($employee) ?? now());

        $previous = (float) $employee->salary;
        $amount   = (float) $data['amount'];
        $newSalary = $previous + $amount;

        // Arrears = increment x full months between the effective date and now.
        $monthsDelayed = max(0, $effective->copy()->startOfMonth()->diffInMonths(now()->startOfMonth()));
        $arrears = $amount * $monthsDelayed;

        $increment = Increment::create([
            'employee_id'     => $employee->id,
            'previous_salary' => $previous,
            'amount'          => $amount,
            'new_salary'      => $newSalary,
            'effective_date'  => $effective->toDateString(),
            'arrears_amount'  => $arrears,
            'arrears_paid'    => false,
            'processed_at'    => now(),
            'processed_by'    => auth()->id(),
            'note'            => $data['note'] ?? null,
        ]);

        // The employee's current salary becomes the new (incremented) salary.
        $employee->update(['salary' => $newSalary]);

        return $this->created(
            $increment->load('employee:id,first_name,last_name'),
            $arrears > 0
                ? "Increment applied. New salary {$newSalary}. Back-pay arrears of {$arrears} for {$monthsDelayed} month(s) will be added to the next payroll."
                : "Increment applied. New salary {$newSalary}."
        );
    }

    /**
     * Correct an increment amount — allowed once per increment (staff only).
     */
    public function editIncrement(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'amount'      => ['required', 'numeric', 'min:1'],
        ]);

        $employee = Employee::findOrFail($data['employee_id']);
        $inc = $employee->increments()->whereYear('effective_date', now()->year)->latest()->first();

        if (!$inc) {
            return $this->error('No increment to edit for this year.', 422);
        }
        if ($inc->edited) {
            return $this->error('This increment has already been edited once and cannot be changed again.', 422);
        }

        $newAmount = (float) $data['amount'];
        $previous  = (float) $inc->previous_salary;
        $newSalary = $previous + $newAmount;

        $effective = Carbon::parse($inc->effective_date);
        $monthsDelayed = max(0, $effective->copy()->startOfMonth()->diffInMonths(now()->startOfMonth()));
        $arrears = $newAmount * $monthsDelayed;

        $inc->update([
            'amount'         => $newAmount,
            'new_salary'     => $newSalary,
            'arrears_amount' => $arrears,
            'arrears_paid'   => false,   // corrected arrears flow into the next payslip
            'edited'         => true,
        ]);

        $employee->update(['salary' => $newSalary]);

        return $this->success(
            ['new_salary' => $newSalary, 'amount' => $newAmount],
            "Increment corrected. New salary {$newSalary}. This increment can no longer be edited."
        );
    }

    public function increments(Request $request): JsonResponse
    {
        $query = Increment::with(['employee:id,first_name,last_name,employee_code', 'processor:id,name'])->latest();
        if ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
        return $this->paginate($query->paginate(10), null, 'Increments fetched.');
    }

    /**
     * Generate (or regenerate) an employee's payroll for a month (staff only).
     * net = base salary + unpaid increment arrears - paid-leave deduction.
     */
    public function generatePayroll(Request $request): JsonResponse
    {
        $data = $request->validate([
            'employee_id' => ['required', 'exists:employees,id'],
            'month'       => ['required', 'date_format:Y-m'],
        ]);

        $employee = Employee::with('user')->findOrFail($data['employee_id']);
        $period   = Carbon::createFromFormat('Y-m', $data['month'])->startOfMonth();

        // A payslip can't be edited — only deleted & regenerated.
        $existing = Payroll::where('employee_id', $employee->id)
            ->where('period_month', $period->toDateString())
            ->exists();
        if ($existing) {
            return $this->error('Payslip for this month already exists. Delete it to regenerate (payslips cannot be edited).', 422);
        }

        $base = (float) $employee->salary;
        $perDay = $base > 0 ? $base / 30 : 0;

        // Paid (deductible) leave days approved within this month.
        $paidLeaveDays = (int) Leave::where('user_id', $employee->user_id)
            ->where('status', 'approved')
            ->whereYear('start_date', $period->year)
            ->whereMonth('start_date', $period->month)
            ->sum('paid_days');
        $leaveDeduction = round($perDay * $paidLeaveDays, 2);

        // Unpaid increment arrears for this employee.
        $arrearsRows = $employee->increments()->where('arrears_paid', false)->where('arrears_amount', '>', 0)->get();
        $arrears = (float) $arrearsRows->sum('arrears_amount');

        // Approved cash overtime not yet paid out.
        $otRows = Overtime::where('user_id', $employee->user_id)
            ->where('status', 'approved')
            ->where('compensation', 'cash')
            ->where('paid_out', false)
            ->get();
        $overtime = (float) $otRows->sum('amount');

        $net = round($base + $arrears + $overtime - $leaveDeduction, 2);

        $payroll = Payroll::create([
            'employee_id'     => $employee->id,
            'period_month'    => $period->toDateString(),
            'pay_date'        => $period->copy()->day(5)->toDateString(), // salary credited on the 5th
            'base_salary'     => $base,
            'arrears'         => $arrears,
            'overtime'        => $overtime,
            'leave_deduction' => $leaveDeduction,
            'paid_leave_days' => $paidLeaveDays,
            'net_salary'      => $net,
            'currency'        => AttendanceSetting::current()->currency ?? 'USD',
            'generated_by'    => auth()->id(),
        ]);

        // Mark arrears + overtime as paid now that they're included in a slip.
        if ($arrears > 0) {
            $arrearsRows->each->update(['arrears_paid' => true]);
        }
        if ($overtime > 0) {
            $otRows->each->update(['paid_out' => true]);
        }

        return $this->success(
            $payroll->load('employee:id,first_name,last_name,employee_code'),
            'Payroll generated.'
        );
    }

    /**
     * Soft-delete a payslip (staff only). It can then be regenerated.
     */
    public function deletePayroll(Payroll $payroll): JsonResponse
    {
        $payroll->delete(); // soft delete
        return $this->noContent('Payslip deleted.');
    }

    /**
     * List payslips. Employees see their own; staff see all (optionally by employee).
     */
    public function payrolls(Request $request): JsonResponse
    {
        $query = Payroll::with(['employee:id,first_name,last_name,employee_code,user_id', 'generator:id,name'])
            ->orderByDesc('period_month');

        if (!auth()->user()->isStaff()) {
            $employeeId = Employee::where('user_id', auth()->id())->value('id');
            $query->where('employee_id', $employeeId);
        } elseif ($request->filled('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }

        return $this->paginate($query->paginate(10), null, 'Payrolls fetched.');
    }
}
