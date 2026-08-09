"use client";

import { useState, useEffect, use } from "react";
import {
  Button,
  Input,
  Label,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

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
  }, [session, id]);

  if (!session) {
    return (
      <main className="p-8">
        <p>Debes iniciar sesión para editar este paciente.</p>
      </main>
    );
  }

  if (loading) return <main className="p-8">Cargando paciente…</main>;
  if (error) return <main className="p-8">Error: {error}</main>;
  if (!patient) return <main className="p-8">Paciente no encontrado.</main>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
      const res = await apiFetch(`/api/patients/${patient.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: patient.firstName,
        lastName: patient.lastName,
        identifier: patient.identifier || undefined,
        birthDate: patient.birthDate || undefined,
        sex: patient.sex || undefined,
        phone: patient.phone || undefined,
        email: patient.email || undefined,
        address: patient.address || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? `HTTP ${res.status}`);
      setSubmitting(false);
      return;
    }
    router.push(`/patients/${patient.id}`);
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Editar paciente</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={patient.firstName}
            onChange={(e) => setPatient((p) => ({ ...p!, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={patient.lastName}
            onChange={(e) => setPatient((p) => ({ ...p!, lastName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="identifier">Identificación</Label>
          <Input
            id="identifier"
            value={patient.identifier ?? ""}
            onChange={(e) => setPatient((p) => ({ ...p!, identifier: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input
            id="birthDate"
            type="date"
            value={patient.birthDate ?? ""}
            onChange={(e) => setPatient((p) => ({ ...p!, birthDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="sex">Sexo</Label>
          <select
            id="sex"
            value={patient.sex ?? ""}
            onChange={(e) => setPatient((p) => ({ ...p!, sex: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="unspecified">No especificado</option>
          </select>
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={patient.phone ?? ""}
            onChange={(e) => setPatient((p) => ({ ...p!, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            value={patient.email ?? ""}
            onChange={(e) => setPatient((p) => ({ ...p!, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={patient.address ?? ""}
            onChange={(e) => setPatient((p) => ({ ...p!, address: e.target.value }))}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={submitting}>
            {submitting ? "Guardando…" : "Guardar cambios"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}
