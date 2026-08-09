export const apiBase =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
  "";

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  if (!apiBase) return p;
  const apiPath = p.startsWith("/api/auth/") ? p : p.replace(/^\/api(?=\/)/, "");
  return `${apiBase}${apiPath}`;
}

export function apiFetch(path: string, init?: RequestInit) {
  return fetch(apiUrl(path), {
    ...init,
    credentials: "include",
  });
}
