<?php

use App\Http\Controllers\Api\AccountController;
use App\Http\Controllers\Api\ArticleReadController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\LogoutController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\BookmarkController;
use App\Http\Controllers\Api\FavoriteTagController;
use App\Http\Controllers\Api\TagArticleController;
use App\Http\Controllers\Api\TagController;
use Illuminate\Support\Facades\Route;

Route::post('/register', RegisterController::class)->middleware('throttle:register');
Route::post('/login', LoginController::class);

// Shared data used by Next.js to build cached (ISR) pages; no login needed.
Route::middleware('throttle:public-api')->group(function () {
    Route::get('/tags', [TagController::class, 'index']);
});

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', LogoutController::class);

    Route::get('/me', [AccountController::class, 'show']);
    Route::delete('/me', [AccountController::class, 'destroy']);
    Route::get('/me/tags', [FavoriteTagController::class, 'index']);
    Route::put('/me/tags', [FavoriteTagController::class, 'update']);

    Route::get('/tags/{tag:slug}/articles', TagArticleController::class);

    Route::post('/articles/{article}/read', ArticleReadController::class);
    Route::put('/articles/{article}/bookmark', [BookmarkController::class, 'store']);
    Route::delete('/articles/{article}/bookmark', [BookmarkController::class, 'destroy']);
});
