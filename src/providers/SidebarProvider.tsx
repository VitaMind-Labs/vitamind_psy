"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useLocalStorage } from "@/hooks/use-local-storage";

interface SidebarContextType {
  /** Desktop rail collapsed to icons. */
  collapsed: boolean;
  /** Mobile drawer visibility. */
  mobileOpen: boolean;
  isMobile: boolean;
  /** Collapses the rail on desktop, opens the drawer on mobile. */
  toggle: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export function SidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsedPref, setCollapsedPref] = useLocalStorage("vm.sidebar.collapsed", "0", ["0", "1"]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggle = useCallback(() => {
    if (isMobile) setDrawerOpen((open) => !open);
    else setCollapsedPref(collapsedPref === "1" ? "0" : "1");
  }, [isMobile, collapsedPref, setCollapsedPref]);

  const closeMobile = useCallback(() => setDrawerOpen(false), []);

  const value = useMemo(
    () => ({
      collapsed: collapsedPref === "1" && !isMobile,
      // Derived: the drawer can only be open below the md breakpoint.
      mobileOpen: drawerOpen && isMobile,
      isMobile,
      toggle,
      closeMobile,
    }),
    [collapsedPref, drawerOpen, isMobile, toggle, closeMobile],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar() {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}
