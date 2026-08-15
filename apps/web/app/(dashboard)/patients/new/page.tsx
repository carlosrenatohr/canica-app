"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import {
  formatFormError,
} from "@/components/forms/form-field";
import {
  PatientForm,
  type PatientFormValues,
} from "@/components/forms/patient-form";

export default function NewPatientPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!session) {
    return (
      <main className="p-8">
        <p>Debes iniciar sesión para crear un paciente.</p>
      </main>
    );
  }

  const handleSubmit = async (form: PatientFormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiFetch("/api/patients", {
        method: "POST",
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
      router.push("/patients");
    } catch {
      setError(formatFormError());
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="p-6 sm:p-8">
      <PatientForm
        title="Nuevo paciente"
        description="Registra los datos de identificación y contacto necesarios para la atención."
        submitLabel="Guardar paciente"
        submittingLabel="Guardando…"
        submitting={submitting}
        serverError={error}
        onSubmit={handleSubmit}
        onCancel={() => router.back()}
      />
    </main>
  );
}
