// Database client factory. Reads DATABASE_URL from env; single shared instance.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

type DbInstance = ReturnType<typeof drizzle<typeof schema>>;

const closers = new WeakMap<object, () => Promise<void>>();

export function createDb(url: string = process.env.DATABASE_URL ?? ""): DbInstance {
  const client = postgres(url, {
    max: 5,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    max_lifetime: 300,
  });
  const db = drizzle(client, { schema });
  closers.set(db, () => client.end({ timeout: 1 }));
  return db;
}

export async function closeDb(db: DbInstance): Promise<void> {
  const close = closers.get(db);
  closers.delete(db);
  await close?.();
}

export type Db = DbInstance;
