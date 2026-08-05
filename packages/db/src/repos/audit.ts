// Audit repository: append-only writes for security- and clinically-relevant actions.
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "../schema";

export type Db = PostgresJsDatabase<typeof schema>;

export interface AuditEntry {
  organizationId: string;
  actorId: string;
  action: string;
  targetEntity?: string;
  targetId?: string;
  summary?: string;
  ip?: string;
  userAgent?: string;
}

export async function writeAudit(db: Db, entry: AuditEntry): Promise<void> {
  await db.insert(schema.auditLogs).values({
    organizationId: entry.organizationId,
    actorId: entry.actorId,
    action: entry.action,
    targetEntity: entry.targetEntity ?? "system",
    targetId: entry.targetId,
    summary: entry.summary,
    ip: entry.ip,
    userAgent: entry.userAgent,
  });
}
