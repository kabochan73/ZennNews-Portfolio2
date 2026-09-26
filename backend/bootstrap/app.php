<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // There is no Laravel login page (the frontend is Next.js), so unauthenticated
        // requests are never redirected; API routes answer 401 JSON instead.
        $middleware->redirectGuestsTo(null);

        // Every request comes through the Next.js server, which forwards the visitor's
        // IP in X-Forwarded-For; trust it so per-IP rate limits apply per visitor.
        // Requires that Laravel is NOT reachable from the internet (private network
        // only), otherwise anyone could forge X-Forwarded-For.
        $middleware->trustProxies(at: '*');
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*') || $request->expectsJson(),
        );
    })->create();
