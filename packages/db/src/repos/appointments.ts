import { and, eq, gte, lte } from "drizzle-orm";
import type { Db } from "../db";
import * as schema from "../schema";

export type AppointmentRow = typeof schema.appointments.$inferSelect;
export type CreateAppointmentInput = Omit<
  typeof schema.appointments.$inferInsert,
  "id" | "organizationId" | "createdAt" | "updatedAt" | "status"
> & {
  startDate: string;
};
export type UpdateAppointmentStatusInput = {
  status: typeof schema.appointmentStatus.enumValues[number];
};
export type UpdateAppointmentInput = Partial<
  Omit<CreateAppointmentInput, "patientId" | "providerId">
>;

export async function listAppointments(
  db: Db,
  organizationId: string,
  options?: {
    providerId?: string;
    fromDate?: string;
    toDate?: string;
    status?: typeof schema.appointmentStatus.enumValues[number];
  }
): Promise<AppointmentRow[]> {
  const conditions = [eq(schema.appointments.organizationId, organizationId)];

  if (options?.providerId) {
    conditions.push(eq(schema.appointments.providerId, options.providerId));
  }
  if (options?.status) {
    conditions.push(eq(schema.appointments.status, options.status));
  }
  if (options?.fromDate) {
    conditions.push(gte(schema.appointments.startDate, new Date(options.fromDate)));
  }
  if (options?.toDate) {
    conditions.push(lte(schema.appointments.startDate, new Date(options.toDate)));
  }

  return db
    .select()
    .from(schema.appointments)
    .where(and(...conditions));
}

export async function getAppointment(
  db: Db,
  organizationId: string,
  id: string
): Promise<AppointmentRow | undefined> {
  const [row] = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.organizationId, organizationId)
      )
    );
  return row;
}

export async function createAppointment(
  db: Db,
  organizationId: string,
  input: CreateAppointmentInput
): Promise<AppointmentRow> {
  const [row] = await db
    .insert(schema.appointments)
    .values({
      organizationId,
      patientId: input.patientId,
      providerId: input.providerId,
      startDate: new Date(input.startDate),
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      reason: input.reason,
      notes: input.notes,
      status: "scheduled",
    })
    .returning();
  return row;
}

export async function updateAppointment(
  db: Db,
  organizationId: string,
  id: string,
  input: UpdateAppointmentInput
): Promise<AppointmentRow> {
  const [row] = await db
    .update(schema.appointments)
    .set({
      startDate: input.startDate ? new Date(input.startDate) : undefined,
      endDate: input.endDate ? new Date(input.endDate) : undefined,
      reason: input.reason,
      notes: input.notes,
      consultationId: input.consultationId,
    })
    .where(
      and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.organizationId, organizationId)
      )
    )
    .returning();
  return row;
}

export async function updateAppointmentStatus(
  db: Db,
  organizationId: string,
  id: string,
  input: UpdateAppointmentStatusInput
): Promise<AppointmentRow> {
  const [row] = await db
    .update(schema.appointments)
    .set({ status: input.status })
    .where(
      and(
        eq(schema.appointments.id, id),
        eq(schema.appointments.organizationId, organizationId)
      )
    )
    .returning();
  return row;
}
