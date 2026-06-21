<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'action'      => $this->action, // created | updated | deleted
            'description' => $this->description,
            'entity'      => $this->subject_type ? class_basename($this->subject_type) : null, // Employee | Department | ...
            'user'        => [
                'id'   => $this->user?->id,
                'name' => $this->user?->name,
                'role' => $this->user?->role,
            ],
            'created_at'  => $this->created_at->diffForHumans(),
        ];
    }
}
