"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, FileText, LineChart, UsersRound } from "lucide-react";
import { useMemo } from "react";
import type { PatientListItem } from "@/lib/api/psychologist";
import { AnalyticsDonutChart, DashboardChartCard, DashboardPageHeader, DashboardStatCard } from "@/components/layout/DashboardUI";

export function PatientShortcutList({ title, description, actionLabel, basePath, patients }: { title: string; description: string; actionLabel: string; basePath: string; patients: PatientListItem[] }) {
  const summary = useMemo(() => {
    const withActivity = patients.filter((patient) => patient.lastActivityAt).length;
    const withAssessment = patients.filter((patient) => patient.lastAssessmentAt).length;
    return {
      total: patients.length,
      withActivity,
      withAssessment,
      coverage: [
        { name: "With activity", value: withActivity, color: "var(--chart-1)" },
        { name: "With assessment", value: withAssessment, color: "var(--chart-3)" },
        { name: "Needs follow-up", value: Math.max(patients.length - Math.max(withActivity, withAssessment), 0), color: "var(--chart-4)" },
      ],
    };
  }, [patients]);

  return (
    <div className="space-y-4">
      <DashboardPageHeader eyebrow="Clinical records" title={title} description={description} action={<div className="flex items-center gap-2 text-xs text-[#64748b]"><BookOpen size={15} className="text-[#0f766e]" />Private workspace</div>} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <DashboardStatCard label="Patient records" value={summary.total} detail="Available shortcuts" tone="blue" icon={<UsersRound size={17} />} />
        <DashboardStatCard label="With recent activity" value={summary.withActivity} detail="Record has activity" tone="green" icon={<FileText size={17} />} />
        <DashboardStatCard label="With assessment" value={summary.withAssessment} detail="Clinical signal available" tone="amber" icon={<LineChart size={17} />} />
        <DashboardStatCard label="Notes action" value="Open" detail="From patient record" tone="blue" icon={<BookOpen size={17} />} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.5fr]">
        <DashboardChartCard title="Record coverage" subtitle="Signals available for clinical notes">
          <AnalyticsDonutChart data={summary.coverage} centerValue={summary.total} centerLabel="patients" height={210} />
        </DashboardChartCard>
        <DashboardChartCard title="Note workflow" subtitle="Choose a patient to open their private notes">
          <div className="grid gap-2 sm:grid-cols-2">
            {patients.map((patient) => (
              <Link key={patient.id} href={`${basePath}/${patient.id}?tab=progress`} className="dashboard-card flex items-center gap-3 p-3 transition hover:border-[#99f6e4] hover:bg-[#f8fafc]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f0fdfa] text-[#0f766e]"><LineChart size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-[#0f172a]">{patient.firstName} {patient.lastName ?? ""}</span><span className="block truncate text-xs text-[#64748b]">{patient.patientCode}</span></span>
                <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#0f766e]">{actionLabel} <ArrowRight size={13} /></span>
              </Link>
            ))}
            {patients.length === 0 && <p className="col-span-full rounded-xl border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">No patients available.</p>}
          </div>
        </DashboardChartCard>
      </div>
    </div>
  );
}
