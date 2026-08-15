import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionTimeout } from "@/components/dashboard/session-timeout";
import { ThemeProvider } from "@/components/layout/theme-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-dvh min-h-0 bg-bg motion-page">
      <ThemeProvider>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-[var(--radius-button)] focus:bg-primary focus:px-4 focus:py-2 focus:text-button-text focus:shadow-lg focus:outline-none"
        >
          Saltar al contenido principal
        </a>
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Topbar />
          <main
            id="main-content"
            className="min-h-0 flex-1 overflow-y-auto"
            tabIndex={-1}
          >
            <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
              {children}
            </div>
          </main>
        </div>
        <SessionTimeout />
      </ThemeProvider>
    </div>
  );
}
