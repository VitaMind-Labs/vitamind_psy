"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getPatientProgressServer } from "@/features/progress/actions";
import type { ProgressResponse } from "@/lib/api/psychologist";
import { ProgressChart } from "@/features/patients/components/ProgressChart";

function dateValue(value: unknown, fallback: string) {
  return typeof value === "string" && value.length > 0 ? value.slice(0, 10) : fallback;
}

function normalizeProgress(value: unknown, fallback: ProgressResponse): ProgressResponse {
  if (!value || typeof value !== "object") return fallback;
  const source = value as Record<string, unknown>;
  const period = source.period && typeof source.period === "object" ? source.period as Record<string, unknown> : {};
  const rawEntries = Array.isArray(source.entries) ? source.entries : Array.isArray(source.checkins) ? source.checkins : [];
  const entries = rawEntries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const date = typeof item.date === "string" ? item.date : typeof item.checkinDate === "string" ? item.checkinDate : "";
    if (!date) return [];
    const valueFor = (key: string, fallbackKey?: string) => {
      const candidate = item[key] ?? (fallbackKey ? item[fallbackKey] : undefined);
      return typeof candidate === "number" ? candidate : null;
    };
    return [{ date, mood: valueFor("mood", "moodScore"), stress: valueFor("stress", "anxietyLevel"), energy: valueFor("energy", "energyLevel"), sleepHours: valueFor("sleepHours"), source: "PATIENT_REPORTED" as const }];
  });
  return { period: { from: dateValue(period.from, fallback.period.from), to: dateValue(period.to, fallback.period.to) }, entries };
}

export function ProgressPanel({ patientId, initialData }: { patientId: string; initialData: ProgressResponse }) {
  const safeInitialData = useMemo(() => normalizeProgress(initialData, { period: { from: "", to: "" }, entries: [] }), [initialData]);
  const [data, setData] = useState(safeInitialData);
  const [from, setFrom] = useState(dateValue(safeInitialData.period.from, ""));
  const [to, setTo] = useState(dateValue(safeInitialData.period.to, ""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!from || !to) {
      setError("Choose both a start and end date.");
      return;
    }
    if (from > to) {
      setError("The start date must be before the end date.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(normalizeProgress(await getPatientProgressServer(patientId, from, to), safeInitialData));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not load progress data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-0 space-y-4">
      <div className="dashboard-card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <div className="min-w-0 flex-1"><label htmlFor="progress-from" className="text-xs font-medium text-[#64748b]">From</label><Input id="progress-from" type="date" value={from} onChange={(event) => setFrom(event.target.value)} className="mt-1" /></div>
        <div className="min-w-0 flex-1"><label htmlFor="progress-to" className="text-xs font-medium text-[#64748b]">To</label><Input id="progress-to" type="date" value={to} onChange={(event) => setTo(event.target.value)} className="mt-1" /></div>
        <Button onClick={() => void load()} disabled={loading}>{loading ? "Loading…" : "Apply range"}</Button>
      </div>
      {error && <p role="alert" className="rounded-xl border border-[#fecaca] bg-[#fef2f2] p-3 text-sm text-[#b91c1c]">{error}</p>}
      {data.entries.length === 0 ? <div className="dashboard-card border-dashed p-10 text-center text-sm text-[#64748b]">No progress data for this period.</div> : <div className="grid min-w-0 gap-4 lg:grid-cols-2"><ProgressChart title="Mood" entries={data.entries} dataKey="mood" color="var(--chart-1)" unit="score" /><ProgressChart title="Reported stress" entries={data.entries} dataKey="stress" color="var(--chart-5)" unit="score" /><ProgressChart title="Energy" entries={data.entries} dataKey="energy" color="var(--chart-3)" unit="score" /><ProgressChart title="Sleep" entries={data.entries} dataKey="sleepHours" color="var(--chart-4)" unit="h" yDomain={[0, 12]} /></div>}
      <p className="text-xs text-[#64748b]">Data source: {data.entries[0]?.source ?? "PATIENT_REPORTED"}</p>
    </div>
  );
}
