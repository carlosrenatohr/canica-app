import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";
import { Permission } from "@canica/auth";

vi.mock("@canica/db/repos/permissions", () => ({
  getPermissionsForRole: vi.fn(),
}));

vi.mock("@canica/db/repos/appointments", () => ({
  listAppointments: vi.fn(),
  getAppointment: vi.fn(),
  createAppointment: vi.fn(),
  updateAppointmentStatus: vi.fn(),
}));

vi.mock("@canica/db/repos/audit", () => ({
  writeAudit: vi.fn(),
}));

import * as appointmentsRepo from "@canica/db/repos/appointments";
import { writeAudit } from "@canica/db/repos/audit";
import { getPermissionsForRole } from "@canica/db/repos/permissions";

const mockListAppointments = vi.mocked(appointmentsRepo.listAppointments);
const mockGetAppointment = vi.mocked(appointmentsRepo.getAppointment);
const mockCreateAppointment = vi.mocked(appointmentsRepo.createAppointment);
const mockUpdateAppointmentStatus = vi.mocked(appointmentsRepo.updateAppointmentStatus);
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

  app.use("/appointments/*", sessionMiddleware());

  app.get("/appointments", requirePermission(Permission.APPOINTMENT_READ), async (c) => {
    const data = await appointmentsRepo.listAppointments(c.var.db, c.var.actor.organizationId, {
      providerId: c.req.query("providerId") ?? undefined,
      fromDate: c.req.query("fromDate") ?? undefined,
      toDate: c.req.query("toDate") ?? undefined,
      status: c.req.query("status") as any,
    });
    return c.json({ data });
  });

  app.get("/appointments/:id", requirePermission(Permission.APPOINTMENT_READ), async (c) => {
    const appointment = await appointmentsRepo.getAppointment(
      c.var.db, c.var.actor.organizationId, c.req.param("id")
    );
    if (!appointment) return c.json({ error: "not_found" }, 404);
    return c.json({ data: appointment });
  });

  app.post("/appointments", requirePermission(Permission.APPOINTMENT_WRITE), async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.patientId || !body?.providerId || !body?.startDate) {
      return c.json({ error: "validation_failed" }, 400);
    }
    const appointment = await appointmentsRepo.createAppointment(
      c.var.db, c.var.actor.organizationId, body
    );
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId,
      actorId: c.var.actor.userId,
      action: "appointment.create",
      targetEntity: "appointment",
      targetId: appointment.id,
    });
    return c.json({ data: appointment }, 201);
  });

  app.patch("/appointments/:id/status", requirePermission(Permission.APPOINTMENT_WRITE), async (c) => {
    const body = await c.req.json().catch(() => null);
    if (!body?.status) return c.json({ error: "validation_failed" }, 400);
    const appointment = await appointmentsRepo.updateAppointmentStatus(
      c.var.db, c.var.actor.organizationId, c.req.param("id"), body
    );
    if (!appointment) return c.json({ error: "not_found" }, 404);
    await writeAudit(c.var.db, {
      organizationId: c.var.actor.organizationId,
      actorId: c.var.actor.userId,
      action: "appointment.status_change",
      targetEntity: "appointment",
      targetId: appointment.id,
    });
    return c.json({ data: appointment });
  });

  return app;
}

const doctorSession = {
  user: { id: "u1", name: "Dr. Test", email: "dr@test.com", organizationId: "org1", role: "doctor" },
};

const sampleAppointment = {
  id: "apt1", organizationId: "org1", patientId: "p1", providerId: "u1",
  startDate: new Date("2026-03-15T10:00:00Z"), status: "scheduled" as const,
  createdAt: new Date(), updatedAt: new Date(),
};

describe("Appointments routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPermissions.mockResolvedValue([
      Permission.APPOINTMENT_READ, Permission.APPOINTMENT_WRITE,
    ] as any);
  });

  it("GET /appointments returns list", async () => {
    mockListAppointments.mockResolvedValue([sampleAppointment] as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toHaveLength(1);
  });

  it("GET /appointments with status filter", async () => {
    mockListAppointments.mockResolvedValue([]);
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments?status=confirmed");
    expect(res.status).toBe(200);
    expect(mockListAppointments).toHaveBeenCalledWith(
      expect.anything(), "org1", expect.objectContaining({ status: "confirmed" })
    );
  });

  it("GET /appointments/:id returns appointment", async () => {
    mockGetAppointment.mockResolvedValue(sampleAppointment as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments/apt1");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.id).toBe("apt1");
  });

  it("GET /appointments/:id returns 404 when not found", async () => {
    mockGetAppointment.mockResolvedValue(undefined);
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments/nonexistent");
    expect(res.status).toBe(404);
  });

  it("POST /appointments creates appointment", async () => {
    mockCreateAppointment.mockResolvedValue(sampleAppointment as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: "p1", providerId: "u1", startDate: "2026-03-15T10:00:00Z" }),
    });
    expect(res.status).toBe(201);
    expect(mockWriteAudit).toHaveBeenCalled();
  });

  it("POST /appointments returns 400 on validation error", async () => {
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ patientId: "p1" }),
    });
    expect(res.status).toBe(400);
  });

  it("PATCH /appointments/:id/status updates status", async () => {
    const confirmed = { ...sampleAppointment, status: "confirmed" as const };
    mockUpdateAppointmentStatus.mockResolvedValue(confirmed as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/appointments/apt1/status", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed" }),
    });
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data.status).toBe("confirmed");
  });
});
