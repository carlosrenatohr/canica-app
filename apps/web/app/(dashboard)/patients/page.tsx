"use client";

import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import {
  Button,
  Input,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  EmptyState,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { User, Calendar, Phone } from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  sex: string | null;
}

export default function PatientsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  useSafePageTitle("Pacientes");

  useEffect(() => {
    if (!session) return;
    apiFetch("/api/patients")
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setPatients(data.data ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Archivar a ${name}?`)) return;
    const res = await apiFetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (!session) {
    return (
      <main className="p-8">
        <p className="text-muted">Debes iniciar sesión para ver pacientes.</p>
      </main>
    );
  }

  const filtered = patients.filter((p) =>
    `${p.firstName} ${p.lastName}`.toLowerCase().includes(filter.toLowerCase()),
  );

  return (
    <main className="p-8 space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold text-primary">Pacientes</h1>
        <Button variant="primary" onClick={() => router.push("/patients/new")}>
          Nuevo paciente
        </Button>
      </div>

      <Input
        placeholder="Buscar paciente…"
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="max-w-md"
        aria-label="Filtrar pacientes por nombre"
      />

      {loading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-danger">Error: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title={patients.length === 0 ? "Sin pacientes" : "Sin resultados"}
          description={
            patients.length === 0
              ? "Aún no tenés pacientes registrados."
              : "No se encontraron pacientes con ese nombre."
          }
          actionLabel={patients.length === 0 ? "Agregar paciente" : undefined}
          onAction={
            patients.length === 0
              ? () => router.push("/patients/new")
              : undefined
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Card
              key={p.id}
              variant="interactive"
              className="motion-card group"
              onClick={() => router.push(`/patients/${p.id}`)}
            >
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <User className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="space-y-1">
                  <CardTitle className="text-h3">
                    {p.firstName} {p.lastName}
                  </CardTitle>
                  <CardDescription>
                    {p.birthDate
                      ? new Date(p.birthDate).getFullYear()
                        ? `${new Date().getFullYear() - new Date(p.birthDate).getFullYear()} años`
                        : ""
                      : ""}
                    {p.sex && p.birthDate && " · "}
                    {p.sex}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent className="flex items-center gap-4 pt-0 text-small text-muted">
                {p.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" aria-hidden="true" /> {p.phone}
                  </span>
                )}
                {p.email && <span className="truncate">{p.email}</span>}
                <Calendar className="ml-auto h-3 w-3" aria-hidden="true" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
