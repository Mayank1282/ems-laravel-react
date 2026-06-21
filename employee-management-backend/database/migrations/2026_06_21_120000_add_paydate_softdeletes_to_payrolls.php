<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            if (!Schema::hasColumn('payrolls', 'pay_date')) {
                $table->date('pay_date')->nullable()->after('period_month');
            }
            if (!Schema::hasColumn('payrolls', 'deleted_at')) {
                $table->softDeletes();
            }
        });

        // The employee_id FK relies on the composite unique index, so add a
        // standalone index on employee_id before dropping the unique.
        $indexes = collect(DB::select('SHOW INDEX FROM payrolls'))->pluck('Key_name')->unique();

        if (!$indexes->contains('payrolls_employee_id_index')) {
            Schema::table('payrolls', fn (Blueprint $t) => $t->index('employee_id'));
        }
        if ($indexes->contains('payrolls_employee_id_period_month_unique')) {
            Schema::table('payrolls', fn (Blueprint $t) => $t->dropUnique('payrolls_employee_id_period_month_unique'));
        }
    }

    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropSoftDeletes();
            $table->dropColumn('pay_date');
        });
    }
};
