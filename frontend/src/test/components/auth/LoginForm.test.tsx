import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { LoginExpiredNotice, LoginForm } from "@/components/auth/LoginForm";

const replace = vi.fn();
let searchParams = new URLSearchParams();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace }),
  useSearchParams: () => searchParams,
}));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  searchParams = new URLSearchParams();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

function renderForm() {
  const queryClient = new QueryClient();
  const clear = vi.spyOn(queryClient, "clear");
  render(
    <QueryClientProvider client={queryClient}>
      <LoginForm />
    </QueryClientProvider>,
  );

  return { clear };
}

async function logIn(username: string, password: string) {
  const user = userEvent.setup();
  if (username) await user.type(screen.getByLabelText("ユーザー名"), username);
  if (password) await user.type(screen.getByLabelText("パスワード"), password);
  await user.click(screen.getByRole("button", { name: "ログイン" }));
}

test("requires both fields without calling the API", async () => {
  renderForm();

  await logIn("", "");

  expect(
    await screen.findByText("ユーザー名を入力してください"),
  ).toBeInTheDocument();
  expect(screen.getByText("パスワードを入力してください")).toBeInTheDocument();
  expect(fetchMock).not.toHaveBeenCalled();
});

test("logs in, clears the cache and opens /home", async () => {
  fetchMock.mockResolvedValue(Response.json({ user: { username: "takumi" } }));
  const { clear } = renderForm();

  await logIn("takumi", "password123");

  await vi.waitFor(() => expect(replace).toHaveBeenCalledWith("/home"));
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/auth/login");
  expect(JSON.parse(init.body)).toEqual({
    username: "takumi",
    password: "password123",
  });
  expect(clear).toHaveBeenCalled();
});

test("shows wrong credentials above the form", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { message: "ユーザー名またはパスワードが違います" },
      { status: 401 },
    ),
  );
  renderForm();

  await logIn("takumi", "wrong-password");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "ユーザー名またはパスワードが違います",
  );
  expect(replace).not.toHaveBeenCalled();
});

test("shows a network failure above the form", async () => {
  fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
  renderForm();

  await logIn("takumi", "password123");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "通信に失敗しました",
  );
});

test("the expired notice appears only with ?expired=1", () => {
  const { rerender } = render(<LoginExpiredNotice />);
  expect(screen.queryByRole("status")).not.toBeInTheDocument();

  searchParams = new URLSearchParams("expired=1");
  rerender(<LoginExpiredNotice />);
  expect(screen.getByRole("status")).toHaveTextContent(
    "ログインし直してください",
  );
});
