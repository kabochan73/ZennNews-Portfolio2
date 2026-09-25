<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateFavoriteTagsRequest;
use App\Http\Resources\TagResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FavoriteTagController extends Controller
{
    /**
     * The user's favorite tags in tag bar order (GET /api/me/tags).
     */
    public function index(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        return $this->favoriteTagsResponse($user);
    }

    /**
     * Replace the favorite tags; the array order becomes the tag bar order (PUT /api/me/tags).
     *
     * sync() deletes unselected rows, inserts new ones and only updates the position of
     * tags that were already selected, so their created_at is kept.
     */
    public function update(UpdateFavoriteTagsRequest $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();

        /** @var list<int> $tagIds */
        $tagIds = $request->validated('tag_ids');

        $user->favoriteTags()->sync(
            collect($tagIds)->mapWithKeys(fn (int $tagId, int $position): array => [
                $tagId => ['position' => $position],
            ])->all(),
        );

        return $this->favoriteTagsResponse($user);
    }

    private function favoriteTagsResponse(User $user): JsonResponse
    {
        return response()->json(['tags' => TagResource::collection($user->favoriteTags()->get())]);
    }
}
