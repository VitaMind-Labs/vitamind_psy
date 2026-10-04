"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addMonths, format } from "date-fns";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, EyeOff, Target } from "lucide-react";
import type { MonthlyOverview as Overview, MonthlyPatientRow, Trend } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, RatioBar, Segmented } from "@/components/layout/Kpi";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { TrafficLightBadge } from "@/features/risks/components/RiskBadge";
import { cn } from "@/lib/utils";

const TREND_META: Record<Trend, { label: string; icon: typeof ArrowUpRight; className: string; color: string }> = {
  IMPROVING: { label: "Improving", icon: ArrowUpRight, className: "text-emerald-700", color: "#10b981" },
  STABLE: { label: "Stable", icon: ArrowRight, className: "text-slate-600", color: "#94a3b8" },
  DECLINING: { label: "Declining", icon: ArrowDownRight, className: "text-red-700", color: "#ef4444" },
  NO_DATA: { label: "No check-ins", icon: EyeOff, className: "text-slate-400", color: "#e2e8f0" },
};

type Filter = "all" | "attention" | "declining" | "silent";

const fixed = (value: number | null, digits = 1) => (value === null ? "—" : value.toFixed(digits));

function CompletionBar({ pct, days }: { pct: number; days: number }) {
  return (
    <div className="w-28">
      <div className="flex items-baseline justify-between text-xs">
        <span className="tabular font-medium text-slate-800">{pct}%</span>
        <span className="tabular text-slate-500">{days} d</span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={`${days} days checked in, ${pct}%`}>
        <div className={cn("h-full rounded-full", pct >= 70 ? "bg-emerald-500" : pct >= 35 ? "bg-amber-400" : "bg-red-400")} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PatientRow({ row }: { row: MonthlyPatientRow }) {
  const trend = TREND_META[row.trend];
  const TrendIcon = trend.icon;
  return (
    <tr className="group transition-colors hover:bg-slate-50/70">
      <td className="py-3 pl-5 pr-3">
        <Link href={`/dashboard/patients/${row.patientId}`} className="flex items-center gap-3">
          <PatientAvatar name={row.nickname} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-slate-900 group-hover:text-teal-700">{row.nickname}</span>
            <span className="block text-xs text-slate-500">
              {row.patientCode}
              {row.covered && " · covering"}
            </span>
          </span>
        </Link>
      </td>
      <td className="px-3 py-3">
        <span className="flex items-center gap-2">
          {row.trafficLight ? <TrafficLightBadge light={row.trafficLight} /> : <span className="text-xs text-slate-400">—</span>}
          {row.openAlerts > 0 && (
            <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[11px] font-semibold text-red-700" title={`${row.openAlerts} open alert${row.openAlerts === 1 ? "" : "s"}`}>
              <AlertTriangle size={11} aria-hidden /> {row.openAlerts}
            </span>
          )}
        </span>
      </td>
      <td className="px-3 py-3"><CompletionBar pct={row.completionPct} days={row.daysCheckedIn} /></td>
      <td className="px-3 py-3">
        {row.daysCheckedIn === 0 ? (
          <span className="text-xs text-slate-400">No data</span>
        ) : (
          <span className={cn("inline-flex items-center gap-1.5 text-[13px] font-medium", trend.className)}>
            <TrendIcon size={14} aria-hidden />
            <span className="tabular">{fixed(row.averages.mood)}</span>
            <span className="text-xs font-normal">
              {row.moodDelta !== null ? `${row.moodDelta > 0 ? "+" : ""}${row.moodDelta.toFixed(1)} vs last month` : trend.label}
            </span>
          </span>
        )}
      </td>
      <td className="tabular hidden px-3 py-3 text-[13px] text-slate-700 lg:table-cell">{fixed(row.averages.energy)}</td>
      <td className="tabular hidden px-3 py-3 text-[13px] text-slate-700 lg:table-cell">{fixed(row.averages.focus)}</td>
      <td className="tabular hidden px-3 py-3 text-[13px] text-slate-700 xl:table-cell">{row.averages.sleepHours === null ? "—" : `${row.averages.sleepHours.toFixed(1)} h`}</td>
      <td className="tabular hidden px-3 py-3 text-[13px] text-slate-700 xl:table-cell">
        {row.goals.achievedPct === null ? "—" : `${row.goals.achievedPct}%`}
        {row.goals.total > 0 && <span className="ml-1 text-xs text-slate-400">of {row.goals.total}</span>}
      </td>
      <td className="py-3 pl-3 pr-5 text-right">
        <Button asChild size="sm" variant="secondary">
          <Link href={`/dashboard/patients/${row.patientId}`}>Open</Link>
        </Button>
      </td>
    </tr>
  );
}

export function MonthlyOverview({ overview }: { overview: Overview }) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const { period, summary, patients } = overview;
  const current = new Date(period.year, period.month - 1, 1);
  const isCurrentMonth = format(current, "yyyy-MM") === format(new Date(), "yyyy-MM");

  const go = (date: Date) => router.push(`/dashboard/monthly?year=${date.getFullYear()}&month=${date.getMonth() + 1}`);

  const rows = patients.filter((p) =>
    filter === "attention" ? p.needsAttention : filter === "declining" ? p.trend === "DECLINING" : filter === "silent" ? p.daysCheckedIn === 0 : true,
  );

  const trendCounts = (Object.keys(TREND_META) as Trend[]).map((trend) => ({
    label: TREND_META[trend].label,
    value: patients.filter((p) => p.trend === trend).length,
    color: TREND_META[trend].color,
  }));

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Clinical records"
        title="Monthly progress"
        description="How each patient did this month and how it compares with the month before. Built from what patients agreed to share."
        action={
          <div className="flex items-center gap-1 rounded-lg border border-slate-200/80 bg-white p-0.5 shadow-sm">
            <Button size="icon-sm" variant="ghost" aria-label="Previous month" onClick={() => go(addMonths(current, -1))}><ChevronLeft size={15} aria-hidden /></Button>
            <span className="min-w-28 text-center text-[13px] font-semibold text-slate-900">{format(current, "MMMM yyyy")}</span>
            <Button size="icon-sm" variant="ghost" aria-label="Next month" disabled={isCurrentMonth} onClick={() => go(addMonths(current, 1))}><ChevronRight size={15} aria-hidden /></Button>
          </div>
        }
      />

      <KpiGrid>
        <KpiCell label="Patients followed" value={summary.patients} hint={summary.notSharing ? `${summary.notSharing} do not share mood data` : "All share mood data"} />
        <KpiCell label="Average mood" value={fixed(summary.averageMood)} unit="/ 5" hint={`${summary.withCheckins} patient${summary.withCheckins === 1 ? "" : "s"} with check-ins`} />
        <KpiCell label="Check-in completion" value={summary.averageCompletionPct ?? "—"} unit={summary.averageCompletionPct === null ? undefined : "%"} tone={summary.averageCompletionPct !== null && summary.averageCompletionPct < 50 ? "warning" : undefined} hint={isCurrentMonth ? `Over the ${period.elapsedDays} days so far` : "Over the whole month"} icon={<Target size={15} aria-hidden />} />
        <KpiCell label="Need your attention" value={summary.needingAttention} tone={summary.needingAttention ? "warning" : undefined} hint={`${summary.declining} declining · ${summary.silent} silent`} />
      </KpiGrid>

      <Panel title="Where the caseload is heading" description="Mood this month compared with last month">
        {summary.sharingMood === 0 ? (
          <ChartEmpty title="No patient shares mood data yet" hint="Reports appear once a patient agrees to share their check-ins." />
        ) : (
          <RatioBar segments={trendCounts} />
        )}
      </Panel>

      <Panel
        title="Patients"
        description={isCurrentMonth ? `${format(current, "MMMM")} so far · most urgent first` : "Most urgent first"}
        flush
        action={
          <Segmented<Filter>
            label="Filter patients"
            value={filter}
            onChange={setFilter}
            options={[
              { value: "all", label: "All", count: patients.length },
              { value: "attention", label: "Attention", count: summary.needingAttention },
              { value: "declining", label: "Declining", count: summary.declining },
              { value: "silent", label: "Silent", count: summary.silent },
            ]}
          />
        }
      >
        {rows.length === 0 ? (
          <div className="px-5 pb-5">
            <ChartEmpty title={patients.length === 0 ? "No patient to report on" : "No patient matches this filter"} hint={patients.length === 0 ? "Patients appear here once they accepted your care and share their mood." : "Try another filter."} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead className="bg-slate-50/60">
                <tr className="border-y border-slate-100 text-left text-xs text-slate-500">
                  <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">Patient</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Check-ins</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Mood</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">Energy</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium lg:table-cell">Focus</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium xl:table-cell">Sleep</th>
                  <th scope="col" className="hidden px-3 py-2.5 font-medium xl:table-cell">Goals</th>
                  <th scope="col" className="py-2.5 pl-3 pr-5"><span className="sr-only">Open</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => <PatientRow key={row.patientId} row={row} />)}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {summary.notSharing > 0 && (
        <p className="text-xs text-slate-500">
          {summary.notSharing} patient{summary.notSharing === 1 ? " is" : "s are"} not listed because they have not agreed to share mood data. Sleep is blank for patients who do not share it. Journal content is never part of this view.
        </p>
      )}
    </div>
  );
}
