import { psychologistApi } from "@/lib/api/psychologist";
import { PatientShortcutList } from "@/features/patients/components/PatientShortcutList";

export default async function ProgressPage() {
  const response = await psychologistApi.listPatients({ page: 1, limit: 100, sortBy: "lastActivityAt", sortOrder: "desc" });
  return <PatientShortcutList title="Progress tracking" description="Choose a patient to review their reported trends." actionLabel="View progress" basePath="/dashboard/patients" patients={response.data} />;
}
