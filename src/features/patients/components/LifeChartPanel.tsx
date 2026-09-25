"use client";

import { useId, useMemo } from "react";
import { format } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, EyeOff, ShieldCheck } from "lucide-react";
import type { ConsentResponse, LifeChartResponse } from "@/lib/api/psychologist";
import { Badge } from "@/components/ui/badge";
import { DashboardChartCard } from "@/components/layout/DashboardUI";
import { ChartEmpty, ChartTooltipShell } from "@/features/dashboard/components/overview/cards";
import { RISK_META } from "@/features/risks/lib/risk";

const dayKey = (value: string) => value.slice(0, 10);

export function LifeChartPanel({ data }: { data: LifeChartResponse }) {
  const gradientId = useId().replace(/:/g, "");

  const series = useMemo(() => {
    const drift = new Map(data.driftScores.map((item) => [dayKey(item.computedAt), item.score]));
    return [...data.checkins]
      .sort((a, b) => a.checkinDate.localeCompare(b.checkinDate))
      .map((entry) => ({
        date: format(new Date(entry.checkinDate), "MMM d"),
        mood: entry.moodScore,
        sleep: entry.sleepHours,
        anxiety: entry.anxietyLevel,
        drift: drift.get(dayKey(entry.checkinDate)) ?? null,
      }));
  }, [data]);

  const stats = useMemo(() => {
    const avg = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);
    const sleep = avg(data.checkins.flatMap((entry) => (entry.sleepHours === null ? [] : [entry.sleepHours])));
    const mood = avg(data.checkins.map((entry) => entry.moodScore));
    const taken = data.checkins.filter((entry) => entry.medicationTaken !== null);
    const adherence = taken.length ? taken.filter((entry) => entry.medicationTaken).length / taken.length : null;
    const latestDrift = data.driftScores.at(-1) ?? null;
    return { sleep, mood, adherence, latestDrift };
  }, [data]);

  const hasDrift = series.some((row) => row.drift !== null);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Average mood" value={stats.mood === null ? "—" : `${stats.mood.toFixed(1)} / 10`} />
        <Metric label="Average sleep" value={stats.sleep === null ? "Not shared" : `${stats.sleep.toFixed(1)} h`} />
        <Metric label="Medication adherence" value={stats.adherence === null ? "Not shared" : `${Math.round(stats.adherence * 100)}%`} />
        <Metric
          label="Latest drift score"
          value={stats.latestDrift ? stats.latestDrift.score.toFixed(2) : "—"}
          badge={stats.latestDrift ? <Badge variant={RISK_META[stats.latestDrift.level].variant} dot>{RISK_META[stats.latestDrift.level].label}</Badge> : undefined}
        />
      </div>

      <DashboardChartCard
        title="Life chart"
        subtitle={`${format(new Date(data.period.from), "MMM d")} – ${format(new Date(data.period.to), "MMM d, yyyy")} · ${data.checkins.length} check-ins · ${data.sessions.length} sessions`}
        action={<Activity size={16} aria-hidden className="text-slate-400" />}
      >
        {series.length === 0 ? (
          <ChartEmpty title="No check-ins in this period" hint="Mood, sleep and drift will chart here once the patient starts checking in." />
        ) : (
          <>
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <LegendDot color="var(--chart-1)" label="Mood (0–10)" />
              <LegendDot color="var(--chart-2)" label="Sleep (h)" dashed />
              {hasDrift && <LegendDot color="#f97316" label="Drift score (right axis)" />}
            </ul>
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <ComposedChart data={series} margin={{ top: 6, right: hasDrift ? 0 : 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                  <YAxis yAxisId="left" domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} tickLine={false} axisLine={false} width={34} />
                  {hasDrift && <YAxis yAxisId="right" orientation="right" domain={[0, 1]} tickLine={false} axisLine={false} width={34} />}
                  <ReferenceLine yAxisId="left" y={4} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: "Low mood", position: "insideTopLeft", fill: "#b91c1c", fontSize: 10 }} />
                  <Tooltip content={<ChartTooltipShell />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
                  <Area yAxisId="left" type="monotone" dataKey="mood" name="Mood" stroke="var(--chart-1)" strokeWidth={2.25} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} connectNulls />
                  <Line yAxisId="left" type="monotone" dataKey="sleep" name="Sleep (h)" stroke="var(--chart-2)" strokeWidth={1.75} strokeDasharray="5 4" dot={false} connectNulls />
                  {hasDrift && <Line yAxisId="right" type="monotone" dataKey="drift" name="Drift" stroke="#f97316" strokeWidth={1.75} dot={{ r: 2.5 }} connectNulls />}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
        {data.notShared.length > 0 && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            <EyeOff size={13} aria-hidden className="shrink-0" />
            Not shared by the patient: {data.notShared.join(", ")}
          </p>
        )}
      </DashboardChartCard>
    </div>
  );
}

const JOURNAL_LABEL: Record<string, string> = { FULL: "Full", FLAGGED_EXCERPTS: "Excerpts" };

export function ConsentPanel({ consent }: { consent: ConsentResponse }) {
  return (
    <DashboardChartCard
      title="Consents & data access"
      subtitle={consent.consentedAt ? `Consent recorded ${format(new Date(consent.consentedAt), "MMM d, yyyy")}` : "No consent recorded yet"}
      action={<ShieldCheck size={16} aria-hidden className="text-slate-400" />}
    >
      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(consent.categories).map(([key, value]) => {
          const shared = value === true || (typeof value === "string" && value in JOURNAL_LABEL);
          const label = typeof value === "string" ? JOURNAL_LABEL[value] ?? "Not shared" : value ? "Shared" : "Not shared";
          return (
            <div key={key} className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/60 px-3 py-2.5">
              <dt className="text-[13px] capitalize text-slate-700">{key}</dt>
              <dd>
                <Badge variant={shared ? "success" : "default"}>{label}</Badge>
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500">
        <span>Safety alerts: {consent.safetyAlertsConsentAt ? `accepted ${format(new Date(consent.safetyAlertsConsentAt), "MMM d, yyyy")}` : "not accepted"}</span>
        <span>Monitoring notice: {consent.monitoringNoticeAckAt ? `acknowledged ${format(new Date(consent.monitoringNoticeAckAt), "MMM d, yyyy")}` : "not acknowledged"}</span>
      </div>
    </DashboardChartCard>
  );
}

function Metric({ label, value, badge }: { label: string; value: string; badge?: React.ReactNode }) {
  return (
    <div className="dashboard-card p-4">
      <p className="text-xs font-medium text-slate-600">{label}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2">
        <p className="tabular text-xl font-semibold tracking-tight text-slate-900">{value}</p>
        {badge}
      </div>
    </div>
  );
}

function LegendDot({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <li className="flex items-center gap-1.5">
      <span aria-hidden className="h-0.5 w-3.5 rounded-full" style={dashed ? { backgroundImage: `linear-gradient(90deg, ${color} 60%, transparent 0)`, backgroundSize: "5px 2px" } : { background: color }} />
      {label}
    </li>
  );
}
