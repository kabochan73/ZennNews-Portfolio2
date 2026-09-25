<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

#[Fillable(['username', 'password'])]
#[Hidden(['password'])]
class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory;

    /**
     * Find a user by username, ignoring case.
     */
    public static function findByUsername(string $username): ?self
    {
        return self::whereRaw('lower(username) = ?', [mb_strtolower($username)])->first();
    }

    /**
     * Favorite tags, in tag bar order.
     *
     * @return BelongsToMany<Tag, $this>
     */
    public function favoriteTags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'user_tags')
            ->withPivot('position', 'created_at')
            ->orderByPivot('position');
    }

    /**
     * Articles the user has read.
     *
     * @return BelongsToMany<Article, $this>
     */
    public function readArticles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'article_reads')
            ->withPivot('created_at');
    }

    /**
     * Bookmarked articles, newest bookmark first.
     *
     * @return BelongsToMany<Article, $this>
     */
    public function bookmarkedArticles(): BelongsToMany
    {
        return $this->belongsToMany(Article::class, 'bookmarks')
            ->withPivot('created_at')
            ->orderByPivot('created_at', 'desc');
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'password' => 'hashed',
        ];
    }
}
