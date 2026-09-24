<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
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
        // Batasi percobaan login: per IP + per email (anti brute-force)
        RateLimiter::for('login', function (Request $request) {
            $email = strtolower(trim((string) $request->input('email', '')));

            return [
                Limit::perMinute(5)->by($request->ip()),
                Limit::perMinute(5)->by('login-email:'.($email !== '' ? $email : 'unknown')),
            ];
        });

        // Cek NIK publik — cegah enumerasi daftar pemilih
        RateLimiter::for('check-nik', function (Request $request) {
            return Limit::perMinute(20)->by($request->ip());
        });
    }
}
