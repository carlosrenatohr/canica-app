import eslint from "@eslint/js";

export default [
  {
    ignores: [".next/**", "dist/**", "coverage/**", "node_modules/**"]
  },
  eslint.configs.recommended
];
