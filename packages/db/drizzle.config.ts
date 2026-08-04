// Drizzle CLI entry. Run `pnpm db:generate` / `pnpm db:migrate` from repo root.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./src/migrations",
  dialect: "postgresql",
  dbCredentials: {
    // Supabase local: http://127.0.0.1:54321
    url: process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/canica",
  },
  strict: true,
});
