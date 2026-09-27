import { expect, test } from "vitest";

import { getClientIp } from "@/lib/client-ip";

function headers(forwardedFor?: string, realIp?: string): Headers {
  const init: Record<string, string> = {};
  if (forwardedFor) {
    init["X-Forwarded-For"] = forwardedFor;
  }
  if (realIp) {
    init["X-Real-IP"] = realIp;
  }

  return new Headers(init);
}

test("prefers X-Real-IP, set by Railway's edge", () => {
  expect(
    getClientIp(headers("203.0.113.1, 152.233.33.165", "203.0.113.1")),
  ).toBe("203.0.113.1");
});

test("ignores a blank X-Real-IP", () => {
  expect(getClientIp(headers("203.0.113.1", " "))).toBe("203.0.113.1");
});

test("without X-Real-IP, uses the only X-Forwarded-For entry", () => {
  expect(getClientIp(headers("203.0.113.1"))).toBe("203.0.113.1");
});

test("without X-Real-IP, uses the right-most X-Forwarded-For entry", () => {
  expect(getClientIp(headers("1.2.3.4, 203.0.113.1"))).toBe("203.0.113.1");
});

test("ignores empty entries and spaces", () => {
  expect(getClientIp(headers(" 1.2.3.4 ,203.0.113.1 , "))).toBe("203.0.113.1");
});

test("is undefined without either header", () => {
  expect(getClientIp(headers())).toBeUndefined();
});
