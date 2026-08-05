// Audit repository: append-only writes for security- and clinically-relevant actions.
import { and, desc, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

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

export type AuditLogRow = typeof schema.auditLogs.$inferSelect;

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

export async function listAuditLogs(
  db: Db,
  organizationId: string,
  options?: {
    actorId?: string;
    targetEntity?: string;
    action?: string;
    fromDate?: string;
    toDate?: string;
    limit?: number;
  }
): Promise<AuditLogRow[]> {
  const conditions = [eq(schema.auditLogs.organizationId, organizationId)];

  if (options?.actorId) conditions.push(eq(schema.auditLogs.actorId, options.actorId));
  if (options?.targetEntity) conditions.push(eq(schema.auditLogs.targetEntity, options.targetEntity));
  if (options?.action) conditions.push(eq(schema.auditLogs.action, options.action));
  if (options?.fromDate) conditions.push(gte(schema.auditLogs.createdAt, new Date(options.fromDate)));
  if (options?.toDate) conditions.push(lte(schema.auditLogs.createdAt, new Date(options.toDate)));

  if (options?.limit) {
    return db
      .select()
      .from(schema.auditLogs)
      .where(and(...conditions))
      .orderBy(desc(schema.auditLogs.createdAt))
      .limit(options.limit);
  }

  return db
    .select()
    .from(schema.auditLogs)
    .where(and(...conditions))
    .orderBy(desc(schema.auditLogs.createdAt));
}
