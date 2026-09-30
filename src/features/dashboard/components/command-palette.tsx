"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { formatDistanceToNowStrict } from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  Bell,
  CalendarDays,
  ClipboardCheck,
  CornerDownLeft,
  LayoutDashboard,
  Loader2,
  LogOut,
  NotebookPen,
  Search,
  Settings,
  ShieldPlus,
  UserRound,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { logoutPsychologist } from "@/features/auth/actions/auth";
import { searchPatientsServer } from "@/features/patients/actions/patients";
import type { ClinicianRole, PaginatedResponse, PatientListItem } from "@/lib/api/psychologist";

const itemClass =
  "flex cursor-pointer select-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-slate-900 outline-none data-[selected=true]:bg-slate-100 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-slate-500";
const groupClass =
  "px-1.5 py-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-slate-500";

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Opens with ⌘K / Ctrl+K anywhere in the workspace. */
export function useCommandPaletteShortcut(onOpen: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onOpen]);
}

type NavItem = { icon: LucideIcon; label: string; path: string };

/** Mirrors the sidebar navigation so the palette only suggests reachable pages. */
const NAV_GROUPS: Array<{ label: string; items: NavItem[] }> = [
  {
    label: "Workspace",
    items: [
      { icon: LayoutDashboard, label: "Overview", path: "/dashboard/overview" },
      { icon: AlertTriangle, label: "Alerts", path: "/dashboard/alerts" },
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
      { icon: Bell, label: "Notifications", path: "/dashboard/notifications" },
      { icon: Settings, label: "Settings", path: "/dashboard/settings" },
    ],
  },
];

const HIDDEN_BY_ROLE: Partial<Record<ClinicianRole, string[]>> = {
  CARE_COORDINATOR: [
    "/dashboard/overview",
    "/dashboard/alerts",
    "/dashboard/patients",
    "/dashboard/assessments",
    "/dashboard/reports",
    "/dashboard/notes",
  ],
  NURSE: ["/dashboard/assessments", "/dashboard/reports", "/dashboard/notes"],
};

function fullNameOf(patient: PatientListItem) {
  return `${patient.firstName}${patient.lastName ? ` ${patient.lastName}` : ""}`;
}

/**
 * Global jump-to: pages the role can open, and a server-side patient search
 * (name / patient code) so it scales to any size caseload.
 */
export function CommandPalette({
  open,
  onOpenChange,
  role,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: ClinicianRole;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PaginatedResponse<PatientListItem> | null>(null);
  const [searchedTerm, setSearchedTerm] = useState("");
  const requestId = useRef(0);
  const term = useDebounced(query.trim(), 250);
  // Care coordinators have no access to the patient directory.
  const canSearchPatients = role !== "CARE_COORDINATOR" && term.length >= 2;
  const searching = open && canSearchPatients && searchedTerm !== term;

  useEffect(() => {
    if (!open || !canSearchPatients) return;
    const id = ++requestId.current;
    searchPatientsServer(term).then(
      (res) => {
        if (requestId.current === id) {
          setResults(res);
          setSearchedTerm(term);
        }
      },
      () => {
        if (requestId.current === id) setSearchedTerm(term);
      },
    );
  }, [open, term, canSearchPatients]);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setResults(null);
    setSearchedTerm("");
  };
  const go = (href: string) => {
    close();
    router.push(href);
  };
  const signOut = async () => {
    close();
    try {
      await logoutPsychologist();
    } finally {
      router.replace("/signin");
      router.refresh();
    }
  };

  const hidden = HIDDEN_BY_ROLE[role] ?? [];
  const needle = query.trim().toLowerCase();
  const pages = NAV_GROUPS.flatMap((g) =>
    g.items.filter((item) => !hidden.includes(item.path)).map((item) => ({ ...item, group: g.label })),
  ).filter(
    (item) => !needle || item.label.toLowerCase().includes(needle) || item.group.toLowerCase().includes(needle),
  );

  const total = results?.meta.total ?? 0;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="top-[18%] max-w-xl translate-y-0 gap-0 overflow-hidden p-0 [&>button:last-child]:hidden">
        <DialogTitle className="sr-only">Command palette</DialogTitle>
        <Command shouldFilter={false} loop className="flex flex-col">
          <div className="flex items-center gap-2.5 border-b border-slate-100 px-4">
            <Search size={16} aria-hidden className="shrink-0 text-slate-400" />
            <Command.Input
              value={query}
              onValueChange={setQuery}
              placeholder={
                role !== "CARE_COORDINATOR"
                  ? "Jump to a page or search patients by name / code…"
                  : "Jump to a page…"
              }
              className="h-12 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
            />
            {searching && <Loader2 size={16} aria-label="Searching" className="animate-spin text-slate-400" />}
            <kbd className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-slate-500">
              ESC
            </kbd>
          </div>
          <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto py-1">
            <Command.Empty className="px-4 py-10 text-center text-[13px] text-slate-500">
              {canSearchPatients && searching ? "Searching patients…" : "No matching pages or patients."}
            </Command.Empty>

            {canSearchPatients && (results?.data.length ?? 0) > 0 && (
              <Command.Group
                heading={`Patients · ${total} match${total === 1 ? "" : "es"}`}
                className={groupClass}
              >
                {results?.data.map((patient) => (
                  <Command.Item
                    key={patient.id}
                    value={`patient-${patient.id}`}
                    onSelect={() => go(`/dashboard/patients/${patient.id}`)}
                    className={itemClass}
                  >
                    <UserRound />
                    <span className="min-w-0 flex-1">
                      <span className="tabular font-medium">{patient.patientCode}</span>
                      <span className="ml-2 truncate text-slate-500">{fullNameOf(patient)}</span>
                    </span>
                    <span className="hidden text-xs text-slate-400 sm:inline">
                      {patient.lastActivityAt
                        ? formatDistanceToNowStrict(new Date(patient.lastActivityAt), { addSuffix: true })
                        : patient.status.charAt(0) + patient.status.slice(1).toLowerCase()}
                    </span>
                  </Command.Item>
                ))}
                {total > (results?.data.length ?? 0) && (
                  <Command.Item
                    value="patient-all"
                    onSelect={() => go(`/dashboard/patients?search=${encodeURIComponent(term)}`)}
                    className={itemClass}
                  >
                    <Search />
                    <span className="font-medium text-teal-700">See all {total} results in Patients</span>
                  </Command.Item>
                )}
              </Command.Group>
            )}

            {pages.length > 0 && (
              <Command.Group heading="Pages" className={groupClass}>
                {pages.map((item) => (
                  <Command.Item
                    key={item.path}
                    value={`page-${item.path}`}
                    onSelect={() => go(item.path)}
                    className={itemClass}
                  >
                    <item.icon />
                    <span className="flex-1">{item.label}</span>
                    <span className="text-xs text-slate-400">{item.group}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            {!needle && (
              <Command.Group heading="Account" className={groupClass}>
                <Command.Item value="settings" onSelect={() => go("/dashboard/settings")} className={itemClass}>
                  <Settings /> Profile & settings
                </Command.Item>
                <Command.Item value="sign-out" onSelect={() => void signOut()} className={itemClass}>
                  <LogOut /> Sign out
                </Command.Item>
              </Command.Group>
            )}
          </Command.List>
          <div className="flex items-center gap-4 border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">↑</kbd>
              <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="rounded border border-slate-200 bg-white px-1 font-sans">
                <CornerDownLeft size={10} aria-hidden className="inline" />
              </kbd>
              open
            </span>
            {role !== "CARE_COORDINATOR" && (
              <span className="ml-auto hidden sm:inline">Type 2+ characters to search patients</span>
            )}
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
