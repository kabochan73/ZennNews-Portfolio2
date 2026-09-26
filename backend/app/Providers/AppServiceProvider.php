<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\JsonResponse;
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
            ->response($this->tooManyRequestsResponse(...)));

        // Public (no login) APIs such as tags and tag articles, per IP address.
        RateLimiter::for('public-api', fn (Request $request): Limit => Limit::perMinute(60)
            ->by($request->ip())
            ->response($this->tooManyRequestsResponse(...)));
    }

    /**
     * The 429 response shared by the rate limiters, in Japanese like the login limit.
     *
     * @param  array<string, mixed>  $headers  Includes Retry-After
     */
    private function tooManyRequestsResponse(Request $request, array $headers): JsonResponse
    {
        return response()->json(['message' => 'しばらく時間をおいてお試しください'], 429, $headers);
    }
}
