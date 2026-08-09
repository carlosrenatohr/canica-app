import app from "./index.js";
import { createDb } from "@canica/db";
import { sql } from "drizzle-orm";

let db: ReturnType<typeof createDb> | undefined;

export default {
  fetch: app.fetch,
  async scheduled() {
    try {
      if (!db) db = createDb();
      await db.execute(sql`SELECT 1`);
      console.log("keepalive pool ok");
    } catch (e) {
      console.error("keepalive failed:", e instanceof Error ? e.message : e);
    }
  },
};