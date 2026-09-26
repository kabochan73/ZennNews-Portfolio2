import { expect, test } from "vitest";

import { getClientIp } from "@/lib/client-ip";

function headers(forwardedFor?: string): Headers {
  return new Headers(forwardedFor ? { "X-Forwarded-For": forwardedFor } : {});
}

test("uses the only entry", () => {
  expect(getClientIp(headers("203.0.113.1"))).toBe("203.0.113.1");
});

test("uses the right-most entry, ignoring values the visitor could forge", () => {
  expect(getClientIp(headers("1.2.3.4, 203.0.113.1"))).toBe("203.0.113.1");
});

test("ignores empty entries and spaces", () => {
  expect(getClientIp(headers(" 1.2.3.4 ,203.0.113.1 , "))).toBe("203.0.113.1");
});

test("is undefined without the header", () => {
  expect(getClientIp(headers())).toBeUndefined();
});
