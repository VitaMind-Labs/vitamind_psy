export const PATIENT_TABS = [
  "overview",
  "life-chart",
  "assessments",
  "progress",
  "medications",
  "thresholds",
  "relapse",
  "consent",
  "messages",
  "timeline",
  "care-plan",
  "diagnosis",
  "notes",
  "sessions",
] as const;

export type PatientTab = (typeof PATIENT_TABS)[number];

export function parsePatientTab(value: string | null | undefined): PatientTab {
  return PATIENT_TABS.includes(value as PatientTab) ? value as PatientTab : "overview";
}
