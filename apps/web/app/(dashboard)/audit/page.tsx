"use client";

import { useEffect, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  Input,
  Label,
  Pagination,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@canica/ui";
import { CalendarClock, Edit, FileText, Search, Shield, Trash2, Upload } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { apiFetch } from "@/lib/api";
import { useSafePageTitle } from "@/hooks/usePageTitle";

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  targetEntity: string;
  targetId?: string | null;
  summary?: string | null;
  createdAt: string;
}

const ACTION_OPTIONS = [
  ["patient.create", "Crear paciente"],
  ["patient.update", "Modificar paciente"],
  ["patient.archive", "Archivar paciente"],
  ["consultation.create", "Crear consulta"],
  ["consultation.finalize", "Finalizar consulta"],
  ["diagnosis.create", "Crear diagnóstico"],
  ["prescription.create", "Crear prescripción"],
  ["appointment.create", "Crear cita"],
  ["appointment.status_change", "Cambiar estado de cita"],
  ["document.export", "Exportar documento"],
] as const;

const ENTITY_OPTIONS = [
  ["patient", "Paciente"],
  ["consultation", "Consulta"],
  ["diagnosis", "Diagnóstico"],
  ["prescription", "Prescripción"],
  ["appointment", "Cita"],
  ["document_export", "Exportación de documento"],
] as const;

const ACTION_LABELS = Object.fromEntries(ACTION_OPTIONS) as Record<string, string>;
const ENTITY_LABELS = Object.fromEntries(ENTITY_OPTIONS) as Record<string, string>;

const actionIcons: Record<string, React.ReactNode> = {
  "patient.create": <FileText className="h-4 w-4" aria-hidden="true" />,
  "patient.update": <Edit className="h-4 w-4" aria-hidden="true" />,
  "patient.archive": <Trash2 className="h-4 w-4" aria-hidden="true" />,
  "consultation.create": <FileText className="h-4 w-4" aria-hidden="true" />,
  "consultation.finalize": <Shield className="h-4 w-4" aria-hidden="true" />,
  "diagnosis.create": <FileText className="h-4 w-4" aria-hidden="true" />,
  "prescription.create": <FileText className="h-4 w-4" aria-hidden="true" />,
  "appointment.create": <CalendarClock className="h-4 w-4" aria-hidden="true" />,
  "appointment.status_change": <CalendarClock className="h-4 w-4" aria-hidden="true" />,
  "document.export": <Upload className="h-4 w-4" aria-hidden="true" />,
};

function actionVariant(action: string): "success" | "warning" | "danger" | "neutral" {
  if (action.includes("archive") || action.includes("delete")) return "danger";
  if (action.includes("create") || action.includes("finalize")) return "success";
  if (action.includes("update") || action.includes("change")) return "warning";
  return "neutral";
}

function actionLabel(action: string) {
  return ACTION_LABELS[action] ?? "Acción registrada";
}

function entityLabel(entity: string) {
  return ENTITY_LABELS[entity] ?? "Entidad registrada";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Fecha no disponible";
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function selectClassName() {
  return "h-10 w-full rounded-[var(--radius-input)] border border-border bg-surface px-3 text-small text-text outline-none transition-colors focus-visible:ring-2 focus-visible:ring-primary";
}

const PAGE_SIZE = 20;

export default function AuditLogPage() {
  const { data: session } = authClient.useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useSafePageTitle("Registro de auditoría");

  useEffect(() => {
    setPage(1);
  }, [actionFilter, entityFilter]);

  useEffect(() => {
    let active = true;

    if (!session) {
      setLoading(false);
      return () => {
        active = false;
      };
    }

    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("targetEntity", entityFilter);
    params.set("limit", String(PAGE_SIZE));
    params.set("offset", String((page - 1) * PAGE_SIZE));
    const query = params.toString();

    apiFetch(`/api/audit?${query}`)
      .then(async (response) => {
        if (!response.ok) {
          if (response.status === 403) throw new Error("forbidden");
          throw new Error("request_failed");
        }
        const body = (await response.json()) as { data?: unknown; total?: number };
        if (!Array.isArray(body.data)) throw new Error("invalid_response");
        return { logs: body.data as AuditLog[], total: body.total ?? 0 };
      })
      .then((next) => {
        if (!active) return;
        setLogs(next.logs);
        setTotal(next.total);
      })
      .catch((requestError: Error) => {
        if (!active) return;
        setError(
          requestError.message === "forbidden"
            ? "No tienes permisos para consultar el registro de auditoría."
            : "No se pudo cargar el registro de auditoría.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [session, actionFilter, entityFilter, refreshKey, page]);

  const normalizedSearch = searchFilter.trim().toLowerCase();
  const filtered = normalizedSearch
    ? logs.filter((log) =>
        [
          actionLabel(log.action),
          log.action,
          entityLabel(log.targetEntity),
          log.targetEntity,
          log.actorId,
          log.targetId ?? "",
          log.summary ?? "",
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch),
      )
    : logs;

  if (!session) {
    return (
      <main>
        <p className="text-muted" role="status">
          Se necesita una sesión activa para ver el registro de auditoría.
        </p>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <header className="flex items-start gap-3">
        <span className="rounded-[var(--radius-button)] bg-primary-light p-2.5 text-primary">
          <Shield className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <h1 className="text-display font-semibold tracking-tight text-text">
            Registro de auditoría
          </h1>
          <p className="mt-2 max-w-3xl text-small text-muted">
            Historial de acciones relevantes para la seguridad y la trazabilidad del sistema.
          </p>
        </div>
      </header>

      <Card variant="elevated" className="p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1.4fr)_minmax(10rem,0.8fr)_minmax(10rem,0.8fr)] md:items-end">
          <div className="space-y-1.5">
            <Label htmlFor="audit-search" className="text-small font-medium">
              Buscar en los registros
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" aria-hidden="true" />
              <Input
                id="audit-search"
                type="search"
                placeholder="Acción, entidad, identificador o resumen"
                value={searchFilter}
                onChange={(event) => setSearchFilter(event.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-entity" className="text-small font-medium">
              Entidad
            </Label>
            <select
              id="audit-entity"
              className={selectClassName()}
              value={entityFilter}
              onChange={(event) => setEntityFilter(event.target.value)}
            >
              <option value="">Todas las entidades</option>
              {ENTITY_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audit-action" className="text-small font-medium">
              Acción
            </Label>
            <select
              id="audit-action"
              className={selectClassName()}
              value={actionFilter}
              onChange={(event) => setActionFilter(event.target.value)}
            >
              <option value="">Todas las acciones</option>
              {ACTION_OPTIONS.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-caption text-muted">
            La API actual entrega el identificador del actor, no su nombre. Se muestra el identificador como respaldo.
          </p>
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

      {loading ? (
        <div className="space-y-2" aria-busy="true">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full" />
          ))}
        </div>
      ) : error ? (
        <Card role="alert">
          <CardHeader>
            <CardTitle>{error}</CardTitle>
            <CardDescription>
              Comprueba la conexión o tus permisos y vuelve a intentarlo.
            </CardDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-2 w-fit"
              onClick={() => setRefreshKey((key) => key + 1)}
            >
              Reintentar
            </Button>
          </CardHeader>
        </Card>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="Sin registros para mostrar"
          description={
            logs.length === 0
              ? "Todavía no hay eventos de auditoría registrados."
              : "No se encontraron registros con los filtros actuales."
          }
          icon={<Shield className="h-10 w-10 text-muted" aria-hidden="true" />}
        />
      ) : (
        <>
          <div className="overflow-x-auto rounded-[var(--radius-card)] border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">Fecha</TableHead>
                  <TableHead scope="col">Acción</TableHead>
                  <TableHead scope="col">Entidad</TableHead>
                  <TableHead scope="col">Actor</TableHead>
                  <TableHead scope="col">Resumen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-muted">
                      <time dateTime={log.createdAt}>{formatDate(log.createdAt)}</time>
                    </TableCell>
                    <TableCell>
                      <div className="flex min-w-44 items-center gap-2">
                        <Badge variant={actionVariant(log.action)} className="gap-1.5">
                          {actionIcons[log.action] ?? <Shield className="h-4 w-4" aria-hidden="true" />}
                          {actionLabel(log.action)}
                        </Badge>
                        {!ACTION_LABELS[log.action] && (
                          <code className="text-caption text-muted">{log.action}</code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-36 space-y-1">
                        <span className="block font-medium">{entityLabel(log.targetEntity)}</span>
                        {!ENTITY_LABELS[log.targetEntity] && (
                          <code className="block text-caption text-muted">{log.targetEntity}</code>
                        )}
                        {log.targetId && (
                          <code className="block break-all text-caption text-muted" title={log.targetId}>
                            {log.targetId}
                          </code>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-36 space-y-1">
                        <span className="block text-small text-muted">Usuario no resuelto</span>
                        <code className="block break-all text-caption text-muted" title={log.actorId}>
                          {log.actorId}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="min-w-56 text-muted">
                      {log.summary || "Sin resumen disponible"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
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
