import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import {
  TOAST_DURATION_MS,
  ToastProvider,
  useToast,
} from "@/components/ui/Toast";

function SaveButton() {
  const { showToast } = useToast();

  return <button onClick={() => showToast("保存に失敗しました")}>save</button>;
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  vi.useRealTimers();
});

test("shows the message and hides it after a few seconds", async () => {
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  render(
    <ToastProvider>
      <SaveButton />
    </ToastProvider>,
  );

  await user.click(screen.getByRole("button", { name: "save" }));
  expect(screen.getByText("保存に失敗しました")).toBeInTheDocument();

  act(() => {
    vi.advanceTimersByTime(TOAST_DURATION_MS);
  });
  expect(screen.queryByText("保存に失敗しました")).not.toBeInTheDocument();
});

test("useToast fails loudly outside the provider", () => {
  vi.spyOn(console, "error").mockImplementation(() => {});

  expect(() => render(<SaveButton />)).toThrow(
    "useToast must be used inside <ToastProvider>",
  );
});
