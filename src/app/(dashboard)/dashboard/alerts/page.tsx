import { psychologistApi } from "@/lib/api/psychologist";
import { AlertsCenter } from "@/features/dashboard/components/AlertsCenter";

const STATUSES = ["OPEN", "ACKNOWLEDGED", "ESCALATED", "RESOLVED"] as const;

export default async function AlertsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const [{ status }, alerts] = await Promise.all([searchParams, psychologistApi.listAlerts({ limit: 50 })]);
  const initialStatus = STATUSES.find((value) => value === status) ?? "ALL";
  return <AlertsCenter initialData={alerts} initialStatus={initialStatus} />;
}
