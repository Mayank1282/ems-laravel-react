<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Payroll extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'employee_id', 'period_month', 'pay_date', 'base_salary', 'arrears', 'overtime',
        'leave_deduction', 'paid_leave_days', 'net_salary', 'currency',
        'generated_by', 'note',
    ];

    protected $casts = [
        'period_month'    => 'date',
        'pay_date'        => 'date',
        'base_salary'     => 'decimal:2',
        'arrears'         => 'decimal:2',
        'overtime'        => 'decimal:2',
        'leave_deduction' => 'decimal:2',
        'net_salary'      => 'decimal:2',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function generator()
    {
        return $this->belongsTo(User::class, 'generated_by');
    }
}
