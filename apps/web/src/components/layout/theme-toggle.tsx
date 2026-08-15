"use client";

import { Button } from "@canica/ui";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { resolvedTheme, setPreference } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setPreference(nextTheme)}
      aria-label={`Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}`}
      title={`Cambiar a modo ${nextTheme === "dark" ? "oscuro" : "claro"}`}
    >
      {resolvedTheme === "dark" ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </Button>
  );
}
