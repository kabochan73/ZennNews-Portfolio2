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
        // Sign-ups per IP address, to stop scripted mass account creation.
        RateLimiter::for('register', fn (Request $request): Limit => Limit::perMinute(10)
            ->by($request->ip())
            ->response(fn (Request $request, array $headers) => response()->json(
                ['message' => 'しばらく時間をおいてお試しください'],
                429,
                $headers,
            )));
    }
}
