"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ChevronRight, Search } from "lucide-react";
import type { AssessmentListItem, AssessmentQueue, AssessmentStatus, PatientRef } from "@/lib/api/psychologist";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, RatioBar, Segmented } from "@/components/layout/Kpi";
import { ChartEmpty, ChartTooltipShell } from "@/features/dashboard/components/overview/cards";
import { PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { bucketByDay, windowDelta } from "@/features/dashboard/lib/metrics";
import { useNow } from "@/hooks/use-now";

type Row = AssessmentQueue["data"][number];
type Filter = "queue" | "FOLLOW_UP_REQUIRED" | "REVIEWED" | "all";

export const REVIEW_META: Record<AssessmentListItem["reviewStatus"], { label: string; variant: BadgeVariant; color: string; rank: number }> = {
  PENDING: { label: "Needs review", variant: "warning", color: "#f59e0b", rank: 0 },
  FOLLOW_UP_REQUIRED: { label: "Follow-up", variant: "high", color: "#f97316", rank: 1 },
  DRAFT: { label: "Draft", variant: "info", color: "#0ea5e9", rank: 2 },
  REVIEWED: { label: "Reviewed", variant: "success", color: "#10b981", rank: 3 },
};

export const ASSESSMENT_STATUS_LABEL: Record<AssessmentStatus, string> = {
  ACTIVE: "In progress",
  COMPLETED: "Completed",
  ABANDONED: "Abandoned",
  EXPIRED: "Expired",
  BLOCKED: "Blocked",
};

const needsReview = (row: AssessmentListItem) => row.status === "COMPLETED" && (row.reviewStatus === "PENDING" || row.reviewStatus === "DRAFT");
const fullName = (patient: PatientRef) => `${patient.firstName}${patient.lastName ? ` ${patient.lastName}` : ""}`;

export function AssessmentsIndex({ queue }: { queue: AssessmentQueue }) {
  const now = useNow();
  const [filter, setFilter] = useState<Filter>("queue");
  const [query, setQuery] = useState("");

  const rows = queue.data;
  const truncated = queue.meta.total > rows.length;

  const stats = useMemo(() => {
    const completed = rows.filter((row) => row.completedAt);
    const count = (status: AssessmentListItem["reviewStatus"]) => rows.filter((row) => row.reviewStatus === status).length;
    return {
      queue: rows.filter(needsReview).length,
      followUp: count("FOLLOW_UP_REQUIRED"),
      reviewed: count("REVIEWED"),
      completedDelta: windowDelta(completed, (row) => row.completedAt, 7, now),
      completedSpark: bucketByDay(completed, (row) => row.completedAt, 14, now).map((row) => row.value),
      inProgress: rows.filter((row) => row.status === "ACTIVE").length,
      byDay: bucketByDay(completed, (row) => row.completedAt, 30, now),
      mix: (["PENDING", "DRAFT", "FOLLOW_UP_REQUIRED", "REVIEWED"] as const).map((status) => ({ label: REVIEW_META[status].label, value: count(status), color: REVIEW_META[status].color })),
    };
  }, [rows, now]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows
      .filter((row) =>
        filter === "all" ? true : filter === "queue" ? needsReview(row) : row.reviewStatus === filter,
      )
      .filter((row) => !needle || `${fullName(row.patient)} ${row.patient.patientCode}`.toLowerCase().includes(needle))
      .sort((a, b) => REVIEW_META[a.reviewStatus].rank - REVIEW_META[b.reviewStatus].rank || (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt));
  }, [rows, filter, query]);

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Clinical records" title="Assessments" description="MIRA diagnostic assessments across your caseload, ordered by what needs your review first." />

      {truncated && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <AlertTriangle size={14} aria-hidden /> Showing the {rows.length} most recent assessments (of {queue.meta.total}). Older ones are in each patient record.
        </p>
      )}

      <KpiGrid>
        <KpiCell label="Awaiting your review" value={stats.queue} tone={stats.queue > 0 ? "warning" : undefined} hint="Completed, not yet signed off" />
        <KpiCell label="Follow-up required" value={stats.followUp} tone={stats.followUp > 0 ? "danger" : undefined} hint="Flagged in a professional review" />
        <KpiCell
          label="Completed this week"
          value={stats.completedDelta.current}
          delta={{ pct: stats.completedDelta.pct, goodWhen: "up", caption: "vs last week" }}
          spark={stats.completedSpark}
        />
        <KpiCell label="In progress" value={stats.inProgress} hint={`${stats.reviewed} reviewed in total`} />
      </KpiGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 rounded-2xl border border-slate-200/80 bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
            <Segmented
              label="Filter assessments"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "queue", label: "Review queue", count: stats.queue },
                { value: "FOLLOW_UP_REQUIRED", label: "Follow-up", count: stats.followUp },
                { value: "REVIEWED", label: "Reviewed", count: stats.reviewed },
                { value: "all", label: "All", count: rows.length },
              ]}
            />
            <div className="relative lg:w-64">
              <Search size={14} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by patient" aria-label="Filter by patient" className="input-ui h-8 rounded-lg pl-8 text-[13px]" />
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="p-6">
              <ChartEmpty
                title={filter === "queue" && !query ? "Review queue is clear" : "No assessments here"}
                hint={filter === "queue" && !query ? "Completed assessments will appear here for sign-off." : "Try another filter or search."}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-slate-50/60">
                  <tr className="border-b border-slate-100 text-left text-xs text-slate-500">
                    <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">Patient</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Assessment</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Completed</th>
                    <th scope="col" className="px-3 py-2.5 font-medium">Review</th>
                    <th scope="col" className="w-10 pr-4"><span className="sr-only">Open</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visible.map((row) => (
                    <tr key={row.id} className="group relative transition-colors hover:bg-slate-50/70">
                      <td className="py-3 pl-5 pr-3">
                        <span className="flex items-center gap-3">
                          <PatientAvatar name={fullName(row.patient)} />
                          <span className="min-w-0">
                            <Link
                              href={`/dashboard/patients/${row.patient.id}?tab=assessments&assessmentId=${row.id}`}
                              className="block truncate font-medium text-slate-900 after:absolute after:inset-0 group-hover:text-teal-700"
                            >
                              {fullName(row.patient)}
                            </Link>
                            <span className="block text-xs text-slate-500">{row.patient.patientCode}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="block text-[13px] text-slate-800">MIRA diagnostic</span>
                        <span className="block text-xs text-slate-500">
                          {ASSESSMENT_STATUS_LABEL[row.status]} · {row.language.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        {row.completedAt ? (
                          <time dateTime={row.completedAt} title={format(new Date(row.completedAt), "MMM d, yyyy · HH:mm")} className="text-xs text-slate-600">
                            {formatDistanceToNowStrict(new Date(row.completedAt), { addSuffix: true })}
                          </time>
                        ) : (
                          <span className="text-xs text-slate-400">Started {format(new Date(row.startedAt), "MMM d")}</span>
                        )}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={REVIEW_META[row.reviewStatus].variant} dot>{REVIEW_META[row.reviewStatus].label}</Badge>
                      </td>
                      <td className="pr-4 text-right">
                        <ChevronRight size={16} aria-hidden className="inline text-slate-300 transition-colors group-hover:text-slate-500" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <aside className="space-y-6" aria-label="Assessment analytics">
          <Panel title="Review status" description={`${rows.length} assessments loaded`}>
            <RatioBar segments={stats.mix} />
          </Panel>
          <Panel title="Completions" description="Per day · last 30 days">
            {stats.byDay.every((row) => row.value === 0) ? (
              <ChartEmpty title="No completions yet" hint="Completed assessments will chart here." />
            ) : (
              <div className="h-40 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart data={stats.byDay} margin={{ top: 4, right: 0, bottom: 0, left: -24 }} barCategoryGap="18%">
                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={30} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                    <Tooltip content={<ChartTooltipShell />} cursor={{ fill: "rgba(241,245,249,0.8)" }} />
                    <Bar dataKey="value" name="Completed" fill="#0d9488" radius={[3, 3, 0, 0]} maxBarSize={14} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  );
}
