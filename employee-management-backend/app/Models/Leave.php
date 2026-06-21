<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Leave extends Model
{
    protected $fillable = [
        'user_id', 'start_date', 'end_date', 'dates', 'is_addon', 'half_day', 'start_time', 'end_time', 'days',
        'casual_days', 'paid_days', 'comp_off_days', 'reason', 'status',
        'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'start_date'    => 'date',
        'end_date'      => 'date',
        'dates'         => 'array',
        'is_addon'      => 'boolean',
        'half_day'      => 'boolean',
        'days'          => 'float',
        'casual_days'   => 'float',
        'paid_days'     => 'float',
        'comp_off_days' => 'float',
        'reviewed_at'   => 'datetime',
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
