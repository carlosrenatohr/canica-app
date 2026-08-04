import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
    AppointmentStatus,
    CreateAppointmentInput,
    CreateDiagnosisInput,
    CreatePatientInput,
    CreatePrescriptionInput,
    DiagnosisStatus,
    PrescriptionStatus,
    UpdatePatientInput,
} from "./index";

const PATIENT = {
  firstName: "Ana",
  lastName: "Lopez",
  birthDate: "1985-06-01",
  sex: "female",
  phone: "+505 8888 8888",
  email: "ana@example.com",
};

describe("CreatePatientInput", () => {
  it("accepts valid patient data", () => {
    const result = CreatePatientInput.safeParse(PATIENT);
    expect(result.success).toBe(true);
  });

  it("rejects empty first name", () => {
    const result = CreatePatientInput.safeParse({ ...PATIENT, firstName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email when provided", () => {
    const result = CreatePatientInput.safeParse({ ...PATIENT, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("allows optional identifier and address", () => {
    const result = CreatePatientInput.safeParse({
      ...PATIENT,
      identifier: "NIC-00112233",
      address: "Calle 1, Managua",
    });
    expect(result.success).toBe(true);
  });
});

describe("UpdatePatientInput allows partial edits", () => {
  it("parses a single-field partial", () => {
    const result = UpdatePatientInput.safeParse({ phone: "+505 7777 7777" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email on partial edit", () => {
    const result = UpdatePatientInput.safeParse({ email: "still-bad" });
    expect(result.success).toBe(false);
  });
});

describe("status enums", () => {
  it("DiagnosisStatus accepts domain values", () => {
    expect(DiagnosisStatus.parse("active")).toBe("active");
    expect(DiagnosisStatus.parse("ruled-out")).toBe("ruled-out");
    expect(() => DiagnosisStatus.parse("deleted")).toThrow();
  });

  it("PrescriptionStatus accepts domain values", () => {
    expect(PrescriptionStatus.parse("cancelled")).toBe("cancelled");
    expect(() => PrescriptionStatus.parse("expired")).toThrow();
  });

  it("AppointmentStatus accepts domain values", () => {
    expect(AppointmentStatus.parse("no-show")).toBe("no-show");
    expect(() => AppointmentStatus.parse("in-progress")).toThrow();
  });
});

describe("CreatePrescriptionInput", () => {
  const BASE = {
    consultationId: "019010d8-5215-4a53-9d90-8b85b3f26034",
    medicationName: "Amoxicilina",
    strength: "500 mg",
    form: "tablet",
    dose: "1 comprimido",
    route: "oral",
    frequency: "cada 8h",
    duration: "7 days",
  };

  it("accepts a valid prescription draft", () => {
    const result = CreatePrescriptionInput.safeParse(BASE);
    expect(result.success).toBe(true);
  });

  it("defaults status to active when omitted", () => {
    const result = CreatePrescriptionInput.safeParse(BASE);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("active");
  });

  it("rejects unknown route", () => {
    const result = CreatePrescriptionInput.safeParse({ ...BASE, route: "nasal" });
    expect(result.success).toBe(false);
  });
});

describe("CreateAppointmentInput", () => {
  const BASE = {
    patientId: "019010d8-5215-4a53-9d90-8b85b3f26034",
    providerId: "019010d8-5215-4a53-9d90-8b85b3f26034",
    startDate: "2025-02-01T09:00:00.000Z",
  };

  it("accepts a scheduled appointment", () => {
    const result = CreateAppointmentInput.safeParse(BASE);
    expect(result.success).toBe(true);
  });

  it("rejects invalid provider UUID", () => {
    const result = CreateAppointmentInput.safeParse({ ...BASE, providerId: "not-a-uuid" });
    expect(result.success).toBe(false);
  });
});

describe("CreateDiagnosisInput", () => {
  it("rejects empty description", () => {
    const result = CreateDiagnosisInput.safeParse({
      consultationId: "019010d8-5215-4a53-9d90-8b85b3f26034",
      description: "",
    });
    expect(result.success).toBe(false);
  });

  it("parses a minimal diagnosis with defaults", () => {
    const result = CreateDiagnosisInput.safeParse({
      consultationId: "019010d8-5215-4a53-9d90-8b85b3f26034",
      description: "Hipertensión arterial",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe("active");
      expect(result.data.primary).toBe(false);
    }
  });
});

describe("schema surface", () => {
  it("exports zod instances", () => {
    expect(CreatePatientInput).toBeInstanceOf(z.ZodObject);
    expect(CreatePrescriptionInput).toBeInstanceOf(z.ZodObject);
    expect(AppointmentStatus).toBeInstanceOf(z.ZodEnum);
  });
});
