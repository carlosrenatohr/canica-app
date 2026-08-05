"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function HomePage() {
  const { data: session } = authClient.useSession();

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">Canica</h1>
      <p className="text-muted-foreground">
        Digital medical records for physicians.
      </p>
      {session ? (
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm">
            Logged in as <strong>{session.user.name}</strong> (
            {(session.user as { role?: string }).role ?? "user"})
          </p>
          <Link href="/patients">
            <Button>Ver pacientes</Button>
          </Link>
        </div>
      ) : (
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Iniciar sesión</Button>
          </Link>
          <Link href="/signup">
            <Button>Registrarse</Button>
          </Link>
        </div>
      )}
    </main>
  );
}
