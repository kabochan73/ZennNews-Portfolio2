<?php

namespace App\Services\Zenn;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Throwable;

/**
 * Client for Zenn's unofficial articles API.
 */
class ZennClient
{
    /**
     * Fetch the latest articles for a topic, newest first.
     *
     * Connection errors and 5xx responses are retried twice (1 second apart);
     * if the request still fails, the exception is thrown to the caller.
     *
     * @param  string  $topicName  Zenn topic name (tags.slug), e.g. "nextjs"
     * @return list<ZennArticle>
     *
     * @throws ConnectionException
     * @throws RequestException
     */
    public function fetchLatestArticles(string $topicName, int $count = 30): array
    {
        $articles = Http::baseUrl(config('services.zenn.base_url'))
            ->timeout(config('services.zenn.timeout'))
            ->withUserAgent('ZennNews/1.0 (unofficial reader)')
            ->acceptJson()
            ->retry(3, 1000, fn (Throwable $e): bool => $this->shouldRetry($e))
            ->get('/articles', [
                'topicname' => $topicName,
                'order' => 'latest',
                'count' => $count,
            ])
            ->throw()
            ->json('articles', []);

        return array_values(array_map(ZennArticle::fromApi(...), $articles));
    }

    /**
     * Only temporary failures are worth retrying (not 4xx such as an unknown topic).
     */
    private function shouldRetry(Throwable $e): bool
    {
        return $e instanceof ConnectionException
            || ($e instanceof RequestException && $e->response->serverError());
    }
}
