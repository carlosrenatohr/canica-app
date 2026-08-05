import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Context } from "hono";
import { Hono } from "hono";
import { ApiEnv, requirePermission, sessionMiddleware } from "./auth.middleware";
import { Permission } from "@canica/auth";

vi.mock("@canica/db/repos/permissions", () => ({
  getPermissionsForRole: vi.fn(),
}));

import { getPermissionsForRole } from "@canica/db/repos/permissions";

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
  app.use("/protected/*", sessionMiddleware());
  app.get(
    "/protected/x",
    requirePermission(Permission.CONSULTATION_WRITE),
    (c) => c.json({ ok: true, actor: c.get("actor") }),
  );
  return app;
}

describe("authz middleware denial paths", () => {
  beforeEach(() => {
    mockGetPermissions.mockReset();
  });

  it("401 when no valid session", async () => {
    const app = makeApp(null);
    const res = await app.request("/protected/x");
    expect(res.status).toBe(401);
  });

  it("401 when session lacks organizationId", async () => {
    const app = makeApp({ user: { id: "u1", role: "doctor" } });
    const res = await app.request("/protected/x");
    expect(res.status).toBe(401);
  });

  it("403 when role lacks the required permission", async () => {
    mockGetPermissions.mockResolvedValue([Permission.PATIENT_READ]);
    const app = makeApp({
      user: { id: "u1", name: "A", email: "a@b.c", organizationId: "org1", role: "receptionist" },
    });
    const res = await app.request("/protected/x");
    expect(res.status).toBe(403);
  });

  it("200 when role has the required permission", async () => {
    mockGetPermissions.mockResolvedValue([
      Permission.CONSULTATION_WRITE,
      Permission.PATIENT_READ,
    ]);
    const app = makeApp({
      user: { id: "u1", name: "A", email: "a@b.c", organizationId: "org1", role: "doctor" },
    });
    const res = await app.request("/protected/x");
    expect(res.status).toBe(200);
    const json = (await res.json()) as any;
    expect(json.actor.organizationId).toBe("org1");
  });
});
