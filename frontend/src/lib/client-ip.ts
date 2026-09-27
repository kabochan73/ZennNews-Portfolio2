import "server-only";

/**
 * The visitor's IP, to forward to Laravel for per-visitor rate limits.
 *
 * On Railway, the edge sets X-Real-IP to the visitor's address and overwrites any
 * value the visitor sent, so it can't be forged. (X-Forwarded-For is
 * "visitor, edge server", and the edge server changes from request to request.)
 * Without X-Real-IP (local Docker), falls back to the right-most X-Forwarded-For
 * entry, which Next.js fills with the connecting address when it is missing.
 */
export function getClientIp(headers: Headers): string | undefined {
  const realIp = headers.get("x-real-ip")?.trim();
  if (realIp) {
    return realIp;
  }

  const entries = headers
    .get("x-forwarded-for")
    ?.split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  return entries?.at(-1);
}
