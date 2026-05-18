"use client";

import { SidebarProvider } from "@/contexts/SidebarContext";
import { SidebarClient } from "./SidebarClient";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <SidebarClient>{children}</SidebarClient>
    </SidebarProvider>
  );
}
