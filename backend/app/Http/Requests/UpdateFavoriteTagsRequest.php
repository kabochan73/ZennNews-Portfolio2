<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateFavoriteTagsRequest extends FormRequest
{
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
            // Tag IDs in tag bar order. At least one favorite tag is always required.
            'tag_ids' => ['required', 'array', 'min:1'],
            'tag_ids.*' => ['integer', 'distinct', 'exists:tags,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tag_ids.required' => 'タグを1つ以上選んでください',
            'tag_ids.min' => 'タグを1つ以上選んでください',
            'tag_ids.array' => 'タグの指定が正しくありません',
            'tag_ids.*.integer' => 'タグの指定が正しくありません',
            'tag_ids.*.distinct' => '同じタグが重複しています',
            'tag_ids.*.exists' => '存在しないタグが含まれています',
        ];
    }
}
