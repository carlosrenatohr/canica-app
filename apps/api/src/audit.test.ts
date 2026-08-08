import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";
import { Permission } from "@canica/auth";

vi.mock("@canica/db/repos/permissions", () => ({
  getPermissionsForRole: vi.fn(),
}));

vi.mock("@canica/db/repos/audit", () => ({
  listAuditLogs: vi.fn(),
  writeAudit: vi.fn(),
}));

import { listAuditLogs, writeAudit } from "@canica/db/repos/audit";
import { getPermissionsForRole } from "@canica/db/repos/permissions";

const mockListAuditLogs = vi.mocked(listAuditLogs);
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

  return app;
}

const doctorSession = {
  user: { id: "u1", name: "Dr. Test", email: "dr@test.com", organizationId: "org1", role: "doctor" },
};

const sampleLogs = [
  { id: "log1", organizationId: "org1", actorId: "u1", action: "patient.create", targetEntity: "patient", targetId: "p1", createdAt: new Date("2026-01-15") },
  { id: "log2", organizationId: "org1", actorId: "u2", action: "consultation.finalize", targetEntity: "consultation", targetId: "c1", createdAt: new Date("2026-02-10") },
];

describe("GET /audit", () => {
  beforeEach(() => {
    mockListAuditLogs.mockReset();
    mockGetPermissions.mockReset();
    mockGetPermissions.mockResolvedValue([Permission.AUDIT_READ] as any);
  });

  it("returns audit logs for the organization", async () => {
    mockListAuditLogs.mockResolvedValue(sampleLogs as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/audit");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toHaveLength(2);
    expect(mockListAuditLogs).toHaveBeenCalledWith(expect.anything(), "org1", {
      actorId: undefined,
      targetEntity: undefined,
      action: undefined,
      fromDate: undefined,
      toDate: undefined,
    });
  });

  it("filters by actorId", async () => {
    mockListAuditLogs.mockResolvedValue([sampleLogs[0]] as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/audit?actorId=u1");
    expect(res.status).toBe(200);
    expect(mockListAuditLogs).toHaveBeenCalledWith(expect.anything(), "org1", expect.objectContaining({ actorId: "u1" }));
  });

  it("filters by action", async () => {
    mockListAuditLogs.mockResolvedValue([sampleLogs[1]] as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/audit?action=consultation.finalize");
    expect(res.status).toBe(200);
    expect(mockListAuditLogs).toHaveBeenCalledWith(expect.anything(), "org1", expect.objectContaining({ action: "consultation.finalize" }));
  });

  it("filters by date range", async () => {
    mockListAuditLogs.mockResolvedValue(sampleLogs as any);
    const app = makeApp(doctorSession);
    const res = await app.request("/audit?fromDate=2026-01-01&toDate=2026-12-31");
    expect(res.status).toBe(200);
    expect(mockListAuditLogs).toHaveBeenCalledWith(expect.anything(), "org1", expect.objectContaining({
      fromDate: "2026-01-01",
      toDate: "2026-12-31",
    }));
  });

  it("returns empty array when no logs match", async () => {
    mockListAuditLogs.mockResolvedValue([]);
    const app = makeApp(doctorSession);
    const res = await app.request("/audit");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toEqual([]);
  });
});
