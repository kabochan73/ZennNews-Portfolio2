<?php

use App\Enums\ArticleType;
use App\Models\Article;
use App\Models\Tag;
use App\Models\User;
use App\Services\ArticleImporter;
use App\Services\Zenn\ZennArticle;
use Carbon\CarbonImmutable;

function fetchedArticle(int $zennId, string $publishedAt = '2026-09-23T14:05:00+09:00', string $title = 'タイトル'): ZennArticle
{
    return new ZennArticle(
        id: $zennId,
        title: $title,
        emoji: '🚀',
        articleType: ArticleType::Tech,
        path: "/author/articles/{$zennId}",
        authorUsername: 'author',
        authorName: 'Author',
        authorAvatarUrl: null,
        publishedAt: CarbonImmutable::parse($publishedAt),
    );
}

/**
 * Link the given number of older articles to a tag (published 2026-01-01 and later, one day apart).
 */
function fillTag(Tag $tag, int $count): void
{
    $start = CarbonImmutable::parse('2026-01-01T00:00:00Z');

    foreach (range(0, $count - 1) as $i) {
        $tag->articles()->attach(Article::factory()->create(['published_at' => $start->addDays($i)]));
    }
}

test('new articles are saved and linked to the tag', function () {
    $tag = Tag::factory()->create();

    $result = (new ArticleImporter)->import($tag, [fetchedArticle(1), fetchedArticle(2)]);

    expect($result['created'])->toBe(2)
        ->and($tag->articles()->pluck('zenn_id')->sort()->values()->all())->toBe([1, 2]);

    $article = Article::where('zenn_id', 1)->sole();
    expect($article->title)->toBe('タイトル')
        ->and($article->article_type)->toBe(ArticleType::Tech)
        ->and($article->published_at->toIso8601String())->toBe('2026-09-23T05:05:00+00:00');
});

test('existing articles are overwritten instead of duplicated', function () {
    $tag = Tag::factory()->create();
    (new ArticleImporter)->import($tag, [fetchedArticle(1, title: '古いタイトル')]);

    $result = (new ArticleImporter)->import($tag, [fetchedArticle(1, title: '新しいタイトル')]);

    expect($result['created'])->toBe(0)
        ->and(Article::count())->toBe(1)
        ->and(Article::sole()->title)->toBe('新しいタイトル')
        ->and($tag->articles()->count())->toBe(1);
});

test('an article found under another tag is linked to that tag too', function () {
    [$nextjs, $react] = Tag::factory()->count(2)->create();
    (new ArticleImporter)->import($nextjs, [fetchedArticle(1)]);

    (new ArticleImporter)->import($react, [fetchedArticle(1)]);

    expect(Article::count())->toBe(1)
        ->and(Article::sole()->tags()->count())->toBe(2);
});

test('only the newest 100 articles stay linked to a tag', function () {
    $tag = Tag::factory()->create();
    fillTag($tag, 100);
    $oldest = $tag->articles()->orderBy('published_at')->first();

    $result = (new ArticleImporter)->import($tag, [fetchedArticle(1, '2026-09-23T00:00:00Z')]);

    expect($result['unlinked'])->toBe(1)
        ->and($tag->articles()->count())->toBe(100)
        ->and($tag->articles()->whereKey($oldest->id)->exists())->toBeFalse()
        ->and($tag->articles()->where('zenn_id', 1)->exists())->toBeTrue();
});

test('articles with the same published_at are ordered by id', function () {
    $tag = Tag::factory()->create();
    fillTag($tag, 99);
    $samePublishedAt = '2025-12-01T00:00:00Z';
    $lowerId = Article::factory()->create(['published_at' => $samePublishedAt]);
    $higherId = Article::factory()->create(['published_at' => $samePublishedAt]);
    $tag->articles()->attach([$lowerId->id, $higherId->id]);

    (new ArticleImporter)->import($tag, []);

    expect($tag->articles()->whereKey($higherId->id)->exists())->toBeTrue()
        ->and($tag->articles()->whereKey($lowerId->id)->exists())->toBeFalse();
});

test('an unlinked article still in another tag is kept', function () {
    [$tag, $otherTag] = Tag::factory()->count(2)->create();
    fillTag($tag, 100);
    $oldest = $tag->articles()->orderBy('published_at')->first();
    $otherTag->articles()->attach($oldest);

    (new ArticleImporter)->import($tag, [fetchedArticle(1, '2026-09-23T00:00:00Z')]);

    expect(Article::whereKey($oldest->id)->exists())->toBeTrue()
        ->and($oldest->tags()->pluck('tags.id')->all())->toBe([$otherTag->id]);
});

test('an unlinked article that someone bookmarked is kept', function () {
    $tag = Tag::factory()->create();
    fillTag($tag, 100);
    $oldest = $tag->articles()->orderBy('published_at')->first();
    User::factory()->create()->bookmarkedArticles()->attach($oldest);

    $result = (new ArticleImporter)->import($tag, [fetchedArticle(1, '2026-09-23T00:00:00Z')]);

    expect($result['deleted'])->toBe(0)
        ->and(Article::whereKey($oldest->id)->exists())->toBeTrue()
        ->and($oldest->tags()->exists())->toBeFalse();
});

test('an unlinked article in no tag is deleted along with its read records', function () {
    $tag = Tag::factory()->create();
    fillTag($tag, 100);
    $oldest = $tag->articles()->orderBy('published_at')->first();
    $user = User::factory()->create();
    $user->readArticles()->attach($oldest);

    $result = (new ArticleImporter)->import($tag, [fetchedArticle(1, '2026-09-23T00:00:00Z')]);

    expect($result['deleted'])->toBe(1)
        ->and(Article::whereKey($oldest->id)->exists())->toBeFalse()
        ->and($user->readArticles()->count())->toBe(0);
});

test('an article is deleted on the next import once its bookmark is removed', function () {
    $tag = Tag::factory()->create();
    $user = User::factory()->create();
    $orphan = Article::factory()->create();
    $user->bookmarkedArticles()->attach($orphan);
    (new ArticleImporter)->import($tag, []);
    expect(Article::whereKey($orphan->id)->exists())->toBeTrue();

    $user->bookmarkedArticles()->detach($orphan);
    (new ArticleImporter)->import($tag, []);

    expect(Article::whereKey($orphan->id)->exists())->toBeFalse();
});
