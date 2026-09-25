<?php

use App\Models\Article;
use App\Models\Tag;
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

test('a bookmarked article appears in the bookmark list', function () {
    $article = Article::factory()->create();
    Sanctum::actingAs($this->user);

    $this->putJson("/api/articles/{$article->id}/bookmark")->assertNoContent();

    $this->getJson('/api/bookmarks')
        ->assertOk()
        ->assertJsonPath('articles.*.id', [$article->id])
        ->assertJsonPath('articles.0.is_bookmarked', true)
        ->assertJsonPath('articles.0.is_read', false);
});

test('bookmarks are listed newest bookmark first, including articles in no tag', function () {
    $tag = Tag::factory()->create();
    [$first, $second] = Article::factory()->count(2)->create();
    $tag->articles()->attach($second);
    bookmarkAt($this->user, [$first, $second]);
    $this->user->readArticles()->attach($first);
    Sanctum::actingAs($this->user);

    $this->getJson('/api/bookmarks')
        ->assertOk()
        ->assertJsonPath('articles.*.id', [$second->id, $first->id])
        ->assertJsonPath('articles.1.is_read', true);
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

    $this->getJson('/api/bookmarks')->assertOk()->assertJsonCount(0, 'articles');
});

test('other users bookmarks are not listed', function () {
    bookmarkAt(User::factory()->create(), [Article::factory()->create()]);
    Sanctum::actingAs($this->user);

    $this->getJson('/api/bookmarks')->assertOk()->assertJsonCount(0, 'articles');
});

test('bookmarking an unknown article is 404', function () {
    Sanctum::actingAs($this->user);

    $this->putJson('/api/articles/999999/bookmark')->assertNotFound();
    $this->deleteJson('/api/articles/999999/bookmark')->assertNotFound();
});

test('bookmarks require authentication', function () {
    $article = Article::factory()->create();

    $this->getJson('/api/bookmarks')->assertUnauthorized();
    $this->putJson("/api/articles/{$article->id}/bookmark")->assertUnauthorized();
    $this->deleteJson("/api/articles/{$article->id}/bookmark")->assertUnauthorized();
});
