"use client";

import { useState } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@canica/ui";
import {
  FormField,
  getFieldDescribedBy,
} from "@/components/forms/form-field";

export type PatientSex = "male" | "female" | "other" | "unspecified";

export interface PatientFormValues {
  firstName: string;
  lastName: string;
  identifier: string;
  birthDate: string;
  sex: PatientSex | "";
  phone: string;
  email: string;
  address: string;
}

interface PatientFormProps {
  title: string;
  description: string;
  initialValues?: Partial<PatientFormValues>;
  submitLabel: string;
  submittingLabel: string;
  submitting: boolean;
  serverError: string | null;
  onSubmit: (values: PatientFormValues) => Promise<void>;
  onCancel: () => void;
}

const emptyValues: PatientFormValues = {
  firstName: "",
  lastName: "",
  identifier: "",
  birthDate: "",
  sex: "",
  phone: "",
  email: "",
  address: "",
};

const sexOptions: Array<{ value: PatientSex; label: string }> = [
  { value: "male", label: "Masculino" },
  { value: "female", label: "Femenino" },
  { value: "other", label: "Otro" },
  { value: "unspecified", label: "No especificado" },
];

export function PatientForm({
  title,
  description,
  initialValues,
  submitLabel,
  submittingLabel,
  submitting,
  serverError,
  onSubmit,
  onCancel,
}: PatientFormProps) {
  const [values, setValues] = useState<PatientFormValues>({
    ...emptyValues,
    ...initialValues,
    birthDate: initialValues?.birthDate?.slice(0, 10) ?? "",
  });
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<keyof PatientFormValues, string>>
  >({});

  const updateValue = <K extends keyof PatientFormValues>(
    field: K,
    value: PatientFormValues[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  };

  const validate = () => {
    const nextErrors: Partial<Record<keyof PatientFormValues, string>> = {};

    if (!values.firstName) nextErrors.firstName = "Ingresa el nombre.";
    if (!values.lastName) nextErrors.lastName = "Ingresa el apellido.";
    if (values.email && !/^\S+@\S+\.\S+$/.test(values.email)) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(values);
  };

  const describedBy = (id: keyof PatientFormValues, descriptionText?: string) =>
    getFieldDescribedBy(id, {
      description: descriptionText,
      error: fieldErrors[id],
    });

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="firstName"
              label="Nombre"
              error={fieldErrors.firstName}
              required
            >
              <Input
                id="firstName"
                value={values.firstName}
                onChange={(event) => updateValue("firstName", event.target.value)}
                aria-invalid={Boolean(fieldErrors.firstName)}
                aria-describedby={describedBy("firstName")}
                autoComplete="given-name"
                required
              />
            </FormField>
            <FormField
              id="lastName"
              label="Apellido"
              error={fieldErrors.lastName}
              required
            >
              <Input
                id="lastName"
                value={values.lastName}
                onChange={(event) => updateValue("lastName", event.target.value)}
                aria-invalid={Boolean(fieldErrors.lastName)}
                aria-describedby={describedBy("lastName")}
                autoComplete="family-name"
                required
              />
            </FormField>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField
              id="identifier"
              label="Identificación"
              description="Opcional. Identificador utilizado por la clínica."
            >
              <Input
                id="identifier"
                value={values.identifier}
                onChange={(event) => updateValue("identifier", event.target.value)}
                aria-describedby={describedBy(
                  "identifier",
                  "Opcional. Identificador utilizado por la clínica.",
                )}
                autoComplete="off"
              />
            </FormField>
            <FormField
              id="birthDate"
              label="Fecha de nacimiento"
              description="Opcional. Usa el formato de fecha de tu dispositivo."
            >
              <Input
                id="birthDate"
                type="date"
                value={values.birthDate}
                onChange={(event) => updateValue("birthDate", event.target.value)}
                aria-describedby={describedBy(
                  "birthDate",
                  "Opcional. Usa el formato de fecha de tu dispositivo.",
                )}
                autoComplete="bday"
              />
            </FormField>
          </div>

          <FormField
            id="sex"
            label="Sexo"
            description="Opcional. Selecciona la opción correspondiente al registro."
          >
            <select
              id="sex"
              value={values.sex}
              onChange={(event) =>
                updateValue("sex", event.target.value as PatientFormValues["sex"])
              }
              aria-describedby={describedBy(
                "sex",
                "Opcional. Selecciona la opción correspondiente al registro.",
              )}
              className="h-11 w-full rounded-[var(--radius-input)] border border-border bg-surface px-4 py-2.5 text-body text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <option value="">Seleccionar</option>
              {sexOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField id="phone" label="Teléfono">
              <Input
                id="phone"
                value={values.phone}
                onChange={(event) => updateValue("phone", event.target.value)}
                aria-describedby={describedBy("phone")}
                autoComplete="tel"
                type="tel"
              />
            </FormField>
            <FormField
              id="email"
              label="Correo electrónico"
              error={fieldErrors.email}
            >
              <Input
                id="email"
                type="email"
                value={values.email}
                onChange={(event) => updateValue("email", event.target.value)}
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={describedBy("email")}
                autoComplete="email"
              />
            </FormField>
          </div>

          <FormField id="address" label="Dirección">
            <Input
              id="address"
              value={values.address}
              onChange={(event) => updateValue("address", event.target.value)}
              aria-describedby={describedBy("address")}
              autoComplete="street-address"
            />
          </FormField>

          {serverError && (
            <p className="text-small text-danger" role="alert" aria-live="assertive">
              {serverError}
            </p>
          )}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <Button type="submit" disabled={submitting} className="sm:min-w-40">
              {submitting ? submittingLabel : submitLabel}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
