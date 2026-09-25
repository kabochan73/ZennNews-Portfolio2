<?php

use App\Models\User;

test('logging out revokes only the current token', function () {
    $user = User::factory()->create();
    $currentToken = $user->createToken('api')->plainTextToken;
    $user->createToken('api');

    $this->withToken($currentToken)
        ->postJson('/api/logout')
        ->assertNoContent();

    expect($user->tokens()->count())->toBe(1);
});

test('logging out requires authentication', function () {
    $this->postJson('/api/logout')->assertUnauthorized();
});
