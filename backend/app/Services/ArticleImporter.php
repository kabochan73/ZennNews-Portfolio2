<?php

namespace App\Services;

use App\Models\Article;
use App\Models\Tag;
use App\Services\Zenn\ZennArticle;
use Illuminate\Support\Facades\DB;

/**
 * Saves articles fetched from Zenn for a tag and keeps each tag at its latest 100.
 */
class ArticleImporter
{
    public const MAX_ARTICLES_PER_TAG = 100;

    /**
     * Import a tag's fetched articles in a single transaction.
     *
     * 1. Upsert articles by zenn_id (existing ones are overwritten with the latest data)
     * 2. Link them to the tag (existing links are kept)
     * 3. Unlink the tag's articles beyond the newest 100
     * 4. Delete articles that belong to no tag and are bookmarked by nobody
     *
     * @param  list<ZennArticle>  $zennArticles
     * @return array{created: int, unlinked: int, deleted: int}
     */
    public function import(Tag $tag, array $zennArticles): array
    {
        return DB::transaction(function () use ($tag, $zennArticles): array {
            $zennIds = array_values(array_unique(array_map(
                fn (ZennArticle $article): int => $article->id,
                $zennArticles,
            )));

            $existingCount = Article::whereIn('zenn_id', $zennIds)->count();
            $this->upsertArticles($zennArticles);

            $articleIds = Article::whereIn('zenn_id', $zennIds)->pluck('id')->all();
            $tag->articles()->syncWithoutDetaching($articleIds);

            return [
                'created' => count($zennIds) - $existingCount,
                'unlinked' => $this->unlinkOldArticles($tag),
                'deleted' => $this->deleteOrphanedArticles(),
            ];
        });
    }

    /**
     * @param  list<ZennArticle>  $zennArticles
     */
    private function upsertArticles(array $zennArticles): void
    {
        $rows = [];

        // Keyed by zenn_id so a duplicated article in one response is upserted once.
        foreach ($zennArticles as $article) {
            $rows[$article->id] = [
                'zenn_id' => $article->id,
                'title' => $article->title,
                'emoji' => $article->emoji,
                'article_type' => $article->articleType->value,
                'path' => $article->path,
                'author_username' => $article->authorUsername,
                'author_name' => $article->authorName,
                'author_avatar_url' => $article->authorAvatarUrl,
                // Pass an ISO 8601 string so the UTC offset is kept in timestamptz.
                'published_at' => $article->publishedAt->toIso8601String(),
            ];
        }

        Article::upsert(array_values($rows), uniqueBy: ['zenn_id'], update: [
            'title',
            'emoji',
            'article_type',
            'path',
            'author_username',
            'author_name',
            'author_avatar_url',
            'published_at',
        ]);
    }

    /**
     * Remove the tag's links beyond the newest 100 (published_at, then id, descending).
     *
     * @return int Number of removed links
     */
    private function unlinkOldArticles(Tag $tag): int
    {
        $newestIds = DB::table('article_tag')
            ->join('articles', 'articles.id', '=', 'article_tag.article_id')
            ->where('article_tag.tag_id', $tag->id)
            ->orderByDesc('articles.published_at')
            ->orderByDesc('articles.id')
            ->limit(self::MAX_ARTICLES_PER_TAG)
            ->select('articles.id');

        return DB::table('article_tag')
            ->where('tag_id', $tag->id)
            ->whereNotIn('article_id', $newestIds)
            ->delete();
    }

    /**
     * Delete articles in no tag's latest 100 and not bookmarked by anyone.
     * Their read records are removed by the foreign key cascade.
     *
     * @return int Number of deleted articles
     */
    private function deleteOrphanedArticles(): int
    {
        return Article::query()
            ->whereDoesntHave('tags')
            ->whereDoesntHave('bookmarkedBy')
            ->delete();
    }
}
