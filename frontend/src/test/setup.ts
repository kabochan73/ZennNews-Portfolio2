import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// Adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import "@testing-library/jest-dom/vitest";

// "server-only" throws outside the server; tests run server modules directly.
vi.mock("server-only", () => ({}));

// Testing Library only unmounts automatically with Vitest globals, which we don't use.
afterEach(() => {
  cleanup();
});
