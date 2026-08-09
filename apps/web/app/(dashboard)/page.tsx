"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
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
import { Users, Calendar, FileText, TrendingUp, Bell } from "lucide-react";
import Link from "next/link";
import { useSafePageTitle } from "@/hooks/usePageTitle";

interface DashboardData {
  patientCount: number;
  todayAppointments: number;
  pendingConsultations: number;
}

export default function DashboardPage() {
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user as { role?: string; name?: string } | undefined;
  const role = user?.role ?? "doctor";
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useSafePageTitle("Dashboard");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch("/api/patients")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      apiFetch("/api/appointments")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
      apiFetch("/api/consultations")
        .then((r) => r.json())
        .catch(() => ({ data: [] })),
    ]).then(([p, a, c]) => {
      const today = new Date().toISOString().slice(0, 10);
      setData({
        patientCount: p.data?.length ?? 0,
        todayAppointments: (a.data ?? []).filter((ap: { startDate: string }) =>
          ap.startDate.startsWith(today),
        ).length,
        pendingConsultations: (c.data ?? []).filter(
          (con: { status: string }) => con.status !== "finalized",
        ).length,
      });
      setLoading(false);
    });
  }, [session]);

  if (!session || isPending) {
    return (
      <main className="p-8">
        <p className="text-muted">Cargando sesión…</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </main>
    );
  }

  const statCards = [
    {
      label: "Pacientes",
      value: data?.patientCount ?? 0,
      icon: Users,
      href: "/patients",
      variant: "secondary" as const,
    },
    {
      label: "Citas de hoy",
      value: data?.todayAppointments ?? 0,
      icon: Calendar,
      href: "/appointments",
      variant: "primary" as const,
    },
    {
      label: "Consultas pendientes",
      value: data?.pendingConsultations ?? 0,
      icon: FileText,
      href: "/patients",
      variant: "info" as const,
    },
  ];

  return (
    <main className="p-8 space-y-8 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display font-semibold text-primary">
            Bienvenido{user?.name ? `, ${user.name}` : ""}
          </h1>
          <p className="text-muted mt-1">
            Vista rápida —{" "}
            <span className="font-medium text-text capitalize">{role}</span>
          </p>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/audit" className="gap-2">
            <Bell className="h-4 w-4" />
            Últimos eventos
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.label} href={card.href}>
              <Card
                variant="interactive"
                className="group h-32 cursor-pointer motion-card"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-h3 font-semibold">
                    {card.value}
                  </CardTitle>
                  <Icon className="h-5 w-5 text-muted group-hover:text-primary" />
                </CardHeader>
                <CardContent>
                  <CardDescription
                    className={cn(
                      "text-small font-medium",
                      card.variant === "primary" && "text-primary",
                      card.variant === "secondary" && "text-secondary",
                      card.variant === "info" && "text-info",
                    )}
                  >
                    {card.label}
                  </CardDescription>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {role === "doctor" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Acciones rápidas
            </CardTitle>
            <CardDescription>¿Qué necesitás hacer ahora?</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Button variant="primary" asChild>
              <Link href="/patients/new">Nuevo paciente</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/appointments/new">Nueva cita</Link>
            </Button>
            <Button variant="secondary" asChild>
              <Link href="/audit">Ver auditoría</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
