import "server-only";

import type { TagArticles, TagCategory } from "@/types/api";

/** Rebuild tag pages at least every 8 hours, in case a revalidation notice is missed. */
const TAG_ARTICLES_REVALIDATE_SECONDS = 60 * 60 * 8;

/** Tags only change on deploy. */
const TAG_CATEGORIES_REVALIDATE_SECONDS = 60 * 60 * 24;

/** Cache tag of a tag's article list, shared with POST /api/revalidate. */
export function tagArticlesCacheTag(slug: string): string {
  return `tag-articles:${slug}`;
}

type LaravelFetchOptions = {
  method?: string;
  /** Request body, already serialized as JSON. */
  body?: string;
  /** Sanctum token of the user, sent as a Bearer token. */
  token?: string;
  next?: NextFetchRequestConfig;
};

/**
 * Call the Laravel API from the Next.js server (never from the browser).
 * `path` is relative to /api, e.g. "/me/home".
 */
export async function laravelFetch(
  path: string,
  { method = "GET", body, token, next }: LaravelFetchOptions = {},
): Promise<Response> {
  const baseUrl = process.env.LARAVEL_API_URL;
  if (!baseUrl) {
    throw new Error("LARAVEL_API_URL is not set");
  }

  const headers: Record<string, string> = { Accept: "application/json" };
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${baseUrl}/api${path}`, { method, headers, body, next });
}

/**
 * A tag's articles for its ISR page, or null if the tag does not exist.
 * Cached per tag; rebuilt on a revalidation notice or every 8 hours.
 */
export async function getTagArticles(
  slug: string,
): Promise<TagArticles | null> {
  const response = await laravelFetch(
    `/tags/${encodeURIComponent(slug)}/articles`,
    {
      next: {
        revalidate: TAG_ARTICLES_REVALIDATE_SECONDS,
        tags: [tagArticlesCacheTag(slug)],
      },
    },
  );

  if (response.status === 404) {
    return null;
  }
  if (!response.ok) {
    throw new Error(
      `Failed to fetch articles of "${slug}" (${response.status})`,
    );
  }

  return response.json();
}

/** All tags grouped by category, for the tag settings page. */
export async function getTagCategories(): Promise<TagCategory[]> {
  const response = await laravelFetch("/tags", {
    next: { revalidate: TAG_CATEGORIES_REVALIDATE_SECONDS },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch tags (${response.status})`);
  }

  const data: { categories: TagCategory[] } = await response.json();

  return data.categories;
}
