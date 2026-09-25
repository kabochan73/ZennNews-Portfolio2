<?php

use App\Models\User;
use Illuminate\Testing\TestResponse;

beforeEach(function () {
    $this->user = User::factory()->create(['username' => 'Takumi', 'password' => 'password123']);
});

function login(string $username, string $password): TestResponse
{
    return test()->postJson('/api/login', ['username' => $username, 'password' => $password]);
}

test('a user can log in and receives a token', function () {
    login('Takumi', 'password123')
        ->assertOk()
        ->assertJsonPath('user.username', 'Takumi')
        ->assertJsonStructure(['user' => ['username', 'created_at'], 'token']);

    expect($this->user->tokens()->count())->toBe(1);
});

test('the username is case-insensitive', function () {
    login('TAKUMI', 'password123')
        ->assertOk()
        ->assertJsonPath('user.username', 'Takumi');
});

test('a wrong password and an unknown username get the same error', function () {
    login('Takumi', 'wrong-password')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'ユーザー名またはパスワードが違います');

    login('nobody', 'password123')
        ->assertUnauthorized()
        ->assertJsonPath('message', 'ユーザー名またはパスワードが違います');

    expect($this->user->tokens()->count())->toBe(0);
});

test('username and password are required', function () {
    $this->postJson('/api/login', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'username' => 'ユーザー名を入力してください',
            'password' => 'パスワードを入力してください',
        ]);
});

test('after 5 failures the next attempt is rejected even with the right password', function () {
    foreach (range(1, 5) as $_) {
        login('takumi', 'wrong-password')->assertUnauthorized();
    }

    login('Takumi', 'password123')
        ->assertTooManyRequests()
        ->assertJsonPath('message', 'しばらく時間をおいてお試しください')
        ->assertHeader('Retry-After');
});

test('the failure count resets after a successful login', function () {
    foreach (range(1, 4) as $_) {
        login('Takumi', 'wrong-password')->assertUnauthorized();
    }
    login('Takumi', 'password123')->assertOk();

    foreach (range(1, 4) as $_) {
        login('Takumi', 'wrong-password')->assertUnauthorized();
    }
    login('Takumi', 'password123')->assertOk();
});
