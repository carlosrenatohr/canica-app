import type { PermissionKey } from "@canica/db/repos/permissions";

export const Permission = {
  PATIENT_READ: "patient:read",
  PATIENT_WRITE: "patient:write",
  PATIENT_ARCHIVE: "patient:archive",
  CONSULTATION_READ: "consultation:read",
  CONSULTATION_WRITE: "consultation:write",
  CONSULTATION_FINALIZE: "consultation:finalize",
  DIAGNOSIS_READ: "diagnosis:read",
  DIAGNOSIS_WRITE: "diagnosis:write",
  PRESCRIPTION_READ: "prescription:read",
  PRESCRIPTION_WRITE: "prescription:write",
  APPOINTMENT_READ: "appointment:read",
  APPOINTMENT_WRITE: "appointment:write",
  ATTACHMENT_READ: "attachment:read",
  ATTACHMENT_WRITE: "attachment:write",
  USER_MANAGE: "user:manage",
  AUDIT_READ: "audit:read",
  ORG_MANAGE: "org:manage",
} as const satisfies Record<string, PermissionKey>;

export type PermissionName = keyof typeof Permission;

export function hasPermission(
  granted: readonly PermissionKey[],
  required: PermissionKey,
): boolean {
  return granted.includes(required);
}

export function requirePermission(
  granted: readonly PermissionKey[],
  required: PermissionKey,
): void {
  if (!hasPermission(granted, required)) {
    throw new PermissionDeniedError(required);
  }
}

export class PermissionDeniedError extends Error {
  constructor(public readonly permission: string) {
    super(`Missing permission: ${permission}`);
    this.name = "PermissionDeniedError";
  }
}
