"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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

export default function ConsultationListPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/patients/${params.id}`)
      .then((res) => res.json())
      .then((data) => setPatient(data.data))
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
    fetch(`/api/consultations?patientId=${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setConsultations(data.data);
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
        <p>Debes iniciar sesión para ver las consultas.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Cargando consultas…</div>;
  if (error) return <div className="p-8">Error: {error}</div>;

  const displayName = patient ? `${patient.firstName} ${patient.lastName}` : "";

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          Consultas{displayName ? ` de ${displayName}` : ""}
        </h1>
        <Button onClick={() => router.push(`/patients/${params.id}/consultations/new`)}>
          Nueva consulta
        </Button>
      </div>
      {consultations.length === 0 ? (
        <p className="text-muted-foreground">No hay consultas registradas.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2">Fecha</th>
              <th className="text-left py-2">Estado</th>
              <th className="text-left py-2">Queja principal</th>
              <th className="text-left py-2">Creado</th>
            </tr>
          </thead>
          <tbody>
            {consultations.map((c) => (
              <tr key={c.id} className="border-t">
                <td className="py-2">
                  <Link href={`/patients/${params.id}/consultations/${c.id}`} className="text-blue-600 hover:underline">
                    {new Date(c.startedAt).toLocaleDateString("es-ES")}
                  </Link>
                </td>
                <td className="py-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    c.status === "finalized"
                      ? "bg-green-100 text-green-800"
                      : c.status === "amended"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-2">{c.chiefComplaint || "-"}</td>
                <td className="py-2 text-sm text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("es-ES")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
