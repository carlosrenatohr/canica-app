import eslint from "@eslint/js";

export default [
  {
    ignores: ["**/*.ts", "**/*.tsx", ".next/**", "dist/**", "coverage/**", "node_modules/**"],
  },
  {
    // Lint JavaScript/MJS only. TypeScript files are validated by tsc/typecheck.
    files: ["**/*.{js,mjs,cjs}"],
    ...eslint.configs.recommended,
  },
];
