import { defineConfig } from "vitest/config"
import { resolve } from "path"

export default defineConfig({
  test: {
    // All current tests are pure logic (no DOM). jsdom@29 ships ESM-with-TLA
    // which Node 20.19's require() cannot load (ERR_REQUIRE_ASYNC_MODULE), so
    // "node" is both correct and the fix. Switch to "jsdom"/happy-dom if/when
    // component (DOM) tests are added.
    environment: "node",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
})