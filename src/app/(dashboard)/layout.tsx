import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar, MobileSidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileBottomNav } from "@/components/layout/mobile-bottom-nav";

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

        {/* Mobile drawer */}
        <MobileSidebar />

        {/* Main column */}
        <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
          <Header userName="Patricia Díaz" userRole="Supervisora" />

          <main className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* pb-20 on mobile to avoid content hidden behind bottom nav */}
            <div className="p-4 pb-24 lg:pb-6 lg:p-6 max-w-[1600px] mx-auto">
              {children}
            </div>
          </main>
        </div>

      </div>

      {/* Mobile bottom navigation bar */}
      <MobileBottomNav />
    </SidebarProvider>
  );
}
