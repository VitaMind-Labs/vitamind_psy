"use client";

import { useId, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartEmpty, ChartTooltipShell } from "@/features/dashboard/components/overview/cards";
import { cn } from "@/lib/utils";

export type ChartData = Record<string, string | number>;

export type ChartSeries = {
  key: string;
  name: string;
  color?: string;
};

const PALETTE = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)"];
const AXIS = { tickLine: false, axisLine: false, tickMargin: 8 } as const;
const colorOf = (series: ChartSeries, index: number) => series.color ?? PALETTE[index % PALETTE.length];

/* ---------- Page scaffolding ---------- */

export function DashboardPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
    >
      <div className="min-w-0">
        <p className="text-xs font-medium text-teal-700">{eyebrow}</p>
        <h1 className="mt-1 text-[1.625rem] font-semibold leading-tight tracking-tight text-slate-900">{title}</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>
      </div>
      {action ? <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div> : null}
    </motion.div>
  );
}

const TONES = {
  blue: { chip: "bg-slate-100 text-slate-700", bar: "bg-slate-300" },
  green: { chip: "bg-emerald-50 text-emerald-700", bar: "bg-emerald-400" },
  amber: { chip: "bg-amber-50 text-amber-700", bar: "bg-amber-400" },
  red: { chip: "bg-red-50 text-red-700", bar: "bg-red-400" },
} as const;

export function DashboardStatCard({
  label,
  value,
  detail,
  icon,
  tone = "blue",
}: {
  label: string;
  value: string | number;
  detail?: string;
  icon?: ReactNode;
  tone?: keyof typeof TONES;
}) {
  return (
    <div className="dashboard-card relative flex min-h-[116px] flex-col justify-between overflow-hidden p-4">
      <span aria-hidden className={cn("absolute inset-y-4 left-0 w-0.5 rounded-r-full", TONES[tone].bar)} />
      <div className="flex items-start justify-between gap-3">
        <p className="text-[13px] font-medium text-slate-600">{label}</p>
        {icon ? (
          <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TONES[tone].chip)}>{icon}</span>
        ) : null}
      </div>
      <div className="min-w-0">
        <p className="tabular text-[1.75rem] font-semibold leading-none tracking-tight text-slate-900">{value}</p>
        {detail ? <p className="mt-1.5 truncate text-xs text-slate-500">{detail}</p> : null}
      </div>
    </div>
  );
}

export function DashboardChartCard({
  title,
  subtitle,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("flex min-h-0 flex-col", className)}>
      <CardHeader className="pb-0">
        <div className="min-w-0">
          <CardTitle>{title}</CardTitle>
          {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
        </div>
        {action ? <div className="shrink-0">{action}</div> : null}
      </CardHeader>
      <CardContent className={cn("flex min-h-0 flex-1 flex-col", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

/* ---------- Charts ---------- */

type BaseChartProps = {
  data: ChartData[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  emptyTitle?: string;
  emptyHint?: string;
  unit?: string;
};

function ChartFrame({ height, children }: { height: number; children: ReactNode }) {
  // Fixed height reserves space up front so charts never cause layout shift.
  return (
    <div className="w-full min-w-0" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%" debounce={50}>
        {children as React.ReactElement}
      </ResponsiveContainer>
    </div>
  );
}

function SeriesLegend({ series }: { series: ChartSeries[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {series.map((item, index) => (
        <li key={item.key} className="flex items-center gap-1.5 text-xs text-slate-600">
          <span aria-hidden className="h-2 w-2 rounded-full" style={{ background: colorOf(item, index) }} />
          {item.name}
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsBarChart({
  data,
  xKey,
  series,
  height = 220,
  emptyTitle = "No chart data yet",
  emptyHint = "New activity will appear here as it is recorded.",
  yWidth = 32,
  unit,
  stacked = false,
}: BaseChartProps & { yWidth?: number; stacked?: boolean }) {
  if (data.length === 0) return <ChartEmpty title={emptyTitle} hint={emptyHint} />;

  return (
    <>
      <SeriesLegend series={series} />
      <ChartFrame height={height}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -12 }} barCategoryGap="32%" barGap={4}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} minTickGap={12} interval="preserveStartEnd" />
          <YAxis {...AXIS} width={yWidth} allowDecimals={false} />
          <Tooltip content={<ChartTooltipShell unit={unit} />} cursor={{ fill: "rgba(241,245,249,0.7)", radius: 6 }} />
          {series.map((item, index) => (
            <Bar
              key={item.key}
              dataKey={item.key}
              name={item.name}
              stackId={stacked ? "stack" : undefined}
              fill={colorOf(item, index)}
              radius={stacked ? (index === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]) : [6, 6, 2, 2]}
              maxBarSize={32}
              isAnimationActive={data.length < 60}
            >
              {data.map((row, rowIndex) =>
                typeof row.color === "string" && series.length === 1 ? <Cell key={rowIndex} fill={row.color} /> : null,
              )}
            </Bar>
          ))}
        </BarChart>
      </ChartFrame>
    </>
  );
}

export function AnalyticsLineChart({
  data,
  xKey,
  series,
  height = 220,
  emptyTitle = "No chart data yet",
  emptyHint = "New activity will appear here as it is recorded.",
  yDomain,
  unit,
}: BaseChartProps & { yDomain?: [number, number] }) {
  if (data.length === 0) return <ChartEmpty title={emptyTitle} hint={emptyHint} />;

  return (
    <>
      <SeriesLegend series={series} />
      <ChartFrame height={height}>
        <LineChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} minTickGap={16} />
          <YAxis {...AXIS} width={34} allowDecimals={false} domain={yDomain} />
          <Tooltip content={<ChartTooltipShell unit={unit} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
          {series.map((item, index) => (
            <Line
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={colorOf(item, index)}
              strokeWidth={index === 0 ? 2.25 : 1.75}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              connectNulls
            />
          ))}
        </LineChart>
      </ChartFrame>
    </>
  );
}

export function AnalyticsAreaChart({
  data,
  xKey,
  series,
  height = 220,
  emptyTitle = "No chart data yet",
  emptyHint = "New activity will appear here as it is recorded.",
  yDomain,
  unit,
}: BaseChartProps & { yDomain?: [number, number] }) {
  const gradientId = useId().replace(/:/g, "");
  if (data.length === 0) return <ChartEmpty title={emptyTitle} hint={emptyHint} />;

  return (
    <>
      <SeriesLegend series={series} />
      <ChartFrame height={height}>
        <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -14 }}>
          <defs>
            {series.map((item, index) => (
              <linearGradient key={item.key} id={`${gradientId}-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={colorOf(item, index)} stopOpacity={index === 0 ? 0.24 : 0.12} />
                <stop offset="95%" stopColor={colorOf(item, index)} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid stroke="var(--chart-grid)" vertical={false} />
          <XAxis dataKey={xKey} {...AXIS} minTickGap={16} />
          <YAxis {...AXIS} width={34} allowDecimals={false} domain={yDomain} />
          <Tooltip content={<ChartTooltipShell unit={unit} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
          {series.map((item, index) => (
            <Area
              key={item.key}
              type="monotone"
              dataKey={item.key}
              name={item.name}
              stroke={colorOf(item, index)}
              strokeWidth={index === 0 ? 2.25 : 1.75}
              fill={`url(#${gradientId}-${index})`}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 2, stroke: "#fff" }}
              connectNulls
            />
          ))}
        </AreaChart>
      </ChartFrame>
    </>
  );
}

export function AnalyticsDonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
  colors = PALETTE,
  showLegend = true,
}: {
  data: ChartData[];
  height?: number;
  centerLabel?: string;
  centerValue?: string | number;
  colors?: string[];
  showLegend?: boolean;
}) {
  const visible = data.filter((item) => Number(item.value) > 0);
  if (visible.length === 0) return <ChartEmpty title="No chart data yet" hint="New activity will appear here as it is recorded." />;
  const fillFor = (item: ChartData, index: number) => (typeof item.color === "string" ? item.color : colors[index % colors.length]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%" debounce={50}>
          <PieChart>
            <Pie data={visible} dataKey="value" nameKey="name" innerRadius="66%" outerRadius="86%" paddingAngle={2} cornerRadius={4} stroke="#fff" strokeWidth={2}>
              {visible.map((item, index) => (
                <Cell key={`${item.name}-${index}`} fill={fillFor(item, index)} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipShell />} />
          </PieChart>
        </ResponsiveContainer>
        {centerValue !== undefined ? (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="tabular text-2xl font-semibold tracking-tight text-slate-900">{centerValue}</span>
            {centerLabel ? <span className="text-[11px] text-slate-500">{centerLabel}</span> : null}
          </div>
        ) : null}
      </div>
      {showLegend && (
        <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
          {visible.map((item, index) => (
            <li key={`${item.name}-${index}`} className="flex items-center justify-between gap-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-600">
                <span aria-hidden className="h-2 w-2 shrink-0 rounded-full" style={{ background: fillFor(item, index) }} />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="tabular font-semibold text-slate-900">{item.value}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

