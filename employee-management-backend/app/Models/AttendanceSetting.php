<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AttendanceSetting extends Model
{
    protected $fillable = [
        'work_start_time',
        'work_end_time',
        'required_minutes',
        'currency',
    ];

    protected $casts = [
        'required_minutes' => 'integer',
    ];

    /**
     * Always work with the single settings row.
     */
    public static function current(): self
    {
        return static::first() ?? static::create([
            'work_start_time'  => '09:00:00',
            'work_end_time'    => '18:00:00',
            'required_minutes' => 480,
            'currency'         => 'USD',
        ]);
    }
}
