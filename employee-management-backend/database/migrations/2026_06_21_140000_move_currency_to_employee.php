<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Currency is now per-employee (set with their salary), not company-wide.
        Schema::table('employees', function (Blueprint $table) {
            $table->string('salary_currency', 3)->default('USD')->after('salary');
        });
        // Snapshot the currency on payroll & overtime so historical records stay correct.
        Schema::table('payrolls', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('net_salary');
        });
        Schema::table('overtimes', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('amount');
        });

        if (Schema::hasColumn('attendance_settings', 'currency')) {
            Schema::table('attendance_settings', fn (Blueprint $t) => $t->dropColumn('currency'));
        }
    }

    public function down(): void
    {
        Schema::table('employees', fn (Blueprint $t) => $t->dropColumn('salary_currency'));
        Schema::table('payrolls', fn (Blueprint $t) => $t->dropColumn('currency'));
        Schema::table('overtimes', fn (Blueprint $t) => $t->dropColumn('currency'));
        Schema::table('attendance_settings', fn (Blueprint $t) => $t->string('currency', 3)->default('USD'));
    }
};
