import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { closeDb, createDb, patients } from "@canica/db";
import { createAuth, Permission } from "@canica/auth";
import * as patientsRepo from "@canica/db/repos/patients";
import * as consultationsRepo from "@canica/db/repos/consultations";
import * as medicalRecordsRepo from "@canica/db/repos/medical-records";
import * as appointmentsRepo from "@canica/db/repos/appointments";
import * as documentExportsRepo from "@canica/db/repos/document-exports";
import { writeAudit, listAuditLogs } from "@canica/db/repos/audit";
import {
  CreatePatientInput,
  UpdatePatientInput,
  CreateConsultationInput,
  FinalizeConsultationInput,
  CreateDiagnosisInput,
  CreatePrescriptionInput,
  CreateAppointmentInput,
  UpdateAppointmentStatusInput,
} from "@canica/validation";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { sql } from "drizzle-orm";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";

const baseURL = process.env.API_BASE_URL ?? "http://localhost:3001";
const trustedOrigins = (process.env.TRUSTED_ORIGINS ?? "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean)
  .concat([baseURL, "http://localhost:3000", "http://localhost:3001"]);

const app = new Hono<ApiEnv>();

app.use("*", async (c, next) => {
  const db = createDb();
  try {
    await db.execute(sql`SELECT 1`);
  } catch (e: any) {
    console.error("DB warmup failed:", e?.message ?? e);
  }
  const auth = createAuth({ db, baseURL, trustedOrigins });
  c.set("db", db);
  c.set("auth", auth);
  c.set("permissions", undefined);
  try {
    return await next();
  } finally {
    await closeDb(db);
  }
});

app.use("*", async (c, next) => {
  const origin = c.req.header("origin");
  if (c.req.method === "OPTIONS") {
    if (origin && trustedOrigins.includes(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
      c.header("Access-Control-Allow-Credentials", "true");
      c.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      c.header("Access-Control-Allow-Headers", "Content-Type,Authorization,Cookie");
      c.header("Access-Control-Max-Age", "600");
    }
    return c.body(null, 204);
  }
  await next();
  if (origin && trustedOrigins.includes(origin)) {
    c.header("Access-Control-Allow-Origin", origin);
    c.header("Access-Control-Allow-Credentials", "true");
    c.header("Vary", "Origin");
  }
});

function orgId(c: { var: { actor: { organizationId: string; role: string } } }): string | null {
  return c.var.actor.role === "superadmin" ? null : c.var.actor.organizationId;
}

app.all("/api/auth/*", async (c) => {
  try {
    return await c.var.auth.handler(c.req.raw);
  } catch (e: any) {
    console.error("AUTH try-1 failed:", e?.message ?? e);
    await new Promise((r) => setTimeout(r, 300));
    try {
      return await c.var.auth.handler(c.req.raw);
    } catch (e2: any) {
      console.error("AUTH try-2 failed:", e2?.message ?? e2);
      throw e2;
    }
  }
});

app.get("/health", (c) => c.json({ ok: true, service: "canica-api" }));

app.get("/debug/db", async (c) => {
  try {
    const rows = await c.get("db").execute(sql<{ now: unknown }>`SELECT now() as now`);
    return c.json({ ok: true, now: rows?.[0]?.now });
  } catch (e: any) {
    return c.json({ ok: false, error: e?.message ?? String(e), cause: e?.cause?.message }, 500);
  }
});

app.get("/me", sessionMiddleware(), (c) => {
  const actor = c.get("actor");
  return c.json({ data: actor });
});

app.use("/patients/*", sessionMiddleware());

app.get("/patients", requirePermission(Permission.PATIENT_READ), async (c) => {
  const patients = await patientsRepo.listPatients(c.var.db, orgId(c));
  return c.json({ data: patients });
});

app.get("/patients/:id", requirePermission(Permission.PATIENT_READ), async (c) => {
  const patient = await patientsRepo.getPatient(c.var.db, orgId(c), c.req.param("id"));
  if (!patient) return c.json({ error: "not_found" }, 404);
  return c.json({ data: patient });
});

app.post("/patients", requirePermission(Permission.PATIENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.createPatient(c.var.db, orgId(c)!, parsed.data);
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "patient.create",
    targetEntity: "patient",
    targetId: patient.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: patient }, 201);
});

app.patch("/patients/:id", requirePermission(Permission.PATIENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.updatePatient(c.var.db, orgId(c), c.req.param("id"), parsed.data);
  if (!patient) return c.json({ error: "not_found" }, 404);
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "patient.update",
    targetEntity: "patient",
    targetId: patient.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: patient });
});

app.delete("/patients/:id", requirePermission(Permission.PATIENT_ARCHIVE), async (c) => {
  await patientsRepo.archivePatient(c.var.db, orgId(c), c.req.param("id"));
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "patient.archive",
    targetEntity: "patient",
    targetId: c.req.param("id"),
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.body(null, 204);
});

app.use("/consultations/*", sessionMiddleware());

app.get("/consultations", requirePermission(Permission.CONSULTATION_READ), async (c) => {
  const patientId = c.req.query("patientId");
  const organizationId = c.var.actor.organizationId;
  let consultations;
  if (patientId) {
    consultations = await consultationsRepo.listConsultations(c.var.db, organizationId, patientId);
  } else {
    consultations = await consultationsRepo.listConsultationsByOrg(c.var.db, organizationId);
  }
  return c.json({ data: consultations });
});

app.get("/consultations/:id", requirePermission(Permission.CONSULTATION_READ), async (c) => {
  const consultation = await consultationsRepo.getConsultation(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id")
  );
  if (!consultation) return c.json({ error: "not_found" }, 404);
  return c.json({ data: consultation });
});

app.post("/consultations", requirePermission(Permission.CONSULTATION_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateConsultationInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const medicalRecordId = await consultationsRepo.getOrCreateMedicalRecord(
    c.var.db,
    c.var.actor.organizationId,
    parsed.data.patientId
  );
  const consultation = await consultationsRepo.createConsultation(c.var.db, c.var.actor.organizationId, {
    ...parsed.data,
    medicalRecordId,
    physicianId: c.var.actor.userId,
  });
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "consultation.create",
    targetEntity: "consultation",
    targetId: consultation.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: consultation }, 201);
});

app.patch("/consultations/:id/finalize", requirePermission(Permission.CONSULTATION_FINALIZE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = FinalizeConsultationInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const consultation = await consultationsRepo.finalizeConsultation(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id"),
    parsed.data
  );
  if (!consultation) return c.json({ error: "not_found" }, 404);
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "consultation.finalize",
    targetEntity: "consultation",
    targetId: consultation.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: consultation });
});

app.get("/consultations/:id/diagnoses", requirePermission(Permission.DIAGNOSIS_READ), async (c) => {
  const diagnoses = await consultationsRepo.listDiagnoses(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id")
  );
  return c.json({ data: diagnoses });
});

app.post("/consultations/:id/diagnoses", requirePermission(Permission.DIAGNOSIS_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateDiagnosisInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const diagnosis = await consultationsRepo.createDiagnosis(c.var.db, c.var.actor.organizationId, {
    ...parsed.data,
    consultationId: c.req.param("id"),
  });
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "diagnosis.create",
    targetEntity: "diagnosis",
    targetId: diagnosis.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: diagnosis }, 201);
});

app.get("/consultations/:id/prescriptions", requirePermission(Permission.PRESCRIPTION_READ), async (c) => {
  const prescriptions = await consultationsRepo.listPrescriptions(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id")
  );
  return c.json({ data: prescriptions });
});

app.post("/consultations/:id/prescriptions", requirePermission(Permission.PRESCRIPTION_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePrescriptionInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const prescription = await consultationsRepo.createPrescription(c.var.db, c.var.actor.organizationId, {
    ...parsed.data,
    consultationId: c.req.param("id"),
  });
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "prescription.create",
    targetEntity: "prescription",
    targetId: prescription.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: prescription }, 201);
});

app.get("/patients/:id/timeline", requirePermission(Permission.PATIENT_READ), async (c) => {
  const entries = await medicalRecordsRepo.getPatientTimeline(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id"),
    {
      fromDate: c.req.query("fromDate") ?? undefined,
      toDate: c.req.query("toDate") ?? undefined,
    }
  );
  return c.json({ data: entries });
});

app.use("/appointments/*", sessionMiddleware());

app.get("/appointments", requirePermission(Permission.APPOINTMENT_READ), async (c) => {
  const appointments = await appointmentsRepo.listAppointments(c.var.db, c.var.actor.organizationId, {
    providerId: c.req.query("providerId") ?? undefined,
    fromDate: c.req.query("fromDate") ?? undefined,
    toDate: c.req.query("toDate") ?? undefined,
    status: c.req.query("status") as
      | "scheduled"
      | "confirmed"
      | "checked-in"
      | "completed"
      | "cancelled"
      | "no-show"
      | undefined,
  });
  return c.json({ data: appointments });
});

app.get("/appointments/:id", requirePermission(Permission.APPOINTMENT_READ), async (c) => {
  const appointment = await appointmentsRepo.getAppointment(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id")
  );
  if (!appointment) return c.json({ error: "not_found" }, 404);
  return c.json({ data: appointment });
});

app.post("/appointments", requirePermission(Permission.APPOINTMENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreateAppointmentInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const appointment = await appointmentsRepo.createAppointment(
    c.var.db,
    c.var.actor.organizationId,
    parsed.data
  );
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "appointment.create",
    targetEntity: "appointment",
    targetId: appointment.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: appointment }, 201);
});

app.patch("/appointments/:id/status", requirePermission(Permission.APPOINTMENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = UpdateAppointmentStatusInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const appointment = await appointmentsRepo.updateAppointmentStatus(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id"),
    parsed.data
  );
  if (!appointment) return c.json({ error: "not_found" }, 404);
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "appointment.status_change",
    targetEntity: "appointment",
    targetId: appointment.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });
  return c.json({ data: appointment });
});

app.post("/consultations/:id/export/pdf", requirePermission(Permission.CONSULTATION_READ), async (c) => {
  const consultation = await consultationsRepo.getConsultation(
    c.var.db,
    c.var.actor.organizationId,
    c.req.param("id")
  );
  if (!consultation) return c.json({ error: "not_found" }, 404);

  const [patient] = await c.var.db
    .select()
    .from(patients)
    .where(eq(patients.id, consultation.patientId));

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595, 842]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  page.setFont(font);
  const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Paciente";
  const dateStr = new Date(consultation.startedAt).toLocaleDateString("es-ES");

  page.setFont(boldFont);
  page.drawText(`Resumen de Consulta — ${patientName}`, { x: 50, y: 800 });
  page.setFont(font);
  page.drawText(`Fecha: ${dateStr}`, { x: 50, y: 775 });
  page.drawText(`Estado: ${consultation.status}`, { x: 50, y: 750 });
  page.drawText(`Médico ID: ${consultation.physicianId}`, { x: 50, y: 725 });

  let yPosition = 675;
  const lineHeight = 70;

  const sections = [
    { label: "Queja principal", content: consultation.chiefComplaint || "—" },
    { label: "Historia", content: consultation.history || "—" },
    { label: "Examen", content: consultation.exam || "—" },
    { label: "Evaluación", content: consultation.assessment || "—" },
    { label: "Plan", content: consultation.plan || "—" },
  ];

  page.setFont(boldFont);
  for (const section of sections) {
    page.drawText(section.label, { x: 50, y: yPosition });
    page.setFont(font);
    const textLines = page.drawText(section.content, {
      x: 50,
      y: yPosition - 20,
      lineHeight: 12,
      maxWidth: 500,
    });
    yPosition -= lineHeight;
    page.setFont(boldFont);
  }

  const pdfBytes = await pdfDoc.save();
  await writeAudit(c.var.db, {
    organizationId: c.var.actor.organizationId,
    actorId: c.var.actor.userId,
    action: "document.export",
    targetEntity: "document_export",
    targetId: consultation.id,
    ip: c.req.header("x-forwarded-for") ?? c.req.header("x-real-ip"),
    userAgent: c.req.header("user-agent"),
  });

  return new Response(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="consulta-${consultation.id}.pdf"`,
    },
  });
});

app.use("/audit/*", sessionMiddleware());

app.get("/audit", requirePermission(Permission.AUDIT_READ), async (c) => {
  const logs = await listAuditLogs(c.var.db, c.var.actor.organizationId, {
    actorId: c.req.query("actorId") ?? undefined,
    targetEntity: c.req.query("targetEntity") ?? undefined,
    action: c.req.query("action") ?? undefined,
    fromDate: c.req.query("fromDate") ?? undefined,
    toDate: c.req.query("toDate") ?? undefined,
  });
  return c.json({ data: logs });
});

app.onError((err, c) => {
  console.error("UNHANDLED", String(err), err?.stack);
  const msg = err?.message ?? "Internal Server Error";
  return c.json({ error: msg, stack: err?.stack?.split("\n").slice(1, 4).join("\n") }, 500);
});

export default app;
