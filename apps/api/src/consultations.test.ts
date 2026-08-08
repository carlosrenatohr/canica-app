import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";
import { Permission } from "@canica/auth";

vi.mock("@canica/db/repos/permissions", () => ({
  getPermissionsForRole: vi.fn(),
}));

vi.mock("@canica/db/repos/consultations", () => ({
  listConsultations: vi.fn(),
  listConsultationsByOrg: vi.fn(),
  getConsultation: vi.fn(),
  createConsultation: vi.fn(),
  finalizeConsultation: vi.fn(),
  getOrCreateMedicalRecord: vi.fn(),
  listDiagnoses: vi.fn(),
  createDiagnosis: vi.fn(),
  listPrescriptions: vi.fn(),
  createPrescription: vi.fn(),
}));

vi.mock("@canica/db/repos/audit", () => ({
  writeAudit: vi.fn(),
}));

import * as consultationsRepo from "@canica/db/repos/consultations";
import { writeAudit } from "@canica/db/repos/audit";
import { getPermissionsForRole } from "@canica/db/repos/permissions";

const mockListConsultations = vi.mocked(consultationsRepo.listConsultations);
const mockListConsultationsByOrg = vi.mocked(consultationsRepo.listConsultationsByOrg);
const mockGetConsultation = vi.mocked(consultationsRepo.getConsultation);
const mockCreateConsultation = vi.mocked(consultationsRepo.createConsultation);
const mockFinalizeConsultation = vi.mocked(consultationsRepo.finalizeConsultation);
const mockGetOrCreateMedicalRecord = vi.mocked(consultationsRepo.getOrCreateMedicalRecord);
const mockListDiagnoses = vi.mocked(consultationsRepo.listDiagnoses);
const mockCreateDiagnosis = vi.mocked(consultationsRepo.createDiagnosis);
const mockListPrescriptions = vi.mocked(consultationsRepo.listPrescriptions);
const mockCreatePrescription = vi.mocked(consultationsRepo.createPrescription);
const mockWriteAudit = vi.mocked(writeAudit);
const mockGetPermissions = vi.mocked(getPermissionsForRole);

function makeApp(session: any) {
  const app = new Hono<ApiEnv>();
  const auth = { api: { getSession: vi.fn().mockResolvedValue(session) } };
  const db = { $client: {} };

  app.use("*", (c, next) => {
    const ctx = c as Context<ApiEnv>;
    ctx.set("db", db as any);
    ctx.set("auth", auth as any);
    ctx.set("permissions", undefined);
    return next();
  });

  app.use("*", sessionMiddleware());

  app.get("/consultations", requirePermission(Permission.CONSULTATION_READ), async (c) => {
    const patientId = c.req.query("patientId");
    let consultations;
    if (patientId) {
      consultations = await consultationsRepo.listConsultations(c.var.db, c.var.actor.organizationId, patientId);
    } else {
      consultations = await consultationsRepo.listConsultationsByOrg(c.var.db, c.var.actor.organizationId);
    }
    return c.json({ data: consultations });
  });

  app.get("/consultations/:id", requirePermission(Permission.CONSULTATION_READ), async (c) => {
    const consultation = await consultationsRepo.getConsultation(
      c.var.db, c.var.actor.organizationId, c.req.param("id")
    );
    if (!consultation) return c.json({ error: "not_found" }, 404);
    return c.json({ data: consultation });
  });

  app.post("/consultations", requirePermission(Permission.CONSULTATION_WRITE), async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.patientId || !body?.startedAt) {
      return c.json({ error: "validation_failed" }, 400);
    }
    const medicalRecordId = await consultationsRepo.getOrCreateMedicalRecord(
      c.var.db, c.var.actor.organizationId, body.patientId
    );
    const consultation = await consultationsRepo.createConsultation(c.var.db, c.var.actor.organizationId, {
      ...body, medicalRecordId, physicianId: c.var.actor.userId,
    });
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId, actorId: c.var.actor.userId,
      action: "consultation.create", targetEntity: "consultation", targetId: consultation.id,
    });
    return c.json({ data: consultation }, 201);
  });

  app.patch("/consultations/:id/finalize", requirePermission(Permission.CONSULTATION_FINALIZE), async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const consultation = await consultationsRepo.finalizeConsultation(
      c.var.db, c.var.actor.organizationId, c.req.param("id"), body
    );
    if (!consultation) return c.json({ error: "not_found" }, 404);
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId, actorId: c.var.actor.userId,
      action: "consultation.finalize", targetEntity: "consultation", targetId: consultation.id,
    });
    return c.json({ data: consultation });
  });

  app.get("/consultations/:id/diagnoses", requirePermission(Permission.DIAGNOSIS_READ), async (c) => {
    const diagnoses = await consultationsRepo.listDiagnoses(
      c.var.db, c.var.actor.organizationId, c.req.param("id")
    );
    return c.json({ data: diagnoses });
  });

  app.post("/consultations/:id/diagnoses", requirePermission(Permission.DIAGNOSIS_WRITE), async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.description) return c.json({ error: "validation_failed" }, 400);
    const diagnosis = await consultationsRepo.createDiagnosis(c.var.db, c.var.actor.organizationId, {
      ...body, consultationId: c.req.param("id"),
    });
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId, actorId: c.var.actor.userId,
      action: "diagnosis.create", targetEntity: "diagnosis", targetId: diagnosis.id,
    });
    return c.json({ data: diagnosis }, 201);
  });

  app.get("/consultations/:id/prescriptions", requirePermission(Permission.PRESCRIPTION_READ), async (c) => {
    const prescriptions = await consultationsRepo.listPrescriptions(
      c.var.db, c.var.actor.organizationId, c.req.param("id")
    );
    return c.json({ data: prescriptions });
  });

  app.post("/consultations/:id/prescriptions", requirePermission(Permission.PRESCRIPTION_WRITE), async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.medicationName || !body?.dose) return c.json({ error: "validation_failed" }, 400);
    const prescription = await consultationsRepo.createPrescription(c.var.db, c.var.actor.organizationId, {
      ...body, consultationId: c.req.param("id"),
    });
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId, actorId: c.var.actor.userId,
      action: "prescription.create", targetEntity: "prescription", targetId: prescription.id,
    });
    return c.json({ data: prescription }, 201);
  });

  return app;
}

const doctorSession = {
  user: { id: "u1", name: "Dr. Test", email: "dr@test.com", organizationId: "org1", role: "doctor" },
};

const sampleConsultation = {
  id: "c1", organizationId: "org1", patientId: "p1", physicianId: "u1",
  status: "draft" as const, startedAt: new Date("2026-03-15"),
  chiefComplaint: "Dolor de cabeza", createdAt: new Date(), updatedAt: new Date(),
};

describe("Consultations routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPermissions.mockResolvedValue([
      Permission.CONSULTATION_READ, Permission.CONSULTATION_WRITE, Permission.CONSULTATION_FINALIZE,
      Permission.DIAGNOSIS_READ, Permission.DIAGNOSIS_WRITE,
      Permission.PRESCRIPTION_READ, Permission.PRESCRIPTION_WRITE,
    ] as any);
  });

  it("GET /consultations returns list", async () => {
    mockListConsultationsByOrg.mockResolvedValue([sampleConsultation] as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toHaveLength(1);
  });

  it("GET /consultations with patientId filter", async () => {
    mockListConsultations.mockResolvedValue([sampleConsultation] as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations?patientId=p1");
    expect(res.status).toBe(200);
    expect(mockListConsultations).toHaveBeenCalledWith(expect.anything(), "org1", "p1");
  });

  it("GET /consultations/:id returns consultation", async () => {
    mockGetConsultation.mockResolvedValue(sampleConsultation as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations/c1");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.id).toBe("c1");
  });

  it("POST /consultations creates consultation + audit", async () => {
    mockGetOrCreateMedicalRecord.mockResolvedValue("mr1");
    mockCreateConsultation.mockResolvedValue(sampleConsultation as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: "p1", startedAt: "2026-03-15T10:00:00Z" }),
    });
    expect(res.status).toBe(201);
    expect(mockWriteAudit).toHaveBeenCalled();
  });

  it("PATCH /consultations/:id/finalize finalizes", async () => {
    const finalized = { ...sampleConsultation, status: "finalized" };
    mockFinalizeConsultation.mockResolvedValue(finalized as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations/c1/finalize", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ history: "Paciente refiere dolor" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.status).toBe("finalized");
  });

  it("POST /consultations/:id/diagnoses creates diagnosis", async () => {
    const diagnosis = { id: "d1", description: "Migraña", status: "active" };
    mockCreateDiagnosis.mockResolvedValue(diagnosis as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations/c1/diagnoses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description: "Migraña" }),
    });
    expect(res.status).toBe(201);
    expect(mockWriteAudit).toHaveBeenCalled();
  });

  it("POST /consultations/:id/prescriptions creates prescription", async () => {
    const prescription = { id: "rx1", medicationName: "Ibuprofeno", dose: "400mg" };
    mockCreatePrescription.mockResolvedValue(prescription as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations/c1/prescriptions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ medicationName: "Ibuprofeno", dose: "400mg" }),
    });
    expect(res.status).toBe(201);
    expect(mockWriteAudit).toHaveBeenCalled();
  });

  it("POST /consultations returns 400 on validation error", async () => {
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    expect(res.status).toBe(400);
  });
});
