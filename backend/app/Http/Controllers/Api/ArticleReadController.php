<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class ArticleReadController extends Controller
{
    /**
     * Mark an article as read (POST /api/articles/{id}/read).
     *
     * insertOrIgnore makes this idempotent even for simultaneous requests
     * (e.g. a double click), where "check, then insert" would hit the primary key.
     */
    public function __invoke(Request $request, Article $article): Response
    {
        DB::table('article_reads')->insertOrIgnore([
            'user_id' => $request->user()->id,
            'article_id' => $article->id,
        ]);

        return response()->noContent();
    }
}
