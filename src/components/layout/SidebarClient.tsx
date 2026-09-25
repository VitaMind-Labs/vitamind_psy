"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Phone } from "lucide-react";
import { useSidebar } from "@/providers/SidebarProvider";
import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/features/dashboard/components/Header";
import type { PsychologistNotification, PsychologistProfile } from "@/lib/api/psychologist";
import { cn } from "@/lib/utils";

interface SidebarClientProps {
  children: React.ReactNode;
  profile: PsychologistProfile;
  notifications: PsychologistNotification[];
  unreadCount: number;
  openAlertCount: number;
}

export function SidebarClient({ children, profile, notifications, unreadCount, openAlertCount }: SidebarClientProps) {
  const { collapsed, mobileOpen, closeMobile } = useSidebar();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement>(null);
  const counts = { alerts: openAlertCount, notifications: unreadCount };

  // The inset panel is the scroll container on desktop, so reset it on navigation.
  useEffect(() => {
    closeMobile();
    scrollRef.current?.scrollTo({ top: 0 });
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && closeMobile();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, closeMobile]);

  return (
    <div className="min-h-dvh bg-[#f4f5f7] md:h-dvh md:overflow-hidden">
      {/* Desktop rail — sits on the app canvas, no border */}
      <aside
        aria-label="Primary navigation"
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden transition-[width] duration-200 ease-out md:block",
          collapsed ? "w-[var(--sidebar-w-collapsed)]" : "w-[var(--sidebar-w)]",
        )}
      >
        <Sidebar profile={profile} counts={counts} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="scrim"
              aria-hidden
              onClick={closeMobile}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px] md:hidden"
            />
            <motion.aside
              key="drawer"
              role="dialog"
              aria-modal="true"
              aria-label="Navigation"
              initial={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "-100%" }}
              transition={{ type: "tween", duration: 0.22, ease: "easeOut" }}
              className="fixed inset-y-0 left-0 z-50 w-[min(var(--sidebar-w),85vw)] bg-white shadow-xl md:hidden"
            >
              <Sidebar profile={profile} counts={counts} variant="drawer" />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Inset content panel */}
      <div
        className={cn(
          "transition-[padding] duration-200 ease-out md:h-dvh md:py-2 md:pr-2",
          collapsed ? "md:pl-[var(--sidebar-w-collapsed)]" : "md:pl-[var(--sidebar-w)]",
        )}
      >
        <div
          ref={scrollRef}
          className="flex min-h-dvh flex-col bg-white md:h-full md:min-h-0 md:overflow-y-auto md:rounded-2xl md:border md:border-slate-200/80 md:shadow-[0_1px_3px_rgba(15,23,42,0.05)]"
        >
          <Header profile={profile} notifications={notifications} unreadCount={unreadCount} openAlertCount={openAlertCount} />
          {profile.clinic?.emergencyNumber && (
            <div className="flex items-center justify-center gap-2 border-b border-amber-200/70 bg-amber-50/70 px-4 py-1.5 text-center text-xs text-amber-900">
              <Phone size={12} aria-hidden className="shrink-0" />
              Messaging is not monitored outside sessions. Emergencies:
              <a href={`tel:${profile.clinic.emergencyNumber}`} className="font-semibold underline underline-offset-2">
                {profile.clinic.emergencyNumber}
              </a>
            </div>
          )}
          <main id="main" className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8 md:py-7">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
