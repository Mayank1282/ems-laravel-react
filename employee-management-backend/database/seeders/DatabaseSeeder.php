<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::firstOrCreate(
            ['email' => 'admin@yopmail.com'],
            [
                'name'     => 'Admin User',
                'email'    => 'admin@yopmail.com',
                'password' => Hash::make('password'),
                'role'     => 'admin',
            ]
        );

        $this->call([
            DepartmentSeeder::class,
            EmployeeSeeder::class,
        ]);
    }
}
