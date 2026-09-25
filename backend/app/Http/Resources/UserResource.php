<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array{username: string, created_at: string|null}
     */
    public function toArray(Request $request): array
    {
        return [
            'username' => $this->username,
            'created_at' => $this->created_at?->copy()->timezone('Asia/Tokyo')->toIso8601String(),
        ];
    }
}
