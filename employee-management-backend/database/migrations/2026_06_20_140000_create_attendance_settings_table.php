<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendance_settings', function (Blueprint $table) {
            $table->id();
            $table->time('work_start_time')->default('09:00:00');
            $table->time('work_end_time')->default('18:00:00');
            $table->unsignedInteger('required_minutes')->default(480); // 8 hours
            $table->timestamps();
        });

        // Seed a single default settings row.
        DB::table('attendance_settings')->insert([
            'work_start_time'  => '09:00:00',
            'work_end_time'    => '18:00:00',
            'required_minutes' => 480,
            'created_at'       => now(),
            'updated_at'       => now(),
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('attendance_settings');
    }
};
