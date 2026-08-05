import { describe, expect, it } from "vitest";
import { hasPermission, Permission, PermissionDeniedError, requirePermission } from "./permissions";

const doctor = [
  Permission.PATIENT_READ,
  Permission.PATIENT_WRITE,
  Permission.CONSULTATION_READ,
  Permission.CONSULTATION_WRITE,
  Permission.CONSULTATION_FINALIZE,
];

describe("hasPermission", () => {
  it("allows a granted permission", () => {
    expect(hasPermission(doctor, Permission.PATIENT_READ)).toBe(true);
  });

  it("denies a missing permission", () => {
    expect(hasPermission(doctor, Permission.USER_MANAGE)).toBe(false);
  });

  it("denies empty permission sets (deny by default)", () => {
    expect(hasPermission([], Permission.PATIENT_READ)).toBe(false);
  });

  it("receptionist cannot write consultations", () => {
    const receptionist = [Permission.PATIENT_READ, Permission.APPOINTMENT_READ];
    expect(hasPermission(receptionist, Permission.CONSULTATION_WRITE)).toBe(false);
  });
});

describe("requirePermission", () => {
  it("passes when granted", () => {
    expect(() => requirePermission(doctor, Permission.PATIENT_READ)).not.toThrow();
  });

  it("throws PermissionDeniedError when missing", () => {
    expect(() => requirePermission(doctor, Permission.ORG_MANAGE)).toThrow(PermissionDeniedError);
  });
});
