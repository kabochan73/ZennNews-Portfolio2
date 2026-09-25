<?php

namespace App\Http\Requests;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RegisterRequest extends FormRequest
{
    public const USERNAME_TAKEN = 'このユーザー名は既に使われています';

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
            'username' => [
                // Stop at the first failure so the lookup below only sees a valid string.
                'bail',
                'required',
                'string',
                'regex:/^[A-Za-z0-9_]{3,20}$/',
                // Usernames are case-insensitive ("Takumi" and "takumi" are the same).
                function (string $attribute, mixed $value, Closure $fail): void {
                    if (User::findByUsername($value) !== null) {
                        $fail(self::USERNAME_TAKEN);
                    }
                },
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'ユーザー名を入力してください',
            'username.regex' => 'ユーザー名は半角英数字と_で、3〜20文字で入力してください',
            'password.required' => 'パスワードを入力してください',
            'password.min' => 'パスワードは8文字以上で入力してください',
            'password.confirmed' => 'パスワードが一致しません',
        ];
    }
}
