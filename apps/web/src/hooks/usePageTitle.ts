import { useEffect } from "react";

const SAFE_TITLE_REGEX = /[^a-zA-Z0-9\s\-–]/g;

export function useSafePageTitle(label: string) {
  useEffect(() => {
    if (!label) return;
    const safe = label.replace(SAFE_TITLE_REGEX, "").trim();
    const truncated = safe.length > 36 ? safe.slice(0, 36) + "…" : safe;
    document.title = `${truncated} — Canica`;
    return () => {
      document.title = "Canica";
    };
  }, [label]);
}

export function safeMetadata(label: string): { title: string } {
  const safe = label.replace(SAFE_TITLE_REGEX, "").trim();
  const truncated = safe.length > 36 ? safe.slice(0, 36) + "…" : safe;
  return { title: `${truncated} — Canica` };
}

export function PHI_SAFE_TITLE(label: string): string {
  return safeMetadata(label).title;
}
