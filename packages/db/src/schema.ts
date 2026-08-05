// Drizzle schema derived from .specs/domain-model.md
// All PHI-bearing tables are organization-scoped via organization_id.
// Audit is append-oriented: rows are never soft-updated to hide history.
import { bigint, boolean, index, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const organizationRole = pgEnum("organization_role", ["doctor", "receptionist", "administrator", "clinic-owner", "specialist", "assistant"]);
export const consultationStatus = pgEnum("consultation_status", ["draft", "finalized", "amended"]);
export const diagnosisStatus = pgEnum("diagnosis_status", ["active", "resolved", "ruled-out"]);
export const prescriptionStatus = pgEnum("prescription_status", ["active", "cancelled", "completed"]);
export const prescriptionRoute = pgEnum("prescription_route", ["oral", "iv", "subcutaneous", "topical", "inhalation", "other"]);
export const appointmentStatus = pgEnum("appointment_status", ["scheduled", "confirmed", "checked-in", "completed", "cancelled", "no-show"]);
export const aiSuggestionType = pgEnum("ai_suggestion_type", ["history-draft", "summary", "prescription-draft", "trend-insight", "coding-suggestion"]);
export const aiSuggestionStatus = pgEnum("ai_suggestion_status", ["proposed", "accepted", "rejected", "edited"]);

export const permissionKey = pgEnum("permission_key", [
  "patient:read",
  "patient:write",
  "patient:archive",
  "consultation:read",
  "consultation:write",
  "consultation:finalize",
  "diagnosis:read",
  "diagnosis:write",
  "prescription:read",
  "prescription:write",
  "appointment:read",
  "appointment:write",
  "attachment:read",
  "attachment:write",
  "user:manage",
  "audit:read",
  "org:manage",
]);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    role: organizationRole("role").notNull(),
    permission: permissionKey("permission").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.role, t.permission] }),
  }),
);

const createdAt = timestamp("created_at", { withTimezone: true }).defaultNow().notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true }).defaultNow().notNull();

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 256 }).notNull(),
  createdAt,
  updatedAt,
});

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  name: varchar("name", { length: 256 }).notNull(),
  image: varchar("image", { length: 1024 }),
  role: organizationRole("role").notNull().default("doctor"),
  createdAt,
  updatedAt,
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: varchar("token", { length: 512 }).notNull().unique(),
  ipAddress: varchar("ip_address", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt,
  updatedAt,
});

export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  providerId: varchar("provider_id", { length: 128 }).notNull(),
  accountId: varchar("account_id", { length: 512 }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt,
  updatedAt,
}, (t) => ({
  userIdIdx: index("accounts_user_id_idx").on(t.userId),
}));

export const verifications = pgTable("verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  identifier: varchar("identifier", { length: 512 }).notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt,
  updatedAt,
});

export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  firstName: varchar("first_name", { length: 256 }).notNull(),
  lastName: varchar("last_name", { length: 256 }).notNull(),
  identifier: varchar("identifier", { length: 256 }),
  birthDate: timestamp("birth_date", { withTimezone: true }),
  sex: varchar("sex", { enum: ["male", "female", "other", "unspecified"] }),
  phone: varchar("phone", { length: 64 }),
  email: varchar("email", { length: 320 }),
  address: text("address"),
  archived: boolean("archived").default(false).notNull(),
  createdAt,
  updatedAt,
}, (t) => ({
  orgIdx: index("patients_organization_idx").on(t.organizationId),
  archivedIdx: index("patients_archived_idx").on(t.organizationId, t.archived),
}));

export const medicalRecords = pgTable("medical_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  createdAt,
  updatedAt,
});

export const consultations = pgTable("consultations", {
  id: uuid("id").primaryKey().defaultRandom(),
  medicalRecordId: uuid("medical_record_id").references(() => medicalRecords.id).notNull(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  physicianId: uuid("physician_id").references(() => users.id).notNull(),
  status: consultationStatus("status").notNull().default("draft"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
  chiefComplaint: text("chief_complaint"),
  history: text("history"),
  exam: text("exam"),
  assessment: text("assessment"),
  plan: text("plan"),
  createdAt,
  updatedAt,
}, (t) => ({
  orgIdx: index("consultations_organization_idx").on(t.organizationId),
  patientIdx: index("consultations_patient_idx").on(t.patientId),
}));

export const diagnoses = pgTable("diagnoses", {
  id: uuid("id").primaryKey().defaultRandom(),
  consultationId: uuid("consultation_id").references(() => consultations.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  primary: boolean("primary").default(false).notNull(),
  status: diagnosisStatus("status").notNull().default("active"),
  description: text("description").notNull(),
  codingSystem: varchar("coding_system", { length: 256 }),
  code: varchar("code", { length: 256 }),
  createdAt,
  updatedAt,
}, (t) => ({
  orgIdx: index("diagnoses_organization_idx").on(t.organizationId),
  consultationIdx: index("diagnoses_consultation_idx").on(t.consultationId),
}));

export const prescriptions = pgTable("prescriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  consultationId: uuid("consultation_id").references(() => consultations.id).notNull(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  medicationName: varchar("medication_name", { length: 256 }).notNull(),
  strength: varchar("strength", { length: 256 }).notNull(),
  form: varchar("form", { length: 256 }).notNull(),
  dose: varchar("dose", { length: 256 }).notNull(),
  route: prescriptionRoute("route").notNull(),
  frequency: varchar("frequency", { length: 256 }).notNull(),
  duration: varchar("duration", { length: 256 }).notNull(),
  instructions: text("instructions"),
  status: prescriptionStatus("status").notNull().default("active"),
  createdAt,
  updatedAt,
}, (t) => ({
  orgIdx: index("prescriptions_organization_idx").on(t.organizationId),
  consultationIdx: index("prescriptions_consultation_idx").on(t.consultationId),
}));

export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  providerId: uuid("provider_id").references(() => users.id).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  status: appointmentStatus("status").notNull().default("scheduled"),
  reason: text("reason"),
  notes: text("notes"),
  consultationId: uuid("consultation_id").references(() => consultations.id),
  createdAt,
  updatedAt,
}, (t) => ({
  orgIdx: index("appointments_organization_idx").on(t.organizationId),
  patientIdx: index("appointments_patient_idx").on(t.patientId),
  providerIdx: index("appointments_provider_idx").on(t.providerId),
}));

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  patientId: uuid("patient_id").references(() => patients.id),
  consultationId: uuid("consultation_id").references(() => consultations.id),
  path: varchar("path", { length: 1024 }).notNull(),
  mimeType: varchar("mime_type", { length: 256 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  uploadedBy: uuid("uploaded_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const aiSuggestions = pgTable("ai_suggestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  patientId: uuid("patient_id").references(() => patients.id).notNull(),
  consultationId: uuid("consultation_id").references(() => consultations.id),
  type: aiSuggestionType("type").notNull(),
  status: aiSuggestionStatus("status").notNull().default("proposed"),
  prompt: text("prompt").notNull(),
  output: jsonb("output").notNull(),
  provider: varchar("provider", { length: 128 }).notNull(),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt,
  updatedAt,
}, (t) => ({
  orgIdx: index("ai_suggestions_organization_idx").on(t.organizationId),
  patientIdx: index("ai_suggestions_patient_idx").on(t.patientId),
}));

// Append-only audit log. Never updated or soft-deleted.
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  actorId: uuid("actor_id").references(() => users.id).notNull(),
  action: varchar("action", { length: 128 }).notNull(),
  targetEntity: varchar("target_entity", { length: 128 }).notNull(),
  targetId: uuid("target_id"),
  summary: text("summary"),
  ip: varchar("ip", { length: 64 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("audit_logs_organization_idx").on(t.organizationId),
  actorIdx: index("audit_logs_actor_idx").on(t.actorId),
  tsIdx: index("audit_logs_ts_idx").on(t.createdAt),
}));

export const documentExports = pgTable("document_exports", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  type: varchar("type", { length: 128 }).notNull(),
  sourceEntity: varchar("source_entity", { length: 128 }).notNull(),
  sourceId: uuid("source_id").notNull(),
  generatedBy: uuid("generated_by").references(() => users.id).notNull(),
  path: varchar("path", { length: 1024 }).notNull(),
  sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  orgIdx: index("document_exports_organization_idx").on(t.organizationId),
}));
