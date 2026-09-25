<?php

use App\Enums\ArticleType;
use App\Services\Zenn\ZennArticle;
use App\Services\Zenn\ZennClient;
use Illuminate\Http\Client\Request;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

beforeEach(function () {
    Sleep::fake();
});

/**
 * @return array<string, mixed>
 */
function zennApiArticle(array $overrides = []): array
{
    return array_replace_recursive([
        'id' => 656309,
        'title' => 'Next.js 16で実装するSEO最適化',
        'emoji' => '🚀',
        'article_type' => 'tech',
        'path' => '/sora/articles/abc123',
        'published_at' => '2026-09-23T14:05:00.000+09:00',
        'liked_count' => 12,
        'user' => [
            'username' => 'sora',
            'name' => 'Sora',
            'avatar_small_url' => 'https://example.com/avatar.png',
        ],
    ], $overrides);
}

test('it requests the latest articles for a topic', function () {
    Http::fake(['zenn.dev/api/articles*' => Http::response(['articles' => []])]);

    (new ZennClient)->fetchLatestArticles('nextjs');

    Http::assertSent(fn (Request $request): bool => $request->method() === 'GET'
        && str_starts_with($request->url(), 'https://zenn.dev/api/articles?')
        && $request['topicname'] === 'nextjs'
        && $request['order'] === 'latest'
        && (int) $request['count'] === 30);
});

test('it maps api articles to ZennArticle objects', function () {
    Http::fake(['zenn.dev/api/articles*' => Http::response(['articles' => [zennApiArticle()]])]);

    $articles = (new ZennClient)->fetchLatestArticles('nextjs');

    expect($articles)->toHaveCount(1)
        ->and($articles[0])->toBeInstanceOf(ZennArticle::class)
        ->and($articles[0]->id)->toBe(656309)
        ->and($articles[0]->title)->toBe('Next.js 16で実装するSEO最適化')
        ->and($articles[0]->emoji)->toBe('🚀')
        ->and($articles[0]->articleType)->toBe(ArticleType::Tech)
        ->and($articles[0]->path)->toBe('/sora/articles/abc123')
        ->and($articles[0]->authorUsername)->toBe('sora')
        ->and($articles[0]->authorName)->toBe('Sora')
        ->and($articles[0]->authorAvatarUrl)->toBe('https://example.com/avatar.png')
        ->and($articles[0]->publishedAt->toIso8601String())->toBe('2026-09-23T14:05:00+09:00');
});

test('a missing avatar becomes null', function () {
    $article = zennApiArticle();
    unset($article['user']['avatar_small_url']);
    Http::fake(['zenn.dev/api/articles*' => Http::response(['articles' => [$article]])]);

    $articles = (new ZennClient)->fetchLatestArticles('nextjs');

    expect($articles[0]->authorAvatarUrl)->toBeNull();
});

test('it retries server errors and throws when they keep failing', function () {
    Http::fake(['zenn.dev/api/articles*' => Http::response([], 503)]);

    expect(fn () => (new ZennClient)->fetchLatestArticles('nextjs'))
        ->toThrow(RequestException::class);

    Http::assertSentCount(3);
});

test('it does not retry client errors', function () {
    Http::fake(['zenn.dev/api/articles*' => Http::response([], 404)]);

    expect(fn () => (new ZennClient)->fetchLatestArticles('unknown-topic'))
        ->toThrow(RequestException::class);

    Http::assertSentCount(1);
});
