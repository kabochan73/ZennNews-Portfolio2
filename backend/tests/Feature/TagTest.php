<?php

use App\Models\Tag;

test('tags are grouped by category in sort order', function () {
    Tag::factory()->create(['slug' => 'nextjs', 'name' => 'Next.js', 'category' => 'フレームワーク', 'sort_order' => 3]);
    Tag::factory()->create(['slug' => 'php', 'name' => 'PHP', 'category' => '開発言語', 'sort_order' => 2]);
    Tag::factory()->create(['slug' => 'typescript', 'name' => 'TypeScript', 'category' => '開発言語', 'sort_order' => 1]);
    Tag::factory()->create(['slug' => 'aws', 'name' => 'AWS', 'category' => 'インフラ', 'sort_order' => 4]);

    $response = $this->getJson('/api/tags')->assertOk();

    expect($response->json('categories.*.name'))->toBe(['開発言語', 'フレームワーク', 'インフラ'])
        ->and($response->json('categories.0.tags.*.slug'))->toBe(['typescript', 'php'])
        ->and($response->json('categories.0.tags.0'))->toHaveKeys(['id', 'slug', 'name']);
});

test('tags can be listed without logging in', function () {
    Tag::factory()->create();

    $this->getJson('/api/tags')->assertOk()->assertJsonCount(1, 'categories');
});

test('the public tag list is limited to 60 requests per minute per IP address', function () {
    foreach (range(1, 60) as $_) {
        $this->getJson('/api/tags')->assertOk();
    }

    $this->getJson('/api/tags')
        ->assertTooManyRequests()
        ->assertJsonPath('message', 'しばらく時間をおいてお試しください')
        ->assertHeader('Retry-After');
});
