<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\DeleteAccountRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\DB;

class AccountController extends Controller
{
    /**
     * The authenticated user's account (GET /api/me).
     */
    public function show(Request $request): JsonResponse
    {
        return response()->json(['user' => new UserResource($request->user())]);
    }

    /**
     * Delete the account after confirming the password (DELETE /api/me).
     *
     * Favorite tags, reads and bookmarks are removed by foreign key cascades.
     * Sanctum tokens are polymorphic (no foreign key), so they are deleted explicitly.
     */
    public function destroy(DeleteAccountRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        DB::transaction(function () use ($user): void {
            $user->tokens()->delete();
            $user->delete();
        });

        return response()->noContent();
    }
}
