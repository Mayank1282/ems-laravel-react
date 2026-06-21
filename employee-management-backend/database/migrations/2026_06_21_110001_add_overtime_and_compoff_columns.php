<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->decimal('overtime', 10, 2)->default(0)->after('arrears');
        });
        Schema::table('leaves', function (Blueprint $table) {
            $table->decimal('comp_off_days', 4, 1)->default(0)->after('paid_days');
        });
    }

    public function down(): void
    {
        Schema::table('payrolls', function (Blueprint $table) {
            $table->dropColumn('overtime');
        });
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn('comp_off_days');
        });
    }
};
