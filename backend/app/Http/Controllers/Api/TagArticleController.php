<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\ArticleImporter;
use Illuminate\Http\JsonResponse;

class TagArticleController extends Controller
{
    /**
     * A tag's articles (up to 100), newest first (GET /api/tags/{slug}/articles).
     *
     * Public and identical for every user, so Next.js can cache it as an ISR page.
     * The client combines it with the user's read IDs to split NEW / READ.
     */
    public function __invoke(Tag $tag): JsonResponse
    {
        $articles = $tag->articles()
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
