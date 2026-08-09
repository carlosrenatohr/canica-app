"use client";

import { useState } from "react";
import { apiUrl } from "@/lib/api";
import {
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@canica/ui";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [orgId, setOrgId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch(apiUrl("/api/auth/sign-up/email"), {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        organizationId: orgId,
      }),
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setError(body?.message ?? "Signup failed");
      return;
    }
    router.push("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card variant="elevated" className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-display text-primary">
            Canica
          </CardTitle>
          <CardDescription className="text-center">
            Crear cuenta profesional
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && <p className="text-small text-danger">{error}</p>}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Dr. Ana Martínez"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="dr.canica@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Mínimo 8 caracteres"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="orgId">Organización (ID)</Label>
              <Input
                id="orgId"
                value={orgId}
                onChange={(e) => setOrgId(e.target.value)}
                required
                placeholder="00000000-0000-0000-0000-000000000000"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Creando…" : "Registrarse"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-small text-muted">
            ¿Ya tenés cuenta?{" "}
            <a href="/login" className="text-secondary hover:underline">
              Iniciar sesión
            </a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
