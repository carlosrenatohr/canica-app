"use client";

import { useRouter } from "next/navigation";
import { Button, Input, Badge } from "@canica/ui";
import { authClient } from "@/lib/auth-client";
import { Search, Bell, User, Settings } from "lucide-react";
import { useState } from "react";
import { getRoleLabel } from "@/lib/roles";

export function Topbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [search, setSearch] = useState("");

  const user = session?.user as { role?: string; name?: string } | undefined;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/patients?search=${encodeURIComponent(search.trim())}`);
    }
  };

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-b border-border bg-surface px-6">
      <form onSubmit={handleSearch} className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            type="search"
            placeholder="Buscar pacientes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </form>

      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          onClick={() => router.push("/settings")}
        >
          <Settings className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 px-2">
          <Badge variant="neutral" className="hidden sm:inline text-xs">
            {getRoleLabel(user?.role)}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-full"
            onClick={() => router.push("/settings")}
          >
            <User className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
