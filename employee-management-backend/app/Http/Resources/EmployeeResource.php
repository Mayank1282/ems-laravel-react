<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EmployeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'employee_code'   => $this->employee_code,
            'first_name'      => $this->first_name,
            'last_name'       => $this->last_name,
            'full_name'       => $this->full_name,
            'email'           => $this->user?->email,
            'avatar_url'      => $this->user?->avatar_url,
            'phone'           => $this->phone,
            'country_code'    => $this->country_code,
            'gender'          => $this->gender,
            'date_of_birth'   => $this->date_of_birth?->toDateString(),
            'address'         => $this->address,
            'job_title'       => $this->job_title,
            'employment_type' => $this->employment_type,
            'shift_start_time' => $this->shift_start_time ? substr($this->shift_start_time, 0, 5) : null,
            'shift_end_time'   => $this->shift_end_time ? substr($this->shift_end_time, 0, 5) : null,
            'shift_required_minutes' => $this->shift_required_minutes,
            'hire_date'       => $this->hire_date?->toDateString(),
            'salary'          => $this->salary,
            'status'          => $this->status,
            'role'            => $this->user?->role,
            'department'      => new DepartmentResource($this->whenLoaded('department')),
            'user'            => new UserResource($this->whenLoaded('user')),
            'created_at'      => $this->created_at->toDateTimeString(),
        ];
    }
}
