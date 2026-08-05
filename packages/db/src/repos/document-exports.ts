import { and, eq, desc } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

export type DocumentExportRow = typeof schema.documentExports.$inferSelect;
export type CreateDocumentExportInput = Omit<
  typeof schema.documentExports.$inferInsert,
  "id" | "organizationId" | "createdAt" | "path" | "sizeBytes"
> & {
  path: string;
  sizeBytes: number;
};

export async function listDocumentExports(
  db: Db,
  organizationId: string
): Promise<DocumentExportRow[]> {
  return db
    .select()
    .from(schema.documentExports)
    .where(eq(schema.documentExports.organizationId, organizationId))
    .orderBy(desc(schema.documentExports.createdAt));
}

export async function createDocumentExport(
  db: Db,
  organizationId: string,
  input: CreateDocumentExportInput
): Promise<DocumentExportRow> {
  const [row] = await db
    .insert(schema.documentExports)
    .values({
      organizationId,
      type: input.type,
      sourceEntity: input.sourceEntity,
      sourceId: input.sourceId,
      generatedBy: input.generatedBy,
      path: input.path,
      sizeBytes: input.sizeBytes,
    })
    .returning();
  return row;
}

export async function getDocumentExport(
  db: Db,
  organizationId: string,
  id: string
): Promise<DocumentExportRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.documentExports)
    .where(
      and(
        eq(schema.documentExports.id, id),
        eq(schema.documentExports.organizationId, organizationId)
      )
    );
  return row;
}
