<?php

use App\Models\Article;
use App\Models\Tag;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Sleep;

beforeEach(function () {
    Sleep::fake();

    Tag::factory()->create(['slug' => 'nextjs', 'fetch_hour' => 5, 'sort_order' => 1]);
    Tag::factory()->create(['slug' => 'react', 'fetch_hour' => 5, 'sort_order' => 2]);
    Tag::factory()->create(['slug' => 'laravel', 'fetch_hour' => 3, 'sort_order' => 3]);

    // Each topic returns one article whose zenn_id is unique per topic; "broken" returns 404.
    // The frontend's revalidate endpoint fails only for "nextjs".
    Http::fake(function (Request $request) {
        if (str_ends_with($request->url(), '/api/revalidate')) {
            return $request['slug'] === 'nextjs'
                ? Http::response([], 500)
                : Http::response(['revalidated' => true]);
        }

        if ($request['topicname'] === 'broken') {
            return Http::response([], 404);
        }

        $ids = ['nextjs' => 1, 'react' => 2, 'laravel' => 3];

        return Http::response(['articles' => [[
            'id' => $ids[$request['topicname']],
            'title' => "{$request['topicname']} article",
            'emoji' => '🚀',
            'article_type' => 'tech',
            'path' => "/author/articles/{$request['topicname']}",
            'published_at' => '2026-09-23T14:05:00.000+09:00',
            'user' => ['username' => 'author', 'name' => 'Author', 'avatar_small_url' => null],
        ]]]);
    });
});

/**
 * @return list<string>
 */
function requestedTopics(): array
{
    return Http::recorded()
        ->filter(fn (array $pair): bool => str_contains($pair[0]->url(), 'zenn.dev'))
        ->map(fn (array $pair): string => $pair[0]['topicname'])
        ->values()
        ->all();
}

test('without options it fetches the tags for the current JST hour', function () {
    // 20:30 UTC = 05:30 JST
    $this->travelTo('2026-09-25T20:30:00Z');

    $this->artisan('zenn:fetch-articles')
        ->expectsOutputToContain('nextjs: 新規 1件')
        ->expectsOutputToContain('react: 新規 1件')
        ->assertSuccessful();

    expect(requestedTopics())->toBe(['nextjs', 'react'])
        ->and(Article::count())->toBe(2);
    Sleep::assertSleptTimes(1);
});

test('outside the fetch hours it does nothing', function () {
    // 03:00 UTC = 12:00 JST
    $this->travelTo('2026-09-25T03:00:00Z');

    $this->artisan('zenn:fetch-articles')
        ->expectsOutput('No tags to fetch at this time.')
        ->assertSuccessful();

    Http::assertNothingSent();
});

test('--hour fetches the tags assigned to that hour', function () {
    $this->artisan('zenn:fetch-articles', ['--hour' => 3])->assertSuccessful();

    expect(requestedTopics())->toBe(['laravel']);
});

test('--tag fetches only the given tags', function () {
    $this->artisan('zenn:fetch-articles', ['--tag' => ['react', 'laravel']])->assertSuccessful();

    expect(requestedTopics())->toBe(['react', 'laravel']);
});

test('--all fetches every tag', function () {
    $this->artisan('zenn:fetch-articles', ['--all' => true])->assertSuccessful();

    expect(requestedTopics())->toBe(['nextjs', 'react', 'laravel'])
        ->and(Article::count())->toBe(3);
});

test('an unknown tag is an error', function () {
    $this->artisan('zenn:fetch-articles', ['--tag' => ['nextjs', 'unknown']])
        ->expectsOutputToContain('Unknown tag: unknown')
        ->assertFailed();

    Http::assertNothingSent();
});

test('a failing tag is skipped and the command reports failure', function () {
    Tag::factory()->create(['slug' => 'broken', 'fetch_hour' => 4, 'sort_order' => 0]);

    $this->artisan('zenn:fetch-articles', ['--tag' => ['broken', 'react']])
        ->expectsOutputToContain('broken: 取得に失敗しました')
        ->expectsOutputToContain('react: 新規 1件')
        ->assertFailed();

    expect(Article::count())->toBe(1);
});

/**
 * @return list<string>
 */
function revalidatedSlugs(): array
{
    return Http::recorded()
        ->filter(fn (array $pair): bool => str_ends_with($pair[0]->url(), '/api/revalidate'))
        ->map(fn (array $pair): string => $pair[0]['slug'])
        ->values()
        ->all();
}

test('each successfully saved tag is sent to the frontend for revalidation', function () {
    config(['services.frontend.url' => 'http://frontend.test', 'services.frontend.revalidate_secret' => 'secret']);
    Tag::factory()->create(['slug' => 'broken', 'fetch_hour' => 4, 'sort_order' => 0]);

    $this->artisan('zenn:fetch-articles', ['--tag' => ['broken', 'react', 'laravel']])->assertFailed();

    expect(revalidatedSlugs())->toBe(['react', 'laravel']);
});

test('a failed revalidation is reported but does not fail the command', function () {
    config(['services.frontend.url' => 'http://frontend.test', 'services.frontend.revalidate_secret' => 'secret']);

    $this->artisan('zenn:fetch-articles', ['--tag' => ['nextjs', 'react']])
        ->expectsOutputToContain('nextjs: キャッシュの更新通知に失敗しました')
        ->doesntExpectOutputToContain('react: キャッシュの更新通知に失敗しました')
        ->assertSuccessful();

    expect(Article::count())->toBe(2);
});

test('nothing is sent to the frontend when it is not configured', function () {
    $this->artisan('zenn:fetch-articles', ['--tag' => ['react']])
        ->doesntExpectOutputToContain('キャッシュの更新通知に失敗しました')
        ->assertSuccessful();

    expect(revalidatedSlugs())->toBe([]);
});
