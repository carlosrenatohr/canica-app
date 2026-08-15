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

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(apiUrl("/api/auth/sign-in/email"), {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setError(body?.message ?? "Login failed");
        return;
      }
      router.push("/");
    } catch {
      setError("No se pudo conectar con el servidor. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-bg p-4">
      <Card variant="elevated" className="w-full max-w-md shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-display text-primary">
            Iniciar sesión
          </CardTitle>
          <CardDescription className="text-center">
            Accede a tu espacio clínico en Canica
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <p className="text-small text-danger" role="alert">
                {error === "Login failed"
                  ? "No pudimos iniciar sesión con esos datos."
                  : error}
              </p>
            )}
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
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Ingresando…" : "Entrar"}
            </Button>
            {loading && (
              <p role="status" aria-live="polite" className="text-center text-small text-muted">
                Verificando tus credenciales…
              </p>
            )}
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-small text-muted">
            ¿No tienes una cuenta?{" "}
            <a
              href="/signup"
              className="text-secondary hover:underline"
            >
              Regístrate
            </a>
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
