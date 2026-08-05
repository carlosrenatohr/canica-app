import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
const __dirname = fileURLToPath(new URL(".", import.meta.url));
dotenv.config({ path: resolve(__dirname, "../../../.env") });

import { Hono } from "hono";
import { createDb } from "@canica/db";
import { createAuth, Permission } from "@canica/auth";
import * as patientsRepo from "@canica/db/repos/patients";
import * as consultationsRepo from "@canica/db/repos/consultations";
import * as medicalRecordsRepo from "@canica/db/repos/medical-records";
import * as appointmentsRepo from "@canica/db/repos/appointments";
import { writeAudit } from "@canica/db/repos/audit";
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
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";

const baseURL = process.env.API_BASE_URL ?? "http://localhost:3001";
const db = createDb();
const auth = createAuth({
  db,
  baseURL,
  trustedOrigins: [baseURL, "http://localhost:3000", "http://localhost:3001"],
});

const app = new Hono<ApiEnv>();

app.use("*", (c, next) => {
  c.set("db", db);
  c.set("auth", auth);
  c.set("permissions", undefined);
  return next();
});

app.all("/api/auth/*", (c) => c.var.auth.handler(c.req.raw));

app.get("/health", (c) => c.json({ ok: true, service: "canica-api" }));

app.get("/me", sessionMiddleware(), (c) => {
  const actor = c.get("actor");
  return c.json({ data: actor });
});

app.use("/patients/*", sessionMiddleware());

app.get("/patients", requirePermission(Permission.PATIENT_READ), async (c) => {
  const patients = await patientsRepo.listPatients(c.var.db, c.var.actor.organizationId);
  return c.json({ data: patients });
});

app.get("/patients/:id", requirePermission(Permission.PATIENT_READ), async (c) => {
  const patient = await patientsRepo.getPatient(c.var.db, c.var.actor.organizationId, c.req.param("id"));
  if (!patient) return c.json({ error: "not_found" }, 404);
  return c.json({ data: patient });
});

app.post("/patients", requirePermission(Permission.PATIENT_WRITE), async (c) => {
  const body = await c.req.json().catch(() => null);
  const parsed = CreatePatientInput.safeParse(body);
  if (!parsed.success) return c.json({ error: "validation_failed", details: parsed.error.flatten() }, 400);
  const patient = await patientsRepo.createPatient(c.var.db, c.var.actor.organizationId, parsed.data);
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
  const patient = await patientsRepo.updatePatient(c.var.db, c.var.actor.organizationId, c.req.param("id"), parsed.data);
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
  await patientsRepo.archivePatient(c.var.db, c.var.actor.organizationId, c.req.param("id"));
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

export default app;
