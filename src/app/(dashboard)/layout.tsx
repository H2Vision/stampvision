import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-surface">

        {/* Desktop sidebar */}
        <Sidebar />

        {/* Mobile drawer (portal-like, outside flow) */}
        <MobileSidebar />

        {/* Main column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header userName="Patricia Díaz" userRole="Supervisora" />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            <div className="p-4 lg:p-6 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
}
