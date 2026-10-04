"use client";

import { useMemo, useState } from "react";
import { addDays, format, formatDistanceStrict, isSameDay } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, CalendarClock, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Colleague, CoverageShift } from "@/lib/api/psychologist";
import { createCoverageAction, removeCoverageAction } from "@/features/clinical/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, Segmented } from "@/components/layout/Kpi";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

const HOUR = 3_600_000;
const DAY = 24 * HOUR;
const RANGE_DAYS = 7;

const coverageSchema = z
  .object({
    mode: z.enum(["ABSENCE", "COVER", "ON_CALL"]),
    coveringId: z.string().trim().min(1, "Choose who covers this period."),
    absentId: z.string().trim().optional(),
    startsAt: z.string().min(1, "Choose a start time."),
    endsAt: z.string().min(1, "Choose an end time."),
  })
  .refine((value) => !value.startsAt || !value.endsAt || value.endsAt > value.startsAt, { path: ["endsAt"], message: "End must be after the start." })
  .refine((value) => value.mode !== "COVER" || Boolean(value.absentId), { path: ["absentId"], message: "Choose the colleague who is away." })
  .refine((value) => value.mode !== "ABSENCE" || value.coveringId !== "", { path: ["coveringId"], message: "Choose who covers you." });

type CoverageFormValues = z.infer<typeof coverageSchema>;
type View = "upcoming" | "past";

const MODES = {
  ABSENCE: { label: "I will be away", hint: "A colleague takes your patients and alerts." },
  COVER: { label: "Cover for a colleague", hint: "Book a replacement for someone else (clinic lead)." },
  ON_CALL: { label: "Clinic on-call", hint: "Who receives urgent alerts for the whole clinic (clinic lead)." },
} as const;

const TYPE_META = {
  ON_CALL: { label: "On-call", variant: "brand" as const, bar: "bg-teal-500", soft: "bg-teal-50 ring-teal-200" },
  LEAVE_COVER: { label: "Leave cover", variant: "info" as const, bar: "bg-indigo-500", soft: "bg-indigo-50 ring-indigo-200" },
};

const personName = (person: { firstName: string; lastName: string }) => `${person.firstName} ${person.lastName}`.trim();

function mergeIntervals(intervals: Array<[number, number]>) {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0]);
  const merged: Array<[number, number]> = [];
  for (const [start, end] of sorted) {
    const last = merged.at(-1);
    if (last && start <= last[1]) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/** Uncovered intervals between `from` and `to`. */
function findGaps(shifts: CoverageShift[], from: number, to: number) {
  const covered = mergeIntervals(
    shifts.map((shift) => [Math.max(+new Date(shift.startsAt), from), Math.min(+new Date(shift.endsAt), to)] as [number, number]).filter(([start, end]) => end > start),
  );
  const gaps: Array<[number, number]> = [];
  let cursor = from;
  for (const [start, end] of covered) {
    if (start > cursor) gaps.push([cursor, start]);
    cursor = Math.max(cursor, end);
  }
  if (cursor < to) gaps.push([cursor, to]);
  return gaps;
}

const toLocalInput = (ms: number) => format(ms, "yyyy-MM-dd'T'HH:mm");

export function CoverageView({ initialCoverage, colleagues, canEdit, currentUser }: { initialCoverage: CoverageShift[]; colleagues: Colleague[]; canEdit: boolean; currentUser: { id: string; name: string } }) {
  const now = useNow();
  const [coverage, setCoverage] = useState(initialCoverage);
  const [view, setView] = useState<View>("upcoming");
  const [dialogOpen, setDialogOpen] = useState(false);
  const form = useForm<CoverageFormValues>({ resolver: zodResolver(coverageSchema), defaultValues: { mode: "ABSENCE", coveringId: "", absentId: "", startsAt: "", endsAt: "" } });

  const mode = useWatch({ control: form.control, name: "mode" });
  const watchedAbsent = useWatch({ control: form.control, name: "absentId" });

  const windowStart = useMemo(() => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    return date.getTime();
  }, [now]);
  const windowEnd = windowStart + RANGE_DAYS * DAY;

  const stats = useMemo(() => {
    const onCallNow = coverage.filter((shift) => +new Date(shift.startsAt) <= now && +new Date(shift.endsAt) > now);
    const upcoming = coverage.filter((shift) => +new Date(shift.startsAt) > now && +new Date(shift.startsAt) <= now + RANGE_DAYS * DAY);
    const gaps = findGaps(coverage, now, now + RANGE_DAYS * DAY);
    const gapHours = gaps.reduce((sum, [start, end]) => sum + (end - start) / HOUR, 0);
    const nextGap = gaps.find(([start, end]) => end - start >= HOUR) ?? null;
    return { onCallNow, upcoming: upcoming.length, gapHours: Math.round(gapHours), coveredPct: Math.round(100 - (gapHours / (RANGE_DAYS * 24)) * 100), nextGap };
  }, [coverage, now]);

  const rota = useMemo(() => {
    const visible = coverage.filter((shift) => +new Date(shift.endsAt) > windowStart && +new Date(shift.startsAt) < windowEnd);
    const rows = new Map<string, { name: string; shifts: CoverageShift[] }>();
    visible.forEach((shift) => {
      const row = rows.get(shift.covering.id) ?? { name: personName(shift.covering), shifts: [] };
      row.shifts.push(shift);
      rows.set(shift.covering.id, row);
    });
    return {
      rows: [...rows.values()].sort((a, b) => a.name.localeCompare(b.name)),
      gaps: findGaps(coverage, Math.max(now, windowStart), windowEnd),
    };
  }, [coverage, windowStart, windowEnd, now]);

  const list = useMemo(
    () =>
      coverage
        .filter((shift) => (view === "past" ? +new Date(shift.endsAt) <= now : +new Date(shift.endsAt) > now))
        .sort((a, b) => (view === "past" ? -1 : 1) * a.startsAt.localeCompare(b.startsAt)),
    [coverage, view, now],
  );

  const position = (start: number, end: number) => {
    const span = windowEnd - windowStart;
    const left = ((Math.max(start, windowStart) - windowStart) / span) * 100;
    const width = ((Math.min(end, windowEnd) - Math.max(start, windowStart)) / span) * 100;
    return { left: `${left}%`, width: `${Math.max(width, 0.6)}%` };
  };

  const openDialog = (open: boolean) => {
    setDialogOpen(open);
    if (open) {
      const start = stats.nextGap?.[0] ?? now;
      form.reset({ mode: "ABSENCE", coveringId: "", absentId: "", startsAt: toLocalInput(start), endsAt: toLocalInput(Math.min(stats.nextGap?.[1] ?? start + 12 * HOUR, start + 24 * HOUR)) });
    }
  };

  const submit = form.handleSubmit(async (values) => {
    try {
      const result = await createCoverageAction({
        coveringId: values.coveringId,
        absentId: values.mode === "ABSENCE" ? currentUser.id : values.mode === "COVER" ? values.absentId : undefined,
        type: values.mode === "ON_CALL" ? "ON_CALL" : "LEAVE_COVER",
        startsAt: new Date(values.startsAt).toISOString(),
        endsAt: new Date(values.endsAt).toISOString(),
      });
      setCoverage((current) => [result, ...current]);
      setDialogOpen(false);
      toast.success("Coverage saved");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save coverage");
    }
  });

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const cancel = async (shift: CoverageShift) => {
    setCancellingId(shift.id);
    try {
      await removeCoverageAction(shift.id);
      setCoverage((current) => current.filter((item) => item.id !== shift.id));
      toast.success("Shift cancelled");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to cancel this shift");
    } finally {
      setCancellingId(null);
    }
  };
  /** Anyone can cancel their own absence; the clinic lead can cancel any shift of the clinic. */
  const canCancel = (shift: CoverageShift) => +new Date(shift.endsAt) > now && (canEdit || shift.absent?.id === currentUser.id);

  const status = (shift: CoverageShift) =>
    +new Date(shift.startsAt) <= now && +new Date(shift.endsAt) > now ? "live" : +new Date(shift.endsAt) <= now ? "ended" : "upcoming";

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Practice"
        title="Coverage & on-call"
        description="Who receives urgent alerts, and when. Keep the next seven days fully covered."
        action={
          <Dialog open={dialogOpen} onOpenChange={openDialog}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus size={14} aria-hidden /> {canEdit ? "Add coverage" : "I will be away"}</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add coverage</DialogTitle>
                <DialogDescription>Alerts route to the covering clinician for the whole window, and they can open the patients concerned (each patient&apos;s consent still applies).</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={submit} className="space-y-4">
                  <FormField control={form.control} name="mode" render={({ field }) => (
                    <FormItem>
                      <FormLabel>What is this?</FormLabel>
                      <div role="radiogroup" className="grid gap-2 sm:grid-cols-3">
                        {(Object.keys(MODES) as Array<keyof typeof MODES>)
                          .filter((mode) => mode === "ABSENCE" || canEdit)
                          .map((mode) => (
                            <button
                              key={mode}
                              type="button"
                              role="radio"
                              aria-checked={field.value === mode}
                              onClick={() => { field.onChange(mode); form.setValue("coveringId", ""); form.setValue("absentId", ""); }}
                              className={cn("cursor-pointer rounded-xl border p-3 text-left transition-colors", field.value === mode ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:border-slate-300")}
                            >
                              <span className="block text-[13px] font-semibold text-slate-900">{MODES[mode].label}</span>
                              <span className="block text-[11px] text-slate-500">{MODES[mode].hint}</span>
                            </button>
                          ))}
                      </div>
                    </FormItem>
                  )} />
                  {mode === "COVER" && (
                    <FormField control={form.control} name="absentId" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Who is away</FormLabel>
                        <Select value={field.value || undefined} onValueChange={field.onChange}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Choose a colleague" /></SelectTrigger></FormControl>
                          <SelectContent>{colleagues.map((c) => <SelectItem key={c.id} value={c.id}>{personName(c)}</SelectItem>)}</SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                  )}
                  <FormField control={form.control} name="coveringId" render={({ field }) => (
                    <FormItem>
                      <FormLabel>{mode === "ABSENCE" ? "Who covers you" : "Covering clinician"}</FormLabel>
                      <Select value={field.value || undefined} onValueChange={field.onChange}>
                        <FormControl><SelectTrigger><SelectValue placeholder={colleagues.length || mode !== "ABSENCE" ? "Choose a clinician" : "No colleague in your clinic"} /></SelectTrigger></FormControl>
                        <SelectContent>
                          {mode !== "ABSENCE" && <SelectItem value={currentUser.id}>Me ({currentUser.name})</SelectItem>}
                          {colleagues.filter((c) => c.id !== watchedAbsent).map((c) => <SelectItem key={c.id} value={c.id}>{personName(c)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormDescription>{colleagues.length === 0 ? "Cover is arranged inside a clinic. Ask the VitaMind team to attach you to one." : "Only active clinicians of your clinic can cover."}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField control={form.control} name="startsAt" render={({ field }) => (
                      <FormItem><FormLabel>Starts</FormLabel><FormControl><Input {...field} type="datetime-local" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="endsAt" render={({ field }) => (
                      <FormItem><FormLabel>Ends</FormLabel><FormControl><Input {...field} type="datetime-local" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  {stats.nextGap && (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">Pre-filled with the next uncovered window.</p>
                  )}
                  <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" loading={form.formState.isSubmitting}>Save coverage</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        }
      />

      <KpiGrid>
        <KpiCell
          label="On call now"
          value={stats.onCallNow.length === 0 ? "Nobody" : stats.onCallNow.length === 1 ? personName(stats.onCallNow[0].covering) : `${stats.onCallNow.length} clinicians`}
          tone={stats.onCallNow.length === 0 ? "danger" : undefined}
          hint={stats.onCallNow[0] ? `Until ${format(new Date(stats.onCallNow[0].endsAt), "EEE HH:mm")}` : "Alerts have no on-call owner"}
          icon={<ShieldCheck size={15} aria-hidden />}
        />
        <KpiCell label="Coverage next 7 days" value={stats.coveredPct} unit="%" tone={stats.coveredPct < 100 ? "warning" : undefined} hint={`${stats.gapHours} uncovered hours`} />
        <KpiCell
          label="Next gap"
          value={stats.nextGap ? format(stats.nextGap[0], "EEE HH:mm") : "None"}
          tone={stats.nextGap ? "warning" : undefined}
          hint={stats.nextGap ? `Lasts ${formatDistanceStrict(stats.nextGap[1], stats.nextGap[0])}` : "Fully covered for 7 days"}
        />
        <KpiCell label="Upcoming shifts" value={stats.upcoming} hint="Starting in the next 7 days" icon={<CalendarClock size={15} aria-hidden />} />
      </KpiGrid>

      {/* Rota */}
      <Panel
        title="Rota"
        description={`${format(windowStart, "MMM d")} – ${format(windowEnd - 1, "MMM d")}`}
        action={
          <span className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-3 rounded-sm bg-teal-500" /> On-call</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-3 rounded-sm bg-indigo-500" /> Leave cover</span>
            <span className="flex items-center gap-1.5"><span aria-hidden className="h-2 w-3 rounded-sm bg-[repeating-linear-gradient(135deg,#fca5a5_0_3px,#fee2e2_3px_6px)]" /> Uncovered</span>
          </span>
        }
      >
        <div className="overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-[160px_minmax(0,1fr)]">
              <span />
              <div className="grid grid-cols-7 border-b border-slate-100 pb-2">
                {Array.from({ length: RANGE_DAYS }, (_, index) => {
                  const day = addDays(windowStart, index);
                  const today = isSameDay(day, now);
                  return (
                    <span key={index} className={cn("text-center text-[11px]", today ? "font-semibold text-slate-900" : "text-slate-500")}>
                      {today ? "Today" : format(day, "EEE d")}
                    </span>
                  );
                })}
              </div>
            </div>

            {[...rota.rows.map((row) => ({ key: row.name, label: row.name, kind: "person" as const, row })), { key: "gaps", label: "Uncovered", kind: "gaps" as const, row: null }].map((entry) => (
              <div key={entry.key} className="grid grid-cols-[160px_minmax(0,1fr)] items-center border-b border-slate-100 last:border-0">
                <span className={cn("flex items-center gap-2 truncate py-3 pr-3 text-[13px]", entry.kind === "gaps" ? "font-medium text-red-700" : "font-medium text-slate-800")}>
                  {entry.kind === "person" ? <PatientAvatar name={entry.label} /> : <AlertTriangle size={14} aria-hidden />}
                  <span className="truncate">{entry.label}</span>
                </span>
                <div className="relative h-11">
                  <div aria-hidden className="absolute inset-0 grid grid-cols-7">
                    {Array.from({ length: RANGE_DAYS }, (_, index) => <span key={index} className="border-l border-dashed border-slate-100 first:border-0" />)}
                  </div>
                  {entry.kind === "person"
                    ? entry.row!.shifts.map((shift) => (
                        <span
                          key={shift.id}
                          title={`${TYPE_META[shift.type].label} · ${format(new Date(shift.startsAt), "EEE HH:mm")} – ${format(new Date(shift.endsAt), "EEE HH:mm")}${shift.absent ? ` · for ${personName(shift.absent)}` : ""}`}
                          className={cn("absolute top-2.5 h-6 rounded-md shadow-sm", TYPE_META[shift.type].bar)}
                          style={position(+new Date(shift.startsAt), +new Date(shift.endsAt))}
                        />
                      ))
                    : rota.gaps.map(([start, end]) => (
                        <span
                          key={start}
                          title={`Uncovered · ${format(start, "EEE HH:mm")} – ${format(end, "EEE HH:mm")}`}
                          className="absolute top-2.5 h-6 rounded-md bg-[repeating-linear-gradient(135deg,#fca5a5_0_4px,#fee2e2_4px_8px)] ring-1 ring-inset ring-red-200"
                          style={position(start, end)}
                        />
                      ))}
                  {now >= windowStart && now < windowEnd && (
                    <span aria-hidden className="absolute inset-y-0 w-px bg-slate-900" style={{ left: `${((now - windowStart) / (windowEnd - windowStart)) * 100}%` }} />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {rota.rows.length === 0 && <p className="mt-3 text-sm text-slate-500">No shifts scheduled in the next seven days.</p>}
      </Panel>

      {/* Shift list */}
      <Panel
        title="Shifts"
        description={view === "upcoming" ? "Live and upcoming" : "Ended"}
        flush
        action={<Segmented label="Shift list" value={view} onChange={setView} options={[{ value: "upcoming", label: "Upcoming" }, { value: "past", label: "Past" }]} />}
      >
        {list.length === 0 ? (
          <div className="px-5 pb-5">
            <ChartEmpty title={view === "upcoming" ? "No upcoming shifts" : "No past shifts"} hint={canEdit ? "Add coverage to route alerts." : "Your clinic admin manages the rota."} />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-slate-50/60">
                <tr className="border-y border-slate-100 text-left text-xs text-slate-500">
                  <th scope="col" className="py-2.5 pl-5 pr-3 font-medium">Covering</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Type</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Window</th>
                  <th scope="col" className="px-3 py-2.5 font-medium">Duration</th>
                  <th scope="col" className="px-3 py-2.5 text-right font-medium">Status</th>
                  <th scope="col" className="py-2.5 pl-1 pr-5"><span className="sr-only">Cancel</span></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {list.map((shift) => {
                  const state = status(shift);
                  return (
                    <tr key={shift.id} className="transition-colors hover:bg-slate-50/70">
                      <td className="py-3 pl-5 pr-3">
                        <span className="flex items-center gap-3">
                          <PatientAvatar name={personName(shift.covering)} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">
                              {personName(shift.covering)}
                              {shift.covering.id === currentUser.id && <span className="ml-1.5 text-xs font-normal text-slate-500">(you)</span>}
                            </span>
                            <span className="block text-xs text-slate-500">{shift.absent ? (shift.absent.id === currentUser.id ? "Covering your absence" : `For ${personName(shift.absent)}`) : "General on-call"}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3"><Badge variant={TYPE_META[shift.type].variant}>{TYPE_META[shift.type].label}</Badge></td>
                      <td className="tabular px-3 py-3 text-xs text-slate-600">
                        {format(new Date(shift.startsAt), "EEE MMM d, HH:mm")} – {format(new Date(shift.endsAt), isSameDay(new Date(shift.startsAt), new Date(shift.endsAt)) ? "HH:mm" : "EEE MMM d, HH:mm")}
                      </td>
                      <td className="tabular px-3 py-3 text-xs text-slate-600">{formatDistanceStrict(new Date(shift.endsAt), new Date(shift.startsAt))}</td>
                      <td className="px-3 py-3 text-right">
                        {state === "live" ? (
                          <Badge variant="success" dot>Live now</Badge>
                        ) : state === "upcoming" ? (
                          <span className="text-xs text-slate-500">Starts {formatDistanceStrict(new Date(shift.startsAt), now, { addSuffix: true })}</span>
                        ) : (
                          <Badge>Ended</Badge>
                        )}
                      </td>
                      <td className="py-3 pl-1 pr-5 text-right">
                        {canCancel(shift) && (
                          <Button variant="ghost" size="icon-sm" aria-label="Cancel this shift" loading={cancellingId === shift.id} onClick={() => void cancel(shift)}>
                            <Trash2 size={14} aria-hidden />
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
