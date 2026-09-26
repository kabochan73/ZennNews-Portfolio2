<?php

use App\Services\FrontendRevalidator;
use Illuminate\Http\Client\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

beforeEach(function () {
    config([
        'services.frontend.url' => 'http://frontend.test',
        'services.frontend.revalidate_secret' => 'test-secret',
    ]);
});

test('it posts the tag slug with the secret header', function () {
    Http::fake(['frontend.test/api/revalidate' => Http::response(['revalidated' => true])]);

    $result = (new FrontendRevalidator)->revalidate('nextjs');

    expect($result)->toBeTrue();
    Http::assertSent(fn (Request $request): bool => $request->method() === 'POST'
        && $request->url() === 'http://frontend.test/api/revalidate'
        && $request->hasHeader('X-Revalidate-Secret', 'test-secret')
        && $request['slug'] === 'nextjs');
});

test('a failed request is logged and returns false instead of throwing', function () {
    Http::fake(['frontend.test/*' => Http::response([], 500)]);
    Log::spy();

    $result = (new FrontendRevalidator)->revalidate('nextjs');

    expect($result)->toBeFalse();
    Log::shouldHaveReceived('warning')->once();
});

test('it does nothing when the frontend is not configured', function (string $key) {
    config(["services.frontend.{$key}" => null]);
    Http::fake();

    expect((new FrontendRevalidator)->revalidate('nextjs'))->toBeFalse();
    Http::assertNothingSent();
})->with(['url', 'revalidate_secret']);
