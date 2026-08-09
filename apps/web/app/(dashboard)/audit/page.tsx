"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Input,
  Label,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  EmptyState,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import {
  Search,
  Trash2,
  Upload,
  FileText,
  Shield,
  Edit,
  Clock,
} from "lucide-react";
import { useSafePageTitle } from "@/hooks/usePageTitle";
import { apiFetch } from "@/lib/api";

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  summary?: string | null;
  ip?: string | null;
  createdAt: string;
}

const actionIcons: Record<string, React.ReactNode> = {
  "patient.create": <FileText className="h-4 w-4" />,
  "patient.update": <Edit className="h-4 w-4" />,
  "patient.archive": <Trash2 className="h-4 w-4" />,
  "consultation.create": <FileText className="h-4 w-4" />,
  "consultation.finalize": <ShieldCheck className="h-4 w-4" />,
  "diagnosis.create": <FileText className="h-4 w-4" />,
  "prescription.create": <FileText className="h-4 w-4" />,
  "appointment.create": <Clock className="h-4 w-4" />,
  "appointment.status_change": <Clock className="h-4 w-4" />,
  "document.export": <Upload className="h-4 w-4" />,
};

function ShieldCheck(props: { className?: string }) {
  return <Shield className="h-4 w-4" {...props} />;
}

function actionVariant(
  action: string,
): "success" | "warning" | "danger" | "neutral" {
  if (action.includes("archive") || action.includes("delete")) return "danger";
  if (action.includes("create") || action.includes("finalize"))
    return "success";
  if (action.includes("update") || action.includes("change")) return "warning";
  return "neutral";
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    "patient.create": "Creación",
    "patient.update": "Modificación",
    "patient.archive": "Archivo",
    "consultation.create": "Consulta creada",
    "consultation.finalize": "Consulta finalizada",
    "diagnosis.create": "Diagnóstico",
    "prescription.create": "Prescripción",
    "appointment.create": "Cita creada",
    "appointment.status_change": "Estado de cita",
    "document.export": "Exportación PDF",
  };
  return map[action] ?? action;
}

export default function AuditLogPage() {
  const { data: session } = authClient.useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");

  useSafePageTitle("Registro de auditoría");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("targetEntity", entityFilter);
    apiFetch(`/api/audit?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLogs(data.data ?? []);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, actionFilter, entityFilter]);

  const filtered = searchFilter
    ? logs.filter(
        (l) =>
          l.action.toLowerCase().includes(searchFilter.toLowerCase()) ||
          l.targetEntity.toLowerCase().includes(searchFilter.toLowerCase()) ||
          (l.summary ?? "").toLowerCase().includes(searchFilter.toLowerCase()),
      )
    : logs;

  if (!session) {
    return (
      <main className="p-8">
        <p className="text-muted-foreground">
          Debes iniciar sesión para ver el registro de auditoría.
        </p>
      </main>
    );
  }

  return (
    <main className="p-8 space-y-6 max-w-6xl">
      <div className="mb-2 flex items-center gap-3">
        <Shield className="h-6 w-6 text-secondary" />
        <h1 className="text-display font-semibold text-primary">
          Registro de auditoría
        </h1>
      </div>
      <CardDescription>
        Historial de acciones realizadas en el sistema (HIPAA-compliant).
      </CardDescription>

      {/* Filters — DS §4.7: filtros + sticky header */}
      <Card variant="elevated" className="p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:items-end">
          <div className="space-y-1">
            <Label htmlFor="search" className="text-small font-medium">
              Buscar
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <Input
                id="search"
                placeholder="Acción, entidad, resumen…"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="entity" className="text-small font-medium">
              Entidad
            </Label>
            <Input
              id="entity"
              placeholder="p. ej. patient"
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="action" className="text-small font-medium">
              Acción
            </Label>
            <Input
              id="action"
              placeholder="p. ej. patient.create"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            />
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setActionFilter("");
              setEntityFilter("");
              setSearchFilter("");
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      </Card>

      {/* Results table with sticky header (DS §4.7) */}
      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : error ? (
        <p className="text-danger">Error: {error}</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin registros"
          description={
            logs.length === 0
              ? "Aún no hay eventos de auditoría registrados."
              : "No se encontraron registros con esos filtros."
          }
          icon={<Shield className="h-10 w-10" />}
        />
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-card)] border">
          <table className="w-full text-small">
            <thead className="sticky top-0 bg-secondary/5">
              <tr>
                <th className="text-left py-2 pl-4 pr-2 font-medium">Fecha</th>
                <th className="text-left py-2 px-2 font-medium">Acción</th>
                <th className="text-left py-2 px-2 font-medium">Entidad</th>
                <th className="text-left py-2 px-2 font-medium">Usuario</th>
                <th className="text-left py-2 pr-4 font-medium">Resumen</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log) => (
                <tr
                  key={log.id}
                  className="border-t hover:bg-secondary/3 transition-colors"
                >
                  <td className="py-2 pl-4 pr-2 text-muted">
                    <time dateTime={log.createdAt}>
                      {new Date(log.createdAt).toLocaleString("es-ES")}
                    </time>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={actionVariant(log.action)}
                        className="text-xs"
                      >
                        {actionLabel(log.action)}
                      </Badge>
                    </div>
                  </td>
                  <td className="py-2 px-2 text-small">
                    <code className="rounded bg-secondary/10 px-1.5 py-0.5 text-muted">
                      {log.targetEntity}
                      {log.targetId ? ` (${log.targetId.slice(0, 8)}…)` : ""}
                    </code>
                  </td>
                  <td className="py-2 px-2 text-muted">
                    <code className="rounded bg-secondary/10 px-1.5 py-0.5">
                      {log.actorId.slice(0, 8)}
                    </code>
                  </td>
                  <td className="py-2 pr-4 text-muted">{log.summary || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
