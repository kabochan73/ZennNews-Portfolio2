import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/test/**/*.test.{ts,tsx}"],
    // jsdom + user-event tests can exceed the 5s default when the machine is busy
    // (e.g. Next.js compiling at the same time, or CI).
    testTimeout: 10_000,
  },
});
