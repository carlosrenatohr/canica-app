"use client";

import { useState, useEffect, use } from "react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Input,
  Textarea,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSafePageTitle } from "@/hooks/usePageTitle";
import {
  FormField,
  formatFormError,
  getFieldDescribedBy,
} from "@/components/forms/form-field";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

export default function NewConsultationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [patientLoading, setPatientLoading] = useState(true);
  const [patientError, setPatientError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | null>(null);
  useSafePageTitle("Nueva consulta");
  const [form, setForm] = useState({
    startedAt: new Date().toISOString().slice(0, 16),
    chiefComplaint: "",
  });

  useEffect(() => {
    if (!session) return;
    setPatientLoading(true);
    setPatientError(null);
    apiFetch(`/api/patients/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(formatFormError(undefined, res.status));
        }
        return res.json();
      })
      .then((data) => setPatient(data.data))
      .catch((requestError) => {
        setPatientError(
          requestError instanceof Error ? requestError.message : formatFormError(),
        );
      })
      .finally(() => setPatientLoading(false));
  }, [session, id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.startedAt) {
      setFieldError("Indica la fecha y hora de la consulta.");
      return;
    }

    setLoading(true);
    setError(null);
    setFieldError(null);
    try {
      const res = await apiFetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: id,
          startedAt: form.startedAt,
          chiefComplaint: form.chiefComplaint || undefined,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(formatFormError(data?.error, res.status));
        return;
      }
      const data = await res.json();
      router.push(`/patients/${id}/consultations/${data.data.id}`);
    } catch {
      setError(formatFormError());
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para crear una consulta.</p>
      </div>
    );
  }

  if (patientLoading) {
    return (
      <div className="p-6 sm:p-8" aria-busy="true">
        <p className="text-small text-muted" role="status">
          Cargando información del paciente…
        </p>
      </div>
    );
  }

  if (patientError || !patient) {
    return (
      <div className="p-6 sm:p-8">
        <p className="text-small text-danger" role="alert">
          {patientError ?? "No se encontró el paciente."}
        </p>
      </div>
    );
  }

  const displayName = `${patient.firstName} ${patient.lastName}`;

  return (
    <div className="p-6 sm:p-8">
      <h1 className="text-h1 mb-6">
        Nueva consulta — {displayName}
      </h1>
      <form onSubmit={handleSubmit} className="w-full max-w-2xl space-y-6">
        <FormField
          id="startedAt"
          label="Fecha y hora"
          error={fieldError ?? undefined}
          required
        >
          <Input
            id="startedAt"
            type="datetime-local"
            value={form.startedAt}
            onChange={(e) => {
              setForm((f) => ({ ...f, startedAt: e.target.value }));
              setFieldError(null);
            }}
            aria-invalid={Boolean(fieldError)}
            aria-describedby={getFieldDescribedBy("startedAt", {
              error: fieldError ?? undefined,
            })}
            required
          />
        </FormField>
        <FormField
          id="chiefComplaint"
          label="Motivo principal"
          description="Opcional. Describe brevemente la razón de la visita."
        >
          <Textarea
            id="chiefComplaint"
            value={form.chiefComplaint}
            onChange={(e) =>
              setForm((f) => ({ ...f, chiefComplaint: e.target.value }))
            }
            aria-describedby={getFieldDescribedBy("chiefComplaint", {
              description: "Opcional. Describe brevemente la razón de la visita.",
            })}
            placeholder="Describe la razón de la visita…"
            rows={4}
          />
        </FormField>
        {error && (
          <p className="text-small text-danger" role="alert" aria-live="assertive">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse gap-3 sm:flex-row">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Crear consulta"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
