// Database client factory. Reads DATABASE_URL from env; single shared instance.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

export function createDb(url: string = process.env.DATABASE_URL ?? ""): ReturnType<typeof drizzle<typeof schema>> {
  const client = postgres(url, { max: 10 });
  return drizzle(client, { schema });
}

export type Db = ReturnType<typeof createDb>;
