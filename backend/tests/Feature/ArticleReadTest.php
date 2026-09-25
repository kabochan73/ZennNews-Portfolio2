<?php

use App\Models\Article;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

test('an article can be marked as read', function () {
    $user = User::factory()->create();
    $article = Article::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson("/api/articles/{$article->id}/read")->assertNoContent();

    expect($user->readArticles()->pluck('articles.id')->all())->toBe([$article->id]);
});

test('marking as read twice is not an error', function () {
    $user = User::factory()->create();
    $article = Article::factory()->create();
    Sanctum::actingAs($user);

    $this->postJson("/api/articles/{$article->id}/read")->assertNoContent();
    $this->postJson("/api/articles/{$article->id}/read")->assertNoContent();

    expect(DB::table('article_reads')->count())->toBe(1);
});

test('an unknown article is 404', function () {
    Sanctum::actingAs(User::factory()->create());

    $this->postJson('/api/articles/999999/read')->assertNotFound();
});

test('marking as read requires authentication', function () {
    $article = Article::factory()->create();

    $this->postJson("/api/articles/{$article->id}/read")->assertUnauthorized();
});
