"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Button, Input, Badge } from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { LogOut, Search, UserRound } from "lucide-react";
import { getRoleLabel } from "@/lib/roles";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [search, setSearch] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  const user = session?.user as
    | { role?: string; name?: string | null; email?: string | null }
    | undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/patients?search=${encodeURIComponent(search.trim())}`);
    }
  };

  useEffect(() => {
    if (!menuOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        return;
      }

      const menuItems = menuRef.current?.querySelectorAll<HTMLElement>(
        '[role="menuitem"]',
      );
      if (!menuItems || menuItems.length === 0) return;

      const currentIndex = Array.from(menuItems).indexOf(
        document.activeElement as HTMLElement,
      );

      if (event.key === "ArrowDown") {
        event.preventDefault();
        const next = currentIndex < menuItems.length - 1 ? currentIndex + 1 : 0;
        menuItems[next].focus();
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : menuItems.length - 1;
        menuItems[prev].focus();
      } else if (event.key === "Home") {
        event.preventDefault();
        menuItems[0].focus();
      } else if (event.key === "End") {
        event.preventDefault();
        menuItems[menuItems.length - 1].focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    // Focus first menu item when menu opens
    const firstItem = menuContainerRef.current?.querySelector<HTMLElement>(
      '[role="menuitem"]',
    );
    firstItem?.focus();

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  const signOut = async () => {
    setMenuOpen(false);
    await authClient.signOut().catch(() => undefined);
    window.location.href = "/login";
  };

  const displayName = user?.name?.trim() || user?.email || "Cuenta";
  const initials = displayName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex min-h-16 flex-shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 px-4 pl-16 backdrop-blur sm:gap-4 sm:px-6 sm:pl-16 md:pl-6">
      <form onSubmit={handleSearch} className="min-w-0 max-w-md flex-1" role="search" aria-label="Búsqueda de pacientes">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <label htmlFor="global-patient-search" className="sr-only">
            Buscar pacientes
          </label>
          <Input
            id="global-patient-search"
            type="search"
            placeholder="Buscar pacientes..."
            aria-label="Buscar pacientes"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <div className="flex items-center gap-1 sm:gap-2">
        <ThemeToggle />
        <div ref={menuRef} className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="h-10 gap-2 px-2 sm:px-3"
            onClick={() => setMenuOpen((value) => !value)}
            aria-label={`Abrir menú de ${displayName}`}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-light text-caption font-semibold text-primary">
              {initials || <UserRound className="h-4 w-4" />}
            </span>
            <span className="hidden max-w-32 truncate text-small sm:inline">{displayName}</span>
          </Button>
          {menuOpen && (
            <div
              ref={menuContainerRef}
              className="absolute right-0 top-[calc(100%+0.5rem)] z-40 min-w-56 rounded-[var(--radius-card)] border border-border bg-surface-elevated p-2 shadow-lg"
              role="menu"
              aria-label="Menú de cuenta"
              tabIndex={-1}
            >
              <div className="border-b border-border px-3 py-2">
                <p className="truncate text-small font-medium text-text">{displayName}</p>
                <Badge variant="neutral" className="mt-1 text-xs">
                  {getRoleLabel(user?.role)}
                </Badge>
              </div>
              <Link
                href="/settings"
                role="menuitem"
                className="mt-1 flex min-h-10 items-center gap-2 rounded-[var(--radius-button)] px-3 text-small text-text hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setMenuOpen(false)}
              >
                <UserRound className="h-4 w-4" />
                Configuración
              </Link>
              <button
                type="button"
                role="menuitem"
                className="flex min-h-10 w-full items-center gap-2 rounded-[var(--radius-button)] px-3 text-left text-small text-danger hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-danger"
                onClick={signOut}
              >
                <LogOut className="h-4 w-4" />
                Cerrar sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
