export const apiBase =
  (typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_URL : undefined) ||
  "";

export function apiUrl(path: string) {
  const p = path.startsWith("/") ? path : `/${path}`;
  return apiBase ? `${apiBase}${p}` : p;
}
