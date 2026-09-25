<?php

use App\Models\Tag;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

test('tags are grouped by category in sort order', function () {
    Tag::factory()->create(['slug' => 'nextjs', 'name' => 'Next.js', 'category' => 'フレームワーク', 'sort_order' => 3]);
    Tag::factory()->create(['slug' => 'php', 'name' => 'PHP', 'category' => '開発言語', 'sort_order' => 2]);
    Tag::factory()->create(['slug' => 'typescript', 'name' => 'TypeScript', 'category' => '開発言語', 'sort_order' => 1]);
    Tag::factory()->create(['slug' => 'aws', 'name' => 'AWS', 'category' => 'インフラ', 'sort_order' => 4]);
    Sanctum::actingAs(User::factory()->create());

    $response = $this->getJson('/api/tags')->assertOk();

    expect($response->json('categories.*.name'))->toBe(['開発言語', 'フレームワーク', 'インフラ'])
        ->and($response->json('categories.0.tags.*.slug'))->toBe(['typescript', 'php'])
        ->and($response->json('categories.0.tags.0'))->toHaveKeys(['id', 'slug', 'name']);
});

test('listing tags requires authentication', function () {
    $this->getJson('/api/tags')->assertUnauthorized();
});
