<?php

namespace App\Services;

use App\Models\Department;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class DepartmentService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        return Department::query()
            ->when(!empty($filters['search']), fn($q) => $q->where('name', 'like', "%{$filters['search']}%"))
            ->when(isset($filters['is_active']), fn($q) => $q->where('is_active', $filters['is_active']))
            ->withCount(['employees' => fn($q) => $q->where('status', 'active')])
            ->orderBy('name')
            ->paginate($filters['per_page'] ?? 10);
    }

    public function create(array $data): Department
    {
        return Department::create($data);
    }

    public function update(Department $department, array $data): Department
    {
        $department->update($data);
        return $department->fresh();
    }

    public function delete(Department $department): void
    {
        $department->delete();
    }
}
