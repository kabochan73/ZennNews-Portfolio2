<?php

namespace App\Http\Resources;

use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Expects is_read / is_bookmarked to be loaded with withExists() for the current user.
 *
 * @mixin Article
 */
class ArticleResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'emoji' => $this->emoji,
            'article_type' => $this->article_type->value,
            'url' => $this->url(),
            'author' => [
                'username' => $this->author_username,
                'name' => $this->author_name,
                'avatar_url' => $this->author_avatar_url,
            ],
            'published_at' => $this->published_at->timezone('Asia/Tokyo')->toIso8601String(),
            'is_read' => (bool) $this->is_read,
            'is_bookmarked' => (bool) $this->is_bookmarked,
        ];
    }
}
