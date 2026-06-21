<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;

class ActivityLogService
{
    public function log(string $action, string $description, ?string $subjectType = null, ?int $subjectId = null): void
    {
        ActivityLog::create([
            'user_id'      => Auth::id(),
            'action'       => $action,
            'description'  => $description,
            'subject_type' => $subjectType,
            'subject_id'   => $subjectId,
        ]);
    }
}
