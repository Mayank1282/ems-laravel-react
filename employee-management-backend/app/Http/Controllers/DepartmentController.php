<?php

namespace App\Http\Controllers;

use App\Http\Requests\DepartmentRequest;
use App\Http\Resources\DepartmentResource;
use App\Models\Department;
use App\Services\ActivityLogService;
use App\Services\DepartmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DepartmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private DepartmentService $departmentService,
        private ActivityLogService $activityLogService
    ) {}

    public function index(Request $request): JsonResponse
    {
        $departments = $this->departmentService->list($request->only(['search', 'is_active', 'per_page']));

        return $this->success(
            DepartmentResource::collection($departments)->response()->getData(true),
            'Departments fetched successfully.'
        );
    }

    public function store(DepartmentRequest $request): JsonResponse
    {
        $department = $this->departmentService->create($request->validated());

        $this->activityLogService->log(
            'created',
            "Created department: {$department->name}",
            Department::class,
            $department->id
        );

        return $this->created(new DepartmentResource($department), 'Department created successfully.');
    }

    public function show(Department $department): JsonResponse
    {
        $department->loadCount(['employees' => fn($q) => $q->where('status', 'active')]);

        return $this->success(new DepartmentResource($department), 'Department fetched successfully.');
    }

    public function update(DepartmentRequest $request, Department $department): JsonResponse
    {
        $department = $this->departmentService->update($department, $request->validated());

        $this->activityLogService->log(
            'updated',
            "Updated department: {$department->name}",
            Department::class,
            $department->id
        );

        return $this->success(new DepartmentResource($department), 'Department updated successfully.');
    }

    public function destroy(Department $department): JsonResponse
    {
        if ($department->employees()->exists()) {
            return $this->error('Cannot delete department with active employees.', 422);
        }

        $name = $department->name;
        $this->departmentService->delete($department);

        $this->activityLogService->log('deleted', "Deleted department: {$name}");

        return $this->noContent('Department deleted successfully.');
    }

    public function all(): JsonResponse
    {
        $departments = Department::where('is_active', true)->orderBy('name')->get();
        return $this->success(DepartmentResource::collection($departments), 'Departments fetched.');
    }
}
