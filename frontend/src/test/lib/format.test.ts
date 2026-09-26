import { expect, test } from "vitest";

import { formatPublishedAt } from "@/lib/format";

test.each([
  ["2026-09-23T14:05:00+09:00", "9/23 14:05"],
  ["2026-09-03T09:05:00+09:00", "9/3 09:05"],
  // UTC input is shown in Japan time, including the date change.
  ["2026-09-22T15:30:00Z", "9/23 00:30"],
  ["2026-12-31T23:59:00+09:00", "12/31 23:59"],
])("%s -> %s", (isoDateTime, expected) => {
  expect(formatPublishedAt(isoDateTime)).toBe(expected);
});
