<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Models\User;
use App\Services\ArticleImporter;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TagArticleController extends Controller
{
    /**
     * A tag's articles (up to 100), newest first, with the user's read/bookmark state
     * (GET /api/tags/{slug}/articles). The client splits them into NEW / READ.
     */
    public function __invoke(Request $request, Tag $tag): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        // One query: is_read / is_bookmarked are EXISTS subqueries, not a query per article.
        $articles = $tag->articles()
            ->withExists([
                'readBy as is_read' => fn (Builder $query) => $query->whereKey($user->id),
                'bookmarkedBy as is_bookmarked' => fn (Builder $query) => $query->whereKey($user->id),
            ])
            ->orderByDesc('published_at')
            ->orderByDesc('articles.id')
            ->limit(ArticleImporter::MAX_ARTICLES_PER_TAG)
            ->get();

        return response()->json([
            'tag' => new TagResource($tag),
            'articles' => ArticleResource::collection($articles),
        ]);
    }
}
