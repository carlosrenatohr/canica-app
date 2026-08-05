import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canica",
  description: "Digital medical records for physicians",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
