// Shared Zod schemas derived from .specs/domain-model.md
// Boundary validators only — DB constraints and GraphQL nullability are enforced elsewhere.
import { z } from "zod";

export const UUID = z.uuid();
export const ISODate = z.string().datetime();
export const DateTimeLocal = z.string().datetime({ precision: 0, offset: false }).or(z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/));

// Input for creating an organization.
export const CreateOrganizationInput = z.object({
  name: z.string().min(1),
});

// Input for creating a patient. PHI-bearing.
export const CreatePatientInput = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  identifier: z.string().optional(),
  birthDate: z.string().optional(),
  sex: z.enum(["male", "female", "other", "unspecified"]).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
});

export const UpdatePatientInput = CreatePatientInput.partial();

export const PatientSchema = z.object({
  id: UUID,
  organizationId: UUID,
  firstName: z.string(),
  lastName: z.string(),
  identifier: z.string().optional(),
  birthDate: ISODate.optional(),
  sex: z.enum(["male", "female", "other", "unspecified"]).optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  address: z.string().optional(),
  archived: z.boolean(),
  createdAt: ISODate,
  updatedAt: ISODate,
});

export const ConsultationStatus = z.enum(["draft", "finalized", "amended"]);
export const DiagnosisStatus = z.enum(["active", "resolved", "ruled-out"]);
export const PrescriptionStatus = z.enum(["active", "cancelled", "completed"]);
export const AppointmentStatus = z.enum(["scheduled", "confirmed", "checked-in", "completed", "cancelled", "no-show"]);
export const AiSuggestionType = z.enum(["history-draft", "summary", "prescription-draft", "trend-insight", "coding-suggestion"]);
export const AiSuggestionStatus = z.enum(["proposed", "accepted", "rejected", "edited"]);

// Clinical encounter between a physician and a patient.
export const CreateConsultationInput = z.object({
  patientId: UUID,
  startedAt: DateTimeLocal,
  chiefComplaint: z.string().optional(),
});

export const FinalizeConsultationInput = z.object({
  history: z.string().optional(),
  exam: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
});

// Diagnosis tied to a consultation.
export const CreateDiagnosisInput = z.object({
  consultationId: UUID,
  primary: z.boolean().default(false),
  status: DiagnosisStatus.default("active"),
  description: z.string().min(1),
  codingSystem: z.string().optional(),
  code: z.string().optional(),
});

// Medication order from a consultation.
export const CreatePrescriptionInput = z.object({
  consultationId: UUID,
  medicationName: z.string().min(1),
  strength: z.string().min(1),
  form: z.string().min(1),
  dose: z.string().min(1),
  route: z.enum(["oral", "iv", "subcutaneous", "topical", "inhalation", "other"]),
  frequency: z.string().min(1),
  duration: z.string().min(1),
  instructions: z.string().optional(),
  status: PrescriptionStatus.default("active"),
});

// Scheduled interaction with a patient.
export const CreateAppointmentInput = z.object({
  patientId: UUID,
  providerId: UUID,
  startDate: DateTimeLocal,
  endDate: DateTimeLocal.optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const UpdateAppointmentStatusInput = z.object({
  status: AppointmentStatus,
});

// Attachment metadata. Binary stored in object storage.
export const CreateAttachmentInput = z.object({
  patientId: UUID.optional(),
  consultationId: UUID.optional(),
  path: z.string().min(1),
  mimeType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
});
