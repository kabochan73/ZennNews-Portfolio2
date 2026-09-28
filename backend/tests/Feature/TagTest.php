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

test('the public tag list is limited to 60 requests per minute per visitor IP', function () {
    $visitor = fn (string $ip) => $this->withHeader('X-Forwarded-For', $ip)->getJson('/api/tags');

    foreach (range(1, 60) as $_) {
        $visitor('203.0.113.1')->assertOk();
    }

    $visitor('203.0.113.1')
        ->assertTooManyRequests()
        ->assertJsonPath('message', 'しばらく時間をおいてお試しください')
        ->assertHeader('Retry-After');
    $visitor('203.0.113.2')->assertOk();
});

test('calls from the Next.js server itself (no X-Forwarded-For) are not limited', function () {
    foreach (range(1, 61) as $_) {
        $this->getJson('/api/tags')->assertOk();
    }
});
