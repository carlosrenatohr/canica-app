// Typed attachment repositories with organization scoping.
// All reads/writes require organization_id to enforce tenant boundaries.
// Superadmin role bypasses org scoping (passes organizationId = null).
import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

export type AttachmentRow = typeof schema.attachments.$inferSelect;
export type AttachmentWritableFields = Omit<
  typeof schema.attachments.$inferInsert,
  "id" | "organizationId" | "createdAt"
>;
export type CreateAttachmentInput = AttachmentWritableFields;

export async function createAttachment(
  db: Db,
  organizationId: string,
  input: CreateAttachmentInput
): Promise<AttachmentRow> {
  const [row] = await db
    .insert(schema.attachments)
    .values({
      organizationId,
      patientId: input.patientId,
      consultationId: input.consultationId,
      path: input.path,
      mimeType: input.mimeType,
      sizeBytes: input.sizeBytes,
      uploadedBy: input.uploadedBy,
    })
    .returning();
  return row;
}

export async function getAttachment(
  db: Db,
  organizationId: string | null,
  id: string
): Promise<AttachmentRow | undefined> {
  const conditions = [eq(schema.attachments.id, id)];
  if (organizationId !== null) {
    conditions.push(eq(schema.attachments.organizationId, organizationId));
  }
  const [row] = await db
    .select()
    .from(schema.attachments)
    .where(and(...conditions));
  return row;
}

export async function listAttachmentsByPatient(
  db: Db,
  organizationId: string | null,
  patientId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: AttachmentRow[]; total: number }> {
  const conditions = [eq(schema.attachments.patientId, patientId)];
  if (organizationId !== null) {
    conditions.push(eq(schema.attachments.organizationId, organizationId));
  }
  const where = and(...conditions);
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.attachments)
      .where(where)
      .orderBy(desc(schema.attachments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.attachments).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0 };
}

export async function listAttachmentsByConsultation(
  db: Db,
  organizationId: string | null,
  consultationId: string,
  options?: { limit?: number; offset?: number }
): Promise<{ data: AttachmentRow[]; total: number }> {
  const conditions = [eq(schema.attachments.consultationId, consultationId)];
  if (organizationId !== null) {
    conditions.push(eq(schema.attachments.organizationId, organizationId));
  }
  const where = and(...conditions);
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.attachments)
      .where(where)
      .orderBy(desc(schema.attachments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.attachments).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0 };
}

export async function deleteAttachment(
  db: Db,
  organizationId: string | null,
  id: string
): Promise<void> {
  const conditions = [eq(schema.attachments.id, id)];
  if (organizationId !== null) {
    conditions.push(eq(schema.attachments.organizationId, organizationId));
  }
  await db
    .delete(schema.attachments)
    .where(and(...conditions));
}

export async function listAttachments(
  db: Db,
  organizationId: string | null,
  options?: { limit?: number; offset?: number; search?: string }
): Promise<{ data: AttachmentRow[]; total: number }> {
  const conditions: SQL[] = [];
  if (organizationId !== null) {
    conditions.push(eq(schema.attachments.organizationId, organizationId));
  }
  if (options?.search) {
    const term = `%${options.search}%`;
    conditions.push(
      or(
        ilike(schema.attachments.path, term),
        ilike(schema.attachments.mimeType, term),
      )!
    );
  }
  const where = and(...conditions);
  const limit = options?.limit ?? 20;
  const offset = options?.offset ?? 0;
  const [data, countResult] = await Promise.all([
    db
      .select()
      .from(schema.attachments)
      .where(where)
      .orderBy(desc(schema.attachments.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({ count: sql<number>`count(*)` }).from(schema.attachments).where(where),
  ]);
  return { data, total: countResult[0]?.count ?? 0 };
}