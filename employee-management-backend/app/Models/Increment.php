<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Increment extends Model
{
    protected $fillable = [
        'employee_id', 'previous_salary', 'amount', 'new_salary',
        'effective_date', 'arrears_amount', 'arrears_paid', 'edited',
        'processed_at', 'processed_by', 'note',
    ];

    protected $casts = [
        'previous_salary' => 'decimal:2',
        'amount'          => 'decimal:2',
        'new_salary'      => 'decimal:2',
        'arrears_amount'  => 'decimal:2',
        'arrears_paid'    => 'boolean',
        'edited'          => 'boolean',
        'effective_date'  => 'date',
        'processed_at'    => 'datetime',
    ];

    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    public function processor()
    {
        return $this->belongsTo(User::class, 'processed_by');
    }
}
