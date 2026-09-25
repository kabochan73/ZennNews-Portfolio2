<?php

namespace App\Models;

use App\Enums\ArticleType;
use Database\Factories\ArticleFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable([
    'zenn_id',
    'title',
    'emoji',
    'article_type',
    'path',
    'author_username',
    'author_name',
    'author_avatar_url',
    'published_at',
])]
class Article extends Model
{
    /** @use HasFactory<ArticleFactory> */
    use HasFactory;

    /**
     * Tags whose latest 100 include this article.
     *
     * @return BelongsToMany<Tag, $this>
     */
    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class);
    }

    /**
     * Users who bookmarked this article.
     *
     * @return BelongsToMany<User, $this>
     */
    public function bookmarkedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'bookmarks');
    }

    /**
     * Full URL of the article on Zenn.
     */
    public function url(): string
    {
        return 'https://zenn.dev'.$this->path;
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'zenn_id' => 'integer',
            'article_type' => ArticleType::class,
            'published_at' => 'immutable_datetime',
        ];
    }
}
