"use client";

import { Label } from "@canica/ui";

interface FormFieldProps {
  id: string;
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

export function FormField({
  id,
  label,
  description,
  error,
  required = false,
  children,
}: FormFieldProps) {
  const descriptionId = description ? `${id}-description` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? " *" : ""}
      </Label>
      {children}
      {description && (
        <p id={descriptionId} className="text-small text-muted">
          {description}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function getFieldDescribedBy(
  id: string,
  options: { description?: string; error?: string },
) {
  return [
    options.description ? `${id}-description` : null,
    options.error ? `${id}-error` : null,
  ]
    .filter(Boolean)
    .join(" ") || undefined;
}

export function formatFormError(error?: unknown, status?: number) {
  if (status === 401 || status === 403) {
    return "No tienes permisos para realizar esta acción.";
  }

  if (status === 404 || error === "not_found") {
    return "No se encontró la información solicitada.";
  }

  if (error === "validation_failed") {
    return "Revisa los campos marcados e inténtalo de nuevo.";
  }

  return "No se pudo completar la operación. Inténtalo de nuevo.";
}
