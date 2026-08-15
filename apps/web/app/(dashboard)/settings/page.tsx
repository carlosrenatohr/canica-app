"use client";

import { useState } from "react";
import { Badge, Button } from "@canica/ui";
import { LogOut, Monitor, Moon, ShieldCheck, Sun, UserRound } from "lucide-react";
import { useAuth } from "@/providers/auth-provider";
import { authClient } from "@/lib/auth-client";
import { getRoleLabel } from "@/lib/roles";
import { type ThemePreference } from "@/lib/theme";
import { useTheme } from "@/components/layout/theme-provider";

const themeOptions: {
  value: ThemePreference;
  label: string;
  description: string;
  icon: typeof Sun;
}[] = [
  { value: "light", label: "Claro", description: "Usar el tema claro", icon: Sun },
  { value: "dark", label: "Oscuro", description: "Usar el tema oscuro", icon: Moon },
  { value: "system", label: "Sistema", description: "Seguir la preferencia del dispositivo", icon: Monitor },
];

export default function SettingsPage() {
  const { data: session } = useAuth();
  const { preference, setPreference } = useTheme();
  const [signingOut, setSigningOut] = useState(false);
  const user = session?.user as
    | { name?: string | null; email?: string | null; role?: string }
    | undefined;

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut().catch(() => undefined);
    window.location.href = "/login";
  };

  return (
    <div className="space-y-8">
      <header>
        <p className="text-small font-medium text-primary">Cuenta</p>
        <h1 className="mt-1 text-h1 text-text">Configuración</h1>
        <p className="mt-2 max-w-2xl text-small text-muted">
          Administra tu apariencia y revisa la información de tu sesión. Las opciones de organización se mantienen fuera de esta pantalla hasta contar con un contrato real.
        </p>
      </header>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(18rem,0.7fr)]">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
              <UserRound className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-h3 text-text">Perfil y sesión</h2>
              <p className="text-small text-muted">Datos disponibles en tu sesión actual.</p>
            </div>
          </div>
          <dl className="mt-6 divide-y divide-border">
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-small text-muted">Nombre</dt>
              <dd className="text-small font-medium text-text">{user?.name || "No disponible"}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-small text-muted">Correo electrónico</dt>
              <dd className="break-all text-small font-medium text-text">{user?.email || "No disponible"}</dd>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between">
              <dt className="text-small text-muted">Rol</dt>
              <dd><Badge variant="neutral">{getRoleLabel(user?.role)}</Badge></dd>
            </div>
          </dl>
        </div>

        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-light text-primary">
              <ShieldCheck className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-h3 text-text">Privacidad y sesión</h2>
              <p className="text-small text-muted">Información para trabajar con seguridad.</p>
            </div>
          </div>
          <p className="mt-5 text-small text-muted">
            El acceso a la información clínica depende de tus permisos y se valida en el servidor. La sesión se cierra después de un periodo de inactividad; también puedes cerrarla manualmente aquí o desde tu menú de cuenta.
          </p>
        </div>
      </section>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-h3 text-text">Apariencia</h2>
          <p className="mt-1 text-small text-muted">Elige cómo quieres ver Canica en este dispositivo.</p>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {themeOptions.map(({ value, label, description, icon: Icon }) => {
            const selected = preference === value;
            return (
              <button
                key={value}
                type="button"
                className={`flex min-h-24 items-start gap-3 rounded-[var(--radius-button)] border p-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${selected ? "border-primary bg-primary-light" : "border-border hover:bg-secondary-bg"}`}
                onClick={() => setPreference(value)}
                aria-pressed={selected}
              >
                <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                <span>
                  <span className="block text-small font-medium text-text">{label}</span>
                  <span className="mt-1 block text-caption text-muted">{description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-danger/30 bg-surface p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div>
          <h2 className="text-h3 text-text">Cerrar sesión</h2>
          <p className="mt-1 text-small text-muted">Finaliza la sesión en este dispositivo.</p>
        </div>
        <Button variant="danger" onClick={signOut} disabled={signingOut}>
          <LogOut className="h-4 w-4" />
          {signingOut ? "Cerrando sesión..." : "Cerrar sesión"}
        </Button>
      </section>
    </div>
  );
}
