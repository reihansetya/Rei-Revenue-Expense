import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BottomNav } from "@/components/layout/bottom-nav";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40 font-sans">
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-14 md:pl-0 md:flex-row">
        <Sidebar />
        <div className="flex flex-col sm:gap-4 sm:py-0 w-full md:flex-1 md:overflow-x-hidden">
          <Header />
          {/* pb-20 for mobile bottom nav, md:pb-0 for desktop */}
          <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8 pb-24 md:pb-0">
            {children}
          </main>
        </div>
      </div>
      <BottomNav />
      <PWAInstallPrompt />
    </div>
  );
}
