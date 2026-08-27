"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  Pagination,
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

const PAGE_SIZE = 20;
const DEBOUNCE_MS = 300;

export default function PatientsPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [patients, setPatients] = useState<Patient[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const [debouncedFilter, setDebouncedFilter] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useSafePageTitle("Pacientes");

  const handleFilterChange = useCallback((value: string) => {
    setFilter(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedFilter(value);
      setPage(1);
    }, DEBOUNCE_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const offset = (page - 1) * PAGE_SIZE;
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
    if (debouncedFilter) params.set("search", debouncedFilter);
    apiFetch(`/api/patients?${params}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((result) => {
        setPatients(result.data ?? []);
        setTotal(result.total ?? 0);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, page, debouncedFilter]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Archivar a ${name}?`)) return;
    const res = await apiFetch(`/api/patients/${id}`, { method: "DELETE" });
    if (res.ok) {
      setPatients((prev) => prev.filter((p) => p.id !== id));
      setTotal((prev) => prev - 1);
    }
  };

  if (!session) {
    return (
      <main>
        <p className="text-muted">Debes iniciar sesión para ver pacientes.</p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-display font-semibold text-primary">Pacientes</h1>
        <Button variant="primary" onClick={() => router.push("/patients/new")}>
          Nuevo paciente
        </Button>
      </div>

      <Input
        placeholder="Buscar paciente…"
        value={filter}
        onChange={(e) => handleFilterChange(e.target.value)}
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
        <Card>
          <CardContent className="flex items-center justify-between p-4">
            <p className="text-small text-danger">{error}</p>
            <Button variant="outline" size="sm" onClick={() => { setError(null); setLoading(true); setPage(1); }}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      ) : patients.length === 0 ? (
        <EmptyState
          title={debouncedFilter ? "Sin resultados" : "Sin pacientes"}
          description={
            debouncedFilter
              ? "No se encontraron pacientes con ese nombre."
              : "Aún no tenés pacientes registrados."
          }
          actionLabel={debouncedFilter ? undefined : "Agregar paciente"}
          onAction={
            debouncedFilter
              ? undefined
              : () => router.push("/patients/new")
          }
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {patients.map((p) => (
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
          <Pagination
            current={page}
            total={total}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </>
      )}
    </main>
  );
}
