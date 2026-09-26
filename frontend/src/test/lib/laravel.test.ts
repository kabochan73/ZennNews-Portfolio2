import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import {
  getTagArticles,
  getTagCategories,
  laravelFetch,
  tagArticlesCacheTag,
} from "@/lib/laravel";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("LARAVEL_API_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(Response.json({}));
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

function lastRequest(): [
  string,
  RequestInit & { next?: NextFetchRequestConfig },
] {
  return fetchMock.mock.calls.at(-1) as [string, RequestInit];
}

describe("laravelFetch", () => {
  test("prefixes the path with LARAVEL_API_URL and /api", async () => {
    await laravelFetch("/me/home");

    const [url, init] = lastRequest();
    expect(url).toBe("http://backend.test/api/me/home");
    expect(init.method).toBe("GET");
    expect(init.headers).toEqual({ Accept: "application/json" });
  });

  test("sends the token as a Bearer token and the body as JSON", async () => {
    await laravelFetch("/me/tags", {
      method: "PUT",
      body: JSON.stringify({ tag_ids: [1] }),
      token: "secret-token",
    });

    const [, init] = lastRequest();
    expect(init.method).toBe("PUT");
    expect(init.body).toBe('{"tag_ids":[1]}');
    expect(init.headers).toEqual({
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: "Bearer secret-token",
    });
  });

  test("fails loudly when LARAVEL_API_URL is missing", async () => {
    vi.stubEnv("LARAVEL_API_URL", "");

    await expect(laravelFetch("/tags")).rejects.toThrow(
      "LARAVEL_API_URL is not set",
    );
  });
});

describe("getTagArticles", () => {
  test("requests the tag's articles with the ISR cache settings", async () => {
    const body = {
      tag: { id: 1, slug: "nextjs", name: "Next.js" },
      articles: [],
    };
    fetchMock.mockResolvedValue(Response.json(body));

    await expect(getTagArticles("nextjs")).resolves.toEqual(body);

    const [url, init] = lastRequest();
    expect(url).toBe("http://backend.test/api/tags/nextjs/articles");
    expect(init.next).toEqual({
      revalidate: 60 * 60 * 8,
      tags: [tagArticlesCacheTag("nextjs")],
    });
  });

  test("returns null for an unknown tag", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "Not Found" }, { status: 404 }),
    );

    await expect(getTagArticles("unknown")).resolves.toBeNull();
  });

  test("throws on other errors", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ message: "Server Error" }, { status: 500 }),
    );

    await expect(getTagArticles("nextjs")).rejects.toThrow("(500)");
  });
});

describe("getTagCategories", () => {
  test("returns the categories, cached for a day", async () => {
    const categories = [
      { name: "開発言語", tags: [{ id: 1, slug: "php", name: "PHP" }] },
    ];
    fetchMock.mockResolvedValue(Response.json({ categories }));

    await expect(getTagCategories()).resolves.toEqual(categories);
    expect(lastRequest()[1].next).toEqual({ revalidate: 60 * 60 * 24 });
  });
});
