"use client";

import { useId, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ---------- Sparkline (pure SVG: crisp, zero layout cost) ---------- */

export function Sparkline({ values, color = "var(--chart-1)", className }: { values: number[]; color?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  if (values.length < 2) return <div className={cn("h-9", className)} aria-hidden />;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const points = values.map((value, index) => [(index / (values.length - 1)) * 100, 30 - ((value - min) / span) * 26] as const);
  const line = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L100,32 L0,32 Z`;
  return (
    <svg viewBox="0 0 100 32" preserveAspectRatio="none" className={cn("h-9 w-full overflow-visible", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${id})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.75} vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

/* ---------- Delta badge ---------- */

export type Delta = { pct: number | null; goodWhen?: "up" | "down"; caption?: string };

export function DeltaBadge({ pct, goodWhen = "up", caption }: Delta) {
  if (pct === null) {
    return <span className="text-xs text-slate-500">New {caption ? `· ${caption}` : ""}</span>;
  }
  const flat = Math.abs(pct) < 0.5;
  const up = pct > 0;
  const good = flat ? null : up === (goodWhen === "up");
  const Icon = flat ? ArrowRight : up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <span
        className={cn(
          "tabular inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold",
          good === null ? "bg-slate-100 text-slate-600" : good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700",
        )}
      >
        <Icon size={12} aria-hidden />
        {flat ? "0%" : `${Math.abs(pct).toFixed(Math.abs(pct) < 10 ? 1 : 0)}%`}
      </span>
      {caption}
    </span>
  );
}

/* ---------- KPI strip ---------- */

export function KpiGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-slate-200/80 bg-slate-200/70 shadow-sm sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export function KpiCell({
  label,
  value,
  unit,
  delta,
  hint,
  spark,
  sparkColor,
  tone,
  href,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: Delta;
  hint?: string;
  spark?: number[];
  sparkColor?: string;
  tone?: "danger" | "warning";
  href?: string;
  icon?: ReactNode;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[13px] font-medium text-slate-600">
          {tone && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", tone === "danger" ? "bg-red-500" : "bg-amber-500")} />}
          {label}
        </p>
        {icon && <span className="text-slate-400">{icon}</span>}
      </div>
      <div className="mt-2 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="tabular text-[1.75rem] font-semibold leading-none tracking-tight text-slate-900">
            {value}
            {unit && <span className="ml-1 text-base font-medium text-slate-500">{unit}</span>}
          </p>
          <div className="mt-2.5 min-h-5">{delta ? <DeltaBadge {...delta} /> : hint ? <p className="text-xs text-slate-500">{hint}</p> : null}</div>
        </div>
        {spark && <Sparkline values={spark} color={sparkColor} className="w-24 shrink-0" />}
      </div>
    </>
  );
  const className = "group relative block bg-white p-5 transition-colors";
  return href ? (
    <Link href={href} className={cn(className, "hover:bg-slate-50/70")}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  );
}

/* ---------- Segmented control ---------- */

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
  size = "sm",
}: {
  value: T;
  onChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: ReactNode; count?: number }>;
  label: string;
  size?: "sm" | "md";
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex shrink-0 rounded-lg border border-slate-200/80 bg-slate-100/70 p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex cursor-pointer items-center gap-1.5 rounded-md font-medium transition-all",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-[13px]",
            value === option.value ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80" : "text-slate-500 hover:text-slate-900",
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className={cn("tabular rounded px-1 text-[10px] font-semibold", value === option.value ? "bg-slate-100 text-slate-700" : "text-slate-400")}>{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ---------- Ratio bar (100% stacked) ---------- */

export function RatioBar({ segments, className }: { segments: Array<{ label: string; value: number; color: string }>; className?: string }) {
  const legendCols = segments.length >= 4 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3";
  const total = segments.reduce((sum, item) => sum + item.value, 0);
  return (
    <div className={className}>
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full bg-slate-100" role="img" aria-label={segments.map((s) => `${s.label} ${s.value}`).join(", ")}>
        {total > 0 &&
          segments
            .filter((segment) => segment.value > 0)
            .map((segment) => <span key={segment.label} className="h-full first:rounded-l-full last:rounded-r-full" style={{ width: `${(segment.value / total) * 100}%`, background: segment.color }} />)}
      </div>
      <dl className={cn("mt-3 grid gap-x-2 gap-y-3", legendCols)}>
        {segments.map((segment) => (
          <div key={segment.label} className="min-w-0">
            <dt className="flex items-center gap-1.5 truncate text-xs text-slate-500">
              <span aria-hidden className="h-2 w-2 shrink-0 rounded-sm" style={{ background: segment.color }} />
              {segment.label}
            </dt>
            <dd className="tabular mt-0.5 text-sm font-semibold text-slate-900">
              {segment.value}
              <span className="ml-1 text-xs font-normal text-slate-500">{total ? Math.round((segment.value / total) * 100) : 0}%</span>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

/* ---------- Panel (section card with header row) ---------- */

export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** Removes body padding, for edge-to-edge tables and lists. */
  flush?: boolean;
}) {
  return (
    <section className={cn("flex min-w-0 flex-col rounded-2xl border border-slate-200/80 bg-white shadow-sm", className)}>
      <header className="flex items-start justify-between gap-3 px-5 pb-3 pt-4">
        <div className="min-w-0">
          <h2 className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
        </div>
        {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
      </header>
      <div className={cn("min-h-0 flex-1", flush ? "" : "px-5 pb-5", bodyClassName)}>{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
      {children}
      <ArrowRight size={12} aria-hidden />
    </Link>
  );
}
