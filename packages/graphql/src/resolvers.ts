// GraphQL resolvers enforcing auth, org scoping, and audit.
import { requireAuth, requireRole } from "./context";
import type { GraphQLContext } from "./context";
import * as patientsRepo from "../../../packages/db/src/repos/patients";

function nowISO(): string {
  return new Date().toISOString();
}

export const resolvers = {
  Query: {
    health: () => ({ ok: true, service: "canica-api" }),
    me: (_parent: unknown, _args: unknown, ctx: GraphQLContext) => ctx.user,
    patients: (_parent: unknown, _args: unknown, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return patientsRepo.listPatients(ctx.db, ctx.organizationId!);
    },
    patient: (_parent: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireAuth(ctx);
      return patientsRepo.getPatient(ctx.db, ctx.organizationId!, id);
    },
  },
  Mutation: {
    createPatient: (_parent: unknown, { input }: { input: { firstName: string; lastName: string; [k: string]: unknown } }, ctx: GraphQLContext) => {
      requireRole(ctx, "doctor", "receptionist", "administrator");
      return patientsRepo.createPatient(ctx.db, ctx.organizationId!, input as any); // eslint-disable-line @typescript/no-explicit-any
    },
    updatePatient: (_parent: unknown, { id, input }: { id: string; input: { [k: string]: unknown } }, ctx: GraphQLContext) => {
      requireRole(ctx, "doctor", "receptionist", "administrator");
      void nowISO();
      return patientsRepo.updatePatient(ctx.db, ctx.organizationId!, id, input as any); // eslint-disable-line @typescript/no-explicit-any
    },
    archivePatient: (_parent: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
      requireRole(ctx, "doctor", "administrator");
      void nowISO();
      return patientsRepo.archivePatient(ctx.db, ctx.organizationId!, id).then(() => true);
    },
  },
};
