"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { format, formatDistanceStrict, formatDistanceToNowStrict } from "date-fns";
import { toast } from "sonner";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CalendarPlus, Check, CheckCircle2, ChevronDown, ChevronRight, Clock3, Inbox, PhoneCall, RotateCcw, Search, ShieldCheck, XCircle } from "lucide-react";
import type { AlertResolution, AlertStatus, ClinicalAlert, PaginatedResponse, RiskLevel } from "@/lib/api/psychologist";
import { acknowledgeAlertAction, proposeSessionAction, resolveAlertAction } from "@/features/dashboard/actions/clinical";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { KpiCell, KpiGrid, Panel, RatioBar, Segmented } from "@/components/layout/Kpi";
import { ChartTooltipShell } from "@/features/dashboard/components/overview/cards";
import { RiskBadge } from "@/features/risks/components/RiskBadge";
import { ALERT_STATUS_META, RISK_META, RISK_ORDER, isUrgent } from "@/features/risks/lib/risk";
import { bucketByDay, bucketSeriesByDay, windowDelta } from "@/features/dashboard/lib/metrics";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

type StatusFilter = "ALL" | Extract<AlertStatus, "OPEN" | "ACKNOWLEDGED" | "ESCALATED" | "RESOLVED">;

const RESOLUTIONS: Array<{ value: Exclude<AlertResolution, "UNRESOLVED">; label: string; icon: typeof Check }> = [
  { value: "GROUNDING_COMPLETED", label: "Grounding completed", icon: CheckCircle2 },
  { value: "CONTACT_MADE", label: "Contact made", icon: PhoneCall },
  { value: "FALSE_ALERT", label: "False alert", icon: XCircle },
];

const RESOLUTION_LABEL: Record<AlertResolution, string> = {
  GROUNDING_COMPLETED: "Grounding completed",
  CONTACT_MADE: "Contact made",
  FALSE_ALERT: "False alert",
  UNRESOLVED: "Escalated as unresolved",
};

const isClosed = (status: AlertStatus) => status === "RESOLVED" || status === "DISMISSED";
const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();

function median(values: number[]) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function formatDuration(ms: number) {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) return { value: minutes, unit: "min" };
  const hours = ms / 3_600_000;
  if (hours < 48) return { value: Number(hours.toFixed(1)), unit: "h" };
  return { value: Math.round(hours / 24), unit: "d" };
}

export function AlertsCenter({ initialData, initialStatus = "ALL" }: { initialData: PaginatedResponse<ClinicalAlert>; initialStatus?: StatusFilter }) {
  const router = useRouter();
  const now = useNow();
  const [alerts, setAlerts] = useState(initialData.data);
  const [synced, setSynced] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(initialStatus);
  const [severityFilter, setSeverityFilter] = useState<"ALL" | RiskLevel>("ALL");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const seenAlerts = useRef(new Set(initialData.data.map((alert) => alert.id)));

  // Server refreshes deliver a new `initialData`; adopt it instead of keeping stale local state.
  if (synced !== initialData) {
    setSynced(initialData);
    setAlerts(initialData.data);
  }

  // Alerts are fetched server-side only: refresh the server data on an interval and toast new high-severity alerts.
  useEffect(() => {
    const timer = window.setInterval(() => router.refresh(), 30000);
    return () => window.clearInterval(timer);
  }, [router]);

  useEffect(() => {
    const fresh = initialData.data.filter((alert) => !seenAlerts.current.has(alert.id));
    fresh.forEach((alert) => {
      seenAlerts.current.add(alert.id);
      if (alert.severity === "HIGH" || alert.severity === "CRITICAL") toast.warning(`${RISK_META[alert.severity].label} · ${alert.title}`);
    });
  }, [initialData]);

  const updateAlert = useCallback(
    (id: string, update: Partial<ClinicalAlert>) => setAlerts((current) => current.map((item) => (item.id === id ? { ...item, ...update } : item))),
    [],
  );

  const run = async (alert: ClinicalAlert, task: () => Promise<void>, failure: string) => {
    setBusy(alert.id);
    try {
      await task();
    } catch {
      toast.error(failure);
    } finally {
      setBusy(null);
    }
  };

  const acknowledge = (alert: ClinicalAlert) =>
    run(alert, async () => {
      updateAlert(alert.id, await acknowledgeAlertAction(alert.id));
      toast.success("Alert acknowledged");
    }, "Could not acknowledge this alert");

  const resolve = (alert: ClinicalAlert, resolution: AlertResolution) =>
    run(alert, async () => {
      updateAlert(alert.id, await resolveAlertAction(alert.id, resolution));
      toast.success(resolution === "UNRESOLVED" ? "Alert escalated" : "Alert resolved");
    }, "Could not update this alert");

  const propose = (alert: ClinicalAlert) =>
    run(alert, async () => {
      await proposeSessionAction(alert.id);
      toast.success("An earlier session was proposed to the patient");
    }, "Could not propose the session");

  const stats = useMemo(() => {
    const count = (predicate: (alert: ClinicalAlert) => boolean) => alerts.filter(predicate).length;
    const active = alerts.filter((alert) => !isClosed(alert.status));
    const ackTimes = alerts.filter((alert) => alert.acknowledgedAt).map((alert) => +new Date(alert.acknowledgedAt!) - +new Date(alert.triggeredAt));
    const resolved = alerts.filter((alert) => alert.resolvedAt);
    return {
      open: count((alert) => alert.status === "OPEN"),
      activeUrgent: active.filter((alert) => isUrgent(alert.severity)).length,
      newDelta: windowDelta(alerts, (alert) => alert.triggeredAt, 7, now),
      newSpark: bucketByDay(alerts, (alert) => alert.triggeredAt, 14, now).map((row) => row.value),
      ackMedian: median(ackTimes),
      resolvedDelta: windowDelta(resolved, (alert) => alert.resolvedAt, 7, now),
      resolvedSpark: bucketByDay(resolved, (alert) => alert.resolvedAt, 14, now).map((row) => row.value),
      severityMix: RISK_ORDER.map((level) => ({ label: RISK_META[level].label, value: active.filter((alert) => alert.severity === level).length, color: RISK_META[level].color })),
      byDay: bucketSeriesByDay(alerts, (alert) => alert.triggeredAt, (alert) => alert.severity, RISK_ORDER, 14, now),
      counts: {
        ALL: alerts.length,
        OPEN: count((alert) => alert.status === "OPEN"),
        ACKNOWLEDGED: count((alert) => alert.status === "ACKNOWLEDGED"),
        ESCALATED: count((alert) => alert.status === "ESCALATED"),
        RESOLVED: count((alert) => alert.status === "RESOLVED"),
      },
    };
  }, [alerts, now]);

  const queue = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return alerts
      .filter(
        (alert) =>
          (statusFilter === "ALL" || alert.status === statusFilter) &&
          (severityFilter === "ALL" || alert.severity === severityFilter) &&
          (!needle || `${alert.title} ${alert.patientCode ?? ""} ${alert.patientName ?? ""}`.toLowerCase().includes(needle)),
      )
      .sort(
        (a, b) =>
          Number(isClosed(a.status)) - Number(isClosed(b.status)) ||
          RISK_META[a.severity].rank - RISK_META[b.severity].rank ||
          +new Date(b.triggeredAt) - +new Date(a.triggeredAt),
      );
  }, [alerts, statusFilter, severityFilter, query]);

  const selected = queue.find((alert) => alert.id === selectedId) ?? queue[0] ?? null;
  const ack = stats.ackMedian === null ? null : formatDuration(stats.ackMedian);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-700">Real-time monitoring</p>
          <h1 className="mt-1 text-[1.625rem] font-semibold leading-tight tracking-tight text-slate-900">Alert center</h1>
          <p className="mt-1 text-sm text-slate-500">Urgent signals are triaged here first. They should never wait for the weekly report.</p>
        </div>
        <span className="inline-flex h-8 items-center gap-2 self-start rounded-lg border border-slate-200/80 bg-white px-3 text-xs font-medium text-slate-600 shadow-sm lg:self-auto">
          <span className="relative flex h-2 w-2" aria-hidden>
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          Live · auto-refresh 30s
        </span>
      </div>

      <KpiGrid>
        <KpiCell
          label="Open alerts"
          value={stats.open}
          tone={stats.activeUrgent > 0 ? "danger" : undefined}
          delta={{ pct: stats.newDelta.pct, goodWhen: "down", caption: `${stats.newDelta.current} new this week` }}
          spark={stats.newSpark}
          sparkColor="#f97316"
        />
        <KpiCell label="High or critical" value={stats.activeUrgent} tone={stats.activeUrgent > 0 ? "danger" : undefined} hint="Active, not yet resolved" />
        <KpiCell label="Median time to acknowledge" value={ack ? ack.value : "—"} unit={ack?.unit} hint="Across acknowledged alerts" icon={<Clock3 size={15} aria-hidden />} />
        <KpiCell
          label="Resolved this week"
          value={stats.resolvedDelta.current}
          delta={{ pct: stats.resolvedDelta.pct, goodWhen: "up", caption: "vs last week" }}
          spark={stats.resolvedSpark}
          sparkColor="#10b981"
        />
      </KpiGrid>

      {/* Inbox */}
      <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 xl:flex-row xl:items-center xl:justify-between">
          <Segmented
            label="Filter by status"
            value={statusFilter}
            onChange={setStatusFilter}
            options={(["ALL", "OPEN", "ACKNOWLEDGED", "ESCALATED", "RESOLVED"] as const).map((value) => ({
              value,
              label: value === "ALL" ? "All" : ALERT_STATUS_META[value].label,
              count: stats.counts[value],
            }))}
          />
          <div className="flex items-center gap-2">
            <div className="relative flex-1 xl:w-60 xl:flex-none">
              <Search size={14} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by patient or title" aria-label="Filter alerts" className="input-ui h-8 rounded-lg pl-8 text-[13px]" />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className="toolbar-pill h-8 rounded-lg text-xs">
                {severityFilter === "ALL" ? "Severity" : RISK_META[severityFilter].label}
                <ChevronDown size={13} aria-hidden />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {(["ALL", ...RISK_ORDER] as const).map((value) => (
                  <DropdownMenuItem key={value} className="cursor-pointer" onSelect={() => setSeverityFilter(value)}>
                    {value !== "ALL" && <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: RISK_META[value].color }} />}
                    {value === "ALL" ? "All severities" : RISK_META[value].label}
                    {severityFilter === value && <Check size={14} aria-hidden className="ml-auto text-teal-700" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {queue.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200">
              <ShieldCheck size={20} aria-hidden />
            </span>
            <p className="mt-3 font-semibold text-slate-900">Nothing to triage</p>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {statusFilter === "ALL" && severityFilter === "ALL" && !query ? "The queue is calm. Trends will surface in weekly reports." : "No alerts match these filters."}
            </p>
            {(statusFilter !== "ALL" || severityFilter !== "ALL" || query) && (
              <Button size="sm" variant="secondary" className="mt-4" onClick={() => { setStatusFilter("ALL"); setSeverityFilter("ALL"); setQuery(""); }}>
                Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid lg:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
            {/* List */}
            <ul role="listbox" aria-label="Alerts" className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto border-slate-100 lg:border-r">
              {queue.map((alert) => {
                const active = selected?.id === alert.id;
                const closed = isClosed(alert.status);
                return (
                  <li key={alert.id} role="option" aria-selected={active}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(alert.id)}
                      className={cn("relative flex w-full cursor-pointer gap-3 px-4 py-3 text-left transition-colors", active ? "bg-slate-50" : "hover:bg-slate-50/60", closed && "opacity-60")}
                    >
                      {active && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-slate-900" />}
                      <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: closed ? "#cbd5e1" : RISK_META[alert.severity].color }} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span className={cn("truncate text-[13px]", alert.status === "OPEN" ? "font-semibold text-slate-900" : "font-medium text-slate-700")}>{alert.title}</span>
                          <time dateTime={alert.triggeredAt} className="shrink-0 text-[11px] text-slate-500">
                            {formatDistanceToNowStrict(new Date(alert.triggeredAt))}
                          </time>
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span className="truncate">{alert.patientCode ?? "Patient"}{alert.patientName ? ` · ${alert.patientName}` : ""}</span>
                          <span aria-hidden>·</span>
                          <span className="shrink-0">{ALERT_STATUS_META[alert.status].label}</span>
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            {/* Detail */}
            <AnimatePresence mode="wait" initial={false}>
              {selected && (
                <motion.div
                  key={selected.id}
                  initial={{ opacity: 0, x: 6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="flex min-w-0 flex-col border-t border-slate-100 lg:border-t-0"
                >
                  <AlertDetail
                    alert={selected}
                    pending={busy === selected.id}
                    onAcknowledge={() => acknowledge(selected)}
                    onResolve={(resolution) => resolve(selected, resolution)}
                    onPropose={() => propose(selected)}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </section>

      {/* Analytics */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Alert volume" description="New alerts per day by severity · last 14 days">
          <div className="h-56 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <BarChart data={stats.byDay} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap="30%">
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                <Tooltip content={<ChartTooltipShell />} cursor={{ fill: "rgba(241,245,249,0.8)" }} />
                {[...RISK_ORDER].reverse().map((level, index) => (
                  <Bar key={level} dataKey={level} name={RISK_META[level].label} stackId="s" fill={RISK_META[level].color} radius={index === RISK_ORDER.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={26} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
        <Panel title="Active severity" description="Open, acknowledged and escalated">
          <RatioBar segments={stats.severityMix} />
          <p className="mt-5 flex items-start gap-2 border-t border-slate-100 pt-4 text-xs text-slate-500">
            <Clock3 size={14} aria-hidden className="mt-px shrink-0" />
            Every action, consultation and export is logged for audit.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function AlertDetail({
  alert,
  pending,
  onAcknowledge,
  onResolve,
  onPropose,
}: {
  alert: ClinicalAlert;
  pending: boolean;
  onAcknowledge: () => void;
  onResolve: (resolution: AlertResolution) => void;
  onPropose: () => void;
}) {
  const closed = isClosed(alert.status);
  const events = [
    { label: "Triggered", at: alert.triggeredAt, done: true },
    { label: "Acknowledged", at: alert.acknowledgedAt, done: Boolean(alert.acknowledgedAt) },
    { label: alert.resolution ? RESOLUTION_LABEL[alert.resolution] : "Resolved", at: alert.resolvedAt, done: Boolean(alert.resolvedAt) },
  ];

  return (
    <>
      <div className="border-b border-slate-100 p-5">
        <div className="flex flex-wrap items-center gap-2">
          <RiskBadge level={alert.severity} />
          <Badge variant={ALERT_STATUS_META[alert.status].variant}>{ALERT_STATUS_META[alert.status].label}</Badge>
          {alert.escalationLevel > 0 && <Badge variant="high">Escalation level {alert.escalationLevel}</Badge>}
          <span className="text-xs text-slate-500">{humanize(alert.type)}</span>
        </div>
        <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900">{alert.title}</h2>
        {alert.description && <p className="mt-1.5 text-sm leading-6 text-slate-600">{alert.description}</p>}

        {alert.patientCode && (
          <Link
            href={`/dashboard/patients/${alert.userId}`}
            className="group mt-4 flex items-center gap-3 rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 transition-colors hover:border-slate-300 hover:bg-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
              {(alert.patientName ?? alert.patientCode).slice(0, 2).toUpperCase()}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-slate-900">{alert.patientName ?? "Patient"}</span>
              <span className="block text-xs text-slate-500">{alert.patientCode} · open patient record</span>
            </span>
            <ChevronRight size={16} aria-hidden className="text-slate-400 transition-transform group-hover:translate-x-0.5" />
          </Link>
        )}
      </div>

      <div className="grid flex-1 gap-6 p-5 md:grid-cols-2">
        <div>
          <h3 className="text-xs font-medium text-slate-500">Signal context</h3>
          {alert.context && Object.keys(alert.context).length > 0 ? (
            <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
              {Object.entries(alert.context).map(([key, value]) => (
                <div key={key} className="bg-white px-3 py-2.5">
                  <dt className="truncate text-[11px] capitalize text-slate-500">{humanize(key)}</dt>
                  <dd className="tabular mt-0.5 truncate text-sm font-semibold text-slate-900">{typeof value === "object" ? JSON.stringify(value) : String(value)}</dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No additional context attached.</p>
          )}
          {alert.resolutionNote && (
            <div className="mt-4 rounded-xl border border-slate-200/80 bg-slate-50 p-3">
              <p className="text-xs font-medium text-slate-500">Resolution note</p>
              <p className="mt-1 text-sm text-slate-700">{alert.resolutionNote}</p>
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xs font-medium text-slate-500">Timeline</h3>
          <ol className="mt-3 space-y-4">
            {events.map((event, index) => (
              <li key={event.label} className="relative flex gap-3">
                {index < events.length - 1 && <span aria-hidden className={cn("absolute left-[7px] top-5 h-[calc(100%+4px)] w-px", events[index + 1].done ? "bg-teal-300" : "bg-slate-200")} />}
                <span
                  aria-hidden
                  className={cn("relative mt-0.5 flex h-[15px] w-[15px] shrink-0 items-center justify-center rounded-full ring-4 ring-white", event.done ? "bg-teal-600" : "border border-slate-300 bg-white")}
                >
                  {event.done && <Check size={9} className="text-white" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-[13px] font-medium", event.done ? "text-slate-900" : "text-slate-400")}>{event.label}</span>
                  <span className="block text-xs text-slate-500">
                    {event.at
                      ? `${format(new Date(event.at), "MMM d, HH:mm")}${index > 0 ? ` · after ${formatDistanceStrict(new Date(event.at), new Date(alert.triggeredAt))}` : ""}`
                      : "Pending"}
                  </span>
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {!closed ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">
          {alert.status === "OPEN" && (
            <Button size="sm" loading={pending} onClick={onAcknowledge}>
              {!pending && <Check size={14} aria-hidden />} Acknowledge
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant={alert.status === "OPEN" ? "secondary" : "primary"} disabled={pending}>
                Resolve <ChevronDown size={13} aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {RESOLUTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem key={value} className="cursor-pointer" onSelect={() => onResolve(value)}>
                  <Icon size={14} aria-hidden /> {label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-orange-700 focus:text-orange-700" onSelect={() => onResolve("UNRESOLVED")}>
                <RotateCcw size={14} aria-hidden /> Escalate as unresolved
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" disabled={pending} onClick={onPropose}>
            <CalendarPlus size={14} aria-hidden /> Propose earlier session
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2 border-t border-slate-100 bg-emerald-50/50 px-5 py-3 text-xs font-medium text-emerald-800">
          <Inbox size={14} aria-hidden /> This alert is closed.
        </div>
      )}
    </>
  );
}
