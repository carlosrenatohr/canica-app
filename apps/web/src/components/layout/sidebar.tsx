"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  Calendar,
  Shield,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

const commonNav: NavItem[] = [
  { label: "Dashboard", href: "/", icon: Home },
  { label: "Pacientes", href: "/patients", icon: Users },
  { label: "Citas", href: "/appointments", icon: Calendar },
  { label: "Auditoría", href: "/audit", icon: Shield },
];

const adminNav: NavItem[] = [
  ...commonNav,
  { label: "Configuración", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const { data: session } = authClient.useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const user = session?.user as { role?: string } | undefined;
  const role = user?.role ?? "doctor";
  const nav = role === "administrator" ? adminNav : commonNav;

  if (!session || !mounted) {
    return (
      <aside className="flex h-screen w-16 flex-col items-center gap-4 border-r bg-surface p-3">
        <Link href="/" className="text-xl font-semibold text-primary">
          C
        </Link>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-screen flex-col justify-between border-r bg-surface transition-all duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div className="flex flex-col gap-2">
        <div
          className={cn(
            "flex items-center gap-3 px-3 py-2",
            collapsed ? "justify-center" : "",
          )}
        >
          <span className="text-xl font-semibold text-primary">C</span>
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
        >
          <Menu className="h-4 w-4" />
        </Button>
      </div>
    </aside>
  );
}
