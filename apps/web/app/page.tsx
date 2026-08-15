"use client";

import { authClient } from "@/lib/auth-client";
import { Button } from "@canica/ui";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { data: session } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [router, session]);

  if (session) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-muted">Abriendo el dashboard…</p>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-3xl font-semibold">Canica</h1>
      <p className="text-muted-foreground">
        Digital medical records for physicians.
      </p>
      <div className="flex gap-4">
        <Link href="/login">
          <Button variant="outline">Iniciar sesión</Button>
        </Link>
        <Link href="/signup">
          <Button>Registrarse</Button>
        </Link>
      </div>
    </main>
  );
}
