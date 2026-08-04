// Lightweight migration runner using `pg` directly.
// Reads every *.sql file in ./src/migrations and executes it against DATABASE_URL.
// This avoids coupling to a vendor migrator package and runs locally without Docker.
import dotenv from "dotenv";
import { Client } from "pg";
import { readFile, readdir } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

export async function migrate(url: string, dir: string): Promise<void> {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();
    for (const file of files) {
      const sql = await readFile(join(dir, file), "utf8");
      // Drizzle splits statements with `-- statement-breakpoint`; run sequentially per statement.
      const statements = sql
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const statement of statements) {
        await client.query(statement);
      }
    }
    await client.end();
  } finally {
    await client
      .end()
      .catch(() => undefined);
  }
}

void migrate(
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:5432/canica",
  new URL("./migrations", import.meta.url).pathname
).catch((error) => {
  console.error(error);
  process.exit(1);
});
