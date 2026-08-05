import "./globals.css";
import { AuthProvider } from "@/providers/auth-provider";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canica",
  description: "Digital medical records for physicians",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
