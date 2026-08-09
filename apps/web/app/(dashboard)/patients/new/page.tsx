"use client";

import { useState } from "react";
import { Button, Input, Label, Card, CardContent, CardHeader, CardTitle } from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function NewPatientPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    identifier: "",
    birthDate: "",
    sex: "",
    phone: "",
    email: "",
    address: "",
  });

  if (!session) {
    return (
      <main className="p-8">
        <p>Debes iniciar sesión para crear un paciente.</p>
      </main>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/patients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: form.firstName,
        lastName: form.lastName,
        identifier: form.identifier || undefined,
        birthDate: form.birthDate || undefined,
        sex: form.sex || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        address: form.address || undefined,
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      setError(data?.error ?? `HTTP ${res.status}`);
      setLoading(false);
      return;
    }
    router.push("/patients");
  };

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold mb-6">Nuevo paciente</h1>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <Label htmlFor="firstName">Nombre *</Label>
          <Input
            id="firstName"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="lastName">Apellido *</Label>
          <Input
            id="lastName"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="identifier">Identificación</Label>
          <Input
            id="identifier"
            value={form.identifier}
            onChange={(e) => setForm((f) => ({ ...f, identifier: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="birthDate">Fecha de nacimiento</Label>
          <Input
            id="birthDate"
            type="date"
            value={form.birthDate}
            onChange={(e) => setForm((f) => ({ ...f, birthDate: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="sex">Sexo</Label>
          <select
            id="sex"
            value={form.sex}
            onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value }))}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Seleccionar</option>
            <option value="male">Masculino</option>
            <option value="female">Femenino</option>
            <option value="other">Otro</option>
            <option value="unspecified">No especificado</option>
          </select>
        </div>
        <div>
          <Label htmlFor="phone">Teléfono</Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
        </div>
        <div>
          <Label htmlFor="address">Dirección</Label>
          <Input
            id="address"
            value={form.address}
            onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? "Guardando…" : "Guardar paciente"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
        </div>
      </form>
    </main>
  );
}