"use client";

import { useMemo, useState, useTransition, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { differenceInYears, format, formatDistanceToNowStrict } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpDown,
  ArrowUpRight,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ClipboardCheck,
  LayoutList,
  MoreHorizontal,
  Search,
  ShieldAlert,
  X,
} from "lucide-react";
import type { CaseloadItem, CaseloadQuery, PaginatedResponse, PatientListItem, PatientListQueryDto, PatientStatus } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KpiCell, KpiGrid, Segmented } from "@/components/layout/Kpi";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { DriftCell, PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { RiskBadge, TrafficLightBadge } from "@/features/risks/components/RiskBadge";
import { TRAFFIC_META } from "@/features/risks/lib/risk";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export type PatientsView = "directory" | "triage";

interface PatientsWorkspaceProps {
  view: PatientsView;
  summary: PaginatedResponse<CaseloadItem>;
  directory: PaginatedResponse<PatientListItem> | null;
  triage: PaginatedResponse<CaseloadItem> | null;
  directoryQuery: PatientListQueryDto;
  triageQuery: CaseloadQuery;
}

const STATUS_META: Record<PatientStatus, { label: string; variant: "success" | "default" | "warning" | "danger" }> = {
  ACTIVE: { label: "Active", variant: "success" },
  INACTIVE: { label: "Inactive", variant: "default" },
  SUSPENDED: { label: "Suspended", variant: "warning" },
  BLOCKED: { label: "Blocked", variant: "danger" },
};

const fullName = (item: { firstName: string; lastName: string | null }) => `${item.firstName}${item.lastName ? ` ${item.lastName}` : ""}`;
const worsened = (item: CaseloadItem) => item.previousTrafficLight !== null && TRAFFIC_META[item.trafficLight].rank < TRAFFIC_META[item.previousTrafficLight].rank;
const improved = (item: CaseloadItem) => item.previousTrafficLight !== null && TRAFFIC_META[item.trafficLight].rank > TRAFFIC_META[item.previousTrafficLight].rank;

export function PatientsWorkspace({ view, summary, directory, triage, directoryQuery, triageQuery }: PatientsWorkspaceProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState(searchParams.get("search") ?? "");

  const navigate = (updates: Record<string, string | null>, resetPage = true) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => (value === null || value === "" ? params.delete(key) : params.set(key, value)));
    if (resetPage && !("page" in updates)) params.delete("page");
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const switchView = (next: PatientsView) => {
    const params = new URLSearchParams();
    if (next === "triage") params.set("view", "triage");
    const search = searchParams.get("search");
    if (search) params.set("search", search);
    startTransition(() => router.push(`${pathname}?${params.toString()}`, { scroll: false }));
  };

  const onSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate({ search: query.trim() || null });
  };

  const kpi = useMemo(() => {
    const items = summary.data;
    const count = (light: CaseloadItem["trafficLight"]) => items.filter((item) => item.trafficLight === light).length;
    return {
      total: summary.meta.total,
      red: count("RED"),
      amber: count("AMBER"),
      green: count("GREEN"),
      worsened: items.filter(worsened).length,
      alerts: items.reduce((sum, item) => sum + item.openAlertCount, 0),
    };
  }, [summary]);

  const meta = view === "directory" ? directory?.meta : triage?.meta;
  const filtered = Boolean(searchParams.get("search") || searchParams.get("status") || searchParams.get("trafficLight"));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-700">Caseload</p>
          <h1 className="mt-1 text-[1.625rem] font-semibold leading-tight tracking-tight text-slate-900">Patients</h1>
          <p className="mt-1 text-sm text-slate-500">Your full patient directory and a risk-ranked triage view in one place.</p>
        </div>
        <Button size="sm" asChild>
          <Link href="/dashboard/sessions">
            <CalendarPlus size={14} aria-hidden /> Schedule session
          </Link>
        </Button>
      </div>

      <KpiGrid>
        <KpiCell label="Patients in caseload" value={kpi.total} hint={`${kpi.alerts} open alerts across caseload`} />
        <KpiCell label="Priority" value={kpi.red} tone={kpi.red > 0 ? "danger" : undefined} hint="Red traffic light" href="/dashboard/patients?view=triage&trafficLight=RED" />
        <KpiCell label="Watch" value={kpi.amber} tone={kpi.amber > 0 ? "warning" : undefined} hint="Amber traffic light" href="/dashboard/patients?view=triage&trafficLight=AMBER" />
        <KpiCell label="Worsened this week" value={kpi.worsened} hint={`${kpi.green} stable patients`} href="/dashboard/patients?view=triage&sort=risk" />
      </KpiGrid>

      <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        {/* View tabs */}
        <div className="flex items-center gap-1 border-b border-slate-100 px-3 pt-2" role="tablist" aria-label="Patient views">
          <ViewTab active={view === "directory"} onClick={() => switchView("directory")} icon={<LayoutList size={15} aria-hidden />} label="Directory" />
          <ViewTab
            active={view === "triage"}
            onClick={() => switchView("triage")}
            icon={<ShieldAlert size={15} aria-hidden />}
            label="Risk triage"
            badge={kpi.red > 0 ? <span className="tabular rounded-md bg-red-500 px-1.5 text-[11px] font-semibold leading-5 text-white">{kpi.red}</span> : undefined}
          />
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-3 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
          <form onSubmit={onSearch} role="search" className="relative w-full lg:max-w-xs">
            <Search size={15} aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or patient code…"
              aria-label="Search patients"
              className="input-ui h-9 rounded-lg pl-9 pr-8 text-[13px]"
            />
            {query && (
              <button type="button" aria-label="Clear search" onClick={() => { setQuery(""); navigate({ search: null }); }} className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={13} aria-hidden />
              </button>
            )}
          </form>

          <div className="flex flex-wrap items-center gap-2">
            {view === "directory" ? (
              <Segmented
                label="Filter by status"
                value={(directoryQuery.status ?? "ALL") as PatientStatus | "ALL"}
                onChange={(value) => navigate({ status: value === "ALL" ? null : value })}
                options={[
                  { value: "ALL", label: "All" },
                  { value: "ACTIVE", label: "Active" },
                  { value: "INACTIVE", label: "Inactive" },
                  { value: "SUSPENDED", label: "Suspended" },
                ]}
              />
            ) : (
              <>
                <Segmented
                  label="Filter by traffic light"
                  value={triageQuery.trafficLight ?? "ALL"}
                  onChange={(value) => navigate({ trafficLight: value === "ALL" ? null : value })}
                  options={[
                    { value: "ALL", label: "All" },
                    { value: "RED", label: "Priority", count: kpi.red },
                    { value: "AMBER", label: "Watch", count: kpi.amber },
                    { value: "GREEN", label: "Stable", count: kpi.green },
                  ]}
                />
                <Segmented
                  label="Sort triage"
                  value={triageQuery.sort ?? "risk"}
                  onChange={(value) => navigate({ sort: value === "risk" ? null : value })}
                  options={[
                    { value: "risk", label: "By risk" },
                    { value: "drift", label: "By drift" },
                  ]}
                />
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className={cn("overflow-x-auto border-t border-slate-100 transition-opacity", pending && "pointer-events-none opacity-60")} aria-busy={pending}>
          {view === "directory" && directory ? (
            <DirectoryTable rows={directory.data} query={directoryQuery} onSort={(sortBy, sortOrder) => navigate({ sortBy, sortOrder })} />
          ) : triage ? (
            <TriageTable rows={triage.data} />
          ) : null}

          {meta && meta.total === 0 && (
            <div className="p-6">
              <ChartEmpty
                title={filtered ? "No patients match these filters" : "No patients yet"}
                hint={filtered ? "Try a different search or filter." : "Patients assigned to you will appear here."}
                action={filtered ? <Button size="sm" variant="secondary" onClick={() => { setQuery(""); switchView(view); }}>Clear filters</Button> : undefined}
              />
            </div>
          )}
        </div>

        {/* Pagination */}
        {meta && meta.total > 0 && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-4 py-3 text-xs text-slate-500">
            <span className="tabular">
              Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="secondary" size="icon-sm" aria-label="Previous page" disabled={meta.page <= 1 || pending} onClick={() => navigate({ page: String(meta.page - 1) }, false)}>
                <ChevronLeft size={15} aria-hidden />
              </Button>
              <span className="tabular px-2">
                {meta.page} / {Math.max(meta.totalPages, 1)}
              </span>
              <Button variant="secondary" size="icon-sm" aria-label="Next page" disabled={meta.page >= meta.totalPages || pending} onClick={() => navigate({ page: String(meta.page + 1) }, false)}>
                <ChevronRight size={15} aria-hidden />
              </Button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ViewTab({ active, onClick, icon, label, badge }: { active: boolean; onClick: () => void; icon: ReactNode; label: string; badge?: ReactNode }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "relative -mb-px inline-flex cursor-pointer items-center gap-2 border-b-2 px-3 pb-2.5 pt-2 text-[13px] font-medium transition-colors",
        active ? "border-slate-900 text-slate-900" : "border-transparent text-slate-500 hover:text-slate-900",
      )}
    >
      {icon}
      {label}
      {badge}
    </button>
  );
}

const TH = "px-3 py-2.5 text-left text-xs font-medium text-slate-500";

function SortHeader({
  label,
  field,
  query,
  onSort,
  className,
}: {
  label: string;
  field: NonNullable<PatientListQueryDto["sortBy"]>;
  query: PatientListQueryDto;
  onSort: (sortBy: string, sortOrder: string) => void;
  className?: string;
}) {
  const active = query.sortBy === field;
  const Icon = !active ? ArrowUpDown : query.sortOrder === "asc" ? ChevronUp : ChevronDown;
  return (
    <th scope="col" aria-sort={active ? (query.sortOrder === "asc" ? "ascending" : "descending") : "none"} className={cn(TH, className)}>
      <button
        type="button"
        onClick={() => onSort(field, active && query.sortOrder === "desc" ? "asc" : "desc")}
        className={cn("inline-flex cursor-pointer items-center gap-1 rounded transition-colors hover:text-slate-900", active && "text-slate-900")}
      >
        {label}
        <Icon size={12} aria-hidden className={active ? "" : "text-slate-300"} />
      </button>
    </th>
  );
}

function DirectoryTable({ rows, query, onSort }: { rows: PatientListItem[]; query: PatientListQueryDto; onSort: (sortBy: string, sortOrder: string) => void }) {
  const router = useRouter();
  const now = useNow();
  if (rows.length === 0) return null;
  return (
    <table className="w-full min-w-[760px] text-sm">
      <thead className="bg-slate-50/60">
        <tr className="border-b border-slate-100">
          <SortHeader label="Patient" field="nickname" query={query} onSort={onSort} className="pl-5" />
          <th scope="col" className={TH}>Status</th>
          <th scope="col" className={TH}>Triage</th>
          <th scope="col" className={TH}>Age</th>
          <th scope="col" className={cn(TH, "hidden lg:table-cell")}>Last check-in</th>
          <SortHeader label="Last activity" field="lastActivityAt" query={query} onSort={onSort} />
          <SortHeader label="Last assessment" field="lastAssessmentAt" query={query} onSort={onSort} />
          <th scope="col" className={cn(TH, "hidden xl:table-cell")}>Shared with you</th>
          <th scope="col" className="w-12 pr-4"><span className="sr-only">Actions</span></th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((patient) => (
          <tr key={patient.id} className="group transition-colors hover:bg-slate-50/70">
            <td className="py-3 pl-5 pr-3">
              <Link href={`/dashboard/patients/${patient.id}`} className="flex items-center gap-3">
                <PatientAvatar name={fullName(patient)} />
                <span className="min-w-0">
                  <span className="block truncate font-medium text-slate-900 group-hover:text-teal-700">{fullName(patient)}</span>
                  <span className="block text-xs text-slate-500">{patient.patientCode}</span>
                </span>
              </Link>
            </td>
            <td className="px-3 py-3">
              <Badge variant={STATUS_META[patient.status].variant} dot>{STATUS_META[patient.status].label}</Badge>
            </td>
            <td className="px-3 py-3">
              <span className="flex items-center gap-2">
                {patient.trafficLight ? <TrafficLightBadge light={patient.trafficLight} /> : <span className="text-xs text-slate-400" title="The patient does not share mood data">Not shared</span>}
                {(patient.openAlerts ?? 0) > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700" title={`${patient.openAlerts} open alert${patient.openAlerts === 1 ? "" : "s"}`}>
                    <AlertTriangle size={11} aria-hidden /> {patient.openAlerts}
                  </span>
                )}
              </span>
            </td>
            <td className="tabular px-3 py-3 text-slate-600">{patient.dateOfBirth ? differenceInYears(now, new Date(patient.dateOfBirth)) : "—"}</td>
            <td className="hidden px-3 py-3 lg:table-cell">{patient.sharing?.mood ? <RelativeDate value={patient.lastCheckinAt ?? null} /> : <span className="text-xs text-slate-400">—</span>}</td>
            <td className="px-3 py-3"><RelativeDate value={patient.lastActivityAt} /></td>
            <td className="px-3 py-3"><RelativeDate value={patient.lastAssessmentAt} /></td>
            <td className="hidden px-3 py-3 xl:table-cell">
              {patient.sharing ? (
                <span className="flex flex-wrap gap-1">
                  {([["mood", patient.sharing.mood, "Mood"], ["sleep", patient.sharing.sleep, "Sleep"], ["diagnostics", patient.sharing.diagnostics, "Orientation"], ["medication", patient.sharing.medication, "Meds"], ["journal", patient.sharing.journal !== "NONE", patient.sharing.journal === "FULL" ? "Journal" : "Journal excerpts"]] as const)
                    .filter(([, on]) => on)
                    .map(([key, , label]) => (
                      <span key={key} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-medium text-slate-600">{label}</span>
                    ))}
                </span>
              ) : (
                <span className="text-xs text-slate-400">—</span>
              )}
            </td>
            <td className="py-3 pr-4 text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${fullName(patient)}`} className="opacity-60 group-hover:opacity-100">
                    <MoreHorizontal size={15} aria-hidden />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push(`/dashboard/patients/${patient.id}`)}><ArrowUpRight size={14} aria-hidden /> Open record</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push(`/dashboard/patients/${patient.id}?tab=life-chart`)}><Activity size={14} aria-hidden /> Life chart</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onSelect={() => router.push(`/dashboard/patients/${patient.id}?tab=assessments`)}><ClipboardCheck size={14} aria-hidden /> Assessments</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function TriageTable({ rows }: { rows: CaseloadItem[] }) {
  if (rows.length === 0) return null;
  return (
    <table className="w-full min-w-[960px] text-sm">
      <thead className="bg-slate-50/60">
        <tr className="border-b border-slate-100">
          <th scope="col" className={cn(TH, "pl-5")}>Patient</th>
          <th scope="col" className={TH}>Traffic light</th>
          <th scope="col" className={TH}>Risk</th>
          <th scope="col" className={TH}>Drift</th>
          <th scope="col" className={TH}>Latest alert</th>
          <th scope="col" className={cn(TH, "text-right")}>Open</th>
          <th scope="col" className={cn(TH, "pr-5 text-right")}>Last activity</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        {rows.map((item) => {
          const latest = [...item.alerts].sort((a, b) => b.triggeredAt.localeCompare(a.triggeredAt))[0];
          return (
            <tr key={item.id} className={cn("group transition-colors hover:bg-slate-50/70", item.trafficLight === "RED" && "bg-red-50/30")}>
              <td className="relative py-3 pl-5 pr-3">
                <span aria-hidden className="absolute inset-y-2 left-0 w-[3px] rounded-r-full" style={{ background: TRAFFIC_META[item.trafficLight].color }} />
                <Link href={`/dashboard/patients/${item.id}`} className="flex items-center gap-3">
                  <PatientAvatar name={fullName(item)} />
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900 group-hover:text-teal-700">{fullName(item)}</span>
                    <span className="block text-xs text-slate-500">{item.patientCode}</span>
                  </span>
                </Link>
              </td>
              <td className="px-3 py-3">
                <span className="flex items-center gap-1.5">
                  <TrafficLightBadge light={item.trafficLight} />
                  {worsened(item) && <ArrowDownRight size={14} aria-label={`Worsened from ${TRAFFIC_META[item.previousTrafficLight!].label}`} className="text-red-500" />}
                  {improved(item) && <ArrowUpRight size={14} aria-label={`Improved from ${TRAFFIC_META[item.previousTrafficLight!].label}`} className="text-emerald-600" />}
                </span>
              </td>
              <td className="px-3 py-3"><RiskBadge level={item.riskLevel} /></td>
              <td className="px-3 py-3"><DriftCell score={item.driftScore} level={item.driftLevel ?? item.riskLevel} /></td>
              <td className="max-w-56 px-3 py-3">
                {latest ? (
                  <span className="block min-w-0">
                    <span className="block truncate text-[13px] text-slate-800">{latest.title}</span>
                    <span className="block text-[11px] text-slate-500">{formatDistanceToNowStrict(new Date(latest.triggeredAt), { addSuffix: true })}</span>
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">No alerts</span>
                )}
              </td>
              <td className="tabular px-3 py-3 text-right">
                {item.openAlertCount > 0 ? (
                  <Link href="/dashboard/alerts?status=OPEN" className="inline-flex min-w-6 justify-center rounded-md bg-red-50 px-1.5 py-0.5 text-xs font-semibold text-red-700 ring-1 ring-inset ring-red-200 hover:bg-red-100">
                    {item.openAlertCount}
                  </Link>
                ) : (
                  <span className="text-slate-400">0</span>
                )}
              </td>
              <td className="py-3 pl-3 pr-5 text-right"><RelativeDate value={item.lastActivityAt} /></td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function RelativeDate({ value }: { value: string | null }) {
  if (!value) return <span className="text-xs text-slate-400">—</span>;
  const date = new Date(value);
  return (
    <time dateTime={value} title={format(date, "MMM d, yyyy · HH:mm")} className="text-xs text-slate-600">
      {formatDistanceToNowStrict(date, { addSuffix: true })}
    </time>
  );
}
