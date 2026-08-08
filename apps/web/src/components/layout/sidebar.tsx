"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@canica/ui";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList,
} from "lucide-react";
import { Logo } from "@canica/ui";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const commonNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Pacientes", href: "/patients", icon: Users },
  { label: "Citas", href: "/appointments", icon: Calendar },
  { label: "Consultas", href: "/consultations", icon: ClipboardList },
  { label: "Auditoría", href: "/audit", icon: Shield },
];

const adminNav: NavItem[] = [
  ...commonNav,
  { label: "Configuración", href: "/settings", icon: Settings },
];

function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < breakpoint);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, [breakpoint]);

  return isMobile;
}

export function Sidebar() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => setMounted(true), []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close mobile drawer on escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    if (mobileOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [mobileOpen]);

  const user = session?.user as { role?: string } | undefined;
  const role = user?.role ?? "doctor";
  const nav = role === "administrator" ? adminNav : commonNav;

  if (!session || !mounted) {
    return (
      <aside className="flex h-screen w-16 flex-col items-center gap-4 border-r bg-surface p-3">
        <Link href="/" className="text-xl font-semibold text-primary">
          <Logo size={28} />
        </Link>
      </aside>
    );
  }

  // Mobile: drawer overlay
  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="sm"
          className="fixed left-4 top-4 z-40 h-10 w-10 p-0 md:hidden"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm md:hidden"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
        )}

        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col border-r bg-surface motion-dialog md:hidden",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex items-center justify-between px-3 py-2">
            <div className="flex items-center gap-3">
              <Logo size={28} />
              <span className="text-xl font-semibold">Canica</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setMobileOpen(false)}
              aria-label="Cerrar menú"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className="w-full justify-start gap-3"
                    size="sm"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-col gap-1 p-2">
            <form action="/api/auth/sign-out" method="post">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3"
                size="sm"
                type="submit"
              >
                <LogOut className="h-4 w-4" />
                <span>Cerrar sesión</span>
              </Button>
            </form>
          </div>
        </aside>
      </>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <aside
      className={cn(
        "flex h-screen flex-col justify-between border-r bg-surface transition-[width] duration-200 ease-out",
        collapsed ? "w-[72px]" : "w-[260px]",
      )}
    >
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2",
            collapsed ? "justify-center" : "",
          )}
        >
          <Logo size={28} />
          {!collapsed && <span className="text-xl font-semibold">Canica</span>}
        </div>
        <nav className="flex flex-col gap-1 p-2">
          {nav.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <Button
                  variant={active ? "secondary" : "ghost"}
                  className="w-full justify-start gap-3"
                  size="sm"
                >
                  <item.icon className="h-4 w-4" />
                  {!collapsed && <span>{item.label}</span>}
                </Button>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="flex flex-col gap-1 p-2">
        <form action="/api/auth/sign-out" method="post">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            size="sm"
            type="submit"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Cerrar sesión</span>}
          </Button>
        </form>
        <Button
          variant="ghost"
          size="sm"
          className="justify-center"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
