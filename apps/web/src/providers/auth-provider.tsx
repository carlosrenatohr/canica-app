"use client";

import { authClient } from "@/lib/auth-client";
import { type ReactNode, createContext, useContext } from "react";

const AuthContext = createContext<ReturnType<typeof authClient.useSession> | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  return <AuthContext.Provider value={session}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
