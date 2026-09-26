import { timingSafeEqual } from "node:crypto";

import { revalidateTag } from "next/cache";

import { tagArticlesCacheTag } from "@/lib/laravel";

/** Zenn topic names: lowercase letters, digits, "-" and "_". */
const SLUG_PATTERN = /^[a-z0-9_-]{1,50}$/;

/**
 * Called by Laravel after a tag's articles are fetched (POST /api/revalidate).
 *
 * Marks the tag's cached article list as stale; with the "max" profile the next
 * visitor still gets the cached page immediately while it is rebuilt in the background.
 */
export async function POST(request: Request): Promise<Response> {
  if (!hasValidSecret(request.headers.get("X-Revalidate-Secret"))) {
    return Response.json({ message: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await request.json().catch(() => ({}));
  if (typeof slug !== "string" || !SLUG_PATTERN.test(slug)) {
    return Response.json({ message: "Invalid slug" }, { status: 422 });
  }

  revalidateTag(tagArticlesCacheTag(slug), "max");

  return Response.json({ revalidated: true });
}

/** Constant-time comparison, so response timing reveals nothing about the secret. */
function hasValidSecret(received: string | null): boolean {
  const expected = process.env.REVALIDATE_SECRET;
  if (!expected || !received) {
    return false;
  }

  const a = Buffer.from(received);
  const b = Buffer.from(expected);

  return a.length === b.length && timingSafeEqual(a, b);
}
