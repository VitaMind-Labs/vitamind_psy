import { psychologistApi } from "@/lib/api/psychologist";
import { WeeklyReports } from "@/features/reports/components/WeeklyReports";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ report?: string }> }) {
  const [{ report }, reports] = await Promise.all([searchParams, psychologistApi.listWeeklyReports()]);
  return <WeeklyReports initialReports={reports} initialReportId={report} />;
}
