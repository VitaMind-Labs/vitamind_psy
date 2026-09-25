import { psychologistApi } from "@/lib/api/psychologist";
import { PracticeOverview } from "@/features/dashboard/components/overview/PracticeOverview";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [dashboard, caseload, sessions, alerts, reports, profile] = await Promise.all([
    psychologistApi.getDashboard(),
    psychologistApi.getCaseload({ page: 1, limit: 50, sort: "risk" }),
    psychologistApi.listSessions({ page: 1, limit: 100 }),
    psychologistApi.listAlerts({ page: 1, limit: 50 }),
    psychologistApi.listWeeklyReports(),
    psychologistApi.getMe(),
  ]);

  const clinicianName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Doctor";

  return (
    <PracticeOverview
      data={{
        dashboard,
        caseload: caseload.data,
        sessions: sessions.data,
        alerts: alerts.data,
        reports,
        clinicianName,
      }}
    />
  );
}
