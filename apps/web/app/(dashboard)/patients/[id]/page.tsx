"use client";

import { useState, useEffect, use } from "react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  FileText,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSafePageTitle } from "@/hooks/usePageTitle";
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
  createdAt: string;
  updatedAt: string;
}

function ageFromBirth(birth: string | null): string | null {
  if (!birth) return null;
  const b = new Date(birth);
  if (Number.isNaN(b.getTime())) return null;
  const diff = new Date().getFullYear() - b.getFullYear();
  return `${diff} años`;
}

function PatientSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

export default function PatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useSafePageTitle("Paciente");

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
        <p className="text-muted">
          Debes iniciar sesión para ver este paciente.
        </p>
      </main>
    );
  }

  if (loading) {
    return (
      <main className="p-8">
        <PatientSkeleton />
      </main>
    );
  }
  if (error) {
    return (
      <main className="p-8">
        <p className="text-danger">Error: {error}</p>
      </main>
    );
  }
  if (!patient) {
    return (
      <main className="p-8">
        <p className="text-muted-foreground">Paciente no encontrado.</p>
      </main>
    );
  }

  const age = ageFromBirth(patient.birthDate);
  const tabs = [
    {
      id: "summary",
      label: "Resumen",
      icon: FileText,
      path: `/patients/${patient.id}`,
    },
    {
      id: "timeline",
      label: "Timeline",
      icon: Clock,
      path: `/patients/${patient.id}/timeline`,
    },
    {
      id: "consultations",
      label: "Consultas",
      icon: FileText,
      path: `/patients/${patient.id}/consultations`,
    },
  ];
  const activeTab = tabs.find((t) => pathname === t.path)?.id ?? "summary";

  return (
    <main className="min-w-0">
      {/* Sticky patient header (always visible per VP0/MediFlow insights) */}
      <section className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b">
        <div className="flex items-center gap-4 p-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10 text-secondary">
            <User className="h-8 w-8" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h1 className="text-display font-semibold text-primary">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-small text-muted">
              {age && <span>{age}</span>}
              {age && patient.sex && " · "}
              {patient.sex}
              {patient.identifier && (
                <>
                  {" · "}
                  <span>ID: {patient.identifier}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Tabs for progressive disclosure (DS principle #1: calm before information) */}
        <nav className="flex items-center gap-6 overflow-x-auto px-6 text-small">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.path)}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap border-b-2 px-1 py-3 font-medium transition-colors",
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-muted hover:text-primary",
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </section>

      {/* Summary tab content (default view) */}
      <div className="p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Medical summary card - prominent per DS principle #4 */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Resumen clínico</CardTitle>
              <CardDescription>Información clave del paciente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-start gap-3">
                  <Calendar className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <dt className="text-xs text-muted">Nacimiento</dt>
                    <dd>
                      {patient.birthDate
                        ? new Date(patient.birthDate).toLocaleDateString(
                            "es-ES",
                          )
                        : "—"}
                    </dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 h-4 w-4 text-muted" />
                  <div>
                    <dt className="text-xs text-muted">Sexo</dt>
                    <dd>{patient.sex ?? "—"}</dd>
                  </div>
                </div>
                {patient.identifier && (
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 h-4 w-4 text-muted" />
                    <div>
                      <dt className="text-xs text-muted">Identificación</dt>
                      <dd>{patient.identifier}</dd>
                    </div>
                  </div>
                )}
              </dl>
              <div className="border-t pt-3">
                <p className="text-xs text-muted">Alergias</p>
                <p className="text-small text-muted">
                  No disponible en los datos actuales.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact info card */}
          <Card>
            <CardHeader>
              <CardTitle>Contacto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {patient.phone && (
                <div className="flex items-center gap-2 text-small">
                  <Phone className="h-4 w-4 text-muted" />
                  <span>{patient.phone}</span>
                </div>
              )}
              {patient.email && (
                <div className="flex items-center gap-2 text-small">
                  <Mail className="h-4 w-4 text-muted" />
                  <span className="truncate">{patient.email}</span>
                </div>
              )}
              {patient.address && (
                <div className="flex items-start gap-2 text-small">
                  <MapPin className="mt-0.5 h-4 w-4 text-muted" />
                  <span>{patient.address}</span>
                </div>
              )}
              {!patient.phone && !patient.email && !patient.address && (
                <p className="text-small text-muted">Sin contacto registrado</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Audit info (DS principle: metadata last) */}
        <Card className="mt-6">
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-4 text-xs text-muted">
              <span>
                Creado: {new Date(patient.createdAt).toLocaleString("es-ES")}
              </span>
              <span>
                Actualizado:{" "}
                {new Date(patient.updatedAt).toLocaleString("es-ES")}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Actions (primary action prominent per DS principle #4) */}
        <div className="mt-6 flex gap-2">
          <Button onClick={() => router.push(`/patients/${patient.id}/edit`)}>
            Editar paciente
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              if (!confirm("¿Archivar este paciente?")) return;
              const res = await apiFetch(`/api/patients/${patient.id}`, {
                method: "DELETE",
              });
              if (res.ok) router.push("/patients");
            }}
          >
            Archivar
          </Button>
        </div>
      </div>
    </main>
  );
}
