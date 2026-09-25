"use client";

import type { ReactNode } from "react";
import { CalendarX2, Inbox } from "lucide-react";

/* ---------- Chart tooltip (glass) ---------- */

type TooltipEntry = { name?: string; value?: number | string; color?: string; dataKey?: string | number; payload?: Record<string, unknown> };

export function ChartTooltipShell({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
  unit?: string;
}) {
  if (!active || !payload?.length) return null;
  const heading = label ?? (payload.length === 1 ? undefined : payload[0]?.name);
  return (
    <div className="min-w-36 rounded-xl border border-white/60 bg-white/85 px-3 py-2.5 shadow-[0_12px_32px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/5 backdrop-blur-md">
      {heading !== undefined && heading !== "" && <p className="mb-1.5 text-[11px] font-medium text-slate-500">{heading}</p>}
      <div className="space-y-1">
        {payload.map((entry, i) => {
          const swatch = (typeof entry.payload?.color === "string" && entry.payload.color) || entry.color || "var(--chart-1)";
          return (
            <p key={`${entry.dataKey ?? i}`} className="flex items-center justify-between gap-4 text-xs text-slate-600">
              <span className="flex items-center gap-2">
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: swatch }} />
                {entry.name}
              </span>
              <span className="tabular font-semibold text-slate-900">
                {entry.value ?? "—"}
                {unit && entry.value !== undefined ? unit : ""}
              </span>
            </p>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Empty states ---------- */

export function ChartEmpty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-8 text-center">
      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
        <Inbox size={16} aria-hidden />
      </span>
      <p className="mt-1 text-[13px] font-semibold text-slate-900">{title}</p>
      <p className="max-w-60 text-xs text-slate-500">{hint}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

export function ListEmpty({ title, hint, action }: { title: string; hint: string; action?: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-slate-500 ring-1 ring-slate-200">
        <CalendarX2 size={16} aria-hidden />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-slate-900">{title}</p>
        <p className="truncate text-xs text-slate-500">{hint}</p>
      </div>
      {action}
    </div>
  );
}
