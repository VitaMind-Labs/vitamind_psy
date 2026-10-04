export const PATIENT_TABS = [
  "overview",
  "life-chart",
  "assessments",
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

/** Tabs that were merged into another; old bookmarks and links still land on the right place. */
const TAB_ALIASES: Record<string, PatientTab> = { progress: "life-chart" };

export function parsePatientTab(value: string | null | undefined): PatientTab {
  if (value && value in TAB_ALIASES) return TAB_ALIASES[value];
  return PATIENT_TABS.includes(value as PatientTab) ? (value as PatientTab) : "overview";
}
