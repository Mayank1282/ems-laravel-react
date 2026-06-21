<?php

namespace App\Http\Controllers;

use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use App\Services\AuthService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Password;

class AuthController extends Controller
{
    use ApiResponse;

    public function __construct(private AuthService $authService) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return $this->created([
            'user'  => new UserResource($result['user']),
            'token' => $result['token'],
        ], 'Account created successfully.');
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login($request->validated());

        return $this->success([
            'user'  => new UserResource($result['user']),
            'token' => $result['token'],
        ], 'Logged in successfully.');
    }

    public function logout(): JsonResponse
    {
        $this->authService->logout(auth()->user());

        return $this->noContent('Logged out successfully.');
    }

    public function me(): JsonResponse
    {
        return $this->success(new UserResource(auth()->user()), 'User fetched successfully.');
    }

    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        // Security: admin credentials cannot be reset via the public flow.
        if ($this->isAdminEmail($request->email)) {
            return $this->error('Password reset is disabled for administrator accounts.', 403);
        }

        $status = Password::sendResetLink($request->only('email'));

        if ($status !== Password::RESET_LINK_SENT) {
            return $this->error('Unable to send reset link.', 400);
        }

        return $this->success(null, 'Password reset link sent to your email.');
    }

    /** True if the email belongs to an administrator account. */
    private function isAdminEmail(?string $email): bool
    {
        if (!$email) return false;
        return User::where('email', $email)->where('role', 'admin')->exists();
    }

    /**
     * Check whether a reset token is still valid (not used / not expired)
     * so the SPA can decide whether to show the reset form.
     */
    public function validateResetToken(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string'],
        ]);

        $user = User::where('email', $request->email)->first();
        // Admin accounts can never be reset through this flow.
        $valid = $user && !$user->isAdmin() && Password::getRepository()->exists($user, $request->token);

        return $this->success(['valid' => $valid], $valid ? 'Token valid.' : 'Token invalid or expired.');
    }

    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        // Security: admin credentials cannot be reset via the public flow.
        if ($this->isAdminEmail($request->email)) {
            return $this->error('Password reset is disabled for administrator accounts.', 403);
        }

        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill(['password' => bcrypt($password)])->save();
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return $this->error('Invalid or expired reset token.', 400);
        }

        return $this->success(null, 'Password reset successfully.');
    }
}
