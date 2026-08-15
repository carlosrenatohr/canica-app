"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Button } from "@canica/ui";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  Shield,
  Menu,
  X,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Logo } from "@canica/ui";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const commonNav: NavItem[] = [
  { label: "Resumen", href: "/dashboard", icon: Home },
  { label: "Pacientes", href: "/patients", icon: Users },
  { label: "Citas", href: "/appointments", icon: Calendar },
  { label: "Consultas", href: "/consultations", icon: ClipboardList },
  { label: "Auditoría", href: "/audit", icon: Shield },
  { label: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;

    closeButtonRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      mobileTriggerRef.current?.focus();
    };
  }, [mobileOpen]);

  return (
    <>
      <aside
        className={cn(
          "hidden h-dvh flex-shrink-0 flex-col justify-between border-r bg-surface transition-[width] duration-200 ease-out md:flex",
          collapsed ? "w-[72px]" : "w-[260px]",
        )}
      >
        <div className="flex min-h-0 flex-col gap-2 overflow-y-auto">
          <div
            className={cn(
              "flex min-h-16 items-center gap-3 px-3 py-2",
              collapsed ? "justify-center" : "",
            )}
          >
            <Link href="/dashboard" aria-label="Ir al resumen">
              <Logo size={28} />
            </Link>
            {!collapsed && <span className="text-xl font-semibold">Canica</span>}
          </div>
          <nav aria-label="Navegación principal" className="flex flex-col gap-1 p-2">
            {commonNav.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </nav>
        </div>
        <div className="p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed((value) => !value)}
            aria-label={collapsed ? "Expandir menú" : "Contraer menú"}
            title={collapsed ? "Expandir menú" : "Contraer menú"}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>

      <Button
        ref={mobileTriggerRef}
        variant="ghost"
        size="icon"
        className="fixed left-3 top-3 z-40 md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Abrir menú de navegación"
        aria-expanded={mobileOpen}
        aria-controls="mobile-navigation"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-overlay backdrop-blur-sm transition-opacity md:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="mobile-navigation"
        aria-label="Navegación principal"
        aria-hidden={!mobileOpen}
        inert={!mobileOpen}
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[min(86vw,260px)] flex-col border-r bg-surface transition-transform md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex min-h-16 items-center justify-between border-b border-border px-3 py-2">
          <Link href="/dashboard" className="flex items-center gap-3" aria-label="Ir al resumen">
            <Logo size={28} />
            <span className="text-xl font-semibold">Canica</span>
          </Link>
          <Button
            ref={closeButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setMobileOpen(false)}
            aria-label="Cerrar menú de navegación"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
          {commonNav.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </nav>
      </aside>
    </>
  );
}

function NavLink({
  item,
  pathname,
  collapsed = false,
}: {
  item: NavItem;
  pathname: string;
  collapsed?: boolean;
}) {
  const active =
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));

  return (
    <Button
      asChild
      variant={active ? "secondary" : "ghost"}
      className={cn("w-full justify-start gap-3", collapsed && "justify-center")}
      size="sm"
    >
      <Link href={item.href} aria-current={active ? "page" : undefined}>
        <item.icon className="h-4 w-4 flex-shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    </Button>
  );
}
