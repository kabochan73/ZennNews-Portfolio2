<?php

use App\Models\Article;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->user = User::factory()->create();
});

/**
 * Bookmark articles directly, one second apart, oldest first.
 *
 * @param  iterable<Article>  $articles
 */
function bookmarkAt(User $user, iterable $articles, string $start = '2026-09-01T00:00:00Z'): void
{
    $time = CarbonImmutable::parse($start);

    foreach ($articles as $article) {
        $user->bookmarkedArticles()->attach($article, ['created_at' => $time]);
        $time = $time->addSecond();
    }
}

test('an article can be bookmarked', function () {
    $article = Article::factory()->create();
    Sanctum::actingAs($this->user);

    $this->putJson("/api/articles/{$article->id}/bookmark")->assertNoContent();

    expect($this->user->bookmarkedArticles()->pluck('articles.id')->all())->toBe([$article->id]);
});

test('bookmarking twice is not an error', function () {
    $article = Article::factory()->create();
    Sanctum::actingAs($this->user);

    $this->putJson("/api/articles/{$article->id}/bookmark")->assertNoContent();
    $this->putJson("/api/articles/{$article->id}/bookmark")->assertNoContent();

    expect(DB::table('bookmarks')->count())->toBe(1);
});

test('the 100th bookmark is allowed and the 101st is rejected', function () {
    bookmarkAt($this->user, Article::factory()->count(99)->create());
    [$hundredth, $hundredFirst] = Article::factory()->count(2)->create();
    Sanctum::actingAs($this->user);

    $this->putJson("/api/articles/{$hundredth->id}/bookmark")->assertNoContent();

    $this->putJson("/api/articles/{$hundredFirst->id}/bookmark")
        ->assertUnprocessable()
        ->assertJsonPath('message', 'ブックマークは100件までです。いくつか外してください');

    expect($this->user->bookmarkedArticles()->count())->toBe(100);
});

test('re-bookmarking an already bookmarked article at the limit is not an error', function () {
    $articles = Article::factory()->count(100)->create();
    bookmarkAt($this->user, $articles);
    Sanctum::actingAs($this->user);

    $this->putJson("/api/articles/{$articles->first()->id}/bookmark")->assertNoContent();
});

test('a bookmark can be removed, and removing a missing one is not an error', function () {
    $article = Article::factory()->create();
    bookmarkAt($this->user, [$article]);
    Sanctum::actingAs($this->user);

    $this->deleteJson("/api/articles/{$article->id}/bookmark")->assertNoContent();
    $this->deleteJson("/api/articles/{$article->id}/bookmark")->assertNoContent();

    expect($this->user->bookmarkedArticles()->count())->toBe(0);
});

test('bookmarking and removing only affect the current user', function () {
    $article = Article::factory()->create();
    $other = User::factory()->create();
    bookmarkAt($other, [$article]);
    Sanctum::actingAs($this->user);

    $this->putJson("/api/articles/{$article->id}/bookmark")->assertNoContent();
    $this->deleteJson("/api/articles/{$article->id}/bookmark")->assertNoContent();

    expect($other->bookmarkedArticles()->pluck('articles.id')->all())->toBe([$article->id]);
});

test('bookmarking an unknown article is 404', function () {
    Sanctum::actingAs($this->user);

    $this->putJson('/api/articles/999999/bookmark')->assertNotFound();
    $this->deleteJson('/api/articles/999999/bookmark')->assertNotFound();
});

test('bookmarks require authentication', function () {
    $article = Article::factory()->create();

    $this->putJson("/api/articles/{$article->id}/bookmark")->assertUnauthorized();
    $this->deleteJson("/api/articles/{$article->id}/bookmark")->assertUnauthorized();
});
