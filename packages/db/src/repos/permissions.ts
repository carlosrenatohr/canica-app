// Permission repository: reads the role → permission matrix from the DB.
import { eq } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

export type PermissionKey = typeof schema.permissionKey.enumValues[number];

export async function getPermissionsForRole(
  db: Db,
  role: typeof schema.organizationRole.enumValues[number],
): Promise<PermissionKey[]> {
  const rows = await db
    .select({ permission: schema.rolePermissions.permission })
    .from(schema.rolePermissions)
    .where(eq(schema.rolePermissions.role, role));
  return rows.map((r) => r.permission);
}
