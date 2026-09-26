import { vi } from "vitest";

// Adds DOM matchers such as toBeInTheDocument() to Vitest's expect.
import "@testing-library/jest-dom/vitest";

// "server-only" throws outside the server; tests run server modules directly.
vi.mock("server-only", () => ({}));
