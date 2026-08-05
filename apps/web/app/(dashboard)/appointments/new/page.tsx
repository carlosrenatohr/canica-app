"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  archived: boolean;
}

export default function NewAppointmentPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    patientId: "",
    startDate: new Date().toISOString().slice(0, 16),
    endDate: "",
    reason: "",
    notes: "",
  });

  useEffect(() => {
    if (!session) return;
    fetch("/api/patients")
      .then((r) => r.json())
      .then((data) => setPatients(data.data.filter((p: Patient) => !p.archived)))
      .catch(() => {});
  }, [session]);

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para crear una cita.</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        patientId: form.patientId,
        providerId: session?.user?.id,
        startDate: form.startDate,
        endDate: form.endDate || undefined,
        reason: form.reason || undefined,
        notes: form.notes || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    router.push("/appointments");
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Nueva cita</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="patientId">Paciente *</Label>
          <select
            id="patientId"
            value={form.patientId}
            onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            required
          >
            <option value="">Seleccionar paciente</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.firstName} {p.lastName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="startDate">Fecha y hora de inicio *</Label>
          <Input
            id="startDate"
            type="datetime-local"
            value={form.startDate}
            onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="endDate">Fecha y hora de fin</Label>
          <Input
            id="endDate"
            type="datetime-local"
            value={form.endDate}
            onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="reason">Razón</Label>
          <Input
            id="reason"
            value={form.reason}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            placeholder="Motivo de la consulta"
          />
        </div>
        <div>
          <Label htmlFor="notes">Notas</Label>
          <textarea
            id="notes"
            value={form.notes}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setForm((f) => ({ ...f, notes: e.target.value }))
            }
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            rows={3}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Crear cita"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </div>
  );
}
