"use client";

import { useState, useEffect, use } from "react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  EmptyState,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FileText,
  ClipboardList,
  Pill,
  ShieldCheck,
  CalendarDays,
  AlertCircle,
} from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";
import { apiFetch } from "@/lib/api";

interface TimelineEntry {
  type: "consultation" | "diagnosis" | "prescription" | "attachment";
  id: string;
  createdAt: string;
  title: string;
  subtitle?: string;
  metadata: Record<string, unknown>;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

const typeConfig: Record<
  TimelineEntry["type"],
  {
    label: string;
    icon: React.ReactNode;
    badge: "default" | "success" | "warning" | "neutral";
  }
> = {
  consultation: {
    label: "Consulta",
    icon: <ClipboardList className="h-5 w-5" />,
    badge: "default",
  },
  diagnosis: {
    label: "Diagnóstico",
    icon: <ShieldCheck className="h-5 w-5" />,
    badge: "success",
  },
  prescription: {
    label: "Prescripción",
    icon: <Pill className="h-5 w-5" />,
    badge: "neutral",
  },
  attachment: {
    label: "Documento",
    icon: <FileText className="h-5 w-5" />,
    badge: "neutral",
  },
};

function statusVariant(
  type: TimelineEntry["type"],
  metadata: Record<string, unknown>,
): "success" | "warning" | "neutral" {
  const status = metadata?.status;
  if (type === "consultation") {
    if (status === "finalized") return "success";
    if (status === "amended") return "warning";
    return "neutral";
  }
  if (status === "active" || status === "completed") return "success";
  return "neutral";
}

export default function TimelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  useSafePageTitle("Historial clínico");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch(`/api/patients/${id}`).then((r) => r.json()),
      apiFetch(`/api/patients/${id}/timeline`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ])
      .then(([p, t]) => {
        setPatient(p.data);
        setEntries(t.data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, id]);

  if (!session) {
    return (
      <main>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver el historial clínico.
        </p>
      </main>
    );
  }

  const displayName = patient ? `${patient.firstName} ${patient.lastName}` : "";

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold text-primary">
          Historial clínico{displayName ? ` de ${displayName}` : ""}
        </h1>
        <Button
          onClick={() =>
            router.push(`/patients/${id}/consultations/new`)
          }
        >
          Nueva consulta
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-danger">Error: {error}</p>
      ) : entries.length === 0 ? (
        <EmptyState
          title="Sin historial"
          description="Aún no hay actividad clínica registrada para este paciente."
          icon={<CalendarDays className="h-10 w-10" />}
          actionLabel="Crear primera consulta"
          onAction={() =>
            router.push(`/patients/${id}/consultations/new`)
          }
        />
      ) : (
        <div className="relative ml-2 space-y-6 before:absolute before:inset-y-0 before:w-px before:bg-border before:left-[-1px]">
          {entries.map((entry, idx) => {
            const config = typeConfig[entry.type];
            return (
              <div key={`${entry.type}-${entry.id}`} className="relative pl-6">
                <div className="absolute left-[-12px] flex h-7 w-7 items-center justify-center rounded-full border-2 border-secondary bg-surface text-secondary">
                  {config.icon}
                </div>
                <Card
                  variant="default"
                  className="border-l-2 border-l-secondary"
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-h3">
                        {entry.title || config.label}
                      </CardTitle>
                      <Badge
                        variant={statusVariant(entry.type, entry.metadata)}
                      >
                        {(entry.metadata?.status as string) ?? config.label}
                      </Badge>
                    </div>
                    <CardDescription className="flex items-center gap-2 text-small text-muted">
                      <time dateTime={entry.createdAt}>
                        {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      <span aria-hidden>·</span>
                      <span className="flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {config.label}
                      </span>
                    </CardDescription>
                    {idx === 0 && (
                      <Badge variant="warning" className="mt-1 text-xs">
                        Más reciente
                      </Badge>
                    )}
                  </CardHeader>
                  {entry.subtitle && (
                    <CardContent>
                      <p className="text-small leading-relaxed">
                        {entry.subtitle}
                      </p>
                    </CardContent>
                  )}
                  {entry.type === "consultation" && (
                    <CardContent>
                      <Link
                        href={`/patients/${id}/consultations/${entry.id}`}
                        className="text-small text-primary hover:underline"
                      >
                        Ver consulta →
                      </Link>
                    </CardContent>
                  )}
                </Card>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
