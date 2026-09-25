<?php

namespace App\Services\Zenn;

use App\Enums\ArticleType;
use Carbon\CarbonImmutable;

/**
 * An article returned by the Zenn articles API.
 */
final readonly class ZennArticle
{
    public function __construct(
        public int $id,
        public string $title,
        public string $emoji,
        public ArticleType $articleType,
        public string $path,
        public string $authorUsername,
        public string $authorName,
        public ?string $authorAvatarUrl,
        public CarbonImmutable $publishedAt,
    ) {}

    /**
     * Build from one element of the API's "articles" array.
     *
     * @param  array{
     *     id: int,
     *     title: string,
     *     emoji: string,
     *     article_type: string,
     *     path: string,
     *     published_at: string,
     *     user: array{username: string, name: string, avatar_small_url?: string|null},
     * }  $data
     */
    public static function fromApi(array $data): self
    {
        return new self(
            id: $data['id'],
            title: $data['title'],
            emoji: $data['emoji'],
            articleType: ArticleType::from($data['article_type']),
            path: $data['path'],
            authorUsername: $data['user']['username'],
            authorName: $data['user']['name'],
            authorAvatarUrl: $data['user']['avatar_small_url'] ?? null,
            publishedAt: CarbonImmutable::parse($data['published_at']),
        );
    }
}
