<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('overtimes', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->date('work_date');
            $table->boolean('is_weekend')->default(false);
            $table->decimal('hours', 5, 2);                 // overtime hours worked
            $table->enum('compensation', ['cash', 'leave']); // leave only allowed for weekend work
            $table->decimal('amount', 10, 2)->default(0);    // cash payout (added to payroll)
            $table->decimal('leave_days', 4, 1)->default(0); // comp-off days granted
            $table->boolean('paid_out')->default(false);     // cash already included in a payslip
            $table->text('note')->nullable();
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->dateTime('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('overtimes');
    }
};
