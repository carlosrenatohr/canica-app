// Typed patient repositories with organization scoping.
// All reads/writes require organization_id to enforce tenant boundaries.
// Superadmin role bypasses org scoping (passes organizationId = null).
import { and, eq } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

export type PatientRow = typeof schema.patients.$inferSelect;
export type PatientWritableFields = Omit<
  typeof schema.patients.$inferInsert,
  "id" | "organizationId" | "archived" | "createdAt" | "updatedAt" | "birthDate"
> & { birthDate?: string | null };
export type CreatePatientInput = PatientWritableFields;
export type UpdatePatientInput = Partial<PatientWritableFields>;

export async function createPatient(
  db: Db,
  organizationId: string,
  input: CreatePatientInput
): Promise<PatientRow> {
  const [row] = await db
    .insert(schema.patients)
    .values({
      organizationId,
      firstName: input.firstName,
      lastName: input.lastName,
      identifier: input.identifier,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      sex: input.sex,
      phone: input.phone,
      email: input.email,
      address: input.address,
      archived: false,
    })
    .returning();
  return row;
}

export async function getPatient(
  db: Db,
  organizationId: string | null,
  id: string
): Promise<PatientRow | undefined> {
  const conditions = [eq(schema.patients.id, id)];
  if (organizationId !== null) {
    conditions.push(eq(schema.patients.organizationId, organizationId));
  }
  const [row] = await db
    .select()
    .from(schema.patients)
    .where(and(...conditions));
  return row;
}

export async function listPatients(db: Db, organizationId: string | null): Promise<PatientRow[]> {
  const conditions = [eq(schema.patients.archived, false)];
  if (organizationId !== null) {
    conditions.push(eq(schema.patients.organizationId, organizationId));
  }
  return db
    .select()
    .from(schema.patients)
    .where(and(...conditions));
}

export async function updatePatient(
  db: Db,
  organizationId: string | null,
  id: string,
  input: UpdatePatientInput
): Promise<PatientRow> {
  const conditions = [eq(schema.patients.id, id)];
  if (organizationId !== null) {
    conditions.push(eq(schema.patients.organizationId, organizationId));
  }
  const [row] = await db
    .update(schema.patients)
    .set({
      firstName: input.firstName,
      lastName: input.lastName,
      identifier: input.identifier,
      birthDate: input.birthDate ? new Date(input.birthDate) : undefined,
      sex: input.sex,
      phone: input.phone,
      email: input.email,
      address: input.address,
    })
    .where(and(...conditions))
    .returning();
  return row;
}

export async function archivePatient(db: Db, organizationId: string | null, id: string): Promise<void> {
  const conditions = [eq(schema.patients.id, id)];
  if (organizationId !== null) {
    conditions.push(eq(schema.patients.organizationId, organizationId));
  }
  await db
    .update(schema.patients)
    .set({ archived: true })
    .where(and(...conditions));
}
