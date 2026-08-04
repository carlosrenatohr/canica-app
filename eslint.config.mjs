import eslint from "@eslint/js";

export default [
  {
    ignores: [
      ".next/**",
      "dist/**",
      "coverage/**",
      "node_modules/**"
    ]
  },
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    ...eslint.configs.recommended
  }
];
