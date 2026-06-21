<?php

namespace App\Providers;

use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Point password-reset links at the SPA frontend instead of a web route.
        ResetPassword::createUrlUsing(function ($notifiable, string $token) {
            $base = rtrim(env('FRONTEND_URL', 'http://localhost:5173'), '/');
            return $base . '/reset-password?token=' . $token . '&email=' . urlencode($notifiable->getEmailForPasswordReset());
        });
    }
}
