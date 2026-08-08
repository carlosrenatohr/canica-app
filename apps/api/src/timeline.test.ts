import { beforeEach, describe, expect, it, vi } from "vitest";
import { Hono } from "hono";
import type { Context } from "hono";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";
import { Permission } from "@canica/auth";

vi.mock("@canica/db/repos/permissions", () => ({
  getPermissionsForRole: vi.fn(),
}));

vi.mock("@canica/db/repos/medical-records", () => ({
  getPatientTimeline: vi.fn(),
}));

import { getPatientTimeline } from "@canica/db/repos/medical-records";
import { getPermissionsForRole } from "@canica/db/repos/permissions";

const mockGetPatientTimeline = vi.mocked(getPatientTimeline);
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

  app.get("/patients/:id/timeline", requirePermission(Permission.PATIENT_READ), async (c) => {
    const entries = await getPatientTimeline(
      c.var.db, c.var.actor.organizationId, c.req.param("id"),
      { fromDate: c.req.query("fromDate") ?? undefined, toDate: c.req.query("toDate") ?? undefined }
    );
    return c.json({ data: entries });
  });

  return app;
}

const doctorSession = {
  user: { id: "u1", name: "Dr. Test", email: "dr@test.com", organizationId: "org1", role: "doctor" },
};

const sampleEntries = [
  { type: "consultation" as const, id: "c1", createdAt: new Date("2026-03-10"), title: "Consulta", subtitle: "Dolor de cabeza", metadata: {} },
  { type: "diagnosis" as const, id: "d1", createdAt: new Date("2026-03-09"), title: "Migraña", subtitle: "active", metadata: {} },
  { type: "prescription" as const, id: "p1", createdAt: new Date("2026-03-08"), title: "Ibuprofeno", subtitle: "active", metadata: {} },
];

describe("GET /patients/:id/timeline", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetPermissions.mockResolvedValue([Permission.PATIENT_READ] as any);
  });

  it("returns timeline entries", async () => {
    mockGetPatientTimeline.mockResolvedValue(sampleEntries);
    const app = makeApp(doctorSession);
    const res = await app.request("/patients/p1/timeline");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toHaveLength(3);
    expect(json.data[0].type).toBe("consultation");
  });

  it("filters by fromDate", async () => {
    mockGetPatientTimeline.mockResolvedValue([sampleEntries[0]]);
    const app = makeApp(doctorSession);
    const res = await app.request("/patients/p1/timeline?fromDate=2026-03-10");
    expect(res.status).toBe(200);
    expect(mockGetPatientTimeline).toHaveBeenCalledWith(
      expect.anything(), "org1", "p1", expect.objectContaining({ fromDate: "2026-03-10" })
    );
  });

  it("filters by toDate", async () => {
    mockGetPatientTimeline.mockResolvedValue(sampleEntries);
    const app = makeApp(doctorSession);
    const res = await app.request("/patients/p1/timeline?toDate=2026-03-09");
    expect(res.status).toBe(200);
    expect(mockGetPatientTimeline).toHaveBeenCalledWith(
      expect.anything(), "org1", "p1", expect.objectContaining({ toDate: "2026-03-09" })
    );
  });

  it("returns empty array for patient with no data", async () => {
    mockGetPatientTimeline.mockResolvedValue([]);
    const app = makeApp(doctorSession);
    const res = await app.request("/patients/p1/timeline");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.data).toEqual([]);
  });
});
