"use client";

import { useState, useEffect } from "react";
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
import { FileText, Calendar, User } from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";

interface Consultation {
  id: string;
  patientId: string;
  status: "draft" | "finalized" | "amended";
  startedAt: string;
  chiefComplaint?: string | null;
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
  return (
    { draft: "Borrador", finalized: "Finalizada", amended: "Modificada" }[
      status
    ] ?? status
  );
}

const PAGE_SIZE = 20;

export default function ConsultationsListPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [patients, setPatients] = useState<Record<string, Patient>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSafePageTitle("Consultas");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    apiFetch(`/api/consultations?limit=${PAGE_SIZE}&offset=${offset}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((result) => {
        setConsultations(result.data ?? []);
        setTotal(result.total ?? 0);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, page]);

  useEffect(() => {
    if (!session || consultations.length === 0) return;
    const uniquePatientIds = [
      ...new Set(consultations.map((c) => c.patientId)),
    ];
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
  }, [session, consultations]);

  if (!session) {
    return (
      <main>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver las consultas.
        </p>
      </main>
    );
  }

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
            <CardTitle>Error al cargar las consultas</CardTitle>
            <p className="text-small text-muted">{error}</p>
            <Button variant="outline" size="sm" className="mt-2 w-fit" onClick={() => window.location.reload()}>
              Reintentar
            </Button>
          </CardHeader>
        </Card>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold text-primary">Consultas</h1>
      </div>

      {consultations.length === 0 ? (
        <EmptyState
          title="Sin consultas"
          description="Aún no hay consultas registradas en el sistema."
          icon={<FileText className="h-10 w-10" />}
        />
      ) : (
        <>
          <div className="space-y-3">
            {consultations.map((c) => {
              const patient = patients[c.patientId];
              return (
                <Card
                  key={c.id}
                  variant="interactive"
                  className="motion-card"
                  onClick={() =>
                    router.push(`/patients/${c.patientId}/consultations/${c.id}`)
                  }
                >
                  <CardHeader className="flex flex-row items-center gap-4 pb-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <CardTitle className="text-h3">
                        {patient
                          ? `${patient.firstName} ${patient.lastName}`
                          : "Paciente"}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-small text-muted">
                        <Calendar className="h-3 w-3" />
                        <time dateTime={c.startedAt}>
                          {new Date(c.startedAt).toLocaleDateString("es-ES", {
                            year: "numeric",
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </time>
                      </div>
                    </div>
                    <Badge variant={statusVariant(c.status)} className="text-xs">
                      {statusLabel(c.status)}
                    </Badge>
                  </CardHeader>
                  {c.chiefComplaint && (
                    <CardContent>
                      <p className="line-clamp-2 text-small text-muted">
                        {c.chiefComplaint}
                      </p>
                    </CardContent>
                  )}
                </Card>
              );
            })}
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
