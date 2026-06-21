<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Overtime extends Model
{
    protected $fillable = [
        'user_id', 'work_date', 'is_weekend', 'hours', 'compensation',
        'amount', 'currency', 'leave_days', 'paid_out', 'note', 'status',
        'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'work_date'  => 'date',
        'is_weekend' => 'boolean',
        'hours'      => 'float',
        'amount'     => 'decimal:2',
        'leave_days' => 'float',
        'paid_out'   => 'boolean',
        'reviewed_at'=> 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
