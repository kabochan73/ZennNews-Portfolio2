import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { AUTH_COOKIE_NAME } from "@/lib/auth-cookie";

const cookieStore = { set: vi.fn(), get: vi.fn(), delete: vi.fn() };

vi.mock("next/headers", () => ({
  cookies: async () => cookieStore,
}));

const fetchMock = vi.fn();
const user = { username: "takumi", created_at: "2026-09-26T10:00:00+09:00" };

beforeEach(() => {
  vi.stubEnv("LARAVEL_API_URL", "http://backend.test");
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/auth/login", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

describe("login", () => {
  test("stores the token in the cookie and returns only the user", async () => {
    fetchMock.mockResolvedValue(Response.json({ user, token: "1|secret" }));

    const response = await login(
      jsonRequest({ username: "takumi", password: "password123" }),
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ user });
    expect(cookieStore.set).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "1|secret",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("http://backend.test/api/login");
    expect(init.body).toBe('{"username":"takumi","password":"password123"}');
  });

  test("passes a 401 through without setting the cookie or debug details", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        {
          message: "ユーザー名またはパスワードが違います",
          exception: "HttpException",
          trace: [{ file: "/app/app/Http/Requests/LoginRequest.php" }],
        },
        { status: 401 },
      ),
    );

    const response = await login(
      jsonRequest({ username: "takumi", password: "wrong" }),
    );

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({
      message: "ユーザー名またはパスワードが違います",
    });
    expect(cookieStore.set).not.toHaveBeenCalled();
  });

  test("passes a 429 through with Retry-After", async () => {
    fetchMock.mockResolvedValue(
      Response.json(
        { message: "しばらく時間をおいてお試しください" },
        { status: 429, headers: { "Retry-After": "42" } },
      ),
    );

    const response = await login(
      jsonRequest({ username: "takumi", password: "wrong" }),
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("42");
  });
});

describe("register", () => {
  test("keeps the 201 status and stores the token", async () => {
    fetchMock.mockResolvedValue(
      Response.json({ user, token: "2|secret" }, { status: 201 }),
    );

    const response = await register(
      jsonRequest({
        username: "takumi",
        password: "password123",
        password_confirmation: "password123",
      }),
    );

    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({ user });
    expect(cookieStore.set).toHaveBeenCalledWith(
      AUTH_COOKIE_NAME,
      "2|secret",
      expect.anything(),
    );
    expect(fetchMock.mock.calls[0][0]).toBe("http://backend.test/api/register");
  });

  test("passes validation errors through", async () => {
    const error = {
      message: "このユーザー名は既に使われています",
      errors: { username: ["このユーザー名は既に使われています"] },
    };
    fetchMock.mockResolvedValue(Response.json(error, { status: 422 }));

    const response = await register(jsonRequest({ username: "takumi" }));

    expect(response.status).toBe(422);
    expect(await response.json()).toEqual(error);
    expect(cookieStore.set).not.toHaveBeenCalled();
  });
});
