// Canonical domain types derived from .specs/domain-model.md
// Import these everywhere instead of redefining shapes.
export type UUID = string;
export type ISODate = string;
export type ISOTime = string;

export type UserRole =
  | "doctor"
  | "receptionist"
  | "administrator"
  | "clinic-owner"
  | "specialist"
  | "assistant";

export interface User {
  id: UUID;
  organizationId: UUID;
  email: string;
  name: string;
  role: UserRole;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Organization {
  id: UUID;
  name: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Patient {
  id: UUID;
  organizationId: UUID;
  firstName: string;
  lastName: string;
  identifier?: string;
  birthDate?: ISODate;
  sex?: "male" | "female" | "other" | "unspecified";
  phone?: string;
  email?: string;
  address?: string;
  archived: boolean;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface MedicalRecord {
  id: UUID;
  patientId: UUID;
  organizationId: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type ConsultationStatus = "draft" | "finalized" | "amended";

export interface Consultation {
  id: UUID;
  medicalRecordId: UUID;
  patientId: UUID;
  organizationId: UUID;
  physicianId: UUID;
  status: ConsultationStatus;
  startedAt: ISODate;
  completedAt?: ISODate;
  chiefComplaint?: string;
  history?: string;
  exam?: string;
  assessment?: string;
  plan?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type DiagnosisStatus = "active" | "resolved" | "ruled-out";

export interface Diagnosis {
  id: UUID;
  consultationId: UUID;
  organizationId: UUID;
  primary: boolean;
  status: DiagnosisStatus;
  description: string;
  codingSystem?: string;
  code?: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type PrescriptionStatus = "active" | "cancelled" | "completed";
export type PrescriptionRoute = "oral" | "iv" | "subcutaneous" | "topical" | "inhalation" | "other";

export interface Prescription {
  id: UUID;
  consultationId: UUID;
  organizationId: UUID;
  medicationName: string;
  strength: string;
  form: string;
  dose: string;
  route: PrescriptionRoute;
  frequency: string;
  duration: string;
  instructions?: string;
  status: PrescriptionStatus;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked-in"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Appointment {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  providerId: UUID;
  startDate: ISODate;
  endDate?: ISODate;
  status: AppointmentStatus;
  reason?: string;
  notes?: string;
  consultationId?: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export type AttachmentStorage = "supabase";

export interface Attachment {
  id: UUID;
  organizationId: UUID;
  patientId?: UUID;
  consultationId?: UUID;
  fileName: string;
  storage: AttachmentStorage;
  path: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: UUID;
  createdAt: ISODate;
}

export type AiSuggestionType =
  | "history-draft"
  | "summary"
  | "prescription-draft"
  | "trend-insight"
  | "coding-suggestion";
export type AiSuggestionStatus = "proposed" | "accepted" | "rejected" | "edited";

export interface AiSuggestion {
  id: UUID;
  organizationId: UUID;
  patientId: UUID;
  consultationId?: UUID;
  type: AiSuggestionType;
  status: AiSuggestionStatus;
  prompt: string;
  output: unknown;
  provider: string;
  reviewedBy?: UUID;
  reviewedAt?: ISODate;
  createdAt: ISODate;
}

export type AuditAction =
  | "login"
  | "login-failed"
  | "logout"
  | "record-created"
  | "record-viewed"
  | "diagnosis-updated"
  | "prescription-edited"
  | "pdf-generated"
  | "pdf-downloaded"
  | "attachment-uploaded"
  | "ai-suggestion-accepted"
  | "ai-suggestion-rejected"
  | "consent-changed";

export interface AuditLog {
  id: UUID;
  organizationId: UUID;
  actorId: UUID;
  action: AuditAction;
  targetEntity: string;
  targetId?: UUID;
  summary?: string;
  ip?: string;
  userAgent?: string;
  createdAt: ISODate;
}

export interface DocumentExport {
  id: UUID;
  organizationId: UUID;
  type: string;
  sourceEntity: string;
  sourceId: UUID;
  generatedBy: UUID;
  path: string;
  sizeBytes: number;
  createdAt: ISODate;
}
