import { and, eq } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";
export type ConsultationRow = typeof schema.consultations.$inferSelect;
export type ConsultationWritableFields = Omit<
  typeof schema.consultations.$inferInsert,
  | "id"
  | "organizationId"
  | "medicalRecordId"
  | "physicianId"
  | "status"
  | "createdAt"
  | "updatedAt"
  | "completedAt"
  | "startedAt"
> & {
  startedAt: string;
  chiefComplaint?: string | null;
  history?: string | null;
  exam?: string | null;
  assessment?: string | null;
  plan?: string | null;
};
export type CreateConsultationInput = ConsultationWritableFields & {
  physicianId: string;
  medicalRecordId: string;
};
export type FinalizeConsultationInput = {
  history?: string | null;
  exam?: string | null;
  assessment?: string | null;
  plan?: string | null;
};

export async function getOrCreateMedicalRecord(
  db: Db,
  organizationId: string,
  patientId: string
): Promise<string> {
  const [existing] = await db
    .select()
    .from(schema.medicalRecords)
    .where(
      and(
        eq(schema.medicalRecords.patientId, patientId),
        eq(schema.medicalRecords.organizationId, organizationId)
      )
    );
  if (existing) return existing.id;
  const [created] = await db
    .insert(schema.medicalRecords)
    .values({
      organizationId,
      patientId,
    })
    .returning();
  return created.id;
}

export async function listConsultations(
  db: Db,
  organizationId: string,
  patientId: string
): Promise<ConsultationRow[]> {
  return db
    .select()
    .from(schema.consultations)
    .where(
      and(
        eq(schema.consultations.organizationId, organizationId),
        eq(schema.consultations.patientId, patientId)
      )
    );
}

export async function listConsultationsByOrg(
  db: Db,
  organizationId: string
): Promise<ConsultationRow[]> {
  return db
    .select()
    .from(schema.consultations)
    .where(eq(schema.consultations.organizationId, organizationId));
}

export async function getConsultation(
  db: Db,
  organizationId: string,
  id: string
): Promise<ConsultationRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.consultations)
    .where(
      and(
        eq(schema.consultations.id, id),
        eq(schema.consultations.organizationId, organizationId)
      )
    );
  return row;
}

export async function createConsultation(
  db: Db,
  organizationId: string,
  input: CreateConsultationInput
): Promise<ConsultationRow> {
  const [row] = await db
    .insert(schema.consultations)
    .values({
      organizationId,
      medicalRecordId: input.medicalRecordId,
      patientId: input.patientId,
      physicianId: input.physicianId,
      startedAt: new Date(input.startedAt),
      chiefComplaint: input.chiefComplaint ?? undefined,
      history: input.history ?? undefined,
      exam: input.exam ?? undefined,
      assessment: input.assessment ?? undefined,
      plan: input.plan ?? undefined,
      status: "draft",
    })
    .returning();
  return row;
}

export async function updateConsultation(
  db: Db,
  organizationId: string,
  id: string,
  input: Partial<ConsultationWritableFields>
): Promise<ConsultationRow> {
  const [row] = await db
    .update(schema.consultations)
    .set({
      chiefComplaint: input.chiefComplaint ?? undefined,
      history: input.history ?? undefined,
      exam: input.exam ?? undefined,
      assessment: input.assessment ?? undefined,
      plan: input.plan ?? undefined,
    })
    .where(
      and(
        eq(schema.consultations.id, id),
        eq(schema.consultations.organizationId, organizationId)
      )
    )
    .returning();
  return row;
}

export async function finalizeConsultation(
  db: Db,
  organizationId: string,
  id: string,
  input: FinalizeConsultationInput
): Promise<ConsultationRow> {
  const [row] = await db
    .update(schema.consultations)
    .set({
      history: input.history ?? undefined,
      exam: input.exam ?? undefined,
      assessment: input.assessment ?? undefined,
      plan: input.plan ?? undefined,
      status: "finalized",
      completedAt: new Date(),
    })
    .where(
      and(
        eq(schema.consultations.id, id),
        eq(schema.consultations.organizationId, organizationId)
      )
    )
    .returning();
  return row;
}

export type DiagnosisRow = typeof schema.diagnoses.$inferSelect;
export type CreateDiagnosisInput = Omit<
  typeof schema.diagnoses.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt"
>;
export type UpdateDiagnosisInput = Partial<
  Omit<CreateDiagnosisInput, "consultationId">
>;

export async function listDiagnoses(
  db: Db,
  organizationId: string,
  consultationId: string
): Promise<DiagnosisRow[]> {
  return db
    .select()
    .from(schema.diagnoses)
    .where(
      and(
        eq(schema.diagnoses.organizationId, organizationId),
        eq(schema.diagnoses.consultationId, consultationId)
      )
    );
}

export async function createDiagnosis(
  db: Db,
  organizationId: string,
  input: CreateDiagnosisInput
): Promise<DiagnosisRow> {
  const [row] = await db
    .insert(schema.diagnoses)
    .values({
      organizationId,
      ...input,
    })
    .returning();
  return row;
}

export async function updateDiagnosis(
  db: Db,
  organizationId: string,
  id: string,
  input: UpdateDiagnosisInput
): Promise<DiagnosisRow> {
  const [row] = await db
    .update(schema.diagnoses)
    .set({
      primary: input.primary ?? undefined,
      status: input.status ?? undefined,
      description: input.description ?? undefined,
      codingSystem: input.codingSystem ?? undefined,
      code: input.code ?? undefined,
    })
    .where(
      and(
        eq(schema.diagnoses.id, id),
        eq(schema.diagnoses.organizationId, organizationId)
      )
    )
    .returning();
  return row;
}

export type PrescriptionRow = typeof schema.prescriptions.$inferSelect;
export type CreatePrescriptionInput = Omit<
  typeof schema.prescriptions.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt"
>;
export type UpdatePrescriptionInput = Partial<
  Omit<CreatePrescriptionInput, "consultationId">
>;

export async function listPrescriptions(
  db: Db,
  organizationId: string,
  consultationId: string
): Promise<PrescriptionRow[]> {
  return db
    .select()
    .from(schema.prescriptions)
    .where(
      and(
        eq(schema.prescriptions.organizationId, organizationId),
        eq(schema.prescriptions.consultationId, consultationId)
      )
    );
}

export async function createPrescription(
  db: Db,
  organizationId: string,
  input: CreatePrescriptionInput
): Promise<PrescriptionRow> {
  const [row] = await db
    .insert(schema.prescriptions)
    .values({
      organizationId,
      ...input,
    })
    .returning();
  return row;
}

export async function updatePrescription(
  db: Db,
  organizationId: string,
  id: string,
  input: UpdatePrescriptionInput
): Promise<PrescriptionRow> {
  const [row] = await db
    .update(schema.prescriptions)
    .set({
      medicationName: input.medicationName ?? undefined,
      strength: input.strength ?? undefined,
      form: input.form ?? undefined,
      dose: input.dose ?? undefined,
      route: input.route ?? undefined,
      frequency: input.frequency ?? undefined,
      duration: input.duration ?? undefined,
      instructions: input.instructions ?? undefined,
      status: input.status ?? undefined,
    })
    .where(
      and(
        eq(schema.prescriptions.id, id),
        eq(schema.prescriptions.organizationId, organizationId)
      )
    )
    .returning();
  return row;
}
