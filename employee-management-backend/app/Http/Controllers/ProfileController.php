<?php

namespace App\Http\Controllers;

use App\Http\Requests\ProfileUpdateRequest;
use App\Http\Resources\UserResource;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProfileController extends Controller
{
    use ApiResponse;

    public function show(): JsonResponse
    {
        $user = auth()->user()->load('employee.department');

        return $this->success(new UserResource($user), 'Profile fetched successfully.');
    }

    public function update(ProfileUpdateRequest $request): JsonResponse
    {
        $user = auth()->user();
        $data = $request->validated();

        // Security: an admin's login email cannot be changed (prevents credential takeover).
        if ($user->isAdmin()) {
            unset($data['email']);
        }

        $user->update($data);

        return $this->success(new UserResource($user->fresh()), 'Profile updated successfully.');
    }

    public function uploadAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
        ]);

        $user = auth()->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return $this->success([
            'avatar_url' => asset('storage/' . $path),
        ], 'Avatar uploaded successfully.');
    }
}
