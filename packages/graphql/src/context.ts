// GraphQL context contract. Boundaries (auth/DB) live in apps/api; tests provide their own.
import type { Db } from "../../../packages/db/src/repos/patients";
import type { User } from "@canica/types";

export interface GraphQLContext {
  db: Db;
  user: User | null;
  organizationId: string | null;
  ip?: string;
  userAgent?: string;
}

// Minimal auth gate used by resolvers before touching PHI.
export function requireAuth(ctx: GraphQLContext): NonNullable<GraphQLContext["user"]> {
  if (!ctx.user || !ctx.organizationId) {
    throw new Error("Unauthorized");
  }
  return ctx.user;
}

export function requireRole(ctx: GraphQLContext, ...allowed: User["role"][]): void {
  const user = requireAuth(ctx);
  if (!allowed.includes(user.role)) {
    throw new Error("Forbidden");
  }
}

export const defaultContext: GraphQLContext = {
  db: null as unknown as Db,
  user: null,
  organizationId: null,
};
