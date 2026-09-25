<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\JsonResponse;

class TagController extends Controller
{
    /**
     * All tags grouped by category, for the tag selection screen (GET /api/tags).
     *
     * Categories appear in the order of their first tag's sort_order.
     */
    public function index(): JsonResponse
    {
        $categories = Tag::orderBy('sort_order')
            ->get()
            ->groupBy('category')
            ->map(fn (Collection $tags, string $category): array => [
                'name' => $category,
                'tags' => TagResource::collection($tags),
            ])
            ->values();

        return response()->json(['categories' => $categories]);
    }
}
