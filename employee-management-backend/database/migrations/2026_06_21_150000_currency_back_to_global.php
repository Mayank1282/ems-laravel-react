<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Currency is company-wide again (set by admin in Settings).
        if (!Schema::hasColumn('attendance_settings', 'currency')) {
            Schema::table('attendance_settings', fn (Blueprint $t) => $t->string('currency', 3)->default('USD')->after('required_minutes'));
        }
        if (Schema::hasColumn('employees', 'salary_currency')) {
            Schema::table('employees', fn (Blueprint $t) => $t->dropColumn('salary_currency'));
        }
        // payrolls.currency & overtimes.currency stay as historical snapshots of the company currency.
    }

    public function down(): void
    {
        Schema::table('attendance_settings', fn (Blueprint $t) => $t->dropColumn('currency'));
        Schema::table('employees', fn (Blueprint $t) => $t->string('salary_currency', 3)->default('USD'));
    }
};
