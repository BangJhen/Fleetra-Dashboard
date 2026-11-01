import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-dev/**",
    ".next-qa/**",
    "test-results/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Vendor worker copied unchanged from the installed MapLibre package.
    "public/maps/maplibre-gl-worker.mjs",
  ]),
]);

export default eslintConfig;
