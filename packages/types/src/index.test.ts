import { expectTypeOf, test } from "vitest";
import type {
  AiSuggestionStatus,
  AiSuggestionType,
  AppointmentStatus,
  ConsultationStatus,
  DiagnosisStatus,
  PrescriptionStatus,
  UserRole,
} from "./index";

// Type-level tests lock enum membership so accidental widening
// is caught before it reaches the rest of the codebase.
test("UserRole is a fixed union", () => {
  expectTypeOf<UserRole>().toEqualTypeOf<"doctor" | "receptionist" | "administrator" | "clinic-owner" | "specialist" | "assistant">();
});

test("ConsultationStatus is a fixed union", () => {
  expectTypeOf<ConsultationStatus>().toEqualTypeOf<"draft" | "finalized" | "amended">();
});

test("DiagnosisStatus is a fixed union", () => {
  expectTypeOf<DiagnosisStatus>().toEqualTypeOf<"active" | "resolved" | "ruled-out">();
});

test("PrescriptionStatus is a fixed union", () => {
  expectTypeOf<PrescriptionStatus>().toEqualTypeOf<"active" | "cancelled" | "completed">();
});

test("AppointmentStatus is a fixed union", () => {
  expectTypeOf<AppointmentStatus>().toEqualTypeOf<
    "scheduled" | "confirmed" | "checked-in" | "completed" | "cancelled" | "no-show"
  >();
});

test("AiSuggestionStatus is a fixed union", () => {
  expectTypeOf<AiSuggestionStatus>().toEqualTypeOf<"proposed" | "accepted" | "rejected" | "edited">();
});

test("AiSuggestionType is a fixed union", () => {
  expectTypeOf<AiSuggestionType>().toEqualTypeOf<
    "history-draft" | "summary" | "prescription-draft" | "trend-insight" | "coding-suggestion"
  >();
});
