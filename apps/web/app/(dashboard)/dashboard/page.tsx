"use client";

import { authClient } from "@/lib/auth-client";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@canica/ui";
import { Users, Calendar, FileText, ArrowRight, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useSafePageTitle } from "@/hooks/usePageTitle";

interface DashboardData {
  patientCount?: number;
  todayAppointments?: number;
  pendingConsultations?: number;
}

interface DashboardScope {
  patients: boolean;
  appointments: boolean;
  consultations: boolean;
  audit: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  doctor: "Médico",
  receptionist: "Recepción",
  administrator: "Administrador",
  superadmin: "Administrador principal",
  "clinic-owner": "Responsable de clínica",
  specialist: "Especialista",
  assistant: "Asistente",
};

const ROLE_SCOPES: Record<string, DashboardScope> = {
  doctor: { patients: true, appointments: true, consultations: true, audit: false },
  receptionist: { patients: true, appointments: true, consultations: false, audit: false },
  administrator: { patients: false, appointments: false, consultations: false, audit: true },
  superadmin: { patients: true, appointments: true, consultations: true, audit: true },
};

function roleLabel(role: string | undefined) {
  return (role && ROLE_LABELS[role]) || "Usuario";
}

function scopeForRole(role: string | undefined): DashboardScope {
  return (
    (role && ROLE_SCOPES[role]) ||
    { patients: false, appointments: false, consultations: false, audit: false }
  );
}

export default function DashboardPage() {
  const { data: session } = authClient.useSession();
  const user = session?.user as { role?: string; name?: string | null } | undefined;
  const role = user?.role;
  const scope = scopeForRole(role);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useSafePageTitle("Resumen");

  useEffect(() => {
    let active = true;

    if (!session) {
      setData(null);
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(false);

    if (!scope.patients) {
      setData({ patientCount: undefined, todayAppointments: undefined, pendingConsultations: undefined });
      setLoading(false);
      return () => { active = false; };
    }

    apiFetch("/api/dashboard/summary")
      .then((r) => r.json())
      .then((summary) => {
        if (!active) return;
        setData({
          patientCount: summary.data?.totalPatients,
          todayAppointments: summary.data?.todayAppointments,
          pendingConsultations: summary.data?.pendingConsultations,
        });
      })
      .catch(() => {
        if (!active) return;
        setData(null);
        setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey, session, role]);

  if (!session) {
    return (
      <main className="max-w-7xl space-y-8">
        <p className="text-muted" role="status">
          Se necesita una sesión activa para ver este resumen.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="max-w-7xl space-y-8" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: scope.consultations ? 3 : scope.patients ? 2 : 1 }).map(
            (_, index) => (
              <Skeleton key={index} className="h-36 w-full" />
            ),
          )}
        </div>
        <Skeleton className="h-44 w-full" />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-3xl space-y-4">
        <div>
          <p className="text-h3 font-semibold text-text">No se pudo cargar el resumen</p>
          <p className="mt-2 text-small text-muted">
            Comprueba la conexión y vuelve a intentarlo. No se muestran valores estimados.
          </p>
        </div>
        <Button variant="outline" onClick={() => setRefreshKey((key) => key + 1)}>
          Reintentar
        </Button>
      </main>
    );
  }

  const statCards = [
    scope.patients && {
      label: "Pacientes",
      description: "Registros disponibles",
      value: data?.patientCount,
      icon: Users,
      href: "/patients",
    },
    scope.appointments && {
      label: "Citas de hoy",
      description: "Según la agenda actual",
      value: data?.todayAppointments,
      icon: Calendar,
      href: "/appointments",
    },
    scope.consultations && {
      label: "Consultas sin finalizar",
      description: "Borradores o en revisión",
      value: data?.pendingConsultations,
      icon: FileText,
      href: "/consultations",
    },
  ].filter(Boolean) as Array<{
    label: string;
    description: string;
    value?: number;
    icon: typeof Users;
    href: string;
  }>;

  const quickActions = [
    scope.patients && {
      label: "Nuevo paciente",
      href: "/patients/new",
      variant: "primary" as const,
    },
    scope.appointments && {
      label: "Nueva cita",
      href: "/appointments/new",
      variant: "outline" as const,
    },
    scope.audit && {
      label: "Ver auditoría",
      href: "/audit",
      variant: "secondary" as const,
    },
  ].filter(Boolean) as Array<{
    label: string;
    href: string;
    variant: "primary" | "outline" | "secondary";
  }>;

  return (
    <main className="max-w-7xl space-y-8">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-caption font-semibold uppercase tracking-[0.16em] text-primary">
            Resumen de trabajo
          </p>
          <h1 className="mt-2 text-display font-semibold tracking-tight text-text">
            {user?.name ? `Bienvenido, ${user.name}` : "Bienvenido"}
          </h1>
          <p className="mt-2 text-small text-muted">
            Vista general para <span className="font-medium text-text">{roleLabel(role)}</span>
          </p>
        </div>
        {scope.audit && (
          <Button variant="ghost" size="sm" asChild>
            <Link href="/audit" className="gap-2">
              <ShieldCheck className="h-4 w-4" />
              Revisar auditoría
            </Link>
          </Button>
        )}
      </header>

      {statCards.length > 0 ? (
        <section aria-labelledby="summary-title" aria-live="polite" className="space-y-4">
          <div>
            <h2 id="summary-title" className="text-h3 font-semibold text-text">
              Situación actual
            </h2>
            <p className="mt-1 text-small text-muted">Indicadores calculados con los registros disponibles.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.label} href={card.href} className="group">
                  <Card variant="interactive" className="h-full min-h-36">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                      <div>
                        <CardDescription>{card.label}</CardDescription>
                        <CardTitle className="mt-3 text-3xl font-semibold tabular-nums">
                          {card.value ?? 0}
                        </CardTitle>
                      </div>
                      <span className="rounded-[var(--radius-button)] bg-primary-light p-2.5 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                    </CardHeader>
                    <CardContent className="flex items-center justify-between gap-3">
                      <span className="text-caption text-muted">{card.description}</span>
                      <ArrowRight className="h-4 w-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary" aria-hidden="true" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Acceso según permisos</CardTitle>
            <CardDescription>
              No hay indicadores operativos disponibles para este perfil en el contrato actual.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {quickActions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Acciones disponibles</CardTitle>
            <CardDescription>Accede directamente a las tareas permitidas para tu perfil.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            {quickActions.map((action) => (
              <Button key={action.href} variant={action.variant} asChild>
                <Link href={action.href}>{action.label}</Link>
              </Button>
            ))}
          </CardContent>
        </Card>
      )}
    </main>
  );
}
