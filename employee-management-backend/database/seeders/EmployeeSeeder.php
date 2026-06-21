<?php

namespace Database\Seeders;

use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class EmployeeSeeder extends Seeder
{
    public function run(): void
    {
        $departments = Department::all();
        $types = ['full_time', 'part_time', 'contract'];
        $genders = ['male', 'female'];

        $employees = [
            ['first_name' => 'Alice', 'last_name' => 'Johnson', 'job_title' => 'Senior Engineer'],
            ['first_name' => 'Bob', 'last_name' => 'Smith', 'job_title' => 'Product Manager'],
            ['first_name' => 'Carol', 'last_name' => 'Williams', 'job_title' => 'UX Designer'],
            ['first_name' => 'David', 'last_name' => 'Brown', 'job_title' => 'Marketing Lead'],
            ['first_name' => 'Eve', 'last_name' => 'Davis', 'job_title' => 'Sales Executive'],
            ['first_name' => 'Frank', 'last_name' => 'Miller', 'job_title' => 'DevOps Engineer'],
            ['first_name' => 'Grace', 'last_name' => 'Wilson', 'job_title' => 'HR Specialist'],
            ['first_name' => 'Henry', 'last_name' => 'Moore', 'job_title' => 'Finance Analyst'],
        ];

        foreach ($employees as $index => $emp) {
            $email = strtolower($emp['first_name'] . '.' . $emp['last_name']) . '@company.com';

            if (User::where('email', $email)->exists()) continue;

            $user = User::create([
                'name'     => $emp['first_name'] . ' ' . $emp['last_name'],
                'email'    => $email,
                'password' => Hash::make('password'),
                'role'     => 'employee',
            ]);

            Employee::create([
                'user_id'         => $user->id,
                'department_id'   => $departments->random()->id,
                'employee_code'   => 'EMP-' . str_pad($index + 2, 4, '0', STR_PAD_LEFT),
                'first_name'      => $emp['first_name'],
                'last_name'       => $emp['last_name'],
                'job_title'       => $emp['job_title'],
                'employment_type' => $types[array_rand($types)],
                'gender'          => $genders[array_rand($genders)],
                'hire_date'       => now()->subDays(rand(30, 730)),
                'salary'          => rand(40000, 120000),
                'status'          => 'active',
                'phone'           => '+1-555-' . rand(1000, 9999),
            ]);
        }
    }
}
