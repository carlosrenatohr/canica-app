import type { MiddlewareHandler } from "hono";
import { actorFromSession, hasPermission, type Auth, type AuthActor } from "@canica/auth";
import type { Db } from "@canica/db";
import { getPermissionsForRole } from "@canica/db/repos/permissions";
import type { PermissionKey } from "@canica/db/repos/permissions";

export interface ApiEnv {
  Bindings: {
    HYPERDRIVE?: { connectionString: string };
  };
  Variables: {
    db: Db;
    auth: Auth;
    actor: AuthActor;
    permissions: { key: string; values: PermissionKey[] } | undefined;
  };
}

export function sessionMiddleware(): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    const auth = c.get("auth");
    let session;
    for (let attempt = 1; ; attempt++) {
      try {
        session = await auth.api.getSession({ headers: c.req.raw.headers });
        break;
      } catch (e) {
        if (attempt >= 2) throw e;
        console.error("getSession failed (retry):", (e as Error).message);
        await new Promise((r) => setTimeout(r, 200));
      }
    }
    const actor = actorFromSession(session);
    if (!actor) return c.json({ error: "unauthorized" }, 401);
    c.set("actor", actor);
    await next();
  };
}

export function requirePermission(permission: PermissionKey): MiddlewareHandler<ApiEnv> {
  return async (c, next) => {
    const actor = c.get("actor");
    const cached = c.get("permissions");
    const permissions =
      cached && cached.key === actor.role
        ? cached.values
        : await getPermissionsForRole(c.get("db"), actor.role as never);
    c.set("permissions", { key: actor.role, values: permissions });
    if (!hasPermission(permissions, permission)) {
      return c.json({ error: "forbidden" }, 403);
    }
    await next();
  };
}
