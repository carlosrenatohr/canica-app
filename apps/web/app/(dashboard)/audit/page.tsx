"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

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

export default function AuditLogPage() {
  const { data: session } = authClient.useSession();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");

  useEffect(() => {
    if (!session) return;
    setLoading(true);
    const params = new URLSearchParams();
    if (actionFilter) params.set("action", actionFilter);
    if (entityFilter) params.set("targetEntity", entityFilter);
    fetch(`/api/audit?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setLogs(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [session, actionFilter, entityFilter]);

  if (!session) {
    return (
      <div className="p-8">
        <p>Debes iniciar sesión para ver el registro de auditoría.</p>
      </div>
    );
  }

  if (loading) return <div className="p-8">Cargando auditoría…</div>;
  if (error) return <div className="p-8">Error: {error}</div>;

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Registro de auditoría</h1>
      </div>

      <div className="flex gap-4 mb-6">
        <div>
          <Label>Acción</Label>
          <Input
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            placeholder="Filtrar por acción…"
          />
        </div>
        <div>
          <Label>Entidad</Label>
          <Input
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            placeholder="Filtrar por entidad…"
          />
        </div>
        <div className="flex items-end">
          <Button variant="outline" onClick={() => { setActionFilter(""); setEntityFilter(""); }}>
            Limpiar
          </Button>
        </div>
      </div>

      {logs.length === 0 ? (
        <p className="text-muted-foreground">No hay registros de auditoría.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left py-2">Fecha</th>
              <th className="text-left py-2">Acción</th>
              <th className="text-left py-2">Entidad</th>
              <th className="text-left py-2">Usuario</th>
              <th className="text-left py-2">Resumen</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-t">
                <td className="py-2">{new Date(log.createdAt).toLocaleString("es-ES")}</td>
                <td className="py-2 font-medium">{log.action}</td>
                <td className="py-2">
                  {log.targetEntity}
                  {log.targetId ? ` (${log.targetId.slice(0, 8)}…)` : ""}
                </td>
                <td className="py-2">{log.actorId.slice(0, 8)}</td>
                <td className="py-2">{log.summary || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
