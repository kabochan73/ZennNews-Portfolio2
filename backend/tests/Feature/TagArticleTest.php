<?php

use App\Models\Article;
use App\Models\Tag;
use Illuminate\Support\Facades\DB;

beforeEach(function () {
    $this->tag = Tag::factory()->create(['slug' => 'nextjs', 'name' => 'Next.js']);
});

test('articles are returned newest first, then by id', function () {
    $older = Article::factory()->create(['published_at' => '2026-09-20T00:00:00Z']);
    $sameTimeLowerId = Article::factory()->create(['published_at' => '2026-09-22T00:00:00Z']);
    $sameTimeHigherId = Article::factory()->create(['published_at' => '2026-09-22T00:00:00Z']);
    $newest = Article::factory()->create(['published_at' => '2026-09-23T00:00:00Z']);
    $this->tag->articles()->attach([$older->id, $sameTimeLowerId->id, $sameTimeHigherId->id, $newest->id]);

    $this->getJson('/api/tags/nextjs/articles')
        ->assertOk()
        ->assertJsonPath('tag.slug', 'nextjs')
        ->assertJsonPath('articles.*.id', [$newest->id, $sameTimeHigherId->id, $sameTimeLowerId->id, $older->id]);
});

test('each article has the documented shape', function () {
    $article = Article::factory()->create([
        'title' => 'Next.js 16で実装するSEO最適化',
        'emoji' => '🚀',
        'path' => '/sora/articles/abc123',
        'author_username' => 'sora',
        'author_name' => 'Sora',
        'author_avatar_url' => null,
        'published_at' => '2026-09-23T05:05:00Z',
    ]);
    $this->tag->articles()->attach($article);

    $this->getJson('/api/tags/nextjs/articles')
        ->assertOk()
        ->assertExactJson([
            'tag' => ['id' => $this->tag->id, 'slug' => 'nextjs', 'name' => 'Next.js'],
            'articles' => [[
                'id' => $article->id,
                'title' => 'Next.js 16で実装するSEO最適化',
                'emoji' => '🚀',
                'article_type' => 'tech',
                'url' => 'https://zenn.dev/sora/articles/abc123',
                'author' => ['username' => 'sora', 'name' => 'Sora', 'avatar_url' => null],
                'published_at' => '2026-09-23T14:05:00+09:00',
            ]],
        ]);
});

test('articles of other tags are not included', function () {
    $mine = Article::factory()->create();
    $this->tag->articles()->attach($mine);
    Tag::factory()->create()->articles()->attach(Article::factory()->create());

    $this->getJson('/api/tags/nextjs/articles')
        ->assertOk()
        ->assertJsonPath('articles.*.id', [$mine->id]);
});

test('the number of queries does not grow with the number of articles', function () {
    $this->tag->articles()->attach(Article::factory()->count(50)->create());

    DB::enableQueryLog();
    $this->getJson('/api/tags/nextjs/articles')->assertOk()->assertJsonCount(50, 'articles');

    // Tag lookup + articles; nothing per article.
    expect(DB::getQueryLog())->toHaveCount(2);
});

test('an unknown tag is 404', function () {
    $this->getJson('/api/tags/unknown/articles')->assertNotFound();
});

test('tag articles can be fetched without logging in, with the public rate limit', function () {
    $this->getJson('/api/tags/nextjs/articles')
        ->assertOk()
        ->assertHeader('X-RateLimit-Limit', 60);
});
