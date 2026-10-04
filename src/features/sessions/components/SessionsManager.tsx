"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { addDays, format, isToday, isTomorrow, isYesterday, startOfDay } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Activity, CalendarDays, CalendarPlus, CheckCircle2, Clock3, MoreHorizontal, UserX, XCircle } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { completeSession, createSession, updateSession } from "@/features/sessions/actions/sessions";
import type { PatientListItem, SessionListItem, TherapySessionStatus, TherapySessionType } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import { AnalyticsBarChart, DashboardChartCard, DashboardPageHeader, DashboardStatCard } from "@/components/layout/DashboardUI";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<TherapySessionType, string> = { INITIAL: "Initial", FOLLOW_UP: "Follow-up", REVIEW: "Review", EMERGENCY: "Urgent" };
const STATUS_META: Record<TherapySessionStatus, { label: string; variant: BadgeVariant }> = {
  SCHEDULED: { label: "Scheduled", variant: "info" },
  PROPOSED: { label: "Proposed", variant: "brand" },
  IN_PROGRESS: { label: "In progress", variant: "warning" },
  COMPLETED: { label: "Completed", variant: "success" },
  CANCELLED: { label: "Cancelled", variant: "default" },
  NO_SHOW: { label: "No-show", variant: "danger" },
};
const CLOSED: TherapySessionStatus[] = ["COMPLETED", "CANCELLED", "NO_SHOW"];

const sessionSchema = z.object({
  patientId: z.string().min(1, "Choose a patient."),
  scheduledAt: z
    .string()
    .min(1, "Choose a date and time.")
    .refine((value) => new Date(value).getTime() > Date.now() - 5 * 60_000, "Choose a time in the future."),
  durationMinutes: z.coerce.number().min(15, "Use at least 15 minutes.").max(240, "Keep sessions under four hours."),
  type: z.enum(["INITIAL", "FOLLOW_UP", "REVIEW", "EMERGENCY"]),
  notes: z.string().max(2000).optional(),
});
const completionSchema = z
  .object({
    summary: z.string().trim().min(3, "Add a short session summary."),
    followUpRequired: z.boolean(),
    followUpDate: z.string().optional(),
  })
  .refine((data) => !data.followUpRequired || Boolean(data.followUpDate), { path: ["followUpDate"], message: "Pick a follow-up date." });

type SessionFormValues = z.infer<typeof sessionSchema>;
type CompletionFormValues = z.infer<typeof completionSchema>;
type View = "upcoming" | "past";

const defaultSession = (patientId: string): SessionFormValues => ({ patientId, scheduledAt: "", durationMinutes: 50, type: "FOLLOW_UP", notes: "" });

function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

export function SessionsManager({ initialSessions, patients, initialPatientId }: { initialSessions: SessionListItem[]; patients: PatientListItem[]; initialPatientId?: string }) {
  // Arriving from a patient record (or a notification) opens the booking form already pointed at that patient.
  const preselected = patients.find((patient) => patient.id === initialPatientId)?.id;
  const [sessions, setSessions] = useState(initialSessions);
  const now = useNow();
  const [view, setView] = useState<View>("upcoming");
  const [dialogOpen, setDialogOpen] = useState(Boolean(preselected));
  const [completionSession, setCompletionSession] = useState<SessionListItem | null>(null);
  const form = useForm<SessionFormValues>({ resolver: zodResolver(sessionSchema), defaultValues: defaultSession(preselected ?? patients[0]?.id ?? "") });
  const completionForm = useForm<CompletionFormValues>({ resolver: zodResolver(completionSchema), defaultValues: { summary: "", followUpRequired: false, followUpDate: "" } });
  const followUpRequired = useWatch({ control: completionForm.control, name: "followUpRequired" });

  const summary = useMemo(() => {
    const upcoming = sessions.filter((s) => !CLOSED.includes(s.status) && +new Date(s.scheduledAt) >= now - s.durationMinutes * 60_000);
    const completed = sessions.filter((s) => s.status === "COMPLETED").length;
    const noShow = sessions.filter((s) => s.status === "NO_SHOW").length;
    const overdue = sessions.filter((s) => !CLOSED.includes(s.status) && +new Date(s.scheduledAt) + s.durationMinutes * 60_000 < now).length;
    const today = startOfDay(now);
    const week = Array.from({ length: 7 }, (_, index) => {
      const day = addDays(today, index);
      const next = addDays(day, 1);
      return {
        day: index === 0 ? "Today" : format(day, "EEE"),
        sessions: sessions.filter((s) => s.status !== "CANCELLED" && new Date(s.scheduledAt) >= day && new Date(s.scheduledAt) < next).length,
      };
    });
    return {
      upcoming: upcoming.length,
      completed,
      overdue,
      attendance: completed + noShow === 0 ? null : Math.round((completed / (completed + noShow)) * 100),
      week,
    };
  }, [sessions, now]);

  const groups = useMemo(() => {
    const filtered = sessions
      .filter((s) => {
        const isPast = CLOSED.includes(s.status) || +new Date(s.scheduledAt) + s.durationMinutes * 60_000 < now;
        return view === "past" ? isPast : !isPast;
      })
      .sort((a, b) => (view === "past" ? -1 : 1) * a.scheduledAt.localeCompare(b.scheduledAt));
    const map = new Map<string, SessionListItem[]>();
    for (const session of filtered) {
      const key = format(new Date(session.scheduledAt), "yyyy-MM-dd");
      map.set(key, [...(map.get(key) ?? []), session]);
    }
    return [...map.entries()];
  }, [sessions, view, now]);

  const create = form.handleSubmit(async (values) => {
    try {
      const session = await createSession({ ...values, scheduledAt: new Date(values.scheduledAt).toISOString() });
      setSessions((current) => [session, ...current]);
      setDialogOpen(false);
      setView("upcoming");
      toast.success(`Session scheduled for ${format(new Date(session.scheduledAt), "MMM d, HH:mm")}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not create this session.");
    }
  });

  const finish = completionForm.handleSubmit(async (values) => {
    if (!completionSession) return;
    try {
      await completeSession(completionSession.id, {
        summary: values.summary,
        followUpRequired: values.followUpRequired,
        followUpDate: values.followUpRequired && values.followUpDate ? new Date(values.followUpDate).toISOString() : undefined,
      });
      setSessions((current) => current.map((item) => (item.id === completionSession.id ? { ...item, status: "COMPLETED" } : item)));
      setCompletionSession(null);
      toast.success("Session completed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "This session could not be completed.");
    }
  });

  const setStatus = async (session: SessionListItem, status: Extract<TherapySessionStatus, "CANCELLED" | "NO_SHOW">) => {
    try {
      await updateSession(session.id, { status });
      setSessions((current) => current.map((item) => (item.id === session.id ? { ...item, status } : item)));
      toast.success(status === "CANCELLED" ? "Session cancelled" : "Marked as no-show");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update this session.");
    }
  };

  const openCompletion = (session: SessionListItem) => {
    completionForm.reset({ summary: "", followUpRequired: false, followUpDate: "" });
    setCompletionSession(session);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Scheduling"
        title="Sessions"
        description="Your agenda, attendance and follow-ups in one place."
        action={
          <Dialog
            open={dialogOpen}
            onOpenChange={(open) => {
              setDialogOpen(open);
              if (open) form.reset(defaultSession(patients[0]?.id ?? ""));
            }}
          >
            <DialogTrigger asChild>
              <Button disabled={patients.length === 0}>
                <CalendarPlus size={15} aria-hidden /> New session
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Schedule a session</DialogTitle>
                <DialogDescription>Create an appointment and add a private preparation note for the care team.</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={create} className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="patientId"
                    render={({ field }) => (
                      <FormItem className="sm:col-span-2">
                        <FormLabel>Patient</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-11 rounded-xl"><SelectValue placeholder="Select a patient" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {patients.map((patient) => (
                              <SelectItem key={patient.id} value={patient.id}>
                                {patient.firstName} {patient.lastName ?? ""} · {patient.patientCode}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField control={form.control} name="scheduledAt" render={({ field }) => (
                    <FormItem><FormLabel>Date and time</FormLabel><FormControl><Input {...field} type="datetime-local" /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="durationMinutes" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration</FormLabel>
                      <Select onValueChange={(value) => field.onChange(Number(value))} value={String(field.value)}>
                        <FormControl><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          {[25, 30, 45, 50, 60, 90].map((minutes) => <SelectItem key={minutes} value={String(minutes)}>{minutes} minutes</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="type" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Session type</FormLabel>
                      <div role="radiogroup" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                        {(Object.keys(TYPE_LABEL) as TherapySessionType[]).map((type) => (
                          <button
                            key={type}
                            type="button"
                            role="radio"
                            aria-checked={field.value === type}
                            onClick={() => field.onChange(type)}
                            className={cn(
                              "cursor-pointer rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors",
                              field.value === type
                                ? type === "EMERGENCY" ? "border-red-300 bg-red-50 text-red-800" : "border-slate-900 bg-slate-900 text-white"
                                : "border-slate-200 text-slate-600 hover:border-slate-300",
                            )}
                          >
                            {TYPE_LABEL[type]}
                          </button>
                        ))}
                      </div>
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="notes" render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Preparation note <span className="font-normal text-slate-500">(optional)</span></FormLabel>
                      <FormControl><Textarea {...field} rows={3} placeholder="Clinical focus for this session…" className="rounded-xl" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <DialogFooter className="sm:col-span-2">
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" loading={form.formState.isSubmitting}>
                      {form.formState.isSubmitting ? "Scheduling…" : "Schedule session"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <DashboardStatCard label="Upcoming" value={summary.upcoming} detail="Scheduled or proposed" tone="blue" icon={<CalendarDays size={16} />} />
        <DashboardStatCard label="Awaiting closure" value={summary.overdue} detail="Past, not yet completed" tone={summary.overdue > 0 ? "amber" : "blue"} icon={<Clock3 size={16} />} />
        <DashboardStatCard label="Completed" value={summary.completed} detail="Closed with a summary" tone="green" icon={<CheckCircle2 size={16} />} />
        <DashboardStatCard label="Attendance" value={summary.attendance === null ? "—" : `${summary.attendance}%`} detail="Completed vs no-show" tone={summary.attendance !== null && summary.attendance < 80 ? "red" : "green"} icon={<Activity size={16} />} />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="agenda-heading" className="min-w-0 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 id="agenda-heading" className="text-[15px] font-semibold text-slate-900">Agenda</h2>
            <div role="group" aria-label="Agenda view" className="inline-flex rounded-lg border border-slate-200/80 bg-slate-50 p-0.5">
              {(["upcoming", "past"] as const).map((value) => (
                <button
                  key={value}
                  type="button"
                  aria-pressed={view === value}
                  onClick={() => setView(value)}
                  className={cn("cursor-pointer rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors", view === value ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80" : "text-slate-500 hover:text-slate-900")}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          {groups.length === 0 ? (
            <ChartEmpty
              title={view === "upcoming" ? "Nothing scheduled" : "No past sessions"}
              hint={view === "upcoming" ? "Schedule a session to build your agenda." : "Completed and cancelled sessions will appear here."}
              action={view === "upcoming" && patients.length > 0 ? <Button size="sm" onClick={() => setDialogOpen(true)}><CalendarPlus size={14} aria-hidden /> New session</Button> : undefined}
            />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.div key={view} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-5">
                {groups.map(([key, items]) => (
                  <div key={key}>
                    <h3 className="eyebrow mb-2">{dayLabel(new Date(key))}</h3>
                    <ul className="dashboard-card divide-y divide-slate-100 overflow-hidden">
                      {items.map((session) => {
                        const start = new Date(session.scheduledAt);
                        const open = !CLOSED.includes(session.status);
                        const overdue = open && +start + session.durationMinutes * 60_000 < now;
                        return (
                          <li key={session.id} className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-slate-50/60">
                            <div className="w-14 shrink-0 text-right">
                              <p className="tabular text-sm font-semibold text-slate-900">{format(start, "HH:mm")}</p>
                              <p className="tabular text-[11px] text-slate-500">{session.durationMinutes} min</p>
                            </div>
                            <span aria-hidden className={cn("h-9 w-0.5 shrink-0 rounded-full", session.type === "EMERGENCY" ? "bg-red-400" : open ? "bg-teal-500" : "bg-slate-200")} />
                            <div className="min-w-0 flex-1">
                              <Link href={`/dashboard/patients/${session.patientId}?tab=sessions`} className="block truncate text-sm font-medium text-slate-900 hover:text-teal-700 hover:underline">
                                {session.patientName}
                              </Link>
                              <Link href={`/dashboard/sessions/${session.id}`} className="block truncate text-xs text-slate-500 hover:text-teal-700 hover:underline">{TYPE_LABEL[session.type] ?? session.type} session · details</Link>
                            </div>
                            <Badge variant={overdue ? "warning" : STATUS_META[session.status].variant} className="hidden sm:inline-flex">
                              {overdue ? "Needs closure" : STATUS_META[session.status].label}
                            </Badge>
                            {open && (
                              <div className="flex shrink-0 items-center gap-1">
                                <Button size="sm" variant={overdue ? "primary" : "secondary"} onClick={() => openCompletion(session)}>
                                  Complete
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button size="icon-sm" variant="ghost" aria-label={`More actions for ${session.patientName}`}>
                                      <MoreHorizontal size={15} aria-hidden />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem className="cursor-pointer" onSelect={() => void setStatus(session, "NO_SHOW")}>
                                      <UserX size={14} aria-hidden /> Mark no-show
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="cursor-pointer text-red-700 focus:text-red-700" onSelect={() => void setStatus(session, "CANCELLED")}>
                                      <XCircle size={14} aria-hidden /> Cancel session
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </motion.div>
            </AnimatePresence>
          )}
        </section>

        <aside className="space-y-4" aria-label="Schedule analytics">
          <DashboardChartCard title="Next 7 days" subtitle="Booked sessions per day">
            <AnalyticsBarChart data={summary.week} xKey="day" series={[{ key: "sessions", name: "Sessions", color: "var(--chart-1)" }]} height={180} />
          </DashboardChartCard>
        </aside>
      </div>

      <Dialog open={completionSession !== null} onOpenChange={(open) => !open && setCompletionSession(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete session</DialogTitle>
            <DialogDescription>
              {completionSession ? `${completionSession.patientName} · ${format(new Date(completionSession.scheduledAt), "MMM d, HH:mm")}` : "Add a concise session summary."}
            </DialogDescription>
          </DialogHeader>
          <Form {...completionForm}>
            <form onSubmit={finish} className="space-y-4">
              <FormField control={completionForm.control} name="summary" render={({ field }) => (
                <FormItem>
                  <FormLabel>Session summary</FormLabel>
                  <FormControl><Textarea {...field} rows={5} placeholder="Key observations, interventions and plan…" className="rounded-xl" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />
              <FormField control={completionForm.control} name="followUpRequired" render={({ field }) => (
                <FormItem>
                  <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-700">
                    <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    Follow-up required
                  </label>
                </FormItem>
              )} />
              {followUpRequired && (
                <FormField control={completionForm.control} name="followUpDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Follow-up by</FormLabel>
                    <FormControl><Input {...field} type="date" min={format(now, "yyyy-MM-dd")} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setCompletionSession(null)}>Cancel</Button>
                <Button type="submit" loading={completionForm.formState.isSubmitting}>Complete session</Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
