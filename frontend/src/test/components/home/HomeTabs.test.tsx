import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, test, vi } from "vitest";

import { HomeTabs } from "@/components/home/HomeTabs";

test("shows each tab with its count and marks the active one", () => {
  render(
    <HomeTabs
      activeTab="new"
      counts={{ new: 72, read: 28, bookmark: 5 }}
      onChange={() => {}}
    />,
  );

  const tabs = screen.getAllByRole("tab");
  expect(tabs.map((tab) => tab.textContent)).toEqual([
    "NEW72",
    "READ28",
    "BOOKMARK5",
  ]);
  expect(tabs[0]).toHaveAttribute("aria-selected", "true");
  expect(tabs[1]).toHaveAttribute("aria-selected", "false");
});

test("choosing a tab calls onChange", async () => {
  const onChange = vi.fn();
  render(<HomeTabs activeTab="new" counts={undefined} onChange={onChange} />);

  await userEvent.click(screen.getByRole("tab", { name: /BOOKMARK/ }));

  expect(onChange).toHaveBeenCalledWith("bookmark");
});

test("hides the counts until the user's data has loaded", () => {
  render(<HomeTabs activeTab="new" counts={undefined} onChange={() => {}} />);

  expect(screen.getAllByRole("tab").map((tab) => tab.textContent)).toEqual([
    "NEW",
    "READ",
    "BOOKMARK",
  ]);
});
