import "server-only";

/**
 * The visitor's IP, to forward to Laravel for per-visitor rate limits.
 *
 * Uses the right-most X-Forwarded-For entry: a visitor can send any value on the
 * left, but the proxy in front of Next.js (Railway's edge) appends the real
 * address on the right. Next.js itself only fills the header when it is missing.
 */
export function getClientIp(headers: Headers): string | undefined {
  const entries = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries?.at(-1);
}
