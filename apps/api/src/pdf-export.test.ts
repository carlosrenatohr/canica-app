import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";
import { Permission } from "@canica/auth";
import { PDFDocument, StandardFonts } from "pdf-lib";

vi.mock("@canica/db/repos/permissions", () => ({
  getPermissionsForRole: vi.fn(),
}));

vi.mock("@canica/db/repos/consultations", () => ({
  getConsultation: vi.fn(),
}));

vi.mock("@canica/db/repos/audit", () => ({
  writeAudit: vi.fn(),
}));

import * as consultationsRepo from "@canica/db/repos/consultations";
import { writeAudit } from "@canica/db/repos/audit";
import { getPermissionsForRole } from "@canica/db/repos/permissions";

const mockGetConsultation = vi.mocked(consultationsRepo.getConsultation);
const mockWriteAudit = vi.mocked(writeAudit);
const mockGetPermissions = vi.mocked(getPermissionsForRole);

const sampleConsultation = {
  id: "c1", organizationId: "org1", patientId: "p1", physicianId: "u1",
  status: "finalized" as const, startedAt: new Date("2026-03-15"),
  chiefComplaint: "Dolor de cabeza", history: "3 días de dolor",
  exam: "Neurológico normal", assessment: "Migraña", plan: "Ibuprofeno 400mg",
  createdAt: new Date(), updatedAt: new Date(), completedAt: new Date(),
  medicalRecordId: "mr1",
};

function makeApp(session: any) {
  const app = new Hono<ApiEnv>();
  const auth = { api: { getSession: vi.fn().mockResolvedValue(session) } };
  const mockPatients = [{ firstName: "María", lastName: "García" }];
  const db = {
    $client: {},
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockResolvedValue(mockPatients),
  };

  app.use("*", (c, next) => {
    const ctx = c as Context<ApiEnv>;
    ctx.set("db", db as any);
    ctx.set("auth", auth as any);
    ctx.set("permissions", undefined);
    return next();
  });

  app.use("*", sessionMiddleware());

  app.post("/consultations/:id/export/pdf", requirePermission(Permission.CONSULTATION_READ), async (c) => {
    const consultation = await consultationsRepo.getConsultation(
      c.var.db, c.var.actor.organizationId, c.req.param("id")
    );
    if (!consultation) return c.json({ error: "not_found" }, 404);

    const [patient] = await c.var.db
      .select()
      .from((await import("@canica/db")).patients)
      .where((await import("drizzle-orm")).eq((await import("@canica/db")).patients.id, consultation.patientId));

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]);
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.setFont(boldFont);
    const patientName = patient ? `${patient.firstName} ${patient.lastName}` : "Paciente";
    page.drawText(`Resumen de Consulta — ${patientName}`, { x: 50, y: 800 });
    page.setFont(font);
    page.drawText(`Fecha: ${new Date(consultation.startedAt).toLocaleDateString("es-ES")}`, { x: 50, y: 775 });
    page.drawText(`Estado: ${consultation.status}`, { x: 50, y: 750 });

    const pdfBytes = await pdfDoc.save();
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId, actorId: c.var.actor.userId,
      action: "document.export", targetEntity: "document_export", targetId: consultation.id,
    });

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="consulta-${consultation.id}.pdf"`,
      },
    });
  });

  return app;
}

const doctorSession = {
  user: { id: "u1", name: "Dr. Test", email: "dr@test.com", organizationId: "org1", role: "doctor" },
};

describe("POST /consultations/:id/export/pdf", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPermissions.mockResolvedValue([Permission.CONSULTATION_READ] as any);
  });

  it("returns PDF with correct content-type", async () => {
    mockGetConsultation.mockResolvedValue(sampleConsultation as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations/c1/export/pdf", { method: "POST" });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/pdf");
    expect(res.headers.get("content-disposition")).toContain("consulta-c1.pdf");
  });

  it("returns 404 when consultation not found", async () => {
    mockGetConsultation.mockResolvedValue(undefined);
    const app = makeApp(doctorSession);
    const res = await app.request("/consultations/nonexistent/export/pdf", { method: "POST" });
    expect(res.status).toBe(404);
  });

  it("writes audit entry for export", async () => {
    mockGetConsultation.mockResolvedValue(sampleConsultation as any);
    const app = makeApp(doctorSession);
    await app.request("/consultations/c1/export/pdf", { method: "POST" });
    expect(mockWriteAudit).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ action: "document.export", targetEntity: "document_export" })
    );
  });
});
