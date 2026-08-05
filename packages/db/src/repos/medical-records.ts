import { and, eq, gte, inArray, lte } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

export type MedicalRecordRow = typeof schema.medicalRecords.$inferSelect;

export async function getMedicalRecord(
  db: Db,
  organizationId: string,
  id: string
): Promise<MedicalRecordRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.medicalRecords)
    .where(
      and(
        eq(schema.medicalRecords.id, id),
        eq(schema.medicalRecords.organizationId, organizationId)
      )
    );
  return row;
}

export async function getMedicalRecordByPatient(
  db: Db,
  organizationId: string,
  patientId: string
): Promise<MedicalRecordRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.medicalRecords)
    .where(
      and(
        eq(schema.medicalRecords.patientId, patientId),
        eq(schema.medicalRecords.organizationId, organizationId)
      )
    );
  return row;
}

export interface TimelineEntry {
  type: "consultation" | "diagnosis" | "prescription" | "attachment";
  id: string;
  createdAt: Date;
  title: string;
  subtitle?: string;
  metadata: Record<string, unknown>;
}

export async function getPatientTimeline(
  db: Db,
  organizationId: string,
  patientId: string,
  options?: { fromDate?: string; toDate?: string }
): Promise<TimelineEntry[]> {
  const whereClause = and(
    eq(schema.consultations.organizationId, organizationId),
    eq(schema.consultations.patientId, patientId)
  );

  const consultationRows = await db
    .select({
      id: schema.consultations.id,
      createdAt: schema.consultations.createdAt,
      startedAt: schema.consultations.startedAt,
      status: schema.consultations.status,
      chiefComplaint: schema.consultations.chiefComplaint,
    })
    .from(schema.consultations)
    .where(whereClause);

  const consultationIds = consultationRows.map((c) => c.id);

  let diagnosisRows: Array<{
    id: string;
    createdAt: Date;
    description: string;
    status: string;
  }> = [];
  let prescriptionRows: Array<{
    id: string;
    createdAt: Date;
    medicationName: string;
    status: string;
  }> = [];

  if (consultationIds.length > 0) {
    diagnosisRows = await db
      .select({
        id: schema.diagnoses.id,
        createdAt: schema.diagnoses.createdAt,
        description: schema.diagnoses.description,
        status: schema.diagnoses.status,
      })
      .from(schema.diagnoses)
      .where(
        and(
          eq(schema.diagnoses.organizationId, organizationId),
          inArray(schema.diagnoses.consultationId, consultationIds)
        )
      );

    prescriptionRows = await db
      .select({
        id: schema.prescriptions.id,
        createdAt: schema.prescriptions.createdAt,
        medicationName: schema.prescriptions.medicationName,
        status: schema.prescriptions.status,
      })
      .from(schema.prescriptions)
      .where(
        and(
          eq(schema.prescriptions.organizationId, organizationId),
          inArray(schema.prescriptions.consultationId, consultationIds)
        )
      );
  }

  const attachmentRows = await db
    .select({
      id: schema.attachments.id,
      createdAt: schema.attachments.createdAt,
      path: schema.attachments.path,
      mimeType: schema.attachments.mimeType,
    })
    .from(schema.attachments)
    .where(
      and(
        eq(schema.attachments.organizationId, organizationId),
        eq(schema.attachments.patientId, patientId)
      )
    );

  const entries: TimelineEntry[] = [];

  for (const c of consultationRows) {
    entries.push({
      type: "consultation",
      id: c.id,
      createdAt: c.createdAt,
      title: "Consulta",
      subtitle: c.chiefComplaint || c.status,
      metadata: {
        startedAt: c.startedAt,
        status: c.status,
      },
    });
  }

  for (const d of diagnosisRows) {
    entries.push({
      type: "diagnosis",
      id: d.id,
      createdAt: d.createdAt,
      title: d.description,
      subtitle: d.status,
      metadata: {},
    });
  }

  for (const p of prescriptionRows) {
    entries.push({
      type: "prescription",
      id: p.id,
      createdAt: p.createdAt,
      title: `${p.medicationName}`,
      subtitle: p.status,
      metadata: {},
    });
  }

  for (const a of attachmentRows) {
    entries.push({
      type: "attachment",
      id: a.id,
      createdAt: a.createdAt,
      title: a.path.split("/").pop() || a.path,
      subtitle: a.mimeType,
      metadata: {},
    });
  }

  entries.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  if (options?.fromDate) {
    const from = new Date(options.fromDate);
    return entries.filter((e) => e.createdAt >= from);
  }
  if (options?.toDate) {
    const to = new Date(options.toDate);
    return entries.filter((e) => e.createdAt <= to);
  }

  return entries;
}
