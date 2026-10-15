import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

// Same rules as the old .eslintrc.json, but run through the ESLint CLI so every folder
// is linted (next lint skipped hooks/ and backend/).
const config = [
  { ignores: [".next/**", "next-env.d.ts", "coverage/**", "playwright-report/**", "test-results/**"] },
  ...compat.extends("next/core-web-vitals"),
];

export default config;
