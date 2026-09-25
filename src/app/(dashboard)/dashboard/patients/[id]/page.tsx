import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { psychologistApi, type AssessmentDetailResponse, type ClinicalAlert, type ConsentResponse, type LifeChartResponse, type AssessmentListItem, type JournalEntry, type PaginatedResponse, type ProgressResponse, type SessionListItem } from "@/lib/api/psychologist";
import { PatientProfile } from "@/features/patients/components/PatientProfile";
import { parsePatientTab, type PatientTab } from "@/features/patients/lib/patient-tabs";

interface PatientDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string; assessmentId?: string }>;
}

const today = () => new Date().toISOString().slice(0, 10);
const thirtyDaysAgo = () => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().slice(0, 10);
};

const emptyProgress = (): ProgressResponse => ({ period: { from: thirtyDaysAgo(), to: today() }, entries: [] });
const emptyPage = <T,>(): PaginatedResponse<T> => ({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
const emptyMessages = { emergencyNotice: { clinicName: null, emergencyNumber: null, message: "" }, data: [] };
const emptyLifeChart = (): LifeChartResponse => ({ period: { from: thirtyDaysAgo(), to: today() }, checkins: [], driftScores: [], sessions: [], notShared: [] });
const emptyConsent = (id: string): ConsentResponse => ({ assignmentId: id, status: "UNKNOWN", consentedAt: null, categories: { diagnostics: false, mood: false, sleep: false, medication: false, exercises: false, biometrics: false, journal: "" }, safetyAlertsConsentAt: null, monitoringNoticeAckAt: null });

async function optional<T>(request: Promise<T>, fallback: T): Promise<T> {
  try {
    const value = await request;
    return value && typeof value === "object" ? value : fallback;
  } catch {
    return fallback;
  }
}

function normalizeProgress(value: unknown): ReturnType<typeof emptyProgress> {
  if (!value || typeof value !== "object") return emptyProgress();
  const source = value as Record<string, unknown>;
  const period = source.period && typeof source.period === "object" ? source.period as Record<string, unknown> : {};
  const rawEntries = Array.isArray(source.entries)
    ? source.entries
    : Array.isArray(source.checkins)
      ? source.checkins
      : [];
  const entries = rawEntries.flatMap((entry) => {
    if (!entry || typeof entry !== "object") return [];
    const item = entry as Record<string, unknown>;
    const date = typeof item.date === "string" ? item.date : typeof item.checkinDate === "string" ? item.checkinDate : "";
    if (!date) return [];
    const mood = typeof item.mood === "number" ? item.mood : typeof item.moodScore === "number" ? item.moodScore : null;
    const stress = typeof item.stress === "number" ? item.stress : typeof item.anxietyLevel === "number" ? item.anxietyLevel : null;
    const energy = typeof item.energy === "number" ? item.energy : typeof item.energyLevel === "number" ? item.energyLevel : null;
    const sleepHours = typeof item.sleepHours === "number" ? item.sleepHours : null;
    return [{ date, mood, stress, energy, sleepHours, source: typeof item.source === "string" ? item.source as "PATIENT_REPORTED" : "PATIENT_REPORTED" }];
  });
  return {
    period: { from: typeof period.from === "string" ? period.from : thirtyDaysAgo(), to: typeof period.to === "string" ? period.to : today() },
    entries,
  };
}

async function loadPatientData(id: string, tab: PatientTab, assessmentId?: string) {
  const [profile, patient] = await Promise.all([psychologistApi.getMe(), psychologistApi.getPatient(id)]);
  const role = profile.role;
  const canTriage = role !== "CARE_COORDINATOR";
  const [progress, assessments, sessions, lifeChart, consent, thresholds, relapseSignatures, timeline, messages, exercises, goals, catalog, openAlerts] = await Promise.all([
    tab === "progress" ? optional(psychologistApi.getPatientProgress(id), emptyProgress()) : Promise.resolve(emptyProgress()),
    tab === "assessments" ? optional(psychologistApi.listAssessments(id, { page: 1, limit: 20 }), emptyPage<AssessmentListItem>()) : Promise.resolve(emptyPage<AssessmentListItem>()),
    tab === "sessions" ? optional(psychologistApi.listSessions({ page: 1, limit: 100 }), emptyPage<SessionListItem>()) : Promise.resolve(emptyPage<SessionListItem>()),
    // Always loaded: drives the critical-indicator strip on every tab.
    optional(psychologistApi.getLifeChart(id), emptyLifeChart()),
    tab === "consent" ? optional(psychologistApi.getConsent(id), emptyConsent(id)) : Promise.resolve(emptyConsent(id)),
    tab === "thresholds" && role === "PSYCHIATRIST" ? optional(psychologistApi.getThresholds(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "relapse" ? optional(psychologistApi.getRelapseSignatures(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "timeline" ? optional(psychologistApi.getTimelineEvents(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "messages" ? optional(psychologistApi.getMessages(id), emptyMessages) : Promise.resolve(emptyMessages),
    tab === "care-plan" || tab === "overview" ? optional(psychologistApi.getExercises(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "care-plan" || tab === "overview" ? optional(psychologistApi.getGoals(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "care-plan" ? optional(psychologistApi.getExerciseCatalog(), { data: [] }) : Promise.resolve({ data: [] }),
    canTriage ? optional(psychologistApi.listAlerts({ status: "OPEN", page: 1, limit: 50 }), { data: [] as ClinicalAlert[], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } }) : Promise.resolve({ data: [] as ClinicalAlert[], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
  ]);
  const initialDetail: AssessmentDetailResponse | null = tab === "assessments" && assessmentId
    ? await optional(psychologistApi.getAssessment(id, assessmentId), null)
    : null;
  const diagnoses = tab === "diagnosis" && role === "PSYCHIATRIST" ? (await optional(psychologistApi.getDiagnoses(id), { data: [] })).data : [];
  const journal = tab === "overview" && role !== "NURSE" && role !== "CARE_COORDINATOR" ? await optional(psychologistApi.getPatientJournal(id, { page: 1, limit: 20 }), { data: [] as JournalEntry[], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) : { data: [] as JournalEntry[], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const notes = tab === "notes" && role !== "NURSE" && role !== "CARE_COORDINATOR" ? (await optional(psychologistApi.listNotes(id), { data: [] })).data : [];
  const medications = tab === "medications" && role === "PSYCHIATRIST" ? (await optional(psychologistApi.getMedications(id), { data: [] })).data : [];
  return { patient, progress: normalizeProgress(progress), journal, assessments, initialDetail, notes, sessions, lifeChart, consent, thresholds: thresholds.data, relapseSignatures: relapseSignatures.data, medications, timeline: timeline.data, messages, exercises: exercises.data, goals: goals.data, diagnoses, exerciseCatalog: catalog.data, role, openAlerts: openAlerts.data.filter((alert) => alert.userId === id), emergencyNumber: profile.clinic?.emergencyNumber ?? null };
}

export default async function PatientDetailPage({ params, searchParams }: PatientDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;
  const tab = parsePatientTab(query.tab);
  let data: Awaited<ReturnType<typeof loadPatientData>>;
  try {
    data = await loadPatientData(id, tab, query.assessmentId);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound();
    throw error;
  }
  return <PatientProfile patient={data.patient} progress={data.progress} journal={data.journal} assessments={data.assessments} initialDetail={data.initialDetail} notes={data.notes} sessions={data.sessions.data.filter((session) => session.patientId === id)} lifeChart={data.lifeChart} consent={data.consent} thresholds={data.thresholds} relapseSignatures={data.relapseSignatures} medications={data.medications} timeline={data.timeline} messages={data.messages} exercises={data.exercises} goals={data.goals} diagnoses={data.diagnoses} exerciseCatalog={data.exerciseCatalog} profileRole={data.role} openAlerts={data.openAlerts} emergencyNumber={data.emergencyNumber} initialTab={tab} initialAssessmentId={query.assessmentId} />;
}
