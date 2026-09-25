<?php

use App\Models\Article;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->tag = Tag::factory()->create(['slug' => 'nextjs', 'name' => 'Next.js']);
});

test('articles are returned newest first, then by id', function () {
    $older = Article::factory()->create(['published_at' => '2026-09-20T00:00:00Z']);
    $sameTimeLowerId = Article::factory()->create(['published_at' => '2026-09-22T00:00:00Z']);
    $sameTimeHigherId = Article::factory()->create(['published_at' => '2026-09-22T00:00:00Z']);
    $newest = Article::factory()->create(['published_at' => '2026-09-23T00:00:00Z']);
    $this->tag->articles()->attach([$older->id, $sameTimeLowerId->id, $sameTimeHigherId->id, $newest->id]);
    Sanctum::actingAs($this->user);

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
    Sanctum::actingAs($this->user);

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
                'is_read' => false,
                'is_bookmarked' => false,
            ]],
        ]);
});

test('read and bookmark flags reflect only the current user', function () {
    [$readByMe, $bookmarkedByMe, $readByOther] = Article::factory()->count(3)->create();
    $this->tag->articles()->attach([$readByMe->id, $bookmarkedByMe->id, $readByOther->id]);
    $this->user->readArticles()->attach($readByMe);
    $this->user->bookmarkedArticles()->attach($bookmarkedByMe);
    $other = User::factory()->create();
    $other->readArticles()->attach($readByOther);
    $other->bookmarkedArticles()->attach($readByOther);
    Sanctum::actingAs($this->user);

    $articles = collect($this->getJson('/api/tags/nextjs/articles')->assertOk()->json('articles'))->keyBy('id');

    expect($articles[$readByMe->id])->toMatchArray(['is_read' => true, 'is_bookmarked' => false])
        ->and($articles[$bookmarkedByMe->id])->toMatchArray(['is_read' => false, 'is_bookmarked' => true])
        ->and($articles[$readByOther->id])->toMatchArray(['is_read' => false, 'is_bookmarked' => false]);
});

test('articles of other tags are not included', function () {
    $mine = Article::factory()->create();
    $this->tag->articles()->attach($mine);
    Tag::factory()->create()->articles()->attach(Article::factory()->create());
    Sanctum::actingAs($this->user);

    $this->getJson('/api/tags/nextjs/articles')
        ->assertOk()
        ->assertJsonPath('articles.*.id', [$mine->id]);
});

test('the number of queries does not grow with the number of articles', function () {
    $this->tag->articles()->attach(Article::factory()->count(50)->create());
    $this->user->readArticles()->attach($this->tag->articles()->limit(10)->pluck('articles.id'));
    Sanctum::actingAs($this->user);

    DB::enableQueryLog();
    $this->getJson('/api/tags/nextjs/articles')->assertOk()->assertJsonCount(50, 'articles');

    // Tag lookup + articles (with EXISTS subqueries); nothing per article.
    expect(DB::getQueryLog())->toHaveCount(2);
});

test('an unknown tag is 404', function () {
    Sanctum::actingAs($this->user);

    $this->getJson('/api/tags/unknown/articles')->assertNotFound();
});

test('tag articles require authentication', function () {
    $this->getJson('/api/tags/nextjs/articles')->assertUnauthorized();
});
