"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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

export default function ConsultationDetailPage({
  params,
}: {
  params: { id: string; consultationId: string };
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [consultation, setConsultation] = useState<Consultation | null>(null);
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"diagnoses" | "prescriptions">("diagnoses");

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch(`/api/consultations/${params.consultationId}`).then((r) => r.json()),
      fetch(`/api/consultations/${params.consultationId}/diagnoses`).then((r) => r.json()),
      fetch(`/api/consultations/${params.consultationId}/prescriptions`).then((r) => r.json()),
    ])
      .then(([c, d, p]) => {
        setConsultation(c.data);
        setDiagnoses(d.data);
        setPrescriptions(p.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, params.consultationId]);

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para ver esta consulta.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Cargando consulta…</div>;
  if (error) return <div className="p-8">Error: {error}</div>;
  if (!consultation) return <div className="p-8">Consulta no encontrada.</div>;

  const statusLabel = {
    draft: "Borrador",
    finalized: "Finalizada",
    amended: "Modificada",
  }[consultation.status];

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Consulta del {new Date(consultation.startedAt).toLocaleDateString("es-ES")}</h1>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded text-xs ${
            consultation.status === "finalized"
              ? "bg-green-100 text-green-800"
              : consultation.status === "amended"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-gray-100 text-gray-800"
          }`}>
            {statusLabel}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              const res = await fetch(`/api/consultations/${params.consultationId}/export/pdf`, {
                headers: { Accept: "application/pdf" },
              });
              if (!res.ok) {
                alert("Error generando PDF");
                return;
              }
              const blob = await res.blob();
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `consulta-${params.consultationId}.pdf`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              window.URL.revokeObjectURL(url);
            }}
          >
            Descargar PDF
          </Button>
          <Button variant="outline" size="sm" onClick={() => router.push(`/patients/${params.id}/consultations`)}>
            Volver
          </Button>
        </div>
      </div>

      <div className="space-y-6 mb-8">
        {consultation.chiefComplaint && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Queja principal</dt>
            <dd>{consultation.chiefComplaint}</dd>
          </>
        )}
        {consultation.history && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Examen</dt>
            <dd>{consultation.history}</dd>
          </>
        )}
        {consultation.exam && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Evolución</dt>
            <dd>{consultation.exam}</dd>
          </>
        )}
        {consultation.assessment && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Evaluación</dt>
            <dd>{consultation.assessment}</dd>
          </>
        )}
        {consultation.plan && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Plan</dt>
            <dd>{consultation.plan}</dd>
          </>
        )}
      </div>

      <div>
        <div className="flex gap-4 border-b mb-4">
          <button
            onClick={() => setActiveTab("diagnoses")}
            className={`pb-2 px-1 ${activeTab === "diagnoses" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground"}`}
          >
            Diagnósticos ({diagnoses.length})
          </button>
          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`pb-2 px-1 ${activeTab === "prescriptions" ? "border-b-2 border-blue-600 text-blue-600" : "text-muted-foreground"}`}
          >
            Prescripciones ({prescriptions.length})
          </button>
        </div>

        {activeTab === "diagnoses" && (
          <div>
            {diagnoses.length === 0 ? (
              <p className="text-muted-foreground">No hay diagnósticos.</p>
            ) : (
              <ul className="space-y-3">
                {diagnoses.map((d) => (
                  <li key={d.id} className="border rounded p-3">
                    <div className="flex justify-between">
                      <strong>{d.description}</strong>
                      <span className={`text-xs px-2 py-1 rounded ${
                        d.status === "active" ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                      }`}>
                        {d.status === "active" ? "Activo" : d.status}
                      </span>
                    </div>
                    {d.primary && <span className="text-xs text-muted-foreground">Principal</span>}
                    {(d.codingSystem || d.code) && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {d.codingSystem} {d.code}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {activeTab === "prescriptions" && (
          <div>
            {prescriptions.length === 0 ? (
              <p className="text-muted-foreground">No hay prescripciones.</p>
            ) : (
              <ul className="space-y-3">
                {prescriptions.map((p) => (
                  <li key={p.id} className="border rounded p-3">
                    <strong>{p.medicationName} {p.strength} {p.form}</strong>
                    <p className="text-sm mt-1">
                      Dosis: {p.dose} | Ruta: {p.route} | Frecuencia: {p.frequency} | Duración: {p.duration}
                    </p>
                    {p.instructions && <p className="text-sm text-muted-foreground mt-1">Indicaciones: {p.instructions}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
