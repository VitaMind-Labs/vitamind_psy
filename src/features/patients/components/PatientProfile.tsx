"use client";

import { Fragment, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { differenceInCalendarDays, differenceInYears, format, formatDistanceToNowStrict } from "date-fns";
import { Area, CartesianGrid, ComposedChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  CalendarDays,
  CalendarPlus,
  ChevronRight,
  CircleAlert,
  ClipboardCheck,
  Dumbbell,
  FileText,
  Globe,
  LineChart as LineChartIcon,
  MessageSquareText,
  NotebookPen,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Target,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger, underlineTabsList, underlineTabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  AssessmentDetailResponse,
  AssessmentListItem,
  ClinicalAlert,
  ClinicianRole,
  ConfirmedDiagnosis,
  ConsentResponse,
  ExerciseAssignment,
  ExerciseCatalogItem,
  FocusGoal,
  JournalEntry,
  LifeChartResponse,
  Medication,
  PaginatedResponse,
  PatientDetailResponse,
  ProgressResponse,
  PsychologistNote,
  RelapseSignature,
  SecureMessagesResponse,
  SessionListItem,
  ThresholdItem,
  TimelineEvent,
} from "@/lib/api/psychologist";
import { Panel, Segmented, Sparkline } from "@/components/layout/Kpi";
import { ChartEmpty, ChartTooltipShell, ListEmpty } from "@/features/dashboard/components/overview/cards";
import { PatientAvatar } from "@/features/dashboard/components/overview/PracticeOverview";
import { ProgressPanel } from "@/features/patients/components/ProgressPanel";
import { AssessmentPanel } from "@/features/assessments/components/AssessmentPanel";
import { NotesPanel } from "@/features/notes/components/NotesPanel";
import { SessionPanel } from "@/features/sessions/components/SessionPanel";
import { JournalPanel } from "@/features/journal/components/JournalPanel";
import { ConsentPanel, LifeChartPanel } from "@/features/patients/components/LifeChartPanel";
import { ThresholdsPanel, RelapseSignaturesPanel, MedicationsPanel, TimelinePanel, MessagesPanel, CarePlanPanel, DiagnosisPanel } from "@/features/patients/components/ClinicalPatientPanels";
import { RiskBadge } from "@/features/risks/components/RiskBadge";
import { RISK_META, isUrgent, toRiskLevel } from "@/features/risks/lib/risk";
import { parsePatientTab, type PatientTab } from "@/features/patients/lib/patient-tabs";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

interface PatientProfileProps {
  patient: PatientDetailResponse;
  progress: ProgressResponse;
  journal: PaginatedResponse<JournalEntry>;
  assessments: PaginatedResponse<AssessmentListItem>;
  initialDetail?: AssessmentDetailResponse | null;
  notes: PsychologistNote[];
  sessions: SessionListItem[];
  lifeChart: LifeChartResponse;
  consent: ConsentResponse;
  thresholds: ThresholdItem[];
  relapseSignatures: RelapseSignature[];
  medications: Medication[];
  timeline: TimelineEvent[];
  messages: SecureMessagesResponse;
  exercises: ExerciseAssignment[];
  goals: FocusGoal[];
  diagnoses: ConfirmedDiagnosis[];
  exerciseCatalog: ExerciseCatalogItem[];
  profileRole: ClinicianRole;
  openAlerts: ClinicalAlert[];
  emergencyNumber: string | null;
  initialTab?: string;
  initialAssessmentId?: string;
}

type TabDef = { value: PatientTab; label: string; icon: LucideIcon; roles?: ClinicianRole[]; hiddenFor?: ClinicianRole[] };

const TAB_GROUPS: TabDef[][] = [
  [
    { value: "overview", label: "Overview", icon: FileText },
    { value: "life-chart", label: "Life chart", icon: Activity },
    { value: "progress", label: "Progress", icon: LineChartIcon },
    { value: "assessments", label: "Assessments", icon: ClipboardCheck },
    { value: "diagnosis", label: "Diagnosis", icon: Stethoscope, roles: ["PSYCHIATRIST"] },
  ],
  [
    { value: "care-plan", label: "Care plan", icon: Target },
    { value: "medications", label: "Medications", icon: Pill, roles: ["PSYCHIATRIST"] },
    { value: "thresholds", label: "Thresholds", icon: CircleAlert, roles: ["PSYCHIATRIST"] },
    { value: "relapse", label: "Relapse signature", icon: ShieldCheck },
  ],
  [
    { value: "sessions", label: "Sessions", icon: CalendarDays },
    { value: "notes", label: "Notes", icon: NotebookPen, hiddenFor: ["NURSE", "CARE_COORDINATOR"] },
    { value: "messages", label: "Messages", icon: MessageSquareText },
    { value: "timeline", label: "Timeline", icon: Activity },
    { value: "consent", label: "Consent", icon: ShieldCheck },
  ],
];

type WellbeingMetric = "mood" | "sleep" | "anxiety" | "energy";
const WELLBEING: Record<WellbeingMetric, { label: string; unit: string; color: string; domain: [number, number] }> = {
  mood: { label: "Mood", unit: "/10", color: "#0d9488", domain: [0, 10] },
  sleep: { label: "Sleep", unit: "h", color: "#6366f1", domain: [0, 12] },
  anxiety: { label: "Anxiety", unit: "/10", color: "#f97316", domain: [0, 10] },
  energy: { label: "Energy", unit: "/10", color: "#0ea5e9", domain: [0, 10] },
};

const tabAllowed = (tab: TabDef, role: ClinicianRole) => (!tab.roles || tab.roles.includes(role)) && !tab.hiddenFor?.includes(role);
const isActivePlanItem = (status: string) => !["COMPLETED", "ARCHIVED", "CANCELLED", "ENDED", "INACTIVE"].includes(status.toUpperCase());
const average = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null);

export function PatientProfile(props: PatientProfileProps) {
  const {
    patient,
    progress,
    journal,
    assessments,
    initialDetail,
    notes,
    sessions,
    lifeChart,
    consent,
    thresholds,
    relapseSignatures,
    medications,
    timeline,
    messages,
    exercises,
    goals,
    diagnoses,
    exerciseCatalog,
    profileRole,
    openAlerts,
    emergencyNumber,
    initialTab,
  } = props;
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const now = useNow();
  const requested = parsePatientTab(searchParams.get("tab") ?? initialTab);
  const allowedTabs = useMemo(() => TAB_GROUPS.flat().filter((tab) => tabAllowed(tab, profileRole)), [profileRole]);
  const tab = allowedTabs.some((item) => item.value === requested) ? requested : "overview";
  const assessmentId = searchParams.get("assessmentId") ?? undefined;
  const { patient: info, careContext } = patient;
  const id = info.id;
  const name = `${info.firstName}${info.lastName ? ` ${info.lastName}` : ""}`;
  const canWriteNotes = !["NURSE", "CARE_COORDINATOR"].includes(profileRole);

  const changeTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const nextTab = parsePatientTab(value);
    params.set("tab", nextTab);
    if (nextTab !== "assessments") params.delete("assessmentId");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const status = useMemo(() => {
    const checkins = [...lifeChart.checkins].sort((a, b) => a.checkinDate.localeCompare(b.checkinDate));
    const lastCheckin = checkins.at(-1) ?? null;
    const latestDrift = lifeChart.driftScores.at(-1) ?? null;
    const topAlert = [...openAlerts].sort((a, b) => RISK_META[a.severity].rank - RISK_META[b.severity].rank)[0] ?? null;
    return {
      checkins,
      lastCheckin,
      latestDrift,
      topAlert,
      daysSinceCheckin: lastCheckin ? differenceInCalendarDays(now, new Date(lastCheckin.checkinDate)) : null,
      riskLevel: latestDrift?.level ?? toRiskLevel(patient.recentActivity.find((item) => item.riskLevel)?.riskLevel),
      moodSpark: checkins.slice(-14).map((entry) => entry.moodScore),
      driftSpark: lifeChart.driftScores.slice(-14).map((entry) => entry.score),
    };
  }, [lifeChart, openAlerts, patient.recentActivity, now]);

  const age = info.dateOfBirth ? differenceInYears(now, new Date(info.dateOfBirth)) : null;

  return (
    <div className="space-y-5">
      <Link href="/dashboard/patients" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-slate-500 transition-colors hover:text-slate-900">
        <ArrowLeft size={14} aria-hidden /> Patients
      </Link>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* ---------- Left: clinical summary ---------- */}
        <aside className="space-y-4 xl:sticky xl:top-[4.5rem]" aria-label="Patient summary">
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
            <div className="flex items-start gap-3.5">
              <PatientAvatar name={name} size="md" />
              <div className="min-w-0">
                <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900">{name}</h1>
                <p className="text-[13px] text-slate-500">{info.patientCode}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant={info.status === "ACTIVE" ? "success" : info.status === "INACTIVE" ? "default" : "danger"} dot>
                {info.status.charAt(0) + info.status.slice(1).toLowerCase()}
              </Badge>
              {status.riskLevel && <RiskBadge level={status.riskLevel} />}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-x-3 gap-y-2.5 border-t border-slate-100 pt-4 text-[13px]">
              <Fact label="Age" value={age !== null ? `${age} years` : "—"} />
              <Fact label="Language" value={<span className="inline-flex items-center gap-1"><Globe size={12} aria-hidden className="text-slate-400" />{info.preferredLanguage.toUpperCase()}</span>} />
              <Fact label="In care since" value={format(new Date(careContext.assignedAt), "MMM d, yyyy")} />
              <Fact label="Last session" value={careContext.lastSessionAt ? format(new Date(careContext.lastSessionAt), "MMM d") : "—"} />
            </dl>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Button size="sm" className="col-span-2" onClick={() => router.push("/dashboard/sessions")}>
                <CalendarPlus size={14} aria-hidden /> Schedule session
              </Button>
              <Button size="sm" variant="secondary" onClick={() => changeTab("messages")}>
                <MessageSquareText size={14} aria-hidden /> Message
              </Button>
              {canWriteNotes ? (
                <Button size="sm" variant="secondary" onClick={() => changeTab("notes")}>
                  <NotebookPen size={14} aria-hidden /> Note
                </Button>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => changeTab("life-chart")}>
                  <Activity size={14} aria-hidden /> Life chart
                </Button>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200/80 bg-white shadow-sm" aria-label="Clinical status">
            <h2 className="px-5 pb-1 pt-4 text-xs font-medium text-slate-500">Clinical status</h2>
            <dl className="divide-y divide-slate-100">
              <StatusRow
                label="Drift score"
                tone={status.latestDrift && isUrgent(status.latestDrift.level) ? "danger" : undefined}
                value={status.latestDrift ? status.latestDrift.score.toFixed(2) : "—"}
                detail={status.latestDrift ? `${RISK_META[status.latestDrift.level].label} · ${formatDistanceToNowStrict(new Date(status.latestDrift.computedAt), { addSuffix: true })}` : "Not computed yet"}
                spark={status.driftSpark}
                sparkColor="#f97316"
              />
              <StatusRow
                label="Open alerts"
                tone={openAlerts.length > 0 ? "danger" : undefined}
                value={String(openAlerts.length)}
                detail={status.topAlert ? `Highest: ${RISK_META[status.topAlert.severity].label}` : "Nothing awaiting triage"}
              />
              <StatusRow
                label="Last check-in"
                tone={status.daysSinceCheckin !== null && status.daysSinceCheckin > 3 ? "warning" : undefined}
                value={status.daysSinceCheckin === null ? "—" : status.daysSinceCheckin === 0 ? "Today" : `${status.daysSinceCheckin}d ago`}
                detail={status.lastCheckin ? `Mood ${status.lastCheckin.moodScore}/10${status.lastCheckin.sleepHours !== null ? ` · ${status.lastCheckin.sleepHours}h sleep` : ""}` : "No check-ins in 30 days"}
                spark={status.moodSpark}
              />
              <StatusRow
                label="Next session"
                tone={careContext.nextSessionAt ? undefined : "warning"}
                value={careContext.nextSessionAt ? format(new Date(careContext.nextSessionAt), "MMM d") : "None"}
                detail={careContext.nextSessionAt ? format(new Date(careContext.nextSessionAt), "EEEE · HH:mm") : "Consider scheduling a follow-up"}
              />
            </dl>
            {emergencyNumber && (
              <a href={`tel:${emergencyNumber}`} className="flex items-center gap-2 rounded-b-2xl border-t border-slate-100 bg-red-50/50 px-5 py-3 text-xs font-medium text-red-800 transition-colors hover:bg-red-50">
                <Phone size={13} aria-hidden /> Clinic emergency line · {emergencyNumber}
              </a>
            )}
          </section>

          {openAlerts.length > 0 && (
            <section className="rounded-2xl border border-red-200 bg-white shadow-sm" aria-label="Open alerts">
              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <h2 className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
                  <AlertTriangle size={13} aria-hidden /> Open alerts
                </h2>
                <Link href="/dashboard/alerts?status=OPEN" className="inline-flex items-center gap-0.5 text-xs font-medium text-red-700 hover:underline">
                  Triage <ChevronRight size={12} aria-hidden />
                </Link>
              </div>
              <ul className="space-y-2 px-5 pb-4">
                {openAlerts.slice(0, 3).map((alert) => (
                  <li key={alert.id} className="flex items-start gap-2.5">
                    <span aria-hidden className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: RISK_META[alert.severity].color }} />
                    <span className="min-w-0">
                      <span className="block truncate text-[13px] font-medium text-slate-900">{alert.title}</span>
                      <span className="block text-[11px] text-slate-500">
                        {RISK_META[alert.severity].label} · {formatDistanceToNowStrict(new Date(alert.triggeredAt), { addSuffix: true })}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>

        {/* ---------- Right: record ---------- */}
        <div className="min-w-0">
          <Tabs value={tab} onValueChange={changeTab} className="w-full">
            <TabsList
              aria-label="Patient record sections"
              className={underlineTabsList}
            >
              {TAB_GROUPS.map((group, index) => {
                const tabs = group.filter((item) => tabAllowed(item, profileRole));
                if (tabs.length === 0) return null;
                return (
                  <Fragment key={index}>
                    {index > 0 && <span aria-hidden className="mx-2 h-4 w-px shrink-0 bg-slate-200" />}
                    {tabs.map(({ value, label, icon: Icon }) => (
                      <TabsTrigger
                        key={value}
                        value={value}
                        className={underlineTabsTrigger}
                      >
                        <Icon size={14} aria-hidden /> {label}
                      </TabsTrigger>
                    ))}
                  </Fragment>
                );
              })}
            </TabsList>

            <TabsContent value="overview" className="mt-5 space-y-6">
              <WellbeingChart checkins={status.checkins} />
              <div className="grid gap-6 2xl:grid-cols-2">
                <DriftChart scores={lifeChart.driftScores} onOpen={() => changeTab("life-chart")} />
                <ActivePlan goals={goals} exercises={exercises} onOpen={() => changeTab("care-plan")} />
              </div>
              <div className="grid gap-6 2xl:grid-cols-2">
                <Panel title="Recent clinical activity" description="Completed assessments">
                  {patient.recentActivity.length === 0 ? (
                    <ListEmpty title="No recent activity" hint="Completed assessments will appear here." />
                  ) : (
                    <ol className="relative space-y-4 border-l border-slate-200 pl-5">
                      {patient.recentActivity.map((activity) => {
                        const risk = toRiskLevel(activity.riskLevel);
                        return (
                          <li key={`${activity.assessmentId}-${activity.createdAt}`} className="relative">
                            <span aria-hidden className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-teal-600 ring-4 ring-white" />
                            <div className="flex flex-wrap items-center gap-2">
                              <Link href={`${pathname}?tab=assessments&assessmentId=${activity.assessmentId}`} scroll={false} className="text-[13px] font-medium text-slate-900 hover:text-teal-700 hover:underline">
                                MIRA assessment completed
                              </Link>
                              {risk && <RiskBadge level={risk} />}
                            </div>
                            <p className="mt-0.5 text-xs text-slate-500">
                              {activity.createdAt ? format(new Date(activity.createdAt), "MMM d, yyyy · HH:mm") : "Date not provided"}
                              {activity.orientation ? ` · ${activity.orientation}` : ""}
                            </p>
                          </li>
                        );
                      })}
                    </ol>
                  )}
                </Panel>
                {canWriteNotes && (
                  <Panel title="Patient journal" description="Entries the patient chose to share">
                    <JournalPanel patientId={id} initialData={journal} />
                  </Panel>
                )}
              </div>
            </TabsContent>
            <TabsContent value="life-chart" className="mt-5"><LifeChartPanel data={lifeChart} /></TabsContent>
            <TabsContent value="assessments" className="mt-5"><AssessmentPanel patientId={id} assessments={assessments} initialAssessmentId={assessmentId ?? initialDetail?.id} initialDetail={initialDetail ?? undefined} /></TabsContent>
            <TabsContent value="progress" className="mt-5"><ProgressPanel patientId={id} initialData={progress} /></TabsContent>
            <TabsContent value="medications" className="mt-5"><MedicationsPanel patientId={id} initialMedications={medications} canEdit={profileRole === "PSYCHIATRIST"} /></TabsContent>
            <TabsContent value="thresholds" className="mt-5"><ThresholdsPanel patientId={id} initialThresholds={thresholds} canEdit={profileRole === "PSYCHIATRIST"} /></TabsContent>
            <TabsContent value="relapse" className="mt-5"><RelapseSignaturesPanel patientId={id} initialSignatures={relapseSignatures} /></TabsContent>
            <TabsContent value="consent" className="mt-5"><ConsentPanel consent={consent} /></TabsContent>
            <TabsContent value="messages" className="mt-5"><MessagesPanel patientId={id} initialMessages={messages} /></TabsContent>
            <TabsContent value="timeline" className="mt-5"><TimelinePanel events={timeline} /></TabsContent>
            <TabsContent value="care-plan" className="mt-5"><CarePlanPanel patientId={id} initialExercises={exercises} initialGoals={goals} exerciseCatalog={exerciseCatalog} /></TabsContent>
            <TabsContent value="diagnosis" className="mt-5"><DiagnosisPanel patientId={id} initialDiagnoses={diagnoses} canEdit={profileRole === "PSYCHIATRIST"} /></TabsContent>
            <TabsContent value="notes" className="mt-5"><NotesPanel patientId={id} initialNotes={notes} /></TabsContent>
            <TabsContent value="sessions" className="mt-5"><SessionPanel sessions={sessions} /></TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

/* ---------- Summary pieces ---------- */

function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="truncate font-medium text-slate-900">{value}</dd>
    </div>
  );
}

function StatusRow({ label, value, detail, tone, spark, sparkColor }: { label: string; value: string; detail: string; tone?: "danger" | "warning"; spark?: number[]; sparkColor?: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3">
      <div className="min-w-0 flex-1">
        <dt className="flex items-center gap-1.5 text-xs text-slate-500">
          {tone && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", tone === "danger" ? "bg-red-500" : "bg-amber-500")} />}
          {label}
        </dt>
        <dd>
          <span className={cn("tabular block text-[15px] font-semibold", tone === "danger" ? "text-red-700" : tone === "warning" ? "text-amber-800" : "text-slate-900")}>{value}</span>
          <span className="block truncate text-[11px] text-slate-500">{detail}</span>
        </dd>
      </div>
      {spark && spark.length > 1 && <Sparkline values={spark} color={sparkColor} className="h-8 w-20 shrink-0" />}
    </div>
  );
}

/* ---------- Overview charts ---------- */

function WellbeingChart({ checkins }: { checkins: LifeChartResponse["checkins"] }) {
  const [metric, setMetric] = useState<WellbeingMetric>("mood");
  const meta = WELLBEING[metric];

  const { rows, stats } = useMemo(() => {
    const pick = (entry: LifeChartResponse["checkins"][number]) =>
      metric === "mood" ? entry.moodScore : metric === "sleep" ? entry.sleepHours : metric === "anxiety" ? entry.anxietyLevel : entry.energyLevel;
    const rows = checkins.map((entry) => ({ date: format(new Date(entry.checkinDate), "MMM d"), value: pick(entry) }));
    const values = rows.flatMap((row) => (row.value === null ? [] : [row.value]));
    const half = Math.floor(values.length / 2);
    const recent = average(values.slice(half));
    const earlier = average(values.slice(0, half));
    return {
      rows,
      stats: {
        avg: average(values),
        min: values.length ? Math.min(...values) : null,
        max: values.length ? Math.max(...values) : null,
        change: recent !== null && earlier !== null ? recent - earlier : null,
      },
    };
  }, [checkins, metric]);

  const hasData = stats.avg !== null;
  // For anxiety a rise is clinically worse; for the others a drop is.
  const worse = stats.change !== null && (metric === "anxiety" ? stats.change > 0.3 : stats.change < -0.3);

  return (
    <Panel
      title="Wellbeing trend"
      description="Patient-reported check-ins · last 30 days"
      action={
        <Segmented
          label="Wellbeing metric"
          value={metric}
          onChange={setMetric}
          options={(Object.keys(WELLBEING) as WellbeingMetric[]).map((key) => ({ value: key, label: WELLBEING[key].label }))}
        />
      }
    >
      {!hasData ? (
        <ChartEmpty title={`No ${meta.label.toLowerCase()} data`} hint="This metric appears once the patient shares it in check-ins." />
      ) : (
        <>
          <dl className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <ChartStat label="Average" value={`${stats.avg!.toFixed(1)}${meta.unit}`} />
            <ChartStat label="Lowest" value={`${stats.min}${meta.unit}`} />
            <ChartStat label="Highest" value={`${stats.max}${meta.unit}`} />
            <ChartStat
              label="Recent vs earlier"
              value={stats.change === null ? "—" : `${stats.change > 0 ? "+" : ""}${stats.change.toFixed(1)}`}
              tone={stats.change === null || Math.abs(stats.change) <= 0.3 ? undefined : worse ? "bad" : "good"}
            />
          </dl>
          <div className="h-60 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%" debounce={50}>
              <ComposedChart data={rows} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id={`wb-${metric}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={meta.color} stopOpacity={0.22} />
                    <stop offset="95%" stopColor={meta.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
                <YAxis domain={meta.domain} tickLine={false} axisLine={false} width={36} allowDecimals={false} />
                <Tooltip content={<ChartTooltipShell unit={meta.unit === "h" ? " h" : ""} />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
                <Area type="monotone" dataKey="value" name={meta.label} stroke={meta.color} strokeWidth={2.25} fill={`url(#wb-${metric})`} dot={{ r: 2.5, fill: "#fff", stroke: meta.color, strokeWidth: 1.5 }} activeDot={{ r: 4.5, stroke: "#fff", strokeWidth: 2 }} connectNulls />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </Panel>
  );
}

function ChartStat({ label, value, tone }: { label: string; value: string; tone?: "good" | "bad" }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{label}</dt>
      <dd className={cn("tabular mt-0.5 text-lg font-semibold tracking-tight", tone === "bad" ? "text-red-700" : tone === "good" ? "text-emerald-700" : "text-slate-900")}>{value}</dd>
    </div>
  );
}

function DriftChart({ scores, onOpen }: { scores: LifeChartResponse["driftScores"]; onOpen: () => void }) {
  const rows = scores.map((item) => ({ date: format(new Date(item.computedAt), "MMM d"), score: Number(item.score.toFixed(3)), level: item.level }));
  const latest = scores.at(-1);
  return (
    <Panel
      title="Drift score"
      description={latest ? `Latest ${latest.score.toFixed(2)} · ${RISK_META[latest.level].label}` : "Deviation from the patient's baseline"}
      action={
        <button type="button" onClick={onOpen} className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
          Life chart
        </button>
      }
    >
      {rows.length < 2 ? (
        <ChartEmpty title="Not enough drift data" hint="Drift is computed as check-ins accumulate." />
      ) : (
        <div className="h-48 w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%" debounce={50}>
            <LineChart data={rows} margin={{ top: 6, right: 6, bottom: 0, left: -20 }}>
              <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis domain={[0, 1]} ticks={[0, 0.25, 0.5, 0.75, 1]} tickLine={false} axisLine={false} width={36} />
              <Tooltip content={<ChartTooltipShell />} cursor={{ stroke: "var(--border-strong)", strokeDasharray: "3 3" }} />
              <Line
                type="monotone"
                dataKey="score"
                name="Drift"
                stroke="#94a3b8"
                strokeWidth={1.75}
                dot={(dot: { cx?: number; cy?: number; index?: number }) => (
                  <circle key={dot.index} cx={dot.cx} cy={dot.cy} r={3.5} fill={RISK_META[rows[dot.index ?? 0].level].color} stroke="#fff" strokeWidth={1.5} />
                )}
                activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

function ActivePlan({ goals, exercises, onOpen }: { goals: FocusGoal[]; exercises: ExerciseAssignment[]; onOpen: () => void }) {
  const activeGoals = goals.filter((goal) => isActivePlanItem(goal.status));
  const activeExercises = exercises.filter((item) => isActivePlanItem(item.status));
  const empty = activeGoals.length === 0 && activeExercises.length === 0;

  return (
    <Panel
      title="Active therapy plan"
      description={empty ? "No active goals or exercises" : `${activeGoals.length} goals · ${activeExercises.length} exercises`}
      action={
        <button type="button" onClick={onOpen} className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900">
          {empty ? "Create plan" : "Manage"}
        </button>
      }
    >
      {empty ? (
        <ListEmpty title="No active plan" hint="Set focus goals and assign exercises." action={<Button size="sm" variant="secondary" onClick={onOpen}>Open</Button>} />
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200/80">
          {activeGoals.slice(0, 3).map((goal) => (
            <PlanItem key={goal.id} icon={<Target size={14} />} title={goal.title} meta={goal.weekStart ? `Week of ${format(new Date(goal.weekStart), "MMM d")}` : "Focus goal"} />
          ))}
          {activeExercises.slice(0, 3).map((item) => {
            const lastDone = item.completions.at(-1);
            return (
              <PlanItem
                key={item.id}
                icon={<Dumbbell size={14} />}
                title={item.exercise.title}
                meta={[item.frequency, `${item.completions.length} done`, lastDone ? `last ${formatDistanceToNowStrict(new Date(lastDone.completedAt), { addSuffix: true })}` : null].filter(Boolean).join(" · ")}
              />
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function PlanItem({ icon, title, meta }: { icon: ReactNode; title: string; meta: string }) {
  return (
    <li className="flex items-center gap-3 px-3 py-2.5">
      <span aria-hidden className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">{icon}</span>
      <span className="min-w-0">
        <span className="block truncate text-[13px] font-medium text-slate-900">{title}</span>
        <span className="block truncate text-xs text-slate-500">{meta}</span>
      </span>
    </li>
  );
}
