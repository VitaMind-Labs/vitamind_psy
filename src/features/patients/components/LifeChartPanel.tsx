"use client";

import { useId, useMemo, useState } from "react";
import { format } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, EyeOff, ShieldCheck } from "lucide-react";
import { getLifeChartServer } from "@/features/patients/actions/patients";
import type { ConsentResponse, LifeChartResponse } from "@/lib/api/psychologist";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardChartCard } from "@/components/layout/DashboardUI";
import { ChartEmpty, ChartTooltipShell } from "@/features/dashboard/components/overview/cards";
import { RISK_META } from "@/features/risks/lib/risk";

const dayKey = (value: string) => value.slice(0, 10);
const dayLabel = (value: string) => format(new Date(`${dayKey(value)}T00:00:00`), "MMM d");
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

/** The patient's check-ins (1-5 scale), sleep and drift over a date range the clinician can change. */
export function LifeChartPanel({ patientId, data: initialData }: { patientId: string; data: LifeChartResponse }) {
  const gradientId = useId().replace(/:/g, "");
  const [data, setData] = useState(initialData);
  const [from, setFrom] = useState(dayKey(initialData.period.from));
  const [to, setTo] = useState(dayKey(initialData.period.to));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = async () => {
    if (!from || !to) return setError("Choose both a start and end date.");
    if (from > to) return setError("The start date must be before the end date.");
    setLoading(true);
    setError(null);
    try {
      setData(await getLifeChartServer(patientId, from, to));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load this period.");
    } finally {
      setLoading(false);
    }
  };

  const series = useMemo(
    () =>
      [...data.checkins]
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((entry) => ({ date: dayLabel(entry.date), mood: entry.mood, energy: entry.energy, focus: entry.focus, sleep: entry.sleepHours })),
    [data.checkins],
  );
  const driftSeries = useMemo(() => data.driftScores.map((item) => ({ date: dayLabel(item.computedAt), score: Number(item.score.toFixed(3)) })), [data.driftScores]);

  const stats = useMemo(
    () => ({
      mood: average(data.checkins.map((entry) => entry.mood)),
      energy: average(data.checkins.map((entry) => entry.energy)),
      focus: average(data.checkins.map((entry) => entry.focus)),
      sleep: average(data.checkins.flatMap((entry) => (entry.sleepHours === null ? [] : [entry.sleepHours]))),
      latestDrift: data.driftScores.at(-1) ?? null,
    }),
    [data],
  );

  const hasSleep = series.some((row) => row.sleep !== null);

  return (
    <div className="space-y-4">
      <div className="dashboard-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1"><label htmlFor="lifechart-from" className="text-xs font-medium text-[#64748b]">From</label><Input id="lifechart-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1" /></div>
        <div className="min-w-0 flex-1"><label htmlFor="lifechart-to" className="text-xs font-medium text-[#64748b]">To</label><Input id="lifechart-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1" /></div>
        <Button onClick={() => void apply()} disabled={loading}>{loading ? "Loading…" : "Apply range"}</Button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</p>}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Average mood" value={stats.mood === null ? "—" : `${stats.mood.toFixed(1)} / 5`} />
        <Metric label="Average energy" value={stats.energy === null ? "—" : `${stats.energy.toFixed(1)} / 5`} />
        <Metric label="Average focus" value={stats.focus === null ? "—" : `${stats.focus.toFixed(1)} / 5`} />
        <Metric label="Average sleep" value={stats.sleep === null ? "Not shared" : `${stats.sleep.toFixed(1)} h`} />
      </div>

      <DashboardChartCard
        title="Life chart"
        subtitle={`${format(new Date(`${dayKey(data.period.from)}T00:00:00`), "MMM d")} – ${format(new Date(`${dayKey(data.period.to)}T00:00:00`), "MMM d, yyyy")} · ${data.checkins.length} check-ins · ${data.sessions.length} sessions`}
        action={<Activity size={16} aria-hidden className="text-slate-400" />}
      >
        {series.length === 0 ? (
          <ChartEmpty title="No check-ins in this period" hint="Mood, energy, focus and sleep will chart here once the patient starts checking in." />
        ) : (
          <>
            <ul className="mb-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
              <LegendDot color="var(--chart-1)" label="Mood (1–5)" />
              <LegendDot color="var(--chart-3)" label="Energy (1–5)" />
              <LegendDot color="var(--chart-5)" label="Focus (1–5)" />
              {hasSleep && <LegendDot color="var(--chart-2)" label="Sleep (h, right axis)" dashed />}
            </ul>
            <div className="h-72 w-full min-w-0">
              <ResponsiveContainer width="100%" height="100%" debounce={50}>
                <ComposedChart data={series} margin={{ top: 6, right: hasSleep ? 0 : 6, bottom: 0, left: -18 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                  <YAxis yAxisId="left" domain={[0, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} width={34} />
                  {hasSleep && <YAxis yAxisId="right" orientation="right" domain={[0, 12]} ticks={[0, 4, 8, 12]} tickLine={false} axisLine={false} width={34} />}
                  <ReferenceLine yAxisId="left" y={2} stroke="#fca5a5" strokeDasharray="4 4" label={{ value: "Low", position: "insideTopLeft", fill: "#b91c1c", fontSize: 10 }} />
                  <Tooltip content={<ChartTooltipShell />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
                  <Area yAxisId="left" type="monotone" dataKey="mood" name="Mood" stroke="var(--chart-1)" strokeWidth={2.25} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4, stroke: "#fff", strokeWidth: 2 }} connectNulls />
                  <Line yAxisId="left" type="monotone" dataKey="energy" name="Energy" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} connectNulls />
                  <Line yAxisId="left" type="monotone" dataKey="focus" name="Focus" stroke="var(--chart-5)" strokeWidth={1.5} dot={false} connectNulls />
                  {hasSleep && <Line yAxisId="right" type="monotone" dataKey="sleep" name="Sleep (h)" stroke="var(--chart-2)" strokeWidth={1.75} strokeDasharray="5 4" dot={false} connectNulls />}
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

      <DashboardChartCard
        title="Drift score"
        subtitle="Deviation from the patient's own baseline (0–1)"
        action={stats.latestDrift ? <Badge variant={RISK_META[stats.latestDrift.level].variant} dot>{stats.latestDrift.score.toFixed(2)} · {RISK_META[stats.latestDrift.level].label}</Badge> : undefined}
      >
        {driftSeries.length < 2 ? (
          <ChartEmpty title="Not enough drift data" hint="Drift is computed as check-ins accumulate." />
        ) : (
          <div className="h-44 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <LineChart data={driftSeries} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={20} />
                <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickLine={false} axisLine={false} width={34} />
                <Tooltip content={<ChartTooltipShell />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
                <Line type="monotone" dataKey="score" name="Drift" stroke="#f97316" strokeWidth={1.75} dot={{ r: 2.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
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
