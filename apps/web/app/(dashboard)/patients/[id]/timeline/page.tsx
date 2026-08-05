"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

const typeLabels: Record<TimelineEntry["type"], string> = {
  consultation: "Consulta",
  diagnosis: "Diagnóstico",
  prescription: "Prescripción",
  attachment: "Documento",
};

const typeIcons: Record<TimelineEntry["type"], string> = {
  consultation: "🩺",
  diagnosis: "🔍",
  prescription: "💊",
  attachment: "📎",
};

export default function TimelinePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [entries, setEntries] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    Promise.all([
      fetch(`/api/patients/${params.id}`).then((r) => r.json()),
      fetch(`/api/patients/${params.id}/timeline`).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      }),
    ])
      .then(([p, t]) => {
        setPatient(p.data);
        setEntries(t.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, params.id]);

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para ver el historial clínico.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Cargando historial…</div>;
  if (error) return <div className="p-8">Error: {error}</div>;

  const displayName = patient ? `${patient.firstName} ${patient.lastName}` : "";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Historial clínico{displayName ? ` de ${displayName}` : ""}
        </h1>
        <Button onClick={() => router.push(`/patients/${params.id}/consultations/new`)}>
          Nueva consulta
        </Button>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground">No hay actividad clínica registrada.</p>
      ) : (
        <ul className="space-y-4">
          {entries.map((entry) => (
            <li key={`${entry.type}-${entry.id}`} className="border rounded-lg p-4 hover:bg-gray-50">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{typeIcons[entry.type]}</span>
                <div className="flex-1">
                  <div className="flex justify-between">
                    <strong className="font-medium">{entry.title || typeLabels[entry.type]}</strong>
                    <time className="text-sm text-muted-foreground">
                      {new Date(entry.createdAt).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </time>
                  </div>
                  {entry.subtitle && (
                    <p className="text-sm text-muted-foreground">{entry.subtitle}</p>
                  )}
                  {entry.type === "consultation" && typeof entry.metadata?.status === "string" && (
                    <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                      entry.metadata.status === "finalized"
                        ? "bg-green-100 text-green-800"
                        : entry.metadata.status === "amended"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {entry.metadata.status}
                    </span>
                  )}
                </div>
              </div>
              {entry.type === "consultation" && (
                <Link
                  href={`/patients/${params.id}/consultations/${entry.id}`}
                  className="text-sm text-blue-600 hover:underline mt-2 block"
                >
                  Ver consulta →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
