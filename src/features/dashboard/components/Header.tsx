"use client";

import { Fragment, useCallback, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, BarChart3, Bell, CalendarPlus, ChevronRight, Menu, Plus, Search, UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { useSidebar } from "@/providers/SidebarProvider";
import { CommandPalette, useCommandPaletteShortcut } from "@/features/dashboard/components/command-palette";
import type { PsychologistNotification, PsychologistProfile } from "@/lib/api/psychologist";
import { cn } from "@/lib/utils";

const SECTIONS: Record<string, string> = {
  overview: "Overview",
  alerts: "Alerts",
  patients: "Patients",
  assessments: "Assessments",
  reports: "Weekly reports",
  progress: "Progress",
  sessions: "Sessions",
  notes: "Notes",
  notifications: "Notifications",
  coverage: "Coverage",
  settings: "Settings",
};

const DETAIL_LABEL: Record<string, string> = {
  patients: "Patient record",
  assessments: "Assessment",
  reports: "Report",
};

function breadcrumbs(pathname: string) {
  const [, , section, detail] = pathname.split("/");
  const crumbs: Array<{ label: string; href?: string }> = [];
  if (section && SECTIONS[section]) crumbs.push({ label: SECTIONS[section], href: detail ? `/dashboard/${section}` : undefined });
  if (detail) crumbs.push({ label: DETAIL_LABEL[section] ?? "Details" });
  return crumbs.length ? crumbs : [{ label: "Overview" }];
}

interface HeaderProps {
  profile: PsychologistProfile;
  notifications: PsychologistNotification[];
  unreadCount: number;
  openAlertCount: number;
}

export function Header({ profile, notifications, unreadCount, openAlertCount }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toggle } = useSidebar();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const openPalette = useCallback(() => setPaletteOpen(true), []);
  useCommandPaletteShortcut(openPalette);
  const isCoordinator = profile.role === "CARE_COORDINATOR";
  const recent = notifications.slice(0, 6);
  const crumbs = breadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md md:rounded-t-2xl">
      <div className="flex h-14 items-center gap-3 px-4 md:px-6">
        <Button variant="ghost" size="icon-sm" onClick={toggle} aria-label="Open navigation" className="-ml-1 md:hidden">
          <Menu size={18} aria-hidden />
        </Button>

        <nav aria-label="Breadcrumb" className="min-w-0">
          <ol className="flex items-center gap-1.5 text-sm">
            <li className="hidden text-slate-500 sm:block">
              <Link href="/dashboard/overview" className="transition-colors hover:text-slate-900">Workspace</Link>
            </li>
            {crumbs.map((crumb, index) => (
              <Fragment key={crumb.label}>
                <li aria-hidden className={cn("text-slate-300", index === 0 && "hidden sm:block")}>
                  <ChevronRight size={14} />
                </li>
                <li className="truncate">
                  {crumb.href ? (
                    <Link href={crumb.href} className="text-slate-500 transition-colors hover:text-slate-900">{crumb.label}</Link>
                  ) : (
                    <span aria-current="page" className="font-medium text-slate-900">{crumb.label}</span>
                  )}
                </li>
              </Fragment>
            ))}
          </ol>
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search pages and patients"
            className="hidden h-8 w-56 cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/80 px-2.5 text-[13px] text-slate-400 transition-colors hover:border-slate-300 hover:text-slate-500 md:flex lg:w-64"
          >
            <Search size={14} aria-hidden />
            <span className="flex-1 text-left">Search pages, patients…</span>
            <kbd className="rounded border border-slate-200 bg-white px-1 font-sans text-[10px] font-medium text-slate-500">
              Ctrl K
            </kbd>
          </button>
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search"
            className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 md:hidden"
          >
            <Search size={16} aria-hidden />
          </button>

          {openAlertCount > 0 && !isCoordinator && (
            <Link
              href="/dashboard/alerts?status=OPEN"
              className="hidden h-8 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-2.5 text-xs font-semibold text-red-700 transition-colors hover:bg-red-100 sm:inline-flex"
            >
              <span className="relative flex h-1.5 w-1.5" aria-hidden>
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-70 motion-reduce:hidden" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500" />
              </span>
              <span className="tabular">{openAlertCount}</span> open
            </Link>
          )}

          <span aria-hidden className="mx-1 hidden h-5 w-px bg-slate-200 sm:block" />

          <LanguageSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="relative inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 data-[state=open]:bg-slate-100"
            >
              <Bell size={16} aria-hidden />
              {unreadCount > 0 && <span aria-hidden className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
                <p className="text-sm font-semibold text-slate-900">Notifications</p>
                {unreadCount > 0 && <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{unreadCount} unread</span>}
              </div>
              {recent.length === 0 ? (
                <p className="px-3.5 py-10 text-center text-sm text-slate-500">You&apos;re all caught up.</p>
              ) : (
                <div className="max-h-80 overflow-y-auto py-1">
                  {recent.map((item) => (
                    <DropdownMenuItem key={item.id} className="cursor-pointer items-start gap-2.5 rounded-none px-3.5 py-2.5" onSelect={() => router.push("/dashboard/notifications")}>
                      <span aria-hidden className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", item.read ? "bg-transparent" : "bg-teal-600")} />
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-[13px]", item.read ? "text-slate-600" : "font-medium text-slate-900")}>{item.title}</span>
                        <span className="block text-[11px] text-slate-500">{formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}</span>
                      </span>
                    </DropdownMenuItem>
                  ))}
                </div>
              )}
              <DropdownMenuSeparator className="my-0" />
              <DropdownMenuItem className="cursor-pointer justify-center rounded-none py-2.5 text-xs font-semibold text-teal-700" onSelect={() => router.push("/dashboard/notifications")}>
                View all notifications
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" className="ml-1 hidden sm:inline-flex">
                <Plus size={14} aria-hidden /> New
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-60">
              <DropdownMenuLabel className="text-xs font-medium text-slate-500">Create</DropdownMenuLabel>
              <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/dashboard/sessions")}>
                <CalendarPlus size={15} aria-hidden /> Session
              </DropdownMenuItem>
              {!isCoordinator && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs font-medium text-slate-500">Go to</DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/dashboard/alerts")}>
                    <AlertTriangle size={15} aria-hidden /> Triage alerts
                    {openAlertCount > 0 && <DropdownMenuShortcut className="tabular text-red-600">{openAlertCount}</DropdownMenuShortcut>}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/dashboard/patients?view=triage")}>
                    <UsersRound size={15} aria-hidden /> Risk triage
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push("/dashboard/reports")}>
                    <BarChart3 size={15} aria-hidden /> Weekly reports
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} role={profile.role} />
    </header>
  );
}
