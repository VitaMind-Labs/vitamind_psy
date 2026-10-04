"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict, isToday, isTomorrow } from "date-fns";
import { Bar, CartesianGrid, ComposedChart, Area, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowDownRight, CalendarPlus, ChevronRight, ClipboardCheck, FileText, TrendingDown } from "lucide-react";
import type { CaseloadItem, ClinicalAlert, DashboardResponse, SessionListItem, WeeklyReport } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { KpiCell, KpiGrid, Panel, PanelLink, RatioBar, Segmented } from "@/components/layout/Kpi";
import { ChartTooltipShell, ListEmpty } from "@/features/dashboard/components/overview/cards";
import { RiskBadge, TrafficLightBadge } from "@/features/risks/components/RiskBadge";
import { RISK_META, TRAFFIC_META, isUrgent } from "@/features/risks/lib/risk";
import { bucketByDay, bucketSeriesByDay, windowDelta } from "@/features/dashboard/lib/metrics";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

export interface PracticeOverviewData {
  dashboard: DashboardResponse;
  caseload: CaseloadItem[];
  sessions: SessionListItem[];
  alerts: ClinicalAlert[];
  /** Open alerts across the whole caseload (the `alerts` list is capped). */
  openAlertTotal: number;
  reports: WeeklyReport[];
  clinicianName: string;
}

type Range = "7" | "30" | "90";
type Metric = "sessions" | "alerts" | "activity";

const RANGES = [
  { value: "7", label: "7D" },
  { value: "30", label: "30D" },
  { value: "90", label: "90D" },
] as const;

const SEVERITY_KEYS = ["CRITICAL", "HIGH", "MODERATE", "LOW"] as const;
const SESSION_KEYS = ["COMPLETED", "SCHEDULED", "MISSED"] as const;

const isWorsening = (item: CaseloadItem) =>
  item.previousTrafficLight !== null && TRAFFIC_META[item.trafficLight].rank < TRAFFIC_META[item.previousTrafficLight].rank;

const fullName = (item: { firstName: string; lastName: string | null }) => `${item.firstName}${item.lastName ? ` ${item.lastName}` : ""}`;

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function sessionBucket(session: SessionListItem): (typeof SESSION_KEYS)[number] | null {
  if (session.status === "COMPLETED") return "COMPLETED";
  if (session.status === "NO_SHOW" || session.status === "CANCELLED") return "MISSED";
  return "SCHEDULED";
}

export function PracticeOverview({ data }: { data: PracticeOverviewData }) {
  const { dashboard, caseload, sessions, alerts, openAlertTotal, reports, clinicianName } = data;
  const now = useNow();
  const [range, setRange] = useState<Range>("30");
  const [metric, setMetric] = useState<Metric>("sessions");
  const days = Number(range);

  const kpis = useMemo(() => {
    const openAlerts = alerts.filter((alert) => alert.status === "OPEN");
    const completed = sessions.filter((session) => session.status === "COMPLETED");
    const pendingReports = reports.filter((report) => report.status !== "RELEASED" && !report.acknowledgedAt);
    const sparkDays = Math.min(days, 30);
    return {
      openAlerts: openAlertTotal,
      urgentOpen: openAlerts.filter((alert) => isUrgent(alert.severity)).length,
      alertDelta: windowDelta(alerts, (alert) => alert.triggeredAt, days, now),
      alertSpark: bucketByDay(alerts, (alert) => alert.triggeredAt, sparkDays, now).map((row) => row.value),
      sessionDelta: windowDelta(completed, (session) => session.scheduledAt, days, now),
      sessionSpark: bucketByDay(completed, (session) => session.scheduledAt, sparkDays, now).map((row) => row.value),
      activeDelta: windowDelta(caseload, (item) => item.lastActivityAt, days, now),
      activitySpark: bucketByDay(caseload, (item) => item.lastActivityAt, sparkDays, now).map((row) => row.value),
      pendingReviews: dashboard.stats.pendingAssessments + pendingReports.length,
      pendingReports: pendingReports.length,
    };
  }, [alerts, openAlertTotal, sessions, reports, caseload, dashboard.stats.pendingAssessments, days, now]);

  const chart = useMemo(() => {
    const rows =
      metric === "alerts"
        ? bucketSeriesByDay(alerts, (alert) => alert.triggeredAt, (alert) => alert.severity, SEVERITY_KEYS, days, now)
        : metric === "sessions"
          ? bucketSeriesByDay(sessions, (session) => session.scheduledAt, sessionBucket, SESSION_KEYS, days, now)
          : bucketByDay(caseload, (item) => item.lastActivityAt, days, now).map((row) => ({ date: row.date, ACTIVE: row.value }));
    return rows;
  }, [metric, alerts, sessions, caseload, days, now]);

  const risk = useMemo(() => {
    const count = (light: CaseloadItem["trafficLight"]) => caseload.filter((item) => item.trafficLight === light).length;
    return {
      segments: (["RED", "AMBER", "GREEN"] as const).map((light) => ({ label: TRAFFIC_META[light].label, value: count(light), color: TRAFFIC_META[light].color })),
      worsening: caseload.filter(isWorsening).length,
    };
  }, [caseload]);

  const attention = useMemo(() => {
    const items: Array<{ key: string; kind: "alert" | "report" | "assessment"; title: string; meta: string; href: string; badge: React.ReactNode; at: string }> = [];
    alerts
      .filter((alert) => alert.status === "OPEN" || alert.status === "ESCALATED")
      .forEach((alert) =>
        items.push({
          key: `a-${alert.id}`,
          kind: "alert",
          title: alert.title,
          meta: alert.patientCode ?? "Patient",
          href: `/dashboard/patients/${alert.userId}`,
          badge: <RiskBadge level={alert.severity} />,
          at: alert.triggeredAt,
        }),
      );
    reports
      .filter((report) => report.trafficLight === "RED" && report.status !== "RELEASED" && !report.acknowledgedAt)
      .forEach((report) =>
        items.push({
          key: `r-${report.id}`,
          kind: "report",
          title: report.headline ?? "Priority weekly report",
          meta: report.user?.nickname ?? "Weekly report",
          href: "/dashboard/reports",
          badge: <TrafficLightBadge light="RED" />,
          at: report.weekEnd,
        }),
      );
    dashboard.pendingItems.forEach((item) =>
      items.push({
        key: `p-${item.assessmentId}`,
        kind: "assessment",
        title: "Assessment awaiting review",
        meta: "MIRA diagnostic",
        href: `/dashboard/patients/${item.patientId}?tab=assessments&assessmentId=${item.assessmentId}`,
        badge: <span className="rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 ring-1 ring-inset ring-sky-200">Review</span>,
        at: item.createdAt,
      }),
    );
    const weight = (item: (typeof items)[number]) => (item.kind === "alert" ? 0 : item.kind === "report" ? 1 : 2);
    return items.sort((a, b) => weight(a) - weight(b) || b.at.localeCompare(a.at)).slice(0, 6);
  }, [alerts, reports, dashboard.pendingItems]);

  const agenda = useMemo(
    () =>
      sessions
        .filter((session) => (session.status === "SCHEDULED" || session.status === "PROPOSED" || session.status === "IN_PROGRESS") && +new Date(session.scheduledAt) + session.durationMinutes * 60_000 >= now)
        .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt))
        .slice(0, 6),
    [sessions, now],
  );

  const priority = useMemo(
    () =>
      [...caseload]
        .sort((a, b) => TRAFFIC_META[a.trafficLight].rank - TRAFFIC_META[b.trafficLight].rank || b.openAlertCount - a.openAlertCount || (b.driftScore ?? 0) - (a.driftScore ?? 0))
        .slice(0, 8),
    [caseload],
  );

  const firstName = clinicianName.split(" ")[0];
  const caption = `vs prev ${days}d`;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-medium text-teal-700">{format(now, "EEEE, MMMM d")}</p>
          <h1 className="mt-1 text-[1.625rem] font-semibold leading-tight tracking-tight text-slate-900">
            {greeting(new Date(now).getHours())}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {kpis.urgentOpen > 0
              ? `${kpis.urgentOpen} high-priority alert${kpis.urgentOpen === 1 ? "" : "s"} and ${agenda.filter((s) => isToday(new Date(s.scheduledAt))).length} sessions today.`
              : `No urgent alerts. ${agenda.filter((s) => isToday(new Date(s.scheduledAt))).length} sessions on today's agenda.`}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented label="Reporting period" value={range} onChange={setRange} options={RANGES} />
          <Button variant="secondary" size="sm" asChild>
            <Link href="/dashboard/alerts?status=OPEN">
              <AlertTriangle size={14} aria-hidden /> Triage
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard/sessions">
              <CalendarPlus size={14} aria-hidden /> Schedule
            </Link>
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <KpiGrid>
        <KpiCell
          label="Open alerts"
          value={kpis.openAlerts}
          tone={kpis.urgentOpen > 0 ? "danger" : undefined}
          delta={{ pct: kpis.alertDelta.pct, goodWhen: "down", caption: `${kpis.alertDelta.current} new ${caption}` }}
          spark={kpis.alertSpark}
          sparkColor="#f97316"
          href="/dashboard/alerts?status=OPEN"
        />
        <KpiCell
          label="Active patients"
          value={dashboard.stats.activePatients}
          delta={{ pct: kpis.activeDelta.pct, goodWhen: "up", caption: `${kpis.activeDelta.current} engaged ${caption}` }}
          spark={kpis.activitySpark}
          href="/dashboard/patients"
        />
        <KpiCell
          label="Sessions completed"
          value={kpis.sessionDelta.current}
          delta={{ pct: kpis.sessionDelta.pct, goodWhen: "up", caption }}
          spark={kpis.sessionSpark}
          sparkColor="var(--chart-2)"
          href="/dashboard/sessions"
        />
        <KpiCell
          label="Pending reviews"
          value={kpis.pendingReviews}
          tone={kpis.pendingReviews > 0 ? "warning" : undefined}
          hint={`${dashboard.stats.pendingAssessments} assessments · ${kpis.pendingReports} weekly reports`}
          href="/dashboard/reports"
        />
      </KpiGrid>

      {/* Activity + risk */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel
          className="xl:col-span-2"
          title="Clinical activity"
          description={`Last ${days} days`}
          action={
            <Segmented
              label="Chart metric"
              value={metric}
              onChange={setMetric}
              options={[
                { value: "sessions", label: "Sessions" },
                { value: "alerts", label: "Alerts" },
                { value: "activity", label: "Patient activity" },
              ]}
            />
          }
        >
          <ActivityChart metric={metric} rows={chart} />
        </Panel>

        <Panel title="Caseload risk" description={`${caseload.length} monitored patients`} action={<PanelLink href="/dashboard/patients?view=triage">Triage</PanelLink>}>
          <RatioBar segments={risk.segments} />
          {risk.worsening > 0 && (
            <Link
              href="/dashboard/patients?view=triage&sort=risk"
              className="mt-4 flex items-center gap-2 rounded-lg border border-orange-200 bg-orange-50/60 px-3 py-2 text-xs font-medium text-orange-800 transition-colors hover:bg-orange-50"
            >
              <TrendingDown size={14} aria-hidden />
              {risk.worsening} patient{risk.worsening === 1 ? "" : "s"} worsened since last week
              <ChevronRight size={13} aria-hidden className="ml-auto" />
            </Link>
          )}
        </Panel>
      </div>

      {/* Attention + agenda */}
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel className="xl:col-span-2" title="Needs your attention" description="Alerts, priority reports and pending reviews" flush action={<PanelLink href="/dashboard/alerts">All alerts</PanelLink>}>
          {attention.length === 0 ? (
            <div className="px-5 pb-5">
              <ListEmpty title="Nothing waiting on you" hint="New alerts and reviews will surface here." />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {attention.map((item) => {
                const Icon = item.kind === "alert" ? AlertTriangle : item.kind === "report" ? FileText : ClipboardCheck;
                return (
                  <li key={item.key}>
                    <Link href={item.href} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/80">
                      <span
                        aria-hidden
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                          item.kind === "alert" ? "bg-red-50 text-red-600" : item.kind === "report" ? "bg-orange-50 text-orange-600" : "bg-sky-50 text-sky-600",
                        )}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-900">{item.title}</span>
                        <span className="block truncate text-xs text-slate-500">
                          {item.meta} · {formatDistanceToNowStrict(new Date(item.at), { addSuffix: true })}
                        </span>
                      </span>
                      {item.badge}
                      <ChevronRight size={15} aria-hidden className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <Panel title="Agenda" description="Upcoming sessions" action={<PanelLink href="/dashboard/sessions">Calendar</PanelLink>}>
          {agenda.length === 0 ? (
            <ListEmpty title="Nothing scheduled" hint="Book a session to fill your agenda." />
          ) : (
            <ol className="space-y-1">
              {agenda.map((session, index) => {
                const start = new Date(session.scheduledAt);
                const dayChanged = index === 0 || format(start, "yyyy-MM-dd") !== format(new Date(agenda[index - 1].scheduledAt), "yyyy-MM-dd");
                return (
                  <li key={session.id}>
                    {dayChanged && (
                      <p className={cn("mb-1.5 text-[11px] font-medium text-slate-500", index > 0 && "mt-3")}>
                        {isToday(start) ? "Today" : isTomorrow(start) ? "Tomorrow" : format(start, "EEE, MMM d")}
                      </p>
                    )}
                    <Link href={`/dashboard/patients/${session.patientId}?tab=sessions`} className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-slate-50">
                      <span className="tabular w-11 shrink-0 text-xs font-semibold text-slate-900">{format(start, "HH:mm")}</span>
                      <span aria-hidden className={cn("h-7 w-0.5 shrink-0 rounded-full", session.type === "EMERGENCY" ? "bg-red-400" : "bg-teal-500")} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-medium text-slate-900 group-hover:text-teal-700">{session.patientName}</span>
                        <span className="block text-[11px] text-slate-500">
                          {session.type.replace("_", "-").toLowerCase()} · {session.durationMinutes} min
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          )}
        </Panel>
      </div>

      {/* Priority patients */}
      <Panel title="Priority patients" description="Ranked by traffic light, open alerts and drift" flush action={<PanelLink href="/dashboard/patients?view=triage">Full triage</PanelLink>}>
        {priority.length === 0 ? (
          <div className="px-5 pb-5">
            <ListEmpty title="No patients in your caseload" hint="Assigned patients will appear here." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-y border-slate-100 bg-slate-50/60 text-left text-xs font-medium text-slate-500">
                  <th scope="col" className="px-5 py-2.5 font-medium">Patient</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Drift</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Open alerts</th>
                  <th scope="col" className="px-5 py-2.5 text-right font-medium">Last activity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {priority.map((item) => (
                  <tr key={item.id} className="group transition-colors hover:bg-slate-50/70">
                    <td className="px-5 py-3">
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
                        {isWorsening(item) && <ArrowDownRight size={14} aria-label="Worsened" className="text-red-500" />}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <DriftCell score={item.driftScore} level={item.driftLevel ?? item.riskLevel} />
                    </td>
                    <td className="tabular px-3 py-3 text-right">
                      {item.openAlertCount > 0 ? <span className="font-semibold text-red-700">{item.openAlertCount}</span> : <span className="text-slate-400">0</span>}
                    </td>
                    <td className="px-5 py-3 text-right text-xs text-slate-500">
                      {item.lastActivityAt ? formatDistanceToNowStrict(new Date(item.lastActivityAt), { addSuffix: true }) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <p className="text-center text-xs text-slate-400">Trends are computed from your latest 100 sessions, 50 alerts and caseload activity.</p>
    </div>
  );
}

/* ---------- Pieces ---------- */

export function PatientAvatar({ name, size = "sm" }: { name: string; size?: "sm" | "md" }) {
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const hue = [...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 5;
  const palette = ["bg-teal-50 text-teal-800 ring-teal-200", "bg-indigo-50 text-indigo-800 ring-indigo-200", "bg-sky-50 text-sky-800 ring-sky-200", "bg-violet-50 text-violet-800 ring-violet-200", "bg-slate-100 text-slate-700 ring-slate-200"];
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full font-semibold ring-1", size === "sm" ? "h-8 w-8 text-[11px]" : "h-11 w-11 text-sm", palette[hue])}>
      {initials}
    </span>
  );
}

export function DriftCell({ score, level }: { score: number | null; level: CaseloadItem["riskLevel"] }) {
  if (score === null) return <span className="text-xs text-slate-400">—</span>;
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-slate-100">
        <span className="block h-full rounded-full" style={{ width: `${Math.min(100, score * 100)}%`, background: RISK_META[level].color }} />
      </span>
      <span className="tabular text-xs font-medium text-slate-700">{score.toFixed(2)}</span>
    </span>
  );
}

const SERIES: Record<Metric, Array<{ key: string; name: string; color: string }>> = {
  sessions: [
    { key: "COMPLETED", name: "Completed", color: "#0d9488" },
    { key: "SCHEDULED", name: "Scheduled", color: "#99f6e4" },
    { key: "MISSED", name: "Cancelled / no-show", color: "#cbd5e1" },
  ],
  alerts: SEVERITY_KEYS.map((key) => ({ key, name: RISK_META[key].label, color: RISK_META[key].color })),
  activity: [{ key: "ACTIVE", name: "Patients active", color: "#0d9488" }],
};

function ActivityChart({ metric, rows }: { metric: Metric; rows: Array<Record<string, string | number>> }) {
  const series = SERIES[metric];
  const totals = series.map((item) => rows.reduce((sum, row) => sum + Number(row[item.key] ?? 0), 0));
  const empty = totals.every((value) => value === 0);

  return (
    <div>
      <dl className="mb-4 flex flex-wrap gap-x-6 gap-y-2">
        {series.map((item, index) => (
          <div key={item.key}>
            <dt className="flex items-center gap-1.5 text-xs text-slate-500">
              <span aria-hidden className="h-2 w-2 rounded-sm" style={{ background: item.color }} />
              {item.name}
            </dt>
            <dd className="tabular mt-0.5 text-lg font-semibold tracking-tight text-slate-900">{totals[index]}</dd>
          </div>
        ))}
      </dl>
      <div className="relative h-64 w-full min-w-0">
        {empty && (
          <p className="absolute inset-0 z-10 flex items-center justify-center text-sm text-slate-500">No activity recorded in this period.</p>
        )}
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <ComposedChart data={rows} margin={{ top: 4, right: 4, bottom: 0, left: -20 }} barCategoryGap={rows.length > 40 ? "12%" : "28%"}>
            <defs>
              <linearGradient id="ov-activity" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0d9488" stopOpacity={0.22} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={28} />
            <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
            <Tooltip content={<ChartTooltipShell />} cursor={metric === "activity" ? { stroke: "var(--border-strong)", strokeDasharray: "3 3" } : { fill: "rgba(241,245,249,0.8)" }} />
            {metric === "activity" ? (
              <Area type="monotone" dataKey="ACTIVE" name="Patients active" stroke="#0d9488" strokeWidth={2.25} fill="url(#ov-activity)" dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} />
            ) : (
              series.map((item, index) => (
                <Bar
                  key={item.key}
                  dataKey={item.key}
                  name={item.name}
                  stackId="stack"
                  fill={item.color}
                  radius={index === series.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  maxBarSize={28}
                />
              ))
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
