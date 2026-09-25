<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;

class LoginRequest extends FormRequest
{
    /**
     * Failed attempts allowed per username + IP within DECAY_SECONDS.
     */
    private const MAX_ATTEMPTS = 5;

    private const DECAY_SECONDS = 60;

    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'ユーザー名を入力してください',
            'password.required' => 'パスワードを入力してください',
        ];
    }

    /**
     * Check the credentials and return the user.
     *
     * Aborts with 429 when there were too many failed attempts, and with 401 when the
     * credentials are wrong. An unknown username gets the same 401 as a wrong password
     * so the response does not reveal which usernames exist.
     */
    public function authenticate(): User
    {
        $this->ensureIsNotRateLimited();

        $user = User::findByUsername($this->string('username')->value());

        if ($user === null || ! Hash::check($this->string('password')->value(), $user->password)) {
            RateLimiter::hit($this->throttleKey(), self::DECAY_SECONDS);

            abort(401, 'ユーザー名またはパスワードが違います');
        }

        RateLimiter::clear($this->throttleKey());

        return $user;
    }

    private function ensureIsNotRateLimited(): void
    {
        if (! RateLimiter::tooManyAttempts($this->throttleKey(), self::MAX_ATTEMPTS)) {
            return;
        }

        abort(429, 'しばらく時間をおいてお試しください', [
            'Retry-After' => RateLimiter::availableIn($this->throttleKey()),
        ]);
    }

    /**
     * Failed attempts are counted per (case-insensitive) username and IP address.
     */
    private function throttleKey(): string
    {
        return 'login:'.mb_strtolower($this->string('username')->value()).'|'.$this->ip();
    }
}
