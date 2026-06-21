import { defineConfig } from "vitest/config"
import { resolve } from "path"
import { transformWithEsbuild } from "vite"

// Vite 7 only auto-JSX-transforms .jsx/.tsx. Extend that to JSX-containing TEST
// files that use a .js extension (src/__tests__/*.test.js). Scoped to .jsx/.tsx
// and test files ONLY, so plain .js source — which may legitimately contain "<"
// comparisons (e.g. src/lib/gesture/*) — is never mis-parsed as JSX.
const jsWithJsx = {
  name: "js-with-jsx",
  enforce: "pre",
  async transform(code, id) {
    const file = id.split("?")[0]
    if (file.includes("node_modules")) return null
    const isJsxExt = /\.[jt]sx$/.test(file)
    const isTestJs = /\.[jt]s$/.test(file) && /(?:__tests__|\.(?:test|spec)\.)/.test(file)
    if (!isJsxExt && !isTestJs) return null
    return transformWithEsbuild(code, file, {
      loader: "jsx",
      jsx: "automatic",
      jsxImportSource: "react",
    })
  },
}

export default defineConfig({
  plugins: [jsWithJsx],
  test: {
    // Pure-logic tests run under "node" (jsdom@29 ships ESM-with-TLA which
    // Node 20.19's require() cannot load — ERR_REQUIRE_ASYNC_MODULE). DOM /
    // component tests opt into happy-dom via a per-file
    // `// @vitest-environment happy-dom` docblock.
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
