import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

/**
 * Tests run in the node environment because everything under test is
 * server-side: request validation, rate limiting, origin checks and the
 * red-flag scanner. Component rendering is not covered here — the value is in
 * the security and correctness boundaries, which are all plain modules.
 *
 * The `@/` alias mirrors tsconfig.json so test imports match app imports.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Route tests mutate process.env (API keys, site URL) and the rate-limit
    // module keeps counters in module scope, so files must not share a worker.
    pool: "forks",
    poolOptions: { forks: { singleFork: false } },
    restoreMocks: true,
  },
});
