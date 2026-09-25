"use client";

import { useId, useMemo } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import type { ProgressResponse } from "@/lib/api/psychologist";

type ProgressKey = "mood" | "stress" | "energy" | "sleepHours";

type ProgressDatum = { date: string; value: number | null };

type ProgressTooltipProps = {
  active?: boolean;
  payload?: Array<{ value?: number | string; name?: string; color?: string }>;
  label?: string;
  unit: string;
};

interface ProgressChartProps {
  title: string;
  entries: ProgressResponse["entries"];
  dataKey: ProgressKey;
  color: string;
  unit: string;
  yDomain?: [number, number];
}

function formatTick(value: unknown) {
  if (typeof value !== "string" || !value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function ProgressTooltip({ active, payload, label, unit }: ProgressTooltipProps) {
  if (!active || !payload?.length) return null;
  return <div className="rounded-xl border border-white/60 bg-white/85 ring-1 ring-slate-900/5 backdrop-blur-md shadow-[0_12px_32px_rgba(15,23,42,0.12)] px-3 py-2"><p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-[#64748b]">{formatTick(label)}</p><p className="flex items-center gap-2 text-xs font-medium text-[#0f172a]"><span className="h-2 w-2 rounded-full" style={{ background: payload[0]?.color ?? "var(--chart-1)" }} />{payload[0]?.value ?? "—"}{unit}</p></div>;
}

export function ProgressChart({ title, entries, dataKey, color, unit, yDomain = [0, 10] }: ProgressChartProps) {
  const gradientId = useId().replaceAll(":", "");
  const data = useMemo<ProgressDatum[]>(() => entries.flatMap((entry) => {
    const value = entry[dataKey];
    if (typeof entry.date !== "string" || !entry.date || (value !== null && typeof value !== "number")) return [];
    return [{ date: entry.date, value }];
  }).sort((a, b) => a.date.localeCompare(b.date)), [dataKey, entries]);

  return (
    <div className="dashboard-card min-w-0 p-4">
      <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-sm font-semibold text-[#0f172a]">{title}</h3><span className="rounded-full bg-[#f8fafc] px-2 py-1 text-[10px] font-semibold text-[#64748b]">{unit}</span></div>
      {data.length === 0 ? <div className="h-48"><ChartEmpty title="No data points" hint="This metric will appear when the patient reports it." /></div> : <div className="h-48 min-w-0"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.24} /><stop offset="100%" stopColor={color} stopOpacity={0.02} /></linearGradient></defs><CartesianGrid stroke="var(--chart-grid)" strokeDasharray="4 4" vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={24} tickFormatter={formatTick} /><YAxis domain={yDomain} tickLine={false} axisLine={false} width={34} allowDecimals={false} /><Tooltip content={<ProgressTooltip unit={unit} />} cursor={{ stroke: "var(--border-strong)" }} /><Area type="monotone" dataKey="value" name={title} stroke={color} strokeWidth={2.5} fill={`url(#${gradientId})`} dot={false} activeDot={{ r: 4 }} connectNulls /></AreaChart></ResponsiveContainer></div>}
    </div>
  );
}
