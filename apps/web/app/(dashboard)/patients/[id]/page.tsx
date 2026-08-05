"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  identifier: string | null;
  birthDate: string | null;
  sex: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function PatientDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    fetch(`/api/patients/${params.id}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPatient(data.data);
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
        <p>Debes iniciar sesión para ver este paciente.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Cargando paciente…</div>;
  if (error) return <div className="p-8">Error: {error}</div>;
  if (!patient) return <div className="p-8">Paciente no encontrado.</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">
          {patient.firstName} {patient.lastName}
        </h1>
        <div className="flex gap-2">
          <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
            Editar
          </Button>
          <Button
            variant="destructive"
            onClick={async () => {
              if (!confirm("¿Archivar este paciente?")) return;
              const res = await fetch(`/api/patients/${patient.id}`, {
                method: "DELETE",
              });
              if (res.ok) router.push("/patients");
            }}
          >
            Archivar
          </Button>
        </div>
      </div>
      <dl className="space-y-2">
        {patient.identifier && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Identificación</dt>
            <dd>{patient.identifier}</dd>
          </>
        )}
        {patient.birthDate && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Fecha de nacimiento</dt>
            <dd>{new Date(patient.birthDate).toLocaleDateString("es-ES")}</dd>
          </>
        )}
        {patient.sex && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Sexo</dt>
            <dd>{patient.sex}</dd>
          </>
        )}
        {patient.phone && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Teléfono</dt>
            <dd>{patient.phone}</dd>
          </>
        )}
        {patient.email && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Correo</dt>
            <dd>{patient.email}</dd>
          </>
        )}
        {patient.address && (
          <>
            <dt className="text-sm font-medium text-muted-foreground">Dirección</dt>
            <dd>{patient.address}</dd>
          </>
        )}
        <dt className="text-sm font-medium text-muted-foreground">Creado</dt>
        <dd>{new Date(patient.createdAt).toLocaleString("es-ES")}</dd>
        <dt className="text-sm font-medium text-muted-foreground">Actualizado</dt>
        <dd>{new Date(patient.updatedAt).toLocaleString("es-ES")}</dd>
      </dl>
    </div>
  );
}