import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { ApiClientError, apiFetch } from "@/lib/api-client";

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
  fetchMock.mockReset();
});

test("GETs /api + path and returns the JSON body", async () => {
  fetchMock.mockResolvedValue(Response.json({ tags: [] }));

  await expect(apiFetch("/me/tags")).resolves.toEqual({ tags: [] });

  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/me/tags");
  expect(init.method).toBe("GET");
  expect(init.body).toBeUndefined();
});

test("sends the body as JSON", async () => {
  fetchMock.mockResolvedValue(Response.json({ tags: [] }));

  await apiFetch("/me/tags", { method: "PUT", body: { tag_ids: [3, 1] } });

  const [, init] = fetchMock.mock.calls[0];
  expect(init.method).toBe("PUT");
  expect(init.body).toBe('{"tag_ids":[3,1]}');
  expect(init.headers["Content-Type"]).toBe("application/json");
});

test("resolves to undefined on 204", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

  await expect(
    apiFetch("/articles/12/read", { method: "POST" }),
  ).resolves.toBeUndefined();
});

test("throws ApiClientError with the status, message and errors", async () => {
  const errors = { tag_ids: ["タグを1つ以上選んでください"] };
  fetchMock.mockResolvedValue(
    Response.json(
      { message: "タグを1つ以上選んでください", errors },
      { status: 422 },
    ),
  );

  const error = await apiFetch("/me/tags", {
    method: "PUT",
    body: { tag_ids: [] },
  }).catch((e: unknown) => e);

  expect(error).toBeInstanceOf(ApiClientError);
  expect(error).toMatchObject({
    status: 422,
    message: "タグを1つ以上選んでください",
    errors,
  });
});

test("falls back to a generic message when the error body is not JSON", async () => {
  fetchMock.mockResolvedValue(new Response("Bad Gateway", { status: 502 }));

  await expect(apiFetch("/me/home")).rejects.toMatchObject({
    status: 502,
    message: "エラーが発生しました",
  });
});
