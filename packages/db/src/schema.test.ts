import { describe, expect, it } from "vitest";
import * as schema from "../src/schema";

// Shape-level verification so the migration always matches domain-model.md.
describe("schema exports", () => {
  it("exposes all domain tables", () => {
    expect(Object.keys(schema).sort()).toEqual(
      [
        "aiSuggestions",
        "aiSuggestionStatus",
        "aiSuggestionType",
        "appointmentStatus",
        "appointments",
        "attachments",
        "auditLogs",
        "consultationStatus",
        "consultations",
        "diagnoses",
        "diagnosisStatus",
        "documentExports",
        "medicalRecords",
        "organizationRole",
        "organizations",
        "patients",
        "prescriptionRoute",
        "prescriptionStatus",
        "prescriptions",
        "users",
      ].sort()
    );
  });
});

describe("organization scoping on PHI tables", () => {
  // Each PHI-bearing table exposes organizationId, enforcing org boundaries.
  const phiTables = [
    schema.patients,
    schema.medicalRecords,
    schema.consultations,
    schema.diagnoses,
    schema.prescriptions,
    schema.appointments,
    schema.attachments,
    schema.aiSuggestions,
    schema.auditLogs,
    schema.documentExports,
  ];

  it("has organizationId on every PHI table", () => {
    for (const table of phiTables) {
      expect("organizationId" in table).toBe(true);
    }
  });

  it("defaults the audit log to the expected shape", () => {
    const cols = Object.keys(schema.auditLogs);
    for (const col of ["id", "organizationId", "actorId", "action", "targetEntity", "createdAt"]) {
      expect(cols).toContain(col);
    }
  });
});
