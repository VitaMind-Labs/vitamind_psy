import { notFound } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { psychologistApi, type AssessmentDetailResponse, type ClinicalAlert, type ConsentResponse, type LifeChartResponse, type AssessmentListItem, type JournalEntry, type PaginatedResponse, type SessionListItem } from "@/lib/api/psychologist";
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

async function loadPatientData(id: string, tab: PatientTab, assessmentId?: string) {
  const [profile, patient] = await Promise.all([psychologistApi.getMe(), psychologistApi.getPatient(id)]);
  const role = profile.role;
  const canTriage = role !== "CARE_COORDINATOR";
  const [assessments, sessions, lifeChart, consent, thresholds, relapseSignatures, timeline, messages, exercises, goals, catalog, openAlerts] = await Promise.all([
    tab === "assessments" ? optional(psychologistApi.listAssessments(id, { page: 1, limit: 20 }), emptyPage<AssessmentListItem>()) : Promise.resolve(emptyPage<AssessmentListItem>()),
    tab === "sessions" ? optional(psychologistApi.listSessions({ patientId: id, order: "desc", page: 1, limit: 100 }), emptyPage<SessionListItem>()) : Promise.resolve(emptyPage<SessionListItem>()),
    // Always loaded: drives the critical-indicator strip on every tab. Thirty days matches the overview charts.
    optional(psychologistApi.getLifeChart(id, { from: thirtyDaysAgo(), to: today() }), emptyLifeChart()),
    tab === "consent" ? optional(psychologistApi.getConsent(id), emptyConsent(id)) : Promise.resolve(emptyConsent(id)),
    tab === "thresholds" && role === "PSYCHIATRIST" ? optional(psychologistApi.getThresholds(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "relapse" ? optional(psychologistApi.getRelapseSignatures(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "timeline" ? optional(psychologistApi.getTimelineEvents(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "messages" ? optional(psychologistApi.getMessages(id), emptyMessages) : Promise.resolve(emptyMessages),
    tab === "care-plan" || tab === "overview" ? optional(psychologistApi.getExercises(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "care-plan" || tab === "overview" ? optional(psychologistApi.getGoals(id), { data: [] }) : Promise.resolve({ data: [] }),
    tab === "care-plan" ? optional(psychologistApi.getExerciseCatalog(), { data: [] }) : Promise.resolve({ data: [] }),
    canTriage ? optional(psychologistApi.listAlerts({ status: "OPEN", patientId: id, page: 1, limit: 50 }), { data: [] as ClinicalAlert[], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } }) : Promise.resolve({ data: [] as ClinicalAlert[], meta: { page: 1, limit: 50, total: 0, totalPages: 0 } }),
  ]);
  const initialDetail: AssessmentDetailResponse | null = tab === "assessments" && assessmentId
    ? await optional(psychologistApi.getAssessment(id, assessmentId), null)
    : null;
  const diagnoses = tab === "diagnosis" && role === "PSYCHIATRIST" ? (await optional(psychologistApi.getDiagnoses(id), { data: [] })).data : [];
  const journal = tab === "overview" && role !== "NURSE" && role !== "CARE_COORDINATOR" ? await optional(psychologistApi.getPatientJournal(id, { page: 1, limit: 20 }), { data: [] as JournalEntry[], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } }) : { data: [] as JournalEntry[], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } };
  const notes = tab === "notes" && role !== "NURSE" && role !== "CARE_COORDINATOR" ? (await optional(psychologistApi.listNotes(id), { data: [] })).data : [];
  const medications = tab === "medications" && role === "PSYCHIATRIST" ? (await optional(psychologistApi.getMedications(id), { data: [] })).data : [];
  return { patient, journal, assessments, initialDetail, notes, sessions, lifeChart, consent, thresholds: thresholds.data, relapseSignatures: relapseSignatures.data, medications, timeline: timeline.data, messages, exercises: exercises.data, goals: goals.data, diagnoses, exerciseCatalog: catalog.data, role, openAlerts: openAlerts.data, emergencyNumber: profile.clinic?.emergencyNumber ?? null };
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
  return <PatientProfile patient={data.patient} journal={data.journal} assessments={data.assessments} initialDetail={data.initialDetail} notes={data.notes} sessions={data.sessions.data} lifeChart={data.lifeChart} consent={data.consent} thresholds={data.thresholds} relapseSignatures={data.relapseSignatures} medications={data.medications} timeline={data.timeline} messages={data.messages} exercises={data.exercises} goals={data.goals} diagnoses={data.diagnoses} exerciseCatalog={data.exerciseCatalog} profileRole={data.role} openAlerts={data.openAlerts} emergencyNumber={data.emergencyNumber} initialTab={tab} initialAssessmentId={query.assessmentId} />;
}
