// TEMPORARY: shows which IP headers Railway's edge sends, to fix client-ip.ts.
// Only echoes the caller's own headers. Delete right after checking.
const IP_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "x-envoy-external-address",
  "forwarded",
  "cf-connecting-ip",
  "true-client-ip",
  "x-railway-edge",
];

export function GET(request: Request): Response {
  return Response.json(
    Object.fromEntries(
      IP_HEADERS.map((name) => [name, request.headers.get(name)]),
    ),
  );
}
