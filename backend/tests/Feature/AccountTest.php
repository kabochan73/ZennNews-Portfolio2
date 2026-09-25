<?php

use App\Models\Article;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\DB;

test('me returns the authenticated user', function () {
    $user = User::factory()->create(['username' => 'Takumi']);

    $this->withToken($user->createToken('api')->plainTextToken)
        ->getJson('/api/me')
        ->assertOk()
        ->assertJsonPath('user.username', 'Takumi')
        ->assertJsonStructure(['user' => ['username', 'created_at']]);
});

test('api routes answer 401 as json even without an Accept header', function () {
    $this->get('/api/me')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'Unauthenticated.');
});

test('deleting the account requires the correct password', function () {
    $user = User::factory()->create(['password' => 'password123']);

    $this->withToken($user->createToken('api')->plainTextToken)
        ->deleteJson('/api/me', ['password' => 'wrong-password'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password' => 'パスワードが違います']);

    expect(User::whereKey($user->id)->exists())->toBeTrue();
});

test('deleting the account removes the user and all related data', function () {
    $user = User::factory()->create(['password' => 'password123']);
    $token = $user->createToken('api')->plainTextToken;
    $user->createToken('api');
    $tag = Tag::factory()->create();
    $article = Article::factory()->create();
    $user->favoriteTags()->attach($tag, ['position' => 0]);
    $user->readArticles()->attach($article);
    $user->bookmarkedArticles()->attach($article);

    $this->withToken($token)
        ->deleteJson('/api/me', ['password' => 'password123'])
        ->assertNoContent();

    expect(User::whereKey($user->id)->exists())->toBeFalse()
        ->and(DB::table('personal_access_tokens')->count())->toBe(0)
        ->and(DB::table('user_tags')->count())->toBe(0)
        ->and(DB::table('article_reads')->count())->toBe(0)
        ->and(DB::table('bookmarks')->count())->toBe(0)
        ->and(Article::whereKey($article->id)->exists())->toBeTrue();
});

test('deleting the account requires authentication', function () {
    $this->deleteJson('/api/me', ['password' => 'password123'])->assertUnauthorized();
});
