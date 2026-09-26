<?php

use App\Models\Article;
use App\Models\Tag;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->user = User::factory()->create(['username' => 'Takumi']);
});

test('it returns the documented shape', function () {
    $tag = Tag::factory()->create(['slug' => 'nextjs', 'name' => 'Next.js']);
    $article = Article::factory()->create([
        'title' => 'Next.js 16で実装するSEO最適化',
        'emoji' => '🚀',
        'path' => '/sora/articles/abc123',
        'author_username' => 'sora',
        'author_name' => 'Sora',
        'author_avatar_url' => null,
        'published_at' => '2026-09-23T05:05:00Z',
    ]);
    $this->user->favoriteTags()->attach($tag, ['position' => 0]);
    $this->user->readArticles()->attach($article);
    $this->user->bookmarkedArticles()->attach($article);
    Sanctum::actingAs($this->user);

    $this->getJson('/api/me/home')
        ->assertOk()
        ->assertJsonPath('user.username', 'Takumi')
        ->assertJsonPath('favorite_tags', [['id' => $tag->id, 'slug' => 'nextjs', 'name' => 'Next.js']])
        ->assertJsonPath('read_article_ids', [$article->id])
        ->assertJsonPath('bookmarks', [[
            'id' => $article->id,
            'title' => 'Next.js 16で実装するSEO最適化',
            'emoji' => '🚀',
            'article_type' => 'tech',
            'url' => 'https://zenn.dev/sora/articles/abc123',
            'author' => ['username' => 'sora', 'name' => 'Sora', 'avatar_url' => null],
            'published_at' => '2026-09-23T14:05:00+09:00',
        ]]);
});

test('favorite tags are in tag bar order', function () {
    [$nextjs, $react, $laravel] = Tag::factory()->count(3)->create();
    $this->user->favoriteTags()->attach([
        $react->id => ['position' => 0],
        $laravel->id => ['position' => 1],
        $nextjs->id => ['position' => 2],
    ]);
    Sanctum::actingAs($this->user);

    $this->getJson('/api/me/home')
        ->assertOk()
        ->assertJsonPath('favorite_tags.*.id', [$react->id, $laravel->id, $nextjs->id]);
});

test('read_article_ids contains only the current user reads', function () {
    [$readByMe, $readByOther] = Article::factory()->count(2)->create();
    $this->user->readArticles()->attach($readByMe);
    User::factory()->create()->readArticles()->attach($readByOther);
    Sanctum::actingAs($this->user);

    $this->getJson('/api/me/home')
        ->assertOk()
        ->assertJsonPath('read_article_ids', [$readByMe->id]);
});

test('bookmarks are newest bookmark first and include articles in no tag', function () {
    $tag = Tag::factory()->create();
    [$first, $second] = Article::factory()->count(2)->create();
    $tag->articles()->attach($second);
    $this->user->bookmarkedArticles()->attach($first, ['created_at' => CarbonImmutable::parse('2026-09-01T00:00:00Z')]);
    $this->user->bookmarkedArticles()->attach($second, ['created_at' => CarbonImmutable::parse('2026-09-02T00:00:00Z')]);
    User::factory()->create()->bookmarkedArticles()->attach(Article::factory()->create());
    Sanctum::actingAs($this->user);

    $this->getJson('/api/me/home')
        ->assertOk()
        ->assertJsonPath('bookmarks.*.id', [$second->id, $first->id]);
});

test('a new user gets empty lists', function () {
    Sanctum::actingAs($this->user);

    $this->getJson('/api/me/home')
        ->assertOk()
        ->assertJsonPath('favorite_tags', [])
        ->assertJsonPath('read_article_ids', [])
        ->assertJsonPath('bookmarks', []);
});

test('the number of queries does not grow with the amount of data', function () {
    $tags = Tag::factory()->count(5)->create();
    $articles = Article::factory()->count(30)->create();
    $this->user->favoriteTags()->attach($tags->mapWithKeys(fn (Tag $tag, int $i): array => [$tag->id => ['position' => $i]]));
    $this->user->readArticles()->attach($articles->take(20));
    $this->user->bookmarkedArticles()->attach($articles->take(10));
    Sanctum::actingAs($this->user);

    DB::enableQueryLog();
    $this->getJson('/api/me/home')->assertOk();

    // Favorite tags + read IDs + bookmarks; nothing per item.
    expect(DB::getQueryLog())->toHaveCount(3);
});

test('it requires authentication', function () {
    $this->getJson('/api/me/home')->assertUnauthorized();
});
