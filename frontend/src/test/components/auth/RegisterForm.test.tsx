import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { RegisterForm } from "@/components/auth/RegisterForm";

const replace = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace }) }));

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
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
      <RegisterForm />
    </QueryClientProvider>,
  );

  return { clear };
}

async function fillIn(
  username: string,
  password: string,
  confirmation = password,
) {
  const user = userEvent.setup();
  if (username) await user.type(screen.getByLabelText("ユーザー名"), username);
  if (password) await user.type(screen.getByLabelText("パスワード"), password);
  if (confirmation) {
    await user.type(screen.getByLabelText("パスワード（確認）"), confirmation);
  }
  await user.click(screen.getByRole("button", { name: "アカウントを作成" }));
}

test("shows validation errors without calling the API", async () => {
  renderForm();

  await fillIn("ab", "short", "other");

  expect(
    await screen.findByText(
      "ユーザー名は半角英数字と_で、3〜20文字で入力してください",
    ),
  ).toBeInTheDocument();
  expect(
    screen.getByText("パスワードは8文字以上で入力してください"),
  ).toBeInTheDocument();
  expect(screen.getByLabelText("ユーザー名")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  expect(fetchMock).not.toHaveBeenCalled();
});

test("registers, clears the cache and opens the first-run tag settings", async () => {
  fetchMock.mockResolvedValue(
    Response.json({ user: { username: "takumi" } }, { status: 201 }),
  );
  const { clear } = renderForm();

  await fillIn("takumi", "password123");

  await vi.waitFor(() =>
    expect(replace).toHaveBeenCalledWith("/home/tags?welcome=1"),
  );
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("/api/auth/register");
  expect(JSON.parse(init.body)).toEqual({
    username: "takumi",
    password: "password123",
    password_confirmation: "password123",
  });
  expect(clear).toHaveBeenCalled();
});

test("shows Laravel's 422 errors under their fields", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      {
        message: "このユーザー名は既に使われています",
        errors: { username: ["このユーザー名は既に使われています"] },
      },
      { status: 422 },
    ),
  );
  renderForm();

  await fillIn("takumi", "password123");

  expect(
    await screen.findByText("このユーザー名は既に使われています"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(replace).not.toHaveBeenCalled();
});

test("shows a 429 above the form", async () => {
  fetchMock.mockResolvedValue(
    Response.json(
      { message: "しばらく時間をおいてお試しください" },
      { status: 429 },
    ),
  );
  renderForm();

  await fillIn("takumi", "password123");

  expect(await screen.findByRole("alert")).toHaveTextContent(
    "しばらく時間をおいてお試しください",
  );
});
