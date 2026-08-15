"use client";

import { use, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  CircleAlert,
  FileText,
  UserRound,
} from "lucide-react";
import {
  Badge,
  Breadcrumb,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Label,
  Skeleton,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { useSafePageTitle } from "@/hooks/usePageTitle";

type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "checked-in"
  | "completed"
  | "cancelled"
  | "no-show";

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startDate: string;
  endDate?: string | null;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  consultationId?: string | null;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Consultation {
  id: string;
  status: "draft" | "finalized" | "amended";
  startedAt: string;
  chiefComplaint?: string | null;
}

type PageState =
  | "loading"
  | "ready"
  | "unauthenticated"
  | "forbidden"
  | "not-found"
  | "error";
type RelatedState = "empty" | "available" | "forbidden" | "not-found" | "error";

const statusLabels: Record<AppointmentStatus, string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  "checked-in": "En recepción",
  completed: "Completada",
  cancelled: "Cancelada",
  "no-show": "No asistió",
};

const consultationStatusLabels: Record<Consultation["status"], string> = {
  draft: "Borrador",
  finalized: "Finalizada",
  amended: "Modificada",
};

const appointmentStatuses = Object.keys(statusLabels) as AppointmentStatus[];

function statusVariant(
  status: AppointmentStatus,
): "default" | "success" | "warning" | "danger" | "neutral" {
  if (status === "completed") return "success";
  if (status === "confirmed" || status === "checked-in") return "warning";
  if (status === "cancelled" || status === "no-show") return "danger";
  return "neutral";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return date.toLocaleDateString("es-NI", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Hora no disponible";
  return date.toLocaleTimeString("es-NI", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatResponseError(status: number): string {
  if (status === 401) return "Tu sesión ya no está disponible. Inicia sesión nuevamente.";
  if (status === 403) return "No tienes permisos para consultar esta cita.";
  if (status === 404) return "La cita que buscas no existe o ya no está disponible.";
  return "No se pudo cargar la cita. Intenta nuevamente.";
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="text-small text-text">{children}</dd>
    </div>
  );
}

function AppointmentSkeleton() {
  return (
    <main className="space-y-6 p-6 sm:p-8" aria-busy="true">
      <Skeleton className="h-5 w-48" />
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-5 w-56" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-56" />
      </div>
    </main>
  );
}

export default function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [pageState, setPageState] = useState<PageState>("loading");
  const [patientState, setPatientState] = useState<RelatedState>("empty");
  const [consultationState, setConsultationState] =
    useState<RelatedState>("empty");
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedStatus, setSelectedStatus] = useState<AppointmentStatus | "">("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);

  useSafePageTitle("Detalle de cita");

  useEffect(() => {
    let active = true;

    if (!session) {
      setPageState("unauthenticated");
      return () => {
        active = false;
      };
    }

    setPageState("loading");
    setError(null);
    setPatient(null);
    setConsultation(null);
    setPatientState("empty");
    setConsultationState("empty");

    async function loadAppointment() {
      try {
        const appointmentResponse = await apiFetch(`/api/appointments/${id}`);
        if (!appointmentResponse.ok) {
          if (!active) return;
          setPageState(
            appointmentResponse.status === 403
              ? "forbidden"
              : appointmentResponse.status === 404
                ? "not-found"
                : appointmentResponse.status === 401
                  ? "unauthenticated"
                  : "error",
          );
          setError(formatResponseError(appointmentResponse.status));
          return;
        }

        const appointmentPayload = (await appointmentResponse.json().catch(() => null)) as {
          data?: Appointment;
        } | null;
        const loadedAppointment = appointmentPayload?.data;
        if (!loadedAppointment) {
          if (!active) return;
          setPageState("not-found");
          setError("La cita que buscas no está disponible.");
          return;
        }

        const [patientResponse, consultationResponse] = await Promise.all([
          apiFetch(`/api/patients/${loadedAppointment.patientId}`),
          loadedAppointment.consultationId
            ? apiFetch(`/api/consultations/${loadedAppointment.consultationId}`)
            : Promise.resolve(null),
        ]);

        if (!active) return;

        const patientPayload = patientResponse.ok
          ? ((await patientResponse.json().catch(() => null)) as {
              data?: Patient;
            } | null)
          : null;
        const consultationPayload = consultationResponse?.ok
          ? ((await consultationResponse.json().catch(() => null)) as {
              data?: Consultation;
            } | null)
          : null;

        setAppointment(loadedAppointment);
        setSelectedStatus(loadedAppointment.status);
        setPatient(patientPayload?.data ?? null);
        setPatientState(
          patientResponse.ok
            ? patientPayload?.data
              ? "available"
              : "not-found"
            : patientResponse.status === 403
              ? "forbidden"
              : patientResponse.status === 404
                ? "not-found"
              : "error",
        );

        if (!loadedAppointment.consultationId) {
          setConsultationState("empty");
        } else {
          setConsultation(consultationPayload?.data ?? null);
          setConsultationState(
            consultationResponse?.ok
              ? consultationPayload?.data
                ? "available"
                : "not-found"
              : consultationResponse?.status === 403
                ? "forbidden"
                : consultationResponse?.status === 404
                  ? "not-found"
                : "error",
          );
        }

        setPageState("ready");
      } catch {
        if (!active) return;
        setPageState("error");
        setError("No se pudo cargar la cita. Revisa tu conexión e intenta nuevamente.");
      }
    }

    void loadAppointment();
    return () => {
      active = false;
    };
  }, [id, retryKey, session]);

  async function updateStatus() {
    if (!appointment || !selectedStatus || selectedStatus === appointment.status) {
      return;
    }

    setUpdatingStatus(true);
    setStatusMessage(null);
    setStatusError(null);

    try {
      const response = await apiFetch(`/api/appointments/${appointment.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (!response.ok) {
        setStatusError(
          response.status === 403
            ? "No tienes permisos para cambiar el estado de esta cita."
            : response.status === 404
              ? "La cita ya no está disponible."
              : "No se pudo actualizar el estado. Intenta nuevamente.",
        );
        return;
      }

      const payload = (await response.json().catch(() => null)) as {
        data?: Appointment;
      } | null;
      const updatedAppointment = payload?.data;
      setAppointment((current) =>
        updatedAppointment ??
        (current ? { ...current, status: selectedStatus } : current),
      );
      setSelectedStatus(updatedAppointment?.status ?? selectedStatus);
      setStatusMessage("Estado actualizado.");
    } catch {
      setStatusError("No se pudo actualizar el estado. Revisa tu conexión e intenta nuevamente.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (pageState === "loading") {
    return <AppointmentSkeleton />;
  }

  if (pageState === "unauthenticated") {
    return (
      <main className="space-y-4 p-6 sm:p-8">
        <h1 className="text-h2 font-semibold text-text">Detalle de cita</h1>
        <p className="text-small text-muted">Debes iniciar sesión para consultar esta cita.</p>
        <Link href="/login" className="inline-flex">
          <Button>Iniciar sesión</Button>
        </Link>
      </main>
    );
  }

  if (pageState === "forbidden") {
    return (
      <main className="space-y-4 p-6 sm:p-8">
        <CircleAlert className="h-8 w-8 text-warning" aria-hidden="true" />
        <h1 className="text-h2 font-semibold text-text">Acceso no disponible</h1>
        <p className="max-w-xl text-small text-muted">
          No tienes permisos para consultar esta cita. El acceso se valida en el servidor.
        </p>
        <Link href="/appointments" className="inline-flex">
          <Button variant="outline">Volver a citas</Button>
        </Link>
      </main>
    );
  }

  if (pageState === "not-found") {
    return (
      <main className="space-y-4 p-6 sm:p-8">
        <EmptyState
          title="Cita no encontrada"
          description={error ?? "La cita que buscas no existe o ya no está disponible."}
          icon={<CalendarClock className="h-8 w-8" aria-hidden="true" />}
          actionLabel="Volver a citas"
          onAction={() => router.push("/appointments")}
        />
      </main>
    );
  }

  if (pageState === "error") {
    return (
      <main className="space-y-4 p-6 sm:p-8">
        <p className="text-small text-danger" role="alert">
          {error ?? "No se pudo cargar la cita."}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => setRetryKey((key) => key + 1)}>Reintentar</Button>
          <Link href="/appointments" className="inline-flex">
            <Button variant="outline">Volver a citas</Button>
          </Link>
        </div>
      </main>
    );
  }

  if (!appointment || !session) return null;

  const sessionUser = session.user as {
    id?: string;
    name?: string | null;
    email?: string | null;
  };
  const providerName =
    sessionUser.id === appointment.providerId
      ? sessionUser.name?.trim() || "Usuario actual"
      : null;
  const patientName = patient
    ? `${patient.firstName} ${patient.lastName}`.trim()
    : "Paciente no disponible";

  return (
    <main className="max-w-6xl space-y-6 p-6 sm:p-8">
      <Breadcrumb
        items={[
          { label: "Citas", href: "/appointments" },
          { label: "Detalle" },
        ]}
      />

      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-h1 font-semibold text-primary">Detalle de la cita</h1>
              <Badge variant={statusVariant(appointment.status)}>
                {statusLabels[appointment.status]}
              </Badge>
            </div>
            <p className="text-small text-muted">{patientName}</p>
          </div>
        </div>
        <Link
          href="/appointments"
          className="inline-flex items-center gap-2 self-start rounded-sm text-small font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Volver a citas
        </Link>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Información de la cita</CardTitle>
            <CardDescription>Datos registrados para esta visita.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-5 sm:grid-cols-2">
              <DetailItem label="Paciente">
                {patient ? (
                  <Link
                    href={`/patients/${patient.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {patientName}
                  </Link>
                ) : patientState === "forbidden" ? (
                  <span className="text-muted">No disponible con los permisos actuales.</span>
                ) : (
                  <span className="text-muted">No disponible en los datos actuales.</span>
                )}
              </DetailItem>
              <DetailItem label="Proveedor">
                {providerName ? (
                  providerName
                ) : (
                  <span className="text-muted">Identidad no disponible en los datos actuales.</span>
                )}
              </DetailItem>
              <DetailItem label="Fecha">{formatDate(appointment.startDate)}</DetailItem>
              <DetailItem label="Horario">
                {formatTime(appointment.startDate)}
                {appointment.endDate ? ` a ${formatTime(appointment.endDate)}` : ""}
              </DetailItem>
              <DetailItem label="Motivo">
                {appointment.reason || <span className="text-muted">Sin registrar.</span>}
              </DetailItem>
              <DetailItem label="Notas">
                {appointment.notes || <span className="text-muted">Sin registrar.</span>}
              </DetailItem>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Paciente</CardTitle>
            <CardDescription>Contexto de la persona atendida.</CardDescription>
          </CardHeader>
          <CardContent>
            {patient ? (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <UserRound className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="min-w-0 space-y-1">
                  <Link
                    href={`/patients/${patient.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {patientName}
                  </Link>
                  <p className="text-small text-muted">Consulta el expediente del paciente.</p>
                </div>
              </div>
            ) : (
              <p className="text-small text-muted">
                {patientState === "forbidden"
                  ? "El contexto del paciente no está disponible con tus permisos."
                  : "El contexto del paciente no está disponible."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Consulta vinculada</CardTitle>
            <CardDescription>Relación clínica registrada para esta cita.</CardDescription>
          </CardHeader>
          <CardContent>
            {consultationState === "empty" && (
              <EmptyState
                title="Sin consulta vinculada"
                description="Esta cita todavía no tiene una consulta asociada."
                icon={<FileText className="h-7 w-7" aria-hidden="true" />}
              />
            )}
            {consultationState === "available" && consultation && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">
                    {consultationStatusLabels[consultation.status]}
                  </Badge>
                  <span className="text-small text-muted">
                    Iniciada el {formatDate(consultation.startedAt)}
                  </span>
                </div>
                {consultation.chiefComplaint && (
                  <p className="text-small text-text">{consultation.chiefComplaint}</p>
                )}
                {patient && (
                  <Link
                    href={`/patients/${patient.id}/consultations/${consultation.id}`}
                    className="inline-flex font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    Ver consulta
                  </Link>
                )}
              </div>
            )}
            {(consultationState === "forbidden" || consultationState === "error") && (
              <p className="text-small text-muted">
                La consulta vinculada no está disponible con los permisos o datos actuales.
              </p>
            )}
            {consultationState === "not-found" && (
              <p className="text-small text-muted">
                La consulta vinculada ya no está disponible.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actualizar estado</CardTitle>
            <CardDescription>
              Disponible para usuarios con permiso de gestión de citas. El servidor valida el acceso.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void updateStatus();
              }}
            >
              <div className="space-y-1">
                <Label htmlFor="appointment-status">Estado</Label>
                <select
                  id="appointment-status"
                  value={selectedStatus}
                  onChange={(event) => {
                    setSelectedStatus(event.target.value as AppointmentStatus);
                    setStatusMessage(null);
                    setStatusError(null);
                  }}
                  disabled={updatingStatus}
                  className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 py-2 text-body text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {appointmentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {statusLabels[status]}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                disabled={updatingStatus || !selectedStatus || selectedStatus === appointment.status}
              >
                {updatingStatus ? "Actualizando…" : "Actualizar estado"}
              </Button>
              {statusMessage && (
                <p className="text-small text-success" role="status">
                  {statusMessage}
                </p>
              )}
              {statusError && (
                <p className="text-small text-danger" role="alert">
                  {statusError}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
