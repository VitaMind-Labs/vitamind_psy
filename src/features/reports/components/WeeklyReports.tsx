"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { ArrowRight, Check, ChevronDown, Download, FileText, MessageSquareText } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { WeeklyReport } from "@/lib/api/psychologist";
import { acknowledgeWeeklyReportAction, annotateWeeklyReportAction } from "@/features/reports/actions/weekly-reports";
import { exportWeeklyReportAction } from "@/features/clinical/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, RatioBar, Segmented } from "@/components/layout/Kpi";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartTooltipShell } from "@/features/dashboard/components/overview/cards";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { TrafficLightBadge } from "@/features/risks/components/RiskBadge";
import { TRAFFIC_META } from "@/features/risks/lib/risk";
import { cn } from "@/lib/utils";

type ReportAlert = { id?: string; title?: string; triggeredAt?: string; status?: string; resolution?: string };
type Filter = "pending" | "reviewed" | "all";

const noteSchema = z.object({ content: z.string().trim().min(3, "Add a little more context before saving.") });
type NoteValues = z.infer<typeof noteSchema>;

const isReviewed = (report: WeeklyReport) => report.status === "RELEASED" || Boolean(report.acknowledgedAt);
const humanize = (key: string) => key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ").toLowerCase();

function formatValue(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number") return Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function reportAlerts(report: WeeklyReport) {
  const value = report.clinicianContent.alerts;
  return Array.isArray(value) ? (value as ReportAlert[]) : [];
}

export function WeeklyReports({ initialReports, initialReportId }: { initialReports: WeeklyReport[]; initialReportId?: string }) {
  const [reports, setReports] = useState(initialReports);
  const linked = initialReportId ? initialReports.find((report) => report.id === initialReportId) : undefined;
  const [filter, setFilter] = useState<Filter>(linked ? (isReviewed(linked) ? "reviewed" : "pending") : "pending");
  const [expanded, setExpanded] = useState<string | null>(linked?.id ?? null);
  const [busy, setBusy] = useState<string | null>(null);
  const [noteReport, setNoteReport] = useState<WeeklyReport | null>(null);
  const noteForm = useForm<NoteValues>({ resolver: zodResolver(noteSchema), defaultValues: { content: "" } });

  const summary = useMemo(() => {
    const count = (light: WeeklyReport["trafficLight"]) => reports.filter((report) => report.trafficLight === light).length;
    const reviewed = reports.filter(isReviewed).length;
    return {
      total: reports.length,
      priority: count("RED"),
      watch: count("AMBER"),
      reviewed,
      pending: reports.length - reviewed,
      mix: (["RED", "AMBER", "GREEN"] as const).map((light) => ({ label: TRAFFIC_META[light].label, value: count(light), color: TRAFFIC_META[light].color })),
      byWeek: Object.values(
        reports.reduce<Record<string, { week: string; start: string; RED: number; AMBER: number; GREEN: number }>>((acc, report) => {
          const key = report.weekStart.slice(0, 10);
          acc[key] ??= { week: format(new Date(report.weekStart), "MMM d"), start: key, RED: 0, AMBER: 0, GREEN: 0 };
          acc[key][report.trafficLight] += 1;
          return acc;
        }, {}),
      )
        .sort((a, b) => a.start.localeCompare(b.start))
        .slice(-10),
    };
  }, [reports]);

  const queue = useMemo(
    () =>
      reports
        .filter((report) => (filter === "all" ? true : filter === "pending" ? !isReviewed(report) : isReviewed(report)))
        .sort(
          (a, b) =>
            Number(isReviewed(a)) - Number(isReviewed(b)) ||
            TRAFFIC_META[a.trafficLight].rank - TRAFFIC_META[b.trafficLight].rank ||
            b.weekStart.localeCompare(a.weekStart),
        ),
    [reports, filter],
  );

  const replace = (updated: WeeklyReport) => setReports((current) => current.map((report) => (report.id === updated.id ? updated : report)));

  const acknowledge = async (reportId: string) => {
    setBusy(reportId);
    try {
      replace(await acknowledgeWeeklyReportAction(reportId));
      toast.success("Report acknowledged · patient version released");
    } catch {
      toast.error("Unable to acknowledge the report");
    } finally {
      setBusy(null);
    }
  };

  const exportReport = async (reportId: string) => {
    try {
      await exportWeeklyReportAction(reportId);
      toast.success("Export logged. Opening print dialog.");
      window.print();
    } catch {
      toast.error("Export failed");
    }
  };

  const openNote = (report: WeeklyReport) => {
    setNoteReport(report);
    noteForm.reset({ content: report.clinicianNote ?? "" });
  };

  const saveNote = noteForm.handleSubmit(async (values) => {
    if (!noteReport) return;
    try {
      replace(await annotateWeeklyReportAction(noteReport.id, values.content));
      setNoteReport(null);
      toast.success("Clinical note saved");
    } catch {
      toast.error("Unable to save the note");
    }
  });

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Clinical insight" title="Weekly reports" description="Review priority weeks first, then release the patient version with a single acknowledgement." />

      <KpiGrid>
        <KpiCell label="Awaiting review" value={summary.pending} tone={summary.pending > 0 ? "warning" : undefined} hint={`of ${summary.total} reports loaded`} icon={<FileText size={15} aria-hidden />} />
        <KpiCell label="Priority weeks" value={summary.priority} tone={summary.priority > 0 ? "danger" : undefined} hint="Red traffic light" />
        <KpiCell label="Watch" value={summary.watch} hint="Amber traffic light" />
        <KpiCell label="Released" value={summary.reviewed} hint="Acknowledged and sent to patients" icon={<Check size={15} aria-hidden />} />
      </KpiGrid>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="reports-heading" className="min-w-0 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="reports-heading" className="text-[15px] font-semibold text-slate-900">
              Review queue <span className="tabular ml-1 font-normal text-slate-500">{queue.length}</span>
            </h2>
            <Segmented
              label="Filter reports"
              value={filter}
              onChange={setFilter}
              options={[
                { value: "pending", label: "Needs review", count: summary.pending },
                { value: "reviewed", label: "Released", count: summary.reviewed },
                { value: "all", label: "All", count: summary.total },
              ]}
            />
          </div>

          {queue.length === 0 ? (
            <ChartEmpty
              title={filter === "pending" ? "All caught up" : "No reports here"}
              hint={filter === "pending" ? "Every weekly report has been reviewed." : "Weekly reports appear after each monitoring week closes."}
              action={filter !== "all" ? <Button size="sm" variant="secondary" onClick={() => setFilter("all")}>Show all reports</Button> : undefined}
            />
          ) : (
            <ul className="space-y-2.5">
              {queue.map((report) => {
                const open = expanded === report.id;
                const alerts = reportAlerts(report);
                const reviewed = isReviewed(report);
                return (
                  <li key={report.id} className={cn("dashboard-card overflow-hidden", report.trafficLight === "RED" && !reviewed && "border-red-200")}>
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : report.id)}
                      aria-expanded={open}
                      aria-controls={`report-${report.id}`}
                      className="flex w-full cursor-pointer items-center gap-3 p-4 text-left transition-colors hover:bg-slate-50/60 sm:gap-4"
                    >
                      <span aria-hidden className="h-10 w-1 shrink-0 rounded-full" style={{ background: TRAFFIC_META[report.trafficLight].color }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-900">{report.user?.nickname ?? "Patient"}</span>
                          {report.previousTrafficLight && report.previousTrafficLight !== report.trafficLight ? (
                            <span className="flex items-center gap-1">
                              <TrafficLightBadge light={report.previousTrafficLight} className="opacity-60" />
                              <ArrowRight size={12} aria-label="changed to" className="text-slate-400" />
                              <TrafficLightBadge light={report.trafficLight} />
                            </span>
                          ) : (
                            <TrafficLightBadge light={report.trafficLight} />
                          )}
                          {reviewed ? <Badge variant="success">Released</Badge> : report.reminderSentAt ? <Badge variant="warning">72h reminder sent</Badge> : null}
                        </div>
                        <p className="mt-0.5 truncate text-[13px] text-slate-600">{report.headline || "Weekly summary"}</p>
                      </div>
                      <span className="tabular hidden shrink-0 text-xs text-slate-500 sm:block">
                        {format(new Date(report.weekStart), "MMM d")} – {format(new Date(report.weekEnd), "MMM d")}
                      </span>
                      <ChevronDown size={16} aria-hidden className={cn("shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
                    </button>

                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          id={`report-${report.id}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <div className="grid gap-6 border-t border-slate-100 p-5 lg:grid-cols-2">
                            <div className="space-y-5">
                              <div>
                                <h3 className="eyebrow">Signals</h3>
                                {Object.keys(report.metrics ?? {}).length === 0 ? (
                                  <p className="mt-2 text-sm text-slate-500">No metrics this week.</p>
                                ) : (
                                  <dl className="mt-2 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
                                    {Object.entries(report.metrics).map(([key, value]) => (
                                      <div key={key} className="bg-white p-3">
                                        <dt className="truncate text-[11px] capitalize text-slate-500">{humanize(key)}</dt>
                                        <dd className="tabular mt-0.5 text-sm font-semibold text-slate-900">{formatValue(value)}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                )}
                              </div>
                              <div>
                                <h3 className="eyebrow">Alerts this week</h3>
                                {alerts.length === 0 ? (
                                  <p className="mt-2 text-sm text-slate-500">No alerts recorded.</p>
                                ) : (
                                  <ul className="mt-2 divide-y divide-slate-100 rounded-xl border border-slate-200/80">
                                    {alerts.map((alert, index) => (
                                      <li key={alert.id ?? index} className="flex items-center justify-between gap-3 px-3 py-2.5 text-xs">
                                        <span className="min-w-0">
                                          <span className="block truncate font-medium text-slate-900">{alert.title ?? "Clinical alert"}</span>
                                          <span className="text-slate-500">{alert.status ?? "Open"}{alert.resolution ? ` · ${humanize(alert.resolution)}` : ""}</span>
                                        </span>
                                        <span className="tabular shrink-0 text-slate-500">{alert.triggeredAt ? format(new Date(alert.triggeredAt), "MMM d") : "—"}</span>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </div>
                            <div className="space-y-5">
                              <div>
                                <h3 className="eyebrow">Discussion points</h3>
                                {report.discussionPoints.length === 0 ? (
                                  <p className="mt-2 text-sm text-slate-500">No discussion points.</p>
                                ) : (
                                  <ol className="mt-2 space-y-2">
                                    {report.discussionPoints.map((point, index) => (
                                      <li key={index} className="flex gap-2.5 text-sm text-slate-700">
                                        <span className="tabular flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold text-slate-600">{index + 1}</span>
                                        {point}
                                      </li>
                                    ))}
                                  </ol>
                                )}
                              </div>
                              {report.patientNote && (
                                <div className="rounded-xl border border-teal-200 bg-teal-50/60 p-3">
                                  <p className="text-xs font-semibold text-teal-900">Patient&apos;s note</p>
                                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{report.patientNote}</p>
                                </div>
                              )}
                              {report.clinicianNote && (
                                <div className="rounded-xl border border-slate-200/80 bg-slate-50 p-3">
                                  <p className="text-xs font-semibold text-slate-900">Your private note</p>
                                  <p className="mt-1 whitespace-pre-line text-sm text-slate-700">{report.clinicianNote}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                            <Button size="sm" variant="ghost" onClick={() => openNote(report)}>
                              <MessageSquareText size={14} aria-hidden /> {report.clinicianNote ? "Edit note" : "Add note"}
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => void exportReport(report.id)}>
                              <Download size={14} aria-hidden /> Export PDF
                            </Button>
                            {!reviewed && (
                              <Button size="sm" loading={busy === report.id} onClick={() => void acknowledge(report.id)}>
                                {busy !== report.id && <Check size={14} aria-hidden />} Acknowledge & release
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-6" aria-label="Report analytics">
          <Panel title="Traffic-light mix" description="Attention level across loaded reports">
            <RatioBar segments={summary.mix} />
          </Panel>
          <Panel title="By week" description="Reports per week, by traffic light">
            {summary.byWeek.length === 0 ? (
              <p className="text-sm text-slate-500">No reports yet.</p>
            ) : (
              <div className="h-44 w-full min-w-0">
                <ResponsiveContainer width="100%" height="100%" debounce={50}>
                  <BarChart data={summary.byWeek} margin={{ top: 4, right: 0, bottom: 0, left: -24 }} barCategoryGap="28%">
                    <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} minTickGap={16} />
                    <YAxis tickLine={false} axisLine={false} allowDecimals={false} width={36} />
                    <Tooltip content={<ChartTooltipShell />} cursor={{ fill: "rgba(241,245,249,0.8)" }} />
                    {(["GREEN", "AMBER", "RED"] as const).map((light, index) => (
                      <Bar key={light} dataKey={light} name={TRAFFIC_META[light].label} stackId="w" fill={TRAFFIC_META[light].color} radius={index === 2 ? [4, 4, 0, 0] : [0, 0, 0, 0]} maxBarSize={22} />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </Panel>
        </aside>
      </div>

      <Dialog open={noteReport !== null} onOpenChange={(open) => !open && setNoteReport(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Private clinical note</DialogTitle>
            <DialogDescription>Context for your next conversation. Not included in the patient release.</DialogDescription>
          </DialogHeader>
          <Form {...noteForm}>
            <form onSubmit={saveNote} className="space-y-4">
              <FormField control={noteForm.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Note</FormLabel>
                  <FormControl><Textarea {...field} rows={8} placeholder="Add context for the next conversation…" className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setNoteReport(null)}>Cancel</Button>
                <Button type="submit" loading={noteForm.formState.isSubmitting}>Save note</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
