<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ArticleResource;
use App\Http\Resources\TagResource;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MyHomeController extends Controller
{
    /**
     * Everything user-specific the home screen needs, in one request (GET /api/me/home).
     *
     * The article lists themselves are shared (ISR); the client combines them with
     * read_article_ids and bookmarks, so switching tags needs no further requests.
     */
    public function __invoke(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return response()->json([
            'user' => new UserResource($user),
            'favorite_tags' => TagResource::collection($user->favoriteTags()->get()),
            // Only the pivot table is read (no join with articles).
            'read_article_ids' => $user->readArticles()->allRelatedIds(),
            'bookmarks' => ArticleResource::collection($user->bookmarkedArticles()->get()),
        ]);
    }
}
