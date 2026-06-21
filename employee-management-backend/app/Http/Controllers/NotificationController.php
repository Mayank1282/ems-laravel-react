<?php

namespace App\Http\Controllers;

use App\Models\Leave;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class NotificationController extends Controller
{
    use ApiResponse;

    /**
     * Leave-driven notifications.
     *  - Staff (admin/hr): pending leave requests that need review.
     *  - Employee: their own leaves that were recently approved/rejected.
     */
    public function index(): JsonResponse
    {
        $user = auth()->user();

        if ($user->isStaff()) {
            $items = Leave::with('user:id,name')
                ->where('status', 'pending')
                ->latest()
                ->take(20)
                ->get()
                ->map(fn (Leave $l) => [
                    'id'       => $l->id,
                    'leave_id' => $l->id,
                    'title'    => $l->user?->name . ' requested leave',
                    'message'  => "{$l->days} day(s) · {$l->start_date->format('M d')} – {$l->end_date->format('M d')}",
                    'time'     => $l->created_at->diffForHumans(),
                ]);
        } else {
            $items = Leave::where('user_id', $user->id)
                ->where('status', '!=', 'pending')
                ->whereNotNull('reviewed_at')
                ->latest('reviewed_at')
                ->take(20)
                ->get()
                ->map(fn (Leave $l) => [
                    'id'       => $l->id,
                    'leave_id' => $l->id,
                    'title'    => 'Leave ' . $l->status,
                    'message'  => "Your leave ({$l->days} day(s)) was {$l->status}.",
                    'time'     => optional($l->reviewed_at)->diffForHumans(),
                ]);
        }

        return $this->success([
            'count' => $items->count(),
            'items' => $items->values(),
        ], 'Notifications fetched.');
    }
}
