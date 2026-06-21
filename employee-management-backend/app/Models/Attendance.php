<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Carbon;

class Attendance extends Model
{
    protected $fillable = [
        'user_id',
        'work_date',
        'first_clock_in_at',
        'session_start_at',
        'break_start_at',
        'worked_seconds',
        'break_seconds',
        'status',
    ];

    protected $casts = [
        'work_date'         => 'date',
        'first_clock_in_at' => 'datetime',
        'session_start_at'  => 'datetime',
        'break_start_at'    => 'datetime',
        'worked_seconds'    => 'integer',
        'break_seconds'     => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Live worked seconds = accumulated + current running session.
     */
    public function liveWorkedSeconds(): int
    {
        $seconds = $this->worked_seconds;
        if ($this->status === 'working' && $this->session_start_at) {
            $seconds += now()->diffInSeconds($this->session_start_at, true);
        }
        return $seconds;
    }

    /**
     * Live break seconds = accumulated + current running break.
     */
    public function liveBreakSeconds(): int
    {
        $seconds = $this->break_seconds;
        if ($this->status === 'on_break' && $this->break_start_at) {
            $seconds += now()->diffInSeconds($this->break_start_at, true);
        }
        return $seconds;
    }

    /**
     * Build the summary payload sent to the frontend.
     */
    public function summary(int $requiredMinutes): array
    {
        $worked   = $this->liveWorkedSeconds();
        $required = $requiredMinutes * 60;

        return [
            'id'                => $this->id,
            'work_date'         => $this->work_date->toDateString(),
            'status'            => $this->status,
            'first_clock_in_at' => optional($this->first_clock_in_at)->toIso8601String(),
            'worked_seconds'    => $worked,
            'break_seconds'     => $this->liveBreakSeconds(),
            'official_seconds'  => min($worked, $required),
            'overtime_seconds'  => max(0, $worked - $required),
            'required_seconds'  => $required,
            'is_complete'       => $worked >= $required,
            // server timestamps so the client can run a live ticking clock accurately
            'session_start_at'  => optional($this->session_start_at)->toIso8601String(),
            'break_start_at'    => optional($this->break_start_at)->toIso8601String(),
            'server_now'        => now()->toIso8601String(),
        ];
    }
}
