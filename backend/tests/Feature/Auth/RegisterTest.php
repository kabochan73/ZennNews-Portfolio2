<?php

use App\Models\User;
use Illuminate\Support\Facades\Hash;

test('a user can register and receives a token', function () {
    $response = $this->postJson('/api/register', [
        'username' => 'Takumi_K',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ]);

    $response->assertCreated()
        ->assertJsonPath('user.username', 'Takumi_K')
        ->assertJsonStructure(['user' => ['username', 'created_at'], 'token']);

    $user = User::sole();
    expect($user->username)->toBe('Takumi_K')
        ->and(Hash::check('password123', $user->password))->toBeTrue()
        ->and($user->tokens()->count())->toBe(1)
        ->and($response->json('user.created_at'))->toEndWith('+09:00');
});

test('usernames must be 3-20 alphanumeric characters or underscores', function (string $username) {
    $this->postJson('/api/register', [
        'username' => $username,
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username' => 'ユーザー名は半角英数字と_で、3〜20文字で入力してください']);
})->with([
    'too short' => 'ab',
    'too long' => str_repeat('a', 21),
    'hyphen' => 'taku-mi',
    'space' => 'taku mi',
    'japanese' => 'たくみ',
]);

test('a username taken with different letter case is rejected', function () {
    User::factory()->create(['username' => 'Takumi']);

    $this->postJson('/api/register', [
        'username' => 'takumi',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username' => 'このユーザー名は既に使われています']);

    expect(User::count())->toBe(1);
});

test('passwords must be at least 8 characters', function () {
    $this->postJson('/api/register', [
        'username' => 'takumi',
        'password' => 'short',
        'password_confirmation' => 'short',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password' => 'パスワードは8文字以上で入力してください']);
});

test('the password confirmation must match', function () {
    $this->postJson('/api/register', [
        'username' => 'takumi',
        'password' => 'password123',
        'password_confirmation' => 'password124',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['password' => 'パスワードが一致しません']);
});

test('a non-string username is a validation error, not a server error', function () {
    $this->postJson('/api/register', [
        'username' => ['takumi'],
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['username']);
});

test('sign-ups are limited to 10 per minute per IP address', function () {
    foreach (range(1, 10) as $i) {
        $this->postJson('/api/register', [
            'username' => "user_{$i}",
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ])->assertCreated();
    }

    $this->postJson('/api/register', [
        'username' => 'user_11',
        'password' => 'password123',
        'password_confirmation' => 'password123',
    ])
        ->assertTooManyRequests()
        ->assertJsonPath('message', 'しばらく時間をおいてお試しください')
        ->assertHeader('Retry-After');

    expect(User::count())->toBe(10);
});

test('username and password are required', function () {
    $this->postJson('/api/register', [])
        ->assertUnprocessable()
        ->assertJsonValidationErrors([
            'username' => 'ユーザー名を入力してください',
            'password' => 'パスワードを入力してください',
        ]);
});
