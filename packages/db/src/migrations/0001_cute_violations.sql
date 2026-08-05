CREATE TYPE "public"."permission_key" AS ENUM('patient:read', 'patient:write', 'patient:archive', 'consultation:read', 'consultation:write', 'consultation:finalize', 'diagnosis:read', 'diagnosis:write', 'prescription:read', 'prescription:write', 'appointment:read', 'appointment:write', 'attachment:read', 'attachment:write', 'user:manage', 'audit:read', 'org:manage');--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role" "organization_role" NOT NULL,
	"permission" "permission_key" NOT NULL,
	CONSTRAINT "role_permissions_role_permission_pk" PRIMARY KEY("role","permission")
);
