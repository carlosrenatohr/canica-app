"use client";

import { useState, useEffect, useMemo } from "react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  EmptyState,
  Pagination,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock } from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  startDate: string;
  endDate?: string | null;
  status:
    | "scheduled"
    | "confirmed"
    | "checked-in"
    | "completed"
    | "cancelled"
    | "no-show";
  reason?: string | null;
  createdAt: string;
}

const statusLabels: Record<Appointment["status"], string> = {
  scheduled: "Programada",
  confirmed: "Confirmada",
  "checked-in": "Registrada",
  completed: "Completada",
  cancelled: "Cancelada",
  "no-show": "No asistió",
};

function statusVariant(
  status: Appointment["status"],
): "default" | "success" | "warning" | "danger" | "neutral" {
  if (status === "completed") return "success";
  if (status === "confirmed" || status === "checked-in") return "warning";
  if (status === "cancelled" || status === "no-show") return "danger";
  return "neutral";
}

function groupByDate(
  appointments: Appointment[],
): Record<string, Appointment[]> {
  return appointments.reduce(
    (acc, a) => {
      const date = new Date(a.startDate).toISOString().split("T")[0] ?? "otros";
      if (!acc[date]) acc[date] = [];
      acc[date].push(a);
      return acc;
    },
    {} as Record<string, Appointment[]>,
  );
}

const PAGE_SIZE = 20;

export default function AppointmentsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSafePageTitle("Citas");

  const grouped = useMemo(() => groupByDate(appointments), [appointments]);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    apiFetch(`/api/appointments?limit=${PAGE_SIZE}&offset=${offset}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((result) => {
        setAppointments(result.data ?? []);
        setTotal(result.total ?? 0);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, page]);

  useEffect(() => {
    if (!session || appointments.length === 0) return;
    const uniquePatientIds = [...new Set(appointments.map((a) => a.patientId))];
    Promise.all(
      uniquePatientIds.map((id) =>
        apiFetch(`/api/patients/${id}`).then((r) => r.json()),
      ),
    ).then((results) => {
      uniquePatientIds.forEach((id, i) => {
        if (results[i]?.data) {
          setPatients((p) => ({ ...p, [id]: results[i].data }));
        }
      });
    });
  }, [session, appointments]);

  if (!session) {
    return (
      <main>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver las citas.
        </p>
      </main>
    );
  }

  const today = new Date().toISOString().split("T")[0];
  const upcoming = Object.keys(grouped).filter((d) => d >= (today ?? ""));
  const past = Object.keys(grouped).filter((d) => d < (today ?? ""));

  if (loading) {
    return (
      <main className="space-y-6" aria-busy="true">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-10 w-36" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main>
        <Card role="alert">
          <CardHeader>
            <CardTitle>Error al cargar las citas</CardTitle>
            <p className="text-small text-muted">{error}</p>
            <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardHeader>
        </Card>
      </main>
    );
  }

  const renderGroup = (
    dateLabel: string,
    date: string,
    items: Appointment[],
  ) => (
    <Card key={date} variant="elevated" className="mb-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-small text-muted-foreground">
          {dateLabel}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((a) => {
          const p = patients[a.patientId];
          const start = new Date(a.startDate);
          const end = a.endDate ? new Date(a.endDate) : null;
          return (
            <Card
              key={a.id}
              variant="default"
              className="motion-card p-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <CalendarDays className="h-4 w-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="font-medium">
                      {start.toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      {end &&
                        ` – ${end.toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}`}
                    </p>
                    <p className="text-h3">
                      {p?.firstName || ""} {p?.lastName || "Paciente"}
                    </p>
                    {a.reason && (
                      <p className="text-small text-muted line-clamp-1">
                        {a.reason}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 self-start">
                  <Clock className="h-4 w-4 text-muted" />
                  <Badge variant={statusVariant(a.status)} className="text-xs">
                    {statusLabels[a.status]}
                  </Badge>
                </div>
              </div>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold text-primary">Citas</h1>
        <Button onClick={() => router.push("/appointments/new")}>
          Nueva cita
        </Button>
      </div>

      {appointments.length === 0 ? (
        <EmptyState
          title="Sin citas"
          description="Aún no hay citas programadas."
          icon={<CalendarDays className="h-10 w-10" />}
          actionLabel="Crear primera cita"
          onAction={() => router.push("/appointments/new")}
        />
      ) : (
        <>
          <div>
            {upcoming.length > 0 && (
              <>
                <h2 className="mb-2 text-h3 font-medium text-primary">
                  Próximas
                </h2>
                {upcoming.map((d) =>
                  renderGroup(
                    d === today
                      ? "Hoy"
                      : new Date(d).toLocaleDateString("es-ES", {
                          weekday: "short",
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }),
                    d,
                    grouped[d]!,
                  ),
                )}
              </>
            )}
            {past.length > 0 && (
              <>
                <h2 className="mb-2 mt-4 text-h3 font-medium text-primary">
                  Anteriores
                </h2>
                {past.map((d) =>
                  renderGroup(
                    new Date(d).toLocaleDateString("es-ES", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                    d,
                    grouped[d]!,
                  ),
                )}
              </>
            )}
          </div>
          <Pagination
            current={page}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}
