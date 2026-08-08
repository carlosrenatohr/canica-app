import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    include: ["**/*.test.ts"],
    exclude: ["node_modules/**", "dist/**", "tests/e2e/**"],
    pool: "forks",
  }
});
