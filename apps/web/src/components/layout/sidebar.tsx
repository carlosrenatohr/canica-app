import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  const { data: session } = authClient.useSession();

  return (
    <aside className="w-64 border-r bg-background p-4 flex flex-col gap-4">
      <Link href="/" className="text-xl font-semibold">
        Canica
      </Link>
      <nav className="flex flex-col gap-2">
        {session ? (
          <>
            <Link href="/patients">
              <Button variant="ghost" className="w-full justify-start">
                Pacientes
              </Button>
            </Link>
            <form
              action="/api/auth/sign-out"
              method="post"
            >
              <Button variant="ghost" className="w-full justify-start" type="submit">
                Cerrar sesión
              </Button>
            </form>
          </>
        ) : (
          <>
            <Link href="/login">
              <Button variant="ghost" className="w-full justify-start">
                Iniciar sesión
              </Button>
            </Link>
            <Link href="/signup">
              <Button variant="ghost" className="w-full justify-start">
                Registrarse
              </Button>
            </Link>
          </>
        )}
      </nav>
    </aside>
  );
}
