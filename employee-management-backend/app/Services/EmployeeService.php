<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmployeeService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Employee::with(['user', 'department'])
            ->whereHas('user', fn ($q) => $q->where('role', '!=', 'admin')) // admins are never enlisted
            ->when(!empty($filters['search']), function ($q) use ($filters) {
                $q->where(function ($q) use ($filters) {
                    $q->where('first_name', 'like', "%{$filters['search']}%")
                      ->orWhere('last_name', 'like', "%{$filters['search']}%")
                      ->orWhere('employee_code', 'like', "%{$filters['search']}%")
                      ->orWhereHas('user', fn($q) => $q->where('email', 'like', "%{$filters['search']}%"));
                });
            })
            ->when(!empty($filters['department_id']), fn($q) => $q->where('department_id', $filters['department_id']))
            ->when(!empty($filters['status']), fn($q) => $q->where('status', $filters['status']))
            ->when(!empty($filters['employment_type']), fn($q) => $q->where('employment_type', $filters['employment_type']))
            ->orderBy('first_name')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function create(array $data): Employee
    {
        $employee = DB::transaction(function () use ($data) {
            $user = User::create([
                'name'     => $data['first_name'] . ' ' . $data['last_name'],
                'email'    => $data['email'],
                'password' => Hash::make($data['password']),
                'role'     => $data['role'] ?? 'employee',
            ]);

            $employeeCode = $this->generateEmployeeCode();

            return Employee::create([
                'user_id'          => $user->id,
                'department_id'    => $data['department_id'] ?? null,
                'employee_code'    => $employeeCode,
                'first_name'       => $data['first_name'],
                'last_name'        => $data['last_name'],
                'phone'            => $data['phone'] ?? null,
                'country_code'     => $data['country_code'] ?? null,
                'gender'           => $data['gender'] ?? null,
                'date_of_birth'    => $data['date_of_birth'] ?? null,
                'address'          => $data['address'] ?? null,
                'job_title'        => $data['job_title'] ?? null,
                'employment_type'  => $data['employment_type'] ?? 'full_time',
                'shift_start_time' => $data['shift_start_time'] ?? null,
                'shift_end_time'   => $data['shift_end_time'] ?? null,
                'shift_required_minutes' => $data['shift_required_minutes'] ?? null,
                'hire_date'        => $data['hire_date'],
                'salary'           => $data['salary'] ?? null,
                'status'           => $data['status'] ?? 'active',
            ]);
        });

        // Email the new account its login credentials (HR onboarding).
        $this->sendCredentials($data['email'], $data['first_name'], $data['password']);

        return $employee;
    }

    /**
     * Send login credentials to a newly created account.
     * With MAIL_MAILER=log this is written to storage/logs/laravel.log.
     */
    private function sendCredentials(string $email, string $name, string $password): void
    {
        $loginUrl = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/') . '/login';
        $appName  = config('app.name', 'Employee Management System');

        $body = "Hello {$name},\n\n"
            . "An account has been created for you on {$appName}.\n\n"
            . "Login URL: {$loginUrl}\n"
            . "Email: {$email}\n"
            . "Temporary Password: {$password}\n\n"
            . "Please log in and change your password from your profile.\n\n"
            . "Regards,\nHR Team";

        try {
            Mail::raw($body, function ($message) use ($email, $appName) {
                $message->to($email)->subject("Your {$appName} login credentials");
            });
        } catch (\Throwable $e) {
            // Never block employee creation if mail delivery fails.
            Log::warning('Failed to send credentials email to ' . $email . ': ' . $e->getMessage());
        }
    }

    public function update(Employee $employee, array $data): Employee
    {
        return DB::transaction(function () use ($employee, $data) {
            $employee->update([
                'department_id'   => $data['department_id'] ?? $employee->department_id,
                'first_name'      => $data['first_name'] ?? $employee->first_name,
                'last_name'       => $data['last_name'] ?? $employee->last_name,
                'phone'           => $data['phone'] ?? $employee->phone,
                'country_code'    => array_key_exists('country_code', $data) ? $data['country_code'] : $employee->country_code,
                'gender'          => $data['gender'] ?? $employee->gender,
                'date_of_birth'   => $data['date_of_birth'] ?? $employee->date_of_birth,
                'address'         => $data['address'] ?? $employee->address,
                'job_title'       => $data['job_title'] ?? $employee->job_title,
                'employment_type' => $data['employment_type'] ?? $employee->employment_type,
                'shift_start_time' => array_key_exists('shift_start_time', $data) ? $data['shift_start_time'] : $employee->shift_start_time,
                'shift_end_time'   => array_key_exists('shift_end_time', $data) ? $data['shift_end_time'] : $employee->shift_end_time,
                'shift_required_minutes' => array_key_exists('shift_required_minutes', $data) ? $data['shift_required_minutes'] : $employee->shift_required_minutes,
                'hire_date'       => $data['hire_date'] ?? $employee->hire_date,
                'salary'          => $data['salary'] ?? $employee->salary,
                'status'          => $data['status'] ?? $employee->status,
            ]);

            $employee->user->update([
                'name'  => $data['first_name'] . ' ' . $data['last_name'],
                'email' => $data['email'] ?? $employee->user->email,
                'role'  => $data['role'] ?? $employee->user->role,
            ]);

            return $employee->fresh(['user', 'department']);
        });
    }

    public function delete(Employee $employee): void
    {
        DB::transaction(function () use ($employee) {
            $userId = $employee->user_id;
            $employee->delete();
            User::destroy($userId);
        });
    }

    private function generateEmployeeCode(): string
    {
        $latest = Employee::orderByDesc('id')->value('employee_code');
        if (!$latest) return 'EMP-0001';
        $num = (int) substr($latest, 4) + 1;
        return 'EMP-' . str_pad($num, 4, '0', STR_PAD_LEFT);
    }
}
