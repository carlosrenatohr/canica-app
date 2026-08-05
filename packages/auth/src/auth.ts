import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { Db } from "@canica/db";
import { users, sessions, accounts, verifications } from "@canica/db";

export type { Db };

export interface CreateAuthOptions {
  db: Db;
  baseURL: string;
  trustedOrigins?: string[];
}

export function createAuth({ db, baseURL, trustedOrigins = [] }: CreateAuthOptions) {
  return betterAuth({
    baseURL,
    trustedOrigins,
    advanced: {
      database: {
        generateId: "uuid",
      },
    },
    database: drizzleAdapter(db, {
      provider: "pg",
      usePlural: true,
      schema: {
        users,
        sessions,
        accounts,
        verifications,
      },
    }),
    user: {
      additionalFields: {
        organizationId: {
          type: "string",
          required: true,
          input: true,
        },
        role: {
          type: "string",
          required: true,
          input: false,
          defaultValue: "doctor",
        },
      },
    },
    emailAndPassword: {
      enabled: true,
    },
  });
}

export type Auth = ReturnType<typeof createAuth>;
export type AuthSession = Awaited<ReturnType<Auth["api"]["getSession"]>>;

export interface AuthActor {
  userId: string;
  organizationId: string;
  role: string;
  email: string;
  name: string;
}

export function actorFromSession(session: AuthSession): AuthActor | null {
  if (!session?.user) return null;
  const user = session.user as typeof session.user & {
    organizationId?: string;
    role?: string;
  };
  if (!user.organizationId) return null;
  return {
    userId: user.id,
    organizationId: user.organizationId,
    role: user.role ?? "doctor",
    email: user.email,
    name: user.name,
  };
}
