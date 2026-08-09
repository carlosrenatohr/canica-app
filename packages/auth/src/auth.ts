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

function sanitizeError(error: unknown) {
  if (!(error instanceof Error)) return undefined;
  const details = error as Error & { code?: unknown; cause?: unknown };
  const cause = details.cause instanceof Error ? (details.cause as Error & { code?: unknown }) : undefined;
  const redactParams = (message: string) => message.replace(/\nparams:.*/s, "\\nparams: [redacted]");
  return {
    name: error.name,
    message: redactParams(error.message),
    code: typeof details.code === "string" ? details.code : undefined,
    cause: cause
      ? {
          name: cause.name,
          message: redactParams(cause.message),
          code: typeof cause.code === "string" ? cause.code : undefined,
        }
      : undefined,
  };
}

export function createAuth({ db, baseURL, trustedOrigins = [] }: CreateAuthOptions) {
  return betterAuth({
    baseURL,
    trustedOrigins,
    logger: {
      level: "error",
      log(level, message, ...args) {
        const error = args.find((arg) => arg instanceof Error);
        console.error("AUTH_ERROR", JSON.stringify({ level, message, error: sanitizeError(error) }));
      },
    },
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
