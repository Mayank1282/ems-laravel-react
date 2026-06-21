<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('work_date');

            $table->dateTime('first_clock_in_at')->nullable();
            $table->dateTime('session_start_at')->nullable();   // start of current working session (null when paused/out)
            $table->dateTime('break_start_at')->nullable();      // start of current break (null when not on break)

            $table->unsignedInteger('worked_seconds')->default(0);   // accumulated completed work
            $table->unsignedInteger('break_seconds')->default(0);    // accumulated break time

            $table->enum('status', ['working', 'on_break', 'off'])->default('off');
            $table->timestamps();

            $table->unique(['user_id', 'work_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
