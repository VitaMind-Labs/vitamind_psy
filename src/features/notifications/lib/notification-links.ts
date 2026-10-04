import type { PsychologistNotification } from "@/lib/api/psychologist";

/**
 * The backend only names the record a notification is about (`reference`); which page shows it is decided here,
 * once, so moving a page never touches the API. Returns null for notices that have no page (system broadcasts).
 */
export function notificationHref(item: Pick<PsychologistNotification, "reference">): string | null {
  const ref = item.reference;
  if (!ref) return null;
  switch (ref.kind) {
    case "CLINICAL_ALERT":
      return `/dashboard/alerts?alert=${encodeURIComponent(ref.id)}`;
    case "WEEKLY_REPORT":
      return `/dashboard/reports/${encodeURIComponent(ref.id)}`;
    case "PATIENT_MESSAGE":
      return ref.patientId ? `/dashboard/patients/${encodeURIComponent(ref.patientId)}?tab=messages` : null;
    case "PATIENT":
      return `/dashboard/patients/${encodeURIComponent(ref.id)}`;
    case "SESSION":
      return `/dashboard/sessions/${encodeURIComponent(ref.id)}`;
    case "ASSIGNMENT_REQUEST":
      return "/dashboard/requests";
    case "COVERAGE":
      return "/dashboard/coverage";
    case "LICENSE":
      return "/dashboard/settings";
    default:
      return null;
  }
}
