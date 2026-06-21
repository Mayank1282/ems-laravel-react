<?php

use App\Http\Controllers\AttendanceController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DepartmentController;
use App\Http\Controllers\EmployeeController;
use App\Http\Controllers\LeaveController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OvertimeController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\SalaryController;
use Illuminate\Support\Facades\Route;

// Public auth routes.
// NOTE: Self-registration is disabled — accounts are created by Admin/HR only.
Route::prefix('auth')->group(function () {
    Route::post('/login', [AuthController::class, 'login']);
    Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
    Route::post('/validate-reset-token', [AuthController::class, 'validateResetToken']);
    Route::post('/reset-password', [AuthController::class, 'resetPassword']);
});

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Notifications (leave-driven)
    Route::get('/notifications', [NotificationController::class, 'index']);

    // Attendance / time tracking (all authenticated users)
    Route::prefix('attendance')->group(function () {
        Route::get('/today', [AttendanceController::class, 'today']);
        Route::post('/clock-in', [AttendanceController::class, 'clockIn']);
        Route::post('/clock-out', [AttendanceController::class, 'clockOut']);
        Route::post('/break/start', [AttendanceController::class, 'startBreak']);
        Route::post('/break/end', [AttendanceController::class, 'endBreak']);
        Route::get('/settings', [AttendanceController::class, 'getSettings']);

        Route::get('/', [AttendanceController::class, 'index'])->middleware('staff');
        Route::put('/settings', [AttendanceController::class, 'updateSettings'])->middleware('admin');
    });

    // Profile
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);
    Route::post('/profile/avatar', [ProfileController::class, 'uploadAvatar']);

    // Leaves
    Route::prefix('leaves')->group(function () {
        Route::get('/', [LeaveController::class, 'index']);
        Route::get('/balance', [LeaveController::class, 'balance']);
        Route::get('/booked-dates', [LeaveController::class, 'bookedDates']);
        Route::post('/', [LeaveController::class, 'apply']);
        Route::delete('/{leave}', [LeaveController::class, 'destroy']);
        Route::put('/{leave}/review', [LeaveController::class, 'review'])->middleware('staff');
    });

    // Overtime — employees view their own; HR/admin manage everyone's.
    Route::prefix('overtime')->group(function () {
        Route::get('/', [OvertimeController::class, 'index']);
        Route::middleware('staff')->group(function () {
            Route::post('/', [OvertimeController::class, 'store']);
            Route::put('/{overtime}', [OvertimeController::class, 'update']);
            Route::delete('/{overtime}', [OvertimeController::class, 'destroy']);
        });
    });

    // Salary / payroll
    Route::prefix('salary')->group(function () {
        Route::get('/payrolls', [SalaryController::class, 'payrolls']); // own for employee, all for staff

        Route::middleware('staff')->group(function () {
            Route::get('/overview', [SalaryController::class, 'overview']);
            Route::get('/increments', [SalaryController::class, 'increments']);
            Route::post('/increments', [SalaryController::class, 'addIncrement']);
            Route::put('/increments', [SalaryController::class, 'editIncrement']);
            Route::post('/payrolls', [SalaryController::class, 'generatePayroll']);
            Route::delete('/payrolls/{payroll}', [SalaryController::class, 'deletePayroll']);
        });
    });

    // All authenticated users can read departments list
    Route::get('/departments/all', [DepartmentController::class, 'all']);

    // Departments - admin only
    Route::middleware('admin')->group(function () {
        Route::apiResource('departments', DepartmentController::class);
    });

    // Employees - admin & HR (creating HR accounts is restricted to admin in the controller)
    Route::middleware('staff')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
    });
});
