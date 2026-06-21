<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->time('shift_start_time')->nullable()->after('employment_type');
            $table->time('shift_end_time')->nullable()->after('shift_start_time');
            $table->unsignedInteger('shift_required_minutes')->nullable()->after('shift_end_time'); // null -> use global default
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropColumn(['shift_start_time', 'shift_end_time', 'shift_required_minutes']);
        });
    }
};
