"use client";

import { useState, useEffect, use } from "react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Input,
  Label,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useSafePageTitle } from "@/hooks/usePageTitle";

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
  useSafePageTitle("Nueva consulta");
  const [form, setForm] = useState({
    startedAt: new Date().toISOString().slice(0, 16),
    chiefComplaint: "",
  });

  useEffect(() => {
    if (!session) return;
    apiFetch(`/api/patients/${id}`)
      .then((res) => res.json())
      .then((data) => setPatient(data.data))
      .catch(() => {});
  }, [session, id]);

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para crear una consulta.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
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
      setError(data?.error ?? `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    const data = await res.json();
    router.push(`/patients/${id}/consultations/${data.data.id}`);
  };

  const displayName = patient
    ? `${patient.firstName} ${patient.lastName}`
    : id;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">
        Nueva consulta — {displayName}
      </h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="startedAt">Fecha y hora *</Label>
          <Input
            id="startedAt"
            type="datetime-local"
            value={form.startedAt}
            onChange={(e) =>
              setForm((f) => ({ ...f, startedAt: e.target.value }))
            }
            required
          />
        </div>
        <div>
          <Label htmlFor="chiefComplaint">Queja principal</Label>
          <textarea
            id="chiefComplaint"
            value={form.chiefComplaint}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setForm((f) => ({ ...f, chiefComplaint: e.target.value }))
            }
            placeholder="Describe la razón de la visita..."
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Crear consulta"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
