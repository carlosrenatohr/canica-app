"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    if (!session) return;
    fetch("/api/patients")
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

  const handleDelete = async (id: string) => {
    if (!confirm("¿Archivar este paciente?")) return;
    const res = await fetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
    }
  };

  if (!session) {
    return (
      <main className="p-8">
        <p>Debes iniciar sesión para ver pacientes.</p>
      </main>
    );
  }

  if (loading) return <main className="p-8">Cargando pacientes…</main>;
  if (error) return <main className="p-8">Error: {error}</main>;

  const filtered = patients.filter(
    (p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <main className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Pacientes</h1>
        <Button onClick={() => router.push("/patients/new")}>Nuevo paciente</Button>
      </div>
      <div className="mb-4">
        <Input
          placeholder="Buscar paciente…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground">
          {patients.length === 0 ? "No hay pacientes." : "Sin resultados."}
        </p>
      ) : (
        <ul className="space-y-2">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent cursor-pointer"
              onClick={() => router.push(`/patients/${p.id}`)}
            >
              <span>
                {p.firstName} {p.lastName}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {p.email ?? p.phone ?? "Sin contacto"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                >
                  Archivar
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
