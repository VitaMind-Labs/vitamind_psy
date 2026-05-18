"use client";

import { useSidebar } from "@/contexts/SidebarContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export function SidebarClient({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  const marginLeft = collapsed ? "72px" : "var(--sidebar-width)";

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div
        className="flex-1 flex flex-col min-h-screen w-full"
        style={{ marginLeft, transition: "margin-left 0.3s ease" }}
      >
        <Header />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
