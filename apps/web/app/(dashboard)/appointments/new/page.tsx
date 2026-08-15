"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Input,
  Label,
  Textarea,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";

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

  useSafePageTitle("Nueva cita");

  useEffect(() => {
    if (!session) return;
      apiFetch("/api/patients")
      .then((r) => r.json())
      .then((data) =>
        setPatients(data.data.filter((p: Patient) => !p.archived)),
      )
      .catch(() => {});
  }, [session]);

  if (!session) {
    return (
      <main>
        <p className="text-muted-foreground">
          Debes iniciar sesión para crear una cita.
        </p>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await apiFetch("/api/appointments", {
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
      setError(data?.error ?? `Error ${res.status}`);
      setLoading(false);
      return;
    }
    router.push("/appointments");
  };

  return (
    <main className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
          <CalendarPlus className="h-5 w-5" />
        </div>
        <h1 className="text-display font-semibold text-primary">Nueva cita</h1>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1">
              <Label htmlFor="patientId" className="text-small font-medium">
                Paciente *
              </Label>
              <select
                id="patientId"
                value={form.patientId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, patientId: e.target.value }))
                }
                className="w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 py-2 text-body text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-1">
                <Label htmlFor="startDate" className="text-small font-medium">
                  Inicio *
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, startDate: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate" className="text-small font-medium">
                  Fin
                </Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, endDate: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="reason" className="text-small font-medium">
                Razón
              </Label>
              <Input
                id="reason"
                value={form.reason}
                onChange={(e) =>
                  setForm((f) => ({ ...f, reason: e.target.value }))
                }
                placeholder="Motivo de la consulta"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="notes" className="text-small font-medium">
                Notas
              </Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, notes: e.target.value }))
                }
                placeholder="Notas adicionales…"
                rows={3}
              />
            </div>

            {error && <p className="text-small text-danger">{error}</p>}

            <div className="flex gap-2 pt-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Guardando…" : "Crear cita"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
