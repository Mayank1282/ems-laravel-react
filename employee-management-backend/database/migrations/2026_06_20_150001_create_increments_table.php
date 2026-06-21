<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('increments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->decimal('previous_salary', 10, 2);
            $table->decimal('amount', 10, 2);          // increment amount per month
            $table->decimal('new_salary', 10, 2);
            $table->date('effective_date');            // anniversary date the raise applies from
            $table->decimal('arrears_amount', 10, 2)->default(0); // back-pay for delayed processing
            $table->boolean('arrears_paid')->default(false);
            $table->dateTime('processed_at');
            $table->foreignId('processed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('increments');
    }
};
