<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Allow the 'hr' role (original enum only had admin/employee).
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','hr','employee') NOT NULL DEFAULT 'employee'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','employee') NOT NULL DEFAULT 'employee'");
    }
};
