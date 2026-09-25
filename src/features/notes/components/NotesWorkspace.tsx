"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, formatDistanceToNowStrict } from "date-fns";
import { AlertTriangle, ChevronRight, FilePlus2, Search } from "lucide-react";
import type { PatientListItem, PsychologistNote } from "@/lib/api/psychologist";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, Segmented } from "@/components/layout/Kpi";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { bucketByDay, windowDelta } from "@/features/dashboard/lib/metrics";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

type NoteRecord = { patient: PatientListItem; notes: PsychologistNote[] };
type Coverage = "gaps" | "all";

const fullName = (patient: PatientListItem) => `${patient.firstName}${patient.lastName ? ` ${patient.lastName}` : ""}`;
const notesHref = (patientId: string) => `/dashboard/patients/${patientId}?tab=notes`;
const STALE_DAYS = 30;

export function NotesWorkspace({
  records,
  failedCount,
  truncated,
  totalPatients,
}: {
  records: NoteRecord[];
  failedCount: number;
  truncated: boolean;
  totalPatients: number;
}) {
  const now = useNow();
  const [query, setQuery] = useState("");
  const [coverage, setCoverage] = useState<Coverage>("gaps");

  const feed = useMemo(
    () => records.flatMap(({ patient, notes }) => notes.map((note) => ({ note, patient }))).sort((a, b) => b.note.createdAt.localeCompare(a.note.createdAt)),
    [records],
  );

  const patients = useMemo(
    () =>
      records.map(({ patient, notes }) => {
        const last = notes.reduce<string | null>((latest, note) => (!latest || note.createdAt > latest ? note.createdAt : latest), null);
        const ageDays = last ? (now - new Date(last).getTime()) / 86_400_000 : null;
        return { patient, count: notes.length, last, gap: patient.status === "ACTIVE" && (ageDays === null || ageDays > STALE_DAYS) };
      }),
    [records, now],
  );

  const stats = useMemo(() => {
    const all = feed.map((item) => item.note);
    return {
      total: all.length,
      week: windowDelta(all, (note) => note.createdAt, 7, now),
      spark: bucketByDay(all, (note) => note.createdAt, 30, now).map((row) => row.value),
      documented: patients.filter((item) => item.count > 0).length,
      gaps: patients.filter((item) => item.gap).length,
    };
  }, [feed, patients, now]);

  const visibleFeed = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const items = needle
      ? feed.filter(({ note, patient }) => `${note.title ?? ""} ${note.content} ${fullName(patient)} ${patient.patientCode}`.toLowerCase().includes(needle))
      : feed;
    return items.slice(0, 30);
  }, [feed, query]);

  const coverageRows = useMemo(
    () =>
      patients
        .filter((item) => (coverage === "gaps" ? item.gap : true))
        .sort((a, b) => (a.last ?? "").localeCompare(b.last ?? "")),
    [patients, coverage],
  );

  return (
    <div className="space-y-6">
      <DashboardPageHeader eyebrow="Clinical records" title="Clinical notes" description="Private notes across your caseload. Notes are written and edited inside each patient record." />

      {(failedCount > 0 || truncated) && (
        <p role="status" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900">
          <AlertTriangle size={14} aria-hidden className="shrink-0" />
          {truncated && `Showing notes for your ${records.length} most recently active patients (of ${totalPatients}). `}
          {failedCount > 0 && `Notes for ${failedCount} patient${failedCount === 1 ? "" : "s"} could not be loaded.`}
        </p>
      )}

      <KpiGrid>
        <KpiCell label="Notes on file" value={stats.total} hint={`Across ${records.length} patients`} spark={stats.spark} />
        <KpiCell label="Written this week" value={stats.week.current} delta={{ pct: stats.week.pct, goodWhen: "up", caption: "vs last week" }} />
        <KpiCell label="Patients documented" value={stats.documented} unit={`/ ${records.length}`} hint="At least one note" />
        <KpiCell label="Documentation gaps" value={stats.gaps} tone={stats.gaps > 0 ? "warning" : undefined} hint={`Active, no note in ${STALE_DAYS} days`} />
      </KpiGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Panel
          title="Recent notes"
          description={query ? `${visibleFeed.length} matching` : "Latest 30 across your caseload"}
          flush
          action={
            <div className="relative w-56">
              <Search size={14} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" aria-label="Search notes" className="input-ui h-8 rounded-lg pl-8 text-[13px]" />
            </div>
          }
        >
          {visibleFeed.length === 0 ? (
            <div className="px-5 pb-5">
              <ChartEmpty
                title={query ? "No notes match your search" : "No clinical notes yet"}
                hint={query ? "Try a patient name, code or keyword." : "Open a patient record to write the first note."}
              />
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 border-t border-slate-100">
              {visibleFeed.map(({ note, patient }) => (
                <li key={note.id}>
                  <Link href={notesHref(patient.id)} className="group flex gap-3.5 px-5 py-4 transition-colors hover:bg-slate-50/70">
                    <PatientAvatar name={fullName(patient)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-[13px] font-semibold text-slate-900 group-hover:text-teal-700">{note.title ?? "Untitled note"}</p>
                        <time dateTime={note.createdAt} title={format(new Date(note.createdAt), "MMM d, yyyy · HH:mm")} className="shrink-0 text-[11px] text-slate-500">
                          {formatDistanceToNowStrict(new Date(note.createdAt), { addSuffix: true })}
                        </time>
                      </div>
                      <p className="text-xs text-slate-500">
                        {fullName(patient)} · {patient.patientCode}
                      </p>
                      <p className="mt-1.5 line-clamp-2 text-[13px] leading-5 text-slate-600">{note.content}</p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel
          title="Documentation coverage"
          description="Oldest documentation first"
          flush
          action={
            <Segmented
              label="Coverage filter"
              value={coverage}
              onChange={setCoverage}
              options={[
                { value: "gaps", label: "Gaps", count: stats.gaps },
                { value: "all", label: "All" },
              ]}
            />
          }
        >
          {coverageRows.length === 0 ? (
            <div className="px-5 pb-5">
              <ChartEmpty title="No documentation gaps" hint={`Every active patient has a note from the last ${STALE_DAYS} days.`} />
            </div>
          ) : (
            <ul className="max-h-[640px] divide-y divide-slate-100 overflow-y-auto border-t border-slate-100">
              {coverageRows.map(({ patient, count, last, gap }) => (
                <li key={patient.id}>
                  <Link href={notesHref(patient.id)} className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70">
                    <PatientAvatar name={fullName(patient)} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13px] font-medium text-slate-900 group-hover:text-teal-700">{fullName(patient)}</span>
                      <span className={cn("block text-xs", gap ? "text-amber-700" : "text-slate-500")}>
                        {last ? `Last note ${formatDistanceToNowStrict(new Date(last), { addSuffix: true })}` : "No notes yet"}
                        <span className="text-slate-400"> · {count} total</span>
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors group-hover:bg-white group-hover:text-slate-900 group-hover:shadow-sm group-hover:ring-1 group-hover:ring-slate-200">
                      <FilePlus2 size={13} aria-hidden /> Write
                    </span>
                    <ChevronRight size={14} aria-hidden className="shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}
