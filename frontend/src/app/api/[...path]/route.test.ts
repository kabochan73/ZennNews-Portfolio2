import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { DELETE, GET, POST, PUT } from "@/app/api/[...path]/route";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubEnv("LARAVEL_API_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
  cookieStore.get.mockReturnValue({
    name: AUTH_COOKIE_NAME,
    value: "1|secret",
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function context(...path: string[]) {
  return { params: Promise.resolve({ path }) };
}

function lastRequest(): [
  string,
  RequestInit & { headers: Record<string, string> },
] {
  return fetchMock.mock.calls.at(-1) as [
    string,
    RequestInit & { headers: Record<string, string> },
  ];
}

test("relays a GET with the Bearer token and the query string", async () => {
  const body = { user: { username: "takumi", created_at: null } };
  fetchMock.mockResolvedValue(Response.json(body));

  const response = await GET(
    new Request("http://localhost/api/me/home?x=1"),
    context("me", "home"),
  );

  expect(response.status).toBe(200);
  expect(await response.json()).toEqual(body);
  const [url, init] = lastRequest();
  expect(url).toBe("http://backend.test/api/me/home?x=1");
  expect(init.method).toBe("GET");
  expect(init.headers.Authorization).toBe("Bearer 1|secret");
  expect(init.body).toBeUndefined();
});

test("relays a PUT with its JSON body", async () => {
  fetchMock.mockResolvedValue(Response.json({ tags: [] }));

  await PUT(
    new Request("http://localhost/api/me/tags", {
      method: "PUT",
      body: JSON.stringify({ tag_ids: [3, 1] }),
    }),
    context("me", "tags"),
  );

  const [url, init] = lastRequest();
  expect(url).toBe("http://backend.test/api/me/tags");
  expect(init.method).toBe("PUT");
  expect(init.body).toBe('{"tag_ids":[3,1]}');
});

test("passes 204 through without a body", async () => {
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

  const response = await POST(
    new Request("http://localhost/api/articles/12/read", { method: "POST" }),
    context("articles", "12", "read"),
  );

  expect(response.status).toBe(204);
  expect(await response.text()).toBe("");
  expect(lastRequest()[1].body).toBeUndefined();
});

test("drops the cookie when Laravel answers 401", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ message: "Unauthenticated." }, { status: 401 }),
  );

  const response = await GET(
    new Request("http://localhost/api/me/home"),
    context("me", "home"),
  );

  expect(response.status).toBe(401);
  expect(cookieStore.delete).toHaveBeenCalledWith(AUTH_COOKIE_NAME);
});

test("passes errors through as message only", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      {
        message: "ブックマークは100件までです。いくつか外してください",
        trace: [
          { file: "/app/app/Http/Controllers/Api/BookmarkController.php" },
        ],
      },
      { status: 422 },
    ),
  );

  const response = await PUT(
    new Request("http://localhost/api/articles/12/bookmark", { method: "PUT" }),
    context("articles", "12", "bookmark"),
  );

  expect(response.status).toBe(422);
  expect(await response.json()).toEqual({
    message: "ブックマークは100件までです。いくつか外してください",
  });
  expect(cookieStore.delete).not.toHaveBeenCalled();
});

test("sends no Authorization header without a cookie", async () => {
  cookieStore.get.mockReturnValue(undefined);
  fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

  await DELETE(
    new Request("http://localhost/api/articles/12/bookmark", {
      method: "DELETE",
    }),
    context("articles", "12", "bookmark"),
  );

  expect(lastRequest()[1].headers.Authorization).toBeUndefined();
});
