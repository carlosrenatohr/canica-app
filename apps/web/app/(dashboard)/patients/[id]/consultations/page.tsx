"use client";

import { useState, useEffect, use } from "react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Skeleton,
  EmptyState,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { FileText, Calendar } from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";
import { apiFetch } from "@/lib/api";

interface Consultation {
  id: string;
  status: "draft" | "finalized" | "amended";
  startedAt: string;
  completedAt?: string | null;
  chiefComplaint?: string | null;
  createdAt: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

function statusVariant(
  status: Consultation["status"],
): "default" | "success" | "warning" | "neutral" {
  if (status === "finalized") return "success";
  if (status === "amended") return "warning";
  return "neutral";
}

function statusLabel(status: Consultation["status"]): string {
  return { draft: "Borrador", finalized: "Finalizada", amended: "Modificada" }[
    status
  ];
}

export default function ConsultationListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSafePageTitle("Consultas");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch(`/api/patients/${id}`).then((res) => res.json()),
      apiFetch(`/api/consultations?patientId=${id}`).then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      }),
    ])
      .then(([p, c]) => {
        setPatient(p.data);
        setConsultations(c.data);
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
          Debes iniciar sesión para ver las consultas.
        </p>
      </main>
    );
  }

  const displayName = patient ? `${patient.firstName} ${patient.lastName}` : "";

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold text-primary">
          Consultas{displayName ? ` de ${displayName}` : ""}
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
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-danger">Error: {error}</p>
      ) : consultations.length === 0 ? (
        <EmptyState
          title="Sin consultas"
          description="Aún no hay consultas registradas para este paciente."
          icon={<FileText className="h-10 w-10" />}
          actionLabel="Crear primera consulta"
          onAction={() =>
            router.push(`/patients/${id}/consultations/new`)
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {consultations.map((c) => (
            <Card
              key={c.id}
              variant="interactive"
              className="motion-card group"
              onClick={() =>
                router.push(`/patients/${id}/consultations/${c.id}`)
              }
            >
              <CardHeader className="flex flex-row items-start justify-between pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <CardTitle className="text-h3">
                      {new Date(c.startedAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </CardTitle>
                    <Badge
                      variant={statusVariant(c.status)}
                      className="text-xs"
                    >
                      {statusLabel(c.status)}
                    </Badge>
                  </div>
                </div>
                <Calendar className="h-4 w-4 text-muted" />
              </CardHeader>
              {c.chiefComplaint && (
                <CardContent>
                  <p className="line-clamp-2 text-small text-muted">
                    {c.chiefComplaint}
                  </p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
