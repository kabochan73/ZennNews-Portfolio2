<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Tells the Next.js frontend to rebuild a tag's cached (ISR) page after its articles change.
 *
 * Failures are logged and reported as false instead of thrown: the articles are already
 * saved, and the frontend also rebuilds every 8 hours as a fallback.
 */
class FrontendRevalidator
{
    private const TIMEOUT_SECONDS = 5;

    /**
     * Ask the frontend to revalidate the page of the given tag (POST /api/revalidate).
     *
     * @return bool Whether the frontend accepted the request (false when not configured)
     */
    public function revalidate(string $slug): bool
    {
        $url = config('services.frontend.url');
        $secret = config('services.frontend.revalidate_secret');

        if (blank($url) || blank($secret)) {
            return false;
        }

        try {
            Http::baseUrl($url)
                ->timeout(self::TIMEOUT_SECONDS)
                ->withHeaders(['X-Revalidate-Secret' => $secret])
                ->acceptJson()
                ->post('/api/revalidate', ['slug' => $slug])
                ->throw();

            return true;
        } catch (Throwable $e) {
            Log::warning('Failed to notify the frontend to revalidate a tag page.', [
                'slug' => $slug,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}
