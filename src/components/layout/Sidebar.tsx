"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  ChevronRight,
  ChevronsUpDown,
  ClipboardCheck,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  NotebookPen,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  ShieldPlus,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { useSidebar } from "@/providers/SidebarProvider";
import { logoutPsychologist } from "@/features/auth/actions/auth";
import type { ClinicianRole, PsychologistProfile } from "@/lib/api/psychologist";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type NavItem = { icon: LucideIcon; label: string; path: string; badgeKey?: "alerts" | "notifications" };

const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/dashboard/overview" },
      { icon: AlertTriangle, label: "Alerts", path: "/dashboard/alerts", badgeKey: "alerts" },
      { icon: UsersRound, label: "Patients", path: "/dashboard/patients" },
      { icon: CalendarDays, label: "Sessions", path: "/dashboard/sessions" },
    ],
  },
  {
    label: "Clinical records",
    items: [
      { icon: ClipboardCheck, label: "Assessments", path: "/dashboard/assessments" },
      { icon: BarChart3, label: "Weekly reports", path: "/dashboard/reports" },
      { icon: NotebookPen, label: "Notes", path: "/dashboard/notes" },
    ],
  },
  {
    label: "Practice",
    items: [
      { icon: ShieldPlus, label: "Coverage", path: "/dashboard/coverage" },
      { icon: Bell, label: "Notifications", path: "/dashboard/notifications", badgeKey: "notifications" },
    ],
  },
];

const HIDDEN_BY_ROLE: Partial<Record<ClinicianRole, string[]>> = {
  CARE_COORDINATOR: ["/dashboard/overview", "/dashboard/alerts", "/dashboard/patients", "/dashboard/assessments", "/dashboard/reports", "/dashboard/notes"],
  NURSE: ["/dashboard/assessments", "/dashboard/reports", "/dashboard/notes"],
};

export const ROLE_LABELS: Record<ClinicianRole, string> = {
  PSYCHIATRIST: "Psychiatrist",
  PSYCHOLOGIST: "Psychologist",
  THERAPIST: "Therapist",
  NURSE: "Nurse",
  CARE_COORDINATOR: "Care coordinator",
};

export function displayNameOf(profile: PsychologistProfile) {
  return [profile.firstName, profile.lastName].filter(Boolean).join(" ") || profile.email;
}

export function initialsOf(name: string) {
  return name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
}

interface SidebarProps {
  profile: PsychologistProfile;
  counts: { alerts: number; notifications: number };
  /** Drawer variant always renders expanded, on a white surface. */
  variant?: "rail" | "drawer";
}

export function Sidebar({ profile, counts, variant = "rail" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { collapsed: railCollapsed, toggle, closeMobile } = useSidebar();
  const [loggingOut, setLoggingOut] = useState(false);
  const collapsed = variant === "rail" && railCollapsed;
  const hidden = HIDDEN_BY_ROLE[profile.role] ?? [];
  const displayName = displayNameOf(profile);
  const showTriage = counts.alerts > 0 && !hidden.includes("/dashboard/alerts");

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logoutPsychologist();
    } finally {
      router.replace("/signin");
      router.refresh();
    }
  };

  const withTooltip = (key: string, label: string, node: React.ReactNode) =>
    collapsed ? (
      <Tooltip key={key}>
        <TooltipTrigger asChild>{node}</TooltipTrigger>
        <TooltipContent side="right" className="bg-slate-900 text-xs font-medium text-white">
          {label}
        </TooltipContent>
      </Tooltip>
    ) : (
      node
    );

  const linkClass = (active: boolean) =>
    cn(
      "relative flex h-8 items-center gap-2.5 rounded-lg text-[13px] font-medium transition-colors",
      collapsed ? "mx-auto w-9 justify-center" : "px-2.5",
      active
        ? variant === "rail"
          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80"
          : "bg-slate-100 text-slate-900"
        : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900",
    );

  return (
    <TooltipProvider delayDuration={120}>
      <div className="flex h-full flex-col">
        {/* Workspace */}
        <div className={cn("flex h-14 shrink-0 items-center", collapsed ? "justify-center px-2" : "px-3")}>
          <Link
            href="/dashboard/overview"
            onClick={closeMobile}
            aria-label="VitaMind Psy overview"
            className={cn("flex min-w-0 items-center gap-2.5 rounded-lg p-1 transition-colors hover:bg-slate-200/50", !collapsed && "flex-1")}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-900 shadow-sm">
              <Image src="/logo.png" alt="" width={18} height={18} priority />
            </span>
            {!collapsed && (
              <span className="min-w-0 leading-tight">
                <span className="block truncate text-[13px] font-semibold text-slate-900">{profile.clinic?.name ?? "VitaMind Psy"}</span>
                <span className="block truncate text-[11px] text-slate-500">Clinical workspace</span>
              </span>
            )}
          </Link>
          {!collapsed && variant === "rail" && (
            <button
              type="button"
              onClick={toggle}
              aria-label="Collapse sidebar"
              className="ml-1 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-900"
            >
              <PanelLeftClose size={15} aria-hidden />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 pt-2" aria-label="Primary">
          {collapsed &&
            withTooltip(
              "expand",
              "Expand sidebar",
              <button type="button" onClick={toggle} aria-label="Expand sidebar" className={cn(linkClass(false), "mb-3 cursor-pointer")}>
                <PanelLeftOpen size={16} aria-hidden />
              </button>,
            )}
          {NAV_GROUPS.map((group) => {
            const items = group.items.filter((item) => !hidden.includes(item.path));
            if (items.length === 0) return null;
            return (
              <div key={group.label} className="mb-5 last:mb-0">
                {collapsed ? (
                  <div className="mx-auto mb-2 h-px w-5 bg-slate-200" aria-hidden />
                ) : (
                  <p className="mb-1 px-2.5 text-[11px] font-medium text-slate-500">{group.label}</p>
                )}
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const active = isActive(item.path);
                    const badge = item.badgeKey ? counts[item.badgeKey] : 0;
                    return (
                      <li key={item.path}>
                        {withTooltip(
                          item.path,
                          badge ? `${item.label} · ${badge}` : item.label,
                          <Link href={item.path} onClick={closeMobile} aria-current={active ? "page" : undefined} className={linkClass(active)}>
                            <span className="relative">
                              <item.icon size={16} strokeWidth={active ? 2.2 : 1.85} aria-hidden className={active ? "text-teal-700" : "text-slate-500"} />
                              {collapsed && badge > 0 && (
                                <span aria-hidden className={cn("absolute -right-1 -top-1 h-2 w-2 rounded-full ring-2 ring-slate-50", item.badgeKey === "alerts" ? "bg-red-500" : "bg-teal-600")} />
                              )}
                            </span>
                            {!collapsed && <span className="truncate">{item.label}</span>}
                            {!collapsed && badge > 0 && (
                              <span
                                className={cn(
                                  "tabular ml-auto min-w-5 rounded-md px-1.5 text-center text-[11px] font-semibold leading-5",
                                  item.badgeKey === "alerts" ? "bg-red-500 text-white" : "bg-slate-200/80 text-slate-700",
                                )}
                              >
                                {badge > 99 ? "99+" : badge}
                              </span>
                            )}
                          </Link>,
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="shrink-0 space-y-2 p-3">
          {showTriage && !collapsed && (
            <Link
              href="/dashboard/alerts?status=OPEN"
              onClick={closeMobile}
              className="group block rounded-xl border border-red-200 bg-gradient-to-b from-red-50 to-white p-3 transition-colors hover:border-red-300"
            >
              <p className="flex items-center gap-2 text-xs font-semibold text-red-800">
                <span className="relative flex h-2 w-2" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-60 motion-reduce:hidden" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
                </span>
                {counts.alerts} alert{counts.alerts === 1 ? "" : "s"} awaiting triage
              </p>
              <p className="mt-1 flex items-center gap-0.5 text-[11px] text-red-700/80">
                Open triage queue <ChevronRight size={12} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
              </p>
            </Link>
          )}

          {withTooltip(
            "settings",
            "Settings",
            <Link href="/dashboard/settings" onClick={closeMobile} aria-current={isActive("/dashboard/settings") ? "page" : undefined} className={linkClass(isActive("/dashboard/settings"))}>
              <Settings size={16} aria-hidden className={isActive("/dashboard/settings") ? "text-teal-700" : "text-slate-500"} />
              {!collapsed && "Settings"}
            </Link>,
          )}

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label="Account menu"
              className={cn(
                "flex w-full cursor-pointer items-center gap-2.5 rounded-xl p-1.5 text-left transition-colors hover:bg-slate-200/50 data-[state=open]:bg-slate-200/50",
                collapsed ? "justify-center" : "border border-slate-200/80 bg-white shadow-sm",
              )}
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-600 to-teal-800 text-[11px] font-semibold text-white">
                {initialsOf(displayName)}
              </span>
              {!collapsed && (
                <>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[13px] font-semibold text-slate-900">{displayName}</span>
                    <span className="block truncate text-[11px] text-slate-500">{ROLE_LABELS[profile.role]}</span>
                  </span>
                  <ChevronsUpDown size={14} aria-hidden className="shrink-0 text-slate-400" />
                </>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" className="w-64">
              <DropdownMenuLabel className="font-normal">
                <p className="truncate text-sm font-semibold text-slate-900">{displayName}</p>
                <p className="truncate text-xs text-slate-500">{profile.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onSelect={() => { closeMobile(); router.push("/dashboard/settings"); }}>
                <Settings size={15} aria-hidden /> Profile & settings
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer" onSelect={() => { closeMobile(); router.push("/dashboard/coverage"); }}>
                <LifeBuoy size={15} aria-hidden /> Coverage & support
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-700 focus:text-red-700" disabled={loggingOut} onSelect={handleLogout}>
                <LogOut size={15} aria-hidden /> {loggingOut ? "Signing out…" : "Sign out"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </TooltipProvider>
  );
}
