import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { SessionTimeout } from "@/components/dashboard/session-timeout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-bg motion-page">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Topbar />
        <main className="p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
      <SessionTimeout />
    </div>
  );
}
