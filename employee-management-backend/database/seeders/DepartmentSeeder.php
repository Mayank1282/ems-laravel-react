<?php

namespace Database\Seeders;

use App\Models\Department;
use Illuminate\Database\Seeder;

class DepartmentSeeder extends Seeder
{
    public function run(): void
    {
        $departments = [
            ['name' => 'Engineering', 'description' => 'Software development and technical operations'],
            ['name' => 'Human Resources', 'description' => 'People operations and talent management'],
            ['name' => 'Marketing', 'description' => 'Brand, growth, and customer acquisition'],
            ['name' => 'Finance', 'description' => 'Financial planning and accounting'],
            ['name' => 'Operations', 'description' => 'Business operations and process management'],
            ['name' => 'Sales', 'description' => 'Revenue generation and client relationships'],
            ['name' => 'Design', 'description' => 'Product and graphic design'],
        ];

        foreach ($departments as $dept) {
            Department::firstOrCreate(['name' => $dept['name']], $dept);
        }
    }
}
