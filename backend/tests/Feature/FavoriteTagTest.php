<?php

use App\Models\Tag;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Laravel\Sanctum\Sanctum;

beforeEach(function () {
    $this->user = User::factory()->create();
    [$this->nextjs, $this->react, $this->laravel] = [
        Tag::factory()->create(['slug' => 'nextjs']),
        Tag::factory()->create(['slug' => 'react']),
        Tag::factory()->create(['slug' => 'laravel']),
    ];
    Sanctum::actingAs($this->user);
});

test('favorite tags are saved and returned in the given order', function () {
    $this->putJson('/api/me/tags', ['tag_ids' => [$this->laravel->id, $this->nextjs->id]])
        ->assertOk()
        ->assertJsonPath('tags.*.slug', ['laravel', 'nextjs']);

    $this->getJson('/api/me/tags')
        ->assertOk()
        ->assertJsonPath('tags.*.slug', ['laravel', 'nextjs']);
});

test('saving again reorders, adds and removes tags', function () {
    $this->putJson('/api/me/tags', ['tag_ids' => [$this->nextjs->id, $this->react->id]]);
    $selectedAt = DB::table('user_tags')->where('tag_id', $this->nextjs->id)->value('created_at');

    // Next.js stays, React is removed, Laravel is added at the end.
    $this->putJson('/api/me/tags', ['tag_ids' => [$this->nextjs->id, $this->laravel->id]])
        ->assertOk()
        ->assertJsonPath('tags.*.slug', ['nextjs', 'laravel']);

    expect(DB::table('user_tags')->where('tag_id', $this->nextjs->id)->value('created_at'))->toBe($selectedAt);
});

test('another user favorites are not affected', function () {
    $other = User::factory()->create();
    $other->favoriteTags()->attach($this->react, ['position' => 0]);

    $this->putJson('/api/me/tags', ['tag_ids' => [$this->nextjs->id]])->assertOk();

    expect($other->favoriteTags()->pluck('slug')->all())->toBe(['react']);
});

test('invalid tag_ids are rejected', function (mixed $tagIds, string $message) {
    $this->putJson('/api/me/tags', ['tag_ids' => is_callable($tagIds) ? $tagIds() : $tagIds])
        ->assertUnprocessable()
        ->assertJsonFragment([$message]);

    expect($this->user->favoriteTags()->count())->toBe(0);
})->with([
    'empty' => [[], 'タグを1つ以上選んでください'],
    'not an array' => ['nextjs', 'タグの指定が正しくありません'],
    'unknown id' => [[999_999], '存在しないタグが含まれています'],
    'duplicated' => [fn () => [test()->nextjs->id, test()->nextjs->id], '同じタグが重複しています'],
    'string id' => [['abc'], 'タグの指定が正しくありません'],
]);

test('favorite tags require authentication', function () {
    $this->app['auth']->forgetGuards();

    $this->getJson('/api/me/tags')->assertUnauthorized();
    $this->putJson('/api/me/tags', ['tag_ids' => [1]])->assertUnauthorized();
});
