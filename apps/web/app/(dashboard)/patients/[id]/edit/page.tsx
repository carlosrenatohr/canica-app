"use client";

import { useState, useEffect, use } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { formatFormError } from "@/components/forms/form-field";
import {
  PatientForm,
  type PatientFormValues,
} from "@/components/forms/patient-form";
import { Skeleton } from "@canica/ui";

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
}

export default function EditPatientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!session) return;
    apiFetch(`/api/patients/${id}`)
      .then((res) => {
        if (!res.ok) {
          const error = new Error(formatFormError(undefined, res.status));
          throw error;
        }
        return res.json();
      })
      .then((data) => {
        setPatient(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : formatFormError());
        setLoading(false);
      });
  }, [session, id]);

  const handleSubmit = async (form: PatientFormValues) => {
    if (!patient) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/patients/${patient.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: form.firstName,
          lastName: form.lastName,
          identifier: form.identifier || undefined,
          birthDate: form.birthDate || undefined,
          sex: form.sex || undefined,
          phone: form.phone || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(formatFormError(data?.error, res.status));
        return;
      }
      router.push(`/patients/${patient.id}`);
    } catch {
      setError(formatFormError());
    } finally {
      setSubmitting(false);
    }
  };

  if (!session) {
    return (
      <main>
        <p>Debes iniciar sesión para editar este paciente.</p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="space-y-5" aria-busy="true">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-[520px] w-full max-w-2xl" />
      </main>
    );
  }
  if (error) {
    return (
      <main>
        <p className="text-small text-danger" role="alert">
          {error}
        </p>
      </main>
    );
  }
  if (!patient) {
    return (
      <main>
        <p className="text-small text-muted">No se encontró el paciente.</p>
      </main>
    );
  }

  return (
    <main>
      <PatientForm
        title="Editar paciente"
        description={`Actualiza los datos de ${patient.firstName} ${patient.lastName}.`}
        initialValues={{
          firstName: patient.firstName,
          lastName: patient.lastName,
          identifier: patient.identifier ?? "",
          birthDate: patient.birthDate ?? "",
          sex: (patient.sex as PatientFormValues["sex"]) ?? "",
          phone: patient.phone ?? "",
          email: patient.email ?? "",
          address: patient.address ?? "",
        }}
        submitLabel="Guardar cambios"
        submittingLabel="Guardando…"
        submitting={submitting}
        serverError={error}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </main>
  );
}
