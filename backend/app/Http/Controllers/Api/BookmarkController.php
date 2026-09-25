<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Models\Article;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class BookmarkController extends Controller
{
    public const MAX_BOOKMARKS = 100;

    /**
     * All bookmarks, newest bookmark first, including articles no longer in any tag
     * (GET /api/bookmarks).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        $articles = $user->bookmarkedArticles()
            ->withExists([
                'readBy as is_read' => fn (Builder $query) => $query->whereKey($user->id),
                'bookmarkedBy as is_bookmarked' => fn (Builder $query) => $query->whereKey($user->id),
            ])
            ->get();

        return response()->json(['articles' => ArticleResource::collection($articles)]);
    }

    /**
     * Bookmark an article (PUT /api/articles/{id}/bookmark). Up to 100 per user.
     *
     * The user's row is locked so parallel requests are counted one at a time and
     * cannot push the total past the limit.
     */
    public function store(Request $request, Article $article): Response
    {
        /** @var User $user */
        $user = $request->user();

        DB::transaction(function () use ($user, $article): void {
            User::whereKey($user->id)->lockForUpdate()->first();

            if ($user->bookmarkedArticles()->whereKey($article->id)->exists()) {
                return;
            }

            if ($user->bookmarkedArticles()->count() >= self::MAX_BOOKMARKS) {
                abort(422, 'ブックマークは100件までです。いくつか外してください');
            }

            DB::table('bookmarks')->insertOrIgnore([
                'user_id' => $user->id,
                'article_id' => $article->id,
            ]);
        });

        return response()->noContent();
    }

    /**
     * Remove a bookmark (DELETE /api/articles/{id}/bookmark). No error if not bookmarked.
     * The article itself is deleted by the next fetch if it belongs to no tag anymore.
     */
    public function destroy(Request $request, Article $article): Response
    {
        /** @var User $user */
        $user = $request->user();

        $user->bookmarkedArticles()->detach($article->id);

        return response()->noContent();
    }
}
