"use client";

import { useState, useEffect, use } from "react";
import {
  Button,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Skeleton,
  EmptyState,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  ConfirmDialog,
} from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter, usePathname } from "next/navigation";
import { FileText, Clock, Download, Trash2, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSafePageTitle } from "@/hooks/usePageTitle";
import { apiFetch } from "@/lib/api";

interface Attachment {
  id: string;
  patientId: string;
  consultationId: string | null;
  fileName: string;
  path: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy: string;
  createdAt: string;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(mime: string): string {
  const parts = mime.split("/");
  if (parts.length === 2) {
    return parts[1].toUpperCase().replace("+", "");
  }
  return mime;
}

function DocumentsSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-32" />
      <Skeleton className="h-64 w-full" />
      <Skeleton className="h-64 w-full" />
    </div>
  );
}

function UploadDialog({
  patientId,
  open,
  onOpenChange,
  onUploaded,
}: {
  patientId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setFile(null);
    setError(null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("patientId", patientId);
    try {
      const res = await apiFetch("/api/attachments", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      reset();
      onUploaded();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al subir");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Subir documento</DialogTitle>
          <DialogDescription>
            Selecciona un archivo para subirlo al expediente del paciente. El
            archivo se almacena encriptado y con acceso restringido.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-center rounded-lg border border-border border-dashed p-6">
            <label className="flex flex-col items-center justify-center gap-2 text-center cursor-pointer">
              <Upload className="h-8 w-8 text-muted" />
              <div>
                <span className="text-small font-medium text-primary">
                  {file ? file.name : "Haz clic para seleccionar"}
                </span>
                {file && (
                  <p className="text-xs text-muted">
                    {(file.size / 1024).toFixed(1)} KB • {file.type || "sin tipo"}
                  </p>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                disabled={uploading}
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt"
              />
            </label>
          </div>
          {error && <p className="text-small text-danger">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={handleUpload} disabled={!file || uploading}>
            {uploading ? "Subiendo..." : "Subir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function PatientDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Attachment | null>(null);

  useSafePageTitle("Documentos");

  const fetchAttachments = () => {
    if (!session) return;
    setLoading(true);
    apiFetch(`/api/patients/${id}/attachments`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setAttachments(data.data);
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Error")
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAttachments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, id]);

  const download = async (attachment: Attachment) => {
    const res = await apiFetch(`/api/attachments/${attachment.id}/signed-url`, {
      method: "GET",
      credentials: "include",
    });
    if (res.ok) {
      const { signedUrl } = await res.json();
      window.open(signedUrl, "_blank");
    }
  };

  const remove = (attachment: Attachment) => {
    setDeleteTarget(attachment);
  };

  const confirmRemove = async () => {
    if (!deleteTarget) return;
    const res = await apiFetch(`/api/attachments/${deleteTarget.id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (res.ok) {
      setAttachments((prev) => prev.filter((a) => a.id !== deleteTarget.id));
    }
    setDeleteTarget(null);
  };

  if (!session) {
    return (
      <main>
        <p className="text-muted">
          Debes iniciar sesión para ver los documentos.
        </p>
      </main>
    );
  }

  return (
    <main className="min-w-0">
      <section className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b">
        <div className="flex items-center justify-between p-6">
          <h1 className="text-display font-semibold text-primary">Documentos</h1>
          <Button size="sm" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" />
            Subir
          </Button>
        </div>
      </section>

      <div className="p-6">
        {loading && <DocumentsSkeleton />}
        {error && (
          <p className="text-small text-danger">Error: {error}</p>
        )}
        {!loading && !error && attachments.length === 0 && (
          <EmptyState
            title="Sin documentos"
            description="Aún no hay documentos cargados para este paciente."
            icon={<FileText className="h-6 w-6" />}
            actionLabel="Subir documento"
            onAction={() => setUploadOpen(true)}
          />
        )}
        {!loading && !error && attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Documentos ({attachments.length})</CardTitle>
              <CardDescription>
                Archivos adjuntos al expediente de este paciente.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full caption-bottom text-small">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="h-12 px-4 text-left align-middle text-small font-medium text-muted">
                        Archivo
                      </th>
                      <th
                        scope="row"
                        className="h-12 px-4 text-left align-middle text-small font-medium text-muted"
                      >
                        Tamaño
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-small font-medium text-muted">
                        Fecha
                      </th>
                      <th className="h-12 px-4 text-left align-middle text-small font-medium text-muted">
                        Subido por
                      </th>
                      <th className="h-12 px-4 text-center align-middle text-small font-medium text-muted">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="[&_tr:last-child]:border-0">
                    {attachments.map((a) => (
                      <tr
                        key={a.id}
                        className="border-b border-border transition-colors hover:bg-primary/5"
                      >
                        <td className="p-4 align-middle">
                          <div className="flex items-center gap-3">
                            <Badge variant="default" className="uppercase">
                              {fileExtension(a.mimeType)}
                            </Badge>
                            <div className="font-medium">
                              {a.fileName}
                            </div>
                          </div>
                        </td>
                        <td
                          scope="row"
                          className="p-4 align-middle text-muted"
                        >
                          {formatBytes(a.sizeBytes)}
                        </td>
                        <td className="p-4 align-middle text-muted">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3 w-3" />
                            {new Date(a.createdAt).toLocaleDateString("es-ES")}
                          </div>
                        </td>
                        <td className="p-4 align-middle text-muted">
                          {a.uploadedBy.slice(0, 8)}
                        </td>
                        <td className="p-4 align-middle">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => download(a)}
                              aria-label={`Descargar ${a.fileName}`}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(a)}
                              aria-label={`Eliminar ${a.fileName}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        <UploadDialog
          patientId={id}
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploaded={fetchAttachments}
        />

        <ConfirmDialog
          open={deleteTarget !== null}
          onOpenChange={(open) => {
            if (!open) setDeleteTarget(null);
          }}
          title="Eliminar documento"
          description={
            deleteTarget
              ? `¿Seguro que deseas eliminar "${deleteTarget.fileName}"? Esta acción no se puede deshacer.`
              : undefined
          }
          confirmLabel="Eliminar"
          destructive
          onConfirm={confirmRemove}
        />
      </div>
    </main>
  );
}
