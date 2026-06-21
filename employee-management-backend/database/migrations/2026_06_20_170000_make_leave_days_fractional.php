<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->decimal('days', 4, 1)->change();
            $table->decimal('casual_days', 4, 1)->default(0)->change();
            $table->decimal('paid_days', 4, 1)->default(0)->change();
            $table->boolean('half_day')->default(false)->after('end_date');
        });
    }

    public function down(): void
    {
        Schema::table('leaves', function (Blueprint $table) {
            $table->dropColumn('half_day');
            $table->unsignedSmallInteger('days')->change();
            $table->unsignedSmallInteger('casual_days')->default(0)->change();
            $table->unsignedSmallInteger('paid_days')->default(0)->change();
        });
    }
};
