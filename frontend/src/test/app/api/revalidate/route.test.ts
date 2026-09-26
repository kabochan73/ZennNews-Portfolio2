import { revalidateTag } from "next/cache";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { POST } from "@/app/api/revalidate/route";

vi.mock("next/cache", () => ({ revalidateTag: vi.fn() }));

beforeEach(() => {
  vi.stubEnv("REVALIDATE_SECRET", "test-secret");
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});

function revalidateRequest(body: unknown, secret?: string): Request {
  return new Request("http://localhost/api/revalidate", {
    method: "POST",
    headers: secret ? { "X-Revalidate-Secret": secret } : {},
    body: JSON.stringify(body),
  });
}

test("revalidates the tag's article list with the max profile", async () => {
  const response = await POST(
    revalidateRequest({ slug: "nextjs" }, "test-secret"),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ revalidated: true });
  expect(revalidateTag).toHaveBeenCalledWith("tag-articles:nextjs", "max");
});

test.each([
  ["missing", undefined],
  ["wrong", "wrong-secret"],
  ["longer", "test-secret-and-more"],
])("rejects a %s secret", async (_, secret) => {
  const response = await POST(revalidateRequest({ slug: "nextjs" }, secret));

  expect(response.status).toBe(401);
  expect(revalidateTag).not.toHaveBeenCalled();
});

test("rejects every request when the secret is not configured", async () => {
  vi.stubEnv("REVALIDATE_SECRET", "");

  const response = await POST(revalidateRequest({ slug: "nextjs" }, ""));

  expect(response.status).toBe(401);
});

test.each([
  ["missing", {}],
  ["not a string", { slug: 1 }],
  ["with a slash", { slug: "../nextjs" }],
  ["uppercase", { slug: "NextJS" }],
])("rejects a %s slug", async (_, body) => {
  const response = await POST(revalidateRequest(body, "test-secret"));

  expect(response.status).toBe(422);
  expect(revalidateTag).not.toHaveBeenCalled();
});
