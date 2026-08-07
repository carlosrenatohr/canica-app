import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <div className="flex-1 overflow-y-auto">
        <Topbar />
        <main className="p-8 max-w-7xl mx-auto w-full">{children}</main>
      </div>
    </div>
  );
}
