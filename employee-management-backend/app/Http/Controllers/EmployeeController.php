<?php

namespace App\Http\Controllers;

use App\Http\Requests\EmployeeRequest;
use App\Http\Resources\EmployeeResource;
use App\Models\Employee;
use App\Services\ActivityLogService;
use App\Services\EmployeeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmployeeController extends Controller
{
    use ApiResponse;

    public function __construct(
        private EmployeeService $employeeService,
        private ActivityLogService $activityLogService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $employees = $this->employeeService->list(
            $request->only(['search', 'department_id', 'status', 'employment_type', 'per_page'])
        );

        return $this->success(
            EmployeeResource::collection($employees)->response()->getData(true),
            'Employees fetched successfully.'
        );
    }

    public function store(EmployeeRequest $request): JsonResponse
    {
        $data = $request->validated();
        // Only admins may create HR accounts; HR can only create regular employees.
        if (($data['role'] ?? null) === 'hr' && !$request->user()->isAdmin()) {
            $data['role'] = 'employee';
        }
        $employee = $this->employeeService->create($data);

        $this->activityLogService->log(
            'created',
            "Added employee: {$employee->full_name} ({$employee->employee_code})",
            Employee::class,
            $employee->id
        );

        $employee->load(['user', 'department']);

        return $this->created(new EmployeeResource($employee), 'Employee created successfully.');
    }

    public function show(Employee $employee): JsonResponse
    {
        $employee->load(['user', 'department']);

        return $this->success(new EmployeeResource($employee), 'Employee fetched successfully.');
    }

    public function update(EmployeeRequest $request, Employee $employee): JsonResponse
    {
        $data = $request->validated();
        if (($data['role'] ?? null) === 'hr' && !$request->user()->isAdmin()) {
            unset($data['role']);
        }
        $employee = $this->employeeService->update($employee, $data);

        $this->activityLogService->log(
            'updated',
            "Updated employee: {$employee->full_name}",
            Employee::class,
            $employee->id
        );

        return $this->success(new EmployeeResource($employee), 'Employee updated successfully.');
    }

    public function destroy(Employee $employee): JsonResponse
    {
        $name = $employee->full_name;
        $this->employeeService->delete($employee);

        $this->activityLogService->log('deleted', "Removed employee: {$name}");

        return $this->noContent('Employee deleted successfully.');
    }
}
