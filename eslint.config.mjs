import { defineConfig, globalIgnores } from "eslint/config"
import nextVitals from "eslint-config-next/core-web-vitals"

const eslintConfig = defineConfig([
  ...nextVitals,
  {
    name: "style-guides",
    rules: {
      semi: ["error", "never"],
      "no-extra-semi": "error",
      "eol-last": ["error", "never"],
      "no-trailing-spaces": "error",
      "prefer-const": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
  ]),
])

export default eslintConfig