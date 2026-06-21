<?php

namespace App\Http\Controllers;

use App\Http\Resources\ActivityLogResource;
use App\Models\ActivityLog;
use App\Models\Department;
use App\Models\Employee;
use App\Models\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class DashboardController extends Controller
{
    use ApiResponse;

    public function stats(): JsonResponse
    {
        $stats = [
            'total_employees'    => Employee::count(),
            'active_employees'   => Employee::where('status', 'active')->count(),
            'inactive_employees' => Employee::where('status', 'inactive')->count(),
            'total_departments'  => Department::where('is_active', true)->count(),
            'new_hires_this_month' => Employee::whereMonth('hire_date', now()->month)
                ->whereYear('hire_date', now()->year)
                ->count(),
            'employees_by_department' => Department::withCount(['employees' => fn($q) => $q->where('status', 'active')])
                ->having('employees_count', '>', 0)
                ->orderByDesc('employees_count')
                ->get(['id', 'name', 'employees_count']),
            'employees_by_type' => Employee::selectRaw('employment_type, count(*) as count')
                ->groupBy('employment_type')
                ->get(),
        ];

        // Hiring trend: employees added per year, broken down by department (for a stacked bar chart).
        $hires = Employee::with('department:id,name')->get(['id', 'hire_date', 'department_id']);
        $deptNames = $hires->map(fn ($e) => $e->department?->name ?? 'Unassigned')->unique()->values();

        $hiresByYear = $hires
            ->groupBy(fn ($e) => $e->hire_date ? $e->hire_date->format('Y') : 'Unknown')
            ->map(function ($group, $year) use ($deptNames) {
                $row = ['year' => $year];
                foreach ($deptNames as $name) {
                    $row[$name] = $group->filter(fn ($e) => ($e->department?->name ?? 'Unassigned') === $name)->count();
                }
                $row['total'] = $group->count();
                return $row;
            })
            ->sortBy('year')
            ->values();

        $stats['hires_by_year'] = $hiresByYear;
        $stats['hire_departments'] = $deptNames;

        $recentActivities = ActivityLog::with('user')
            ->latest()
            ->take(10)
            ->get();

        return $this->success([
            'stats'             => $stats,
            'recent_activities' => ActivityLogResource::collection($recentActivities),
        ], 'Dashboard data fetched successfully.');
    }
}
