<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('attendance_settings', function (Blueprint $table) {
            $table->string('currency', 3)->default('USD')->after('required_minutes'); // company salary currency
        });

        Schema::table('employees', function (Blueprint $table) {
            $table->string('country_code', 6)->nullable()->after('phone'); // e.g. +91, +1
        });
    }

    public function down(): void
    {
        Schema::table('attendance_settings', fn (Blueprint $t) => $t->dropColumn('currency'));
        Schema::table('employees', fn (Blueprint $t) => $t->dropColumn('country_code'));
    }
};
