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
  CardFooter,
  Skeleton,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { Download, FileText } from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";
import { apiFetch } from "@/lib/api";

interface Consultation {
  id: string;
  status: "draft" | "finalized" | "amended";
  startedAt: string;
  completedAt?: string | null;
  chiefComplaint?: string | null;
  history?: string | null;
  exam?: string | null;
  assessment?: string | null;
  plan?: string | null;
  createdAt: string;
  updatedAt: string;
  patientId: string;
}

interface Diagnosis {
  id: string;
  primary: boolean;
  status: "active" | "resolved" | "ruled-out";
  description: string;
  codingSystem?: string | null;
  code?: string | null;
  createdAt: string;
}

interface Prescription {
  id: string;
  medicationName: string;
  strength: string;
  form: string;
  dose: string;
  route: "oral" | "iv" | "subcutaneous" | "topical" | "inhalation" | "other";
  frequency: string;
  duration: string;
  instructions?: string | null;
  status: "active" | "cancelled" | "completed";
  createdAt: string;
}

function statusVariant(
  status: Consultation["status"],
): "success" | "warning" | "neutral" {
  if (status === "finalized") return "success";
  if (status === "amended") return "warning";
  return "neutral";
}

function statusLabel(status: Consultation["status"]): string {
  return { draft: "Borrador", finalized: "Finalizada", amended: "Modificada" }[
    status
  ];
}

function Section({
  label,
  children,
}: {
  label: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      <p className="text-xs font-semibold text-muted">{label}</p>
      {children ? (
        <p className="mt-1 text-small leading-relaxed">{children}</p>
      ) : (
        <p className="mt-1 text-small text-muted">Sin registrar</p>
      )}
    </div>
  );
}

export default function ConsultationDetailPage({
  params,
}: {
  params: Promise<{ id: string; consultationId: string }>;
}) {
  const { id, consultationId } = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);

  useSafePageTitle("Consulta");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      apiFetch(`/api/consultations/${consultationId}`).then((r) =>
        r.json(),
      ),
      apiFetch(`/api/consultations/${consultationId}/diagnoses`).then((r) =>
        r.json(),
      ),
      apiFetch(`/api/consultations/${consultationId}/prescriptions`).then(
        (r) => r.json(),
      ),
    ])
      .then(([c, d, p]) => {
        setConsultation(c.data);
        setDiagnoses(d.data);
        setPrescriptions(p.data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, consultationId]);

  if (!session) {
    return (
      <main>
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver esta consulta.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main>
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      </main>
    );
  }
  if (error) {
    return (
      <main>
        <p className="text-danger">Error: {error}</p>
      </main>
    );
  }
  if (!consultation) {
    return (
      <main>
        <p className="text-muted-foreground">Consulta no encontrada.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      {/* Consultation header with primary action prominent (DS principle #4) */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <FileText className="h-5 w-5" />
          </div>
          <h1 className="text-display font-semibold text-primary">
            Consulta del{" "}
            {new Date(consultation.startedAt).toLocaleDateString("es-ES", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </h1>
          <Badge variant={statusVariant(consultation.status)}>
            {statusLabel(consultation.status)}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await apiFetch(
                `/api/consultations/${consultationId}/export/pdf`,
                {
                  headers: { Accept: "application/pdf" },
                },
              );
              if (!res.ok) {
                setPdfError("Error generando PDF. Inténtalo de nuevo.");
                return;
              }
              setPdfError(null);
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `consulta-${consultationId}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
          >
            <Download className="h-4 w-4" />
            <span className="ml-1">Descargar PDF</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push(`/patients/${id}/consultations`)}
          >
            Volver
          </Button>
        </div>
        {pdfError ? (
          <p role="alert" className="mt-2 text-small text-danger">
            {pdfError}
          </p>
        ) : null}
      </div>

      {/* Progressive disclosure: queja → historia → examen → evaluación → plan (DS insight: ClyHealth) */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de la consulta</CardTitle>
          <CardDescription>
            Registro clínico completo de la visita.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Section label="Queja principal">
            {consultation.chiefComplaint || undefined}
          </Section>
          <Section label="Historia clínica">
            {consultation.history || undefined}
          </Section>
          <Section label="Examen">{consultation.exam || undefined}</Section>
          <Section label="Evaluación / Diagnóstico">
            {consultation.assessment || undefined}
          </Section>
          <Section label="Plan">{consultation.plan || undefined}</Section>
        </CardContent>
      </Card>

      {/* Tabbed sub-resources (diagnoses / prescriptions) per DS principle #1 progressive disclosure */}
      <Tabs defaultValue="diagnoses" className="w-full">
        <TabsList>
          <TabsTrigger value="diagnoses">
            Diagnósticos ({diagnoses.length})
          </TabsTrigger>
          <TabsTrigger value="prescriptions">
            Prescripciones ({prescriptions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="diagnoses" className="mt-4">
          {diagnoses.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No hay diagnósticos registados.
            </p>
          ) : (
            <ul className="space-y-3">
              {diagnoses.map((d) => (
                <Card key={d.id} variant="default">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{d.description}</p>
                        {d.primary && (
                          <Badge variant="neutral" className="text-xs">
                            Principal
                          </Badge>
                        )}
                        {(d.codingSystem || d.code) && (
                          <p className="text-xs text-muted-foreground">
                            {d.codingSystem} {d.code}
                          </p>
                        )}
                      </div>
                      <Badge
                        variant={d.status === "active" ? "success" : "neutral"}
                        className="text-xs"
                      >
                        {d.status === "active" ? "Activo" : d.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="prescriptions" className="mt-4">
          {prescriptions.length === 0 ? (
            <p className="text-small text-muted-foreground">
              No hay prescripciones registradas.
            </p>
          ) : (
            <ul className="space-y-3">
              {prescriptions.map((p) => (
                <Card key={p.id} variant="default">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-h3">
                      {p.medicationName} {p.strength} {p.form}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-1">
                    <p className="text-small">
                      Dosis: {p.dose} · Ruta: {p.route} · Frecuencia:{" "}
                      {p.frequency} · Duración: {p.duration}
                    </p>
                    {p.instructions && (
                      <p className="text-small text-muted-foreground">
                        Indicaciones: {p.instructions}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="p-4 pt-0">
                    <Badge
                      variant={p.status === "active" ? "success" : "neutral"}
                      className="text-xs"
                    >
                      {p.status}
                    </Badge>
                  </CardFooter>
                </Card>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
}
