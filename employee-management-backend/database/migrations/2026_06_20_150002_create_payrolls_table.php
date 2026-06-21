<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payrolls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('employee_id')->constrained()->onDelete('cascade');
            $table->date('period_month');               // first day of the salary month
            $table->decimal('base_salary', 10, 2);
            $table->decimal('arrears', 10, 2)->default(0);          // increment back-pay
            $table->decimal('leave_deduction', 10, 2)->default(0);  // unpaid (paid-type) leave deduction
            $table->unsignedSmallInteger('paid_leave_days')->default(0);
            $table->decimal('net_salary', 10, 2);
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('note')->nullable();
            $table->timestamps();

            $table->unique(['employee_id', 'period_month']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payrolls');
    }
};
