import Link from "next/link";
import { ArrowRight, Inbox } from "lucide-react";
import { psychologistApi } from "@/lib/api/psychologist";
import { PracticeOverview } from "@/features/dashboard/components/overview/PracticeOverview";

export const dynamic = "force-dynamic";

export default async function OverviewPage() {
  const [dashboard, caseload, sessions, alerts, openAlerts, reports, profile] = await Promise.all([
    psychologistApi.getDashboard(),
    psychologistApi.getCaseload({ page: 1, limit: 50, sort: "risk" }),
    psychologistApi.listSessions({ order: "desc", page: 1, limit: 100 }),
    psychologistApi.listAlerts({ page: 1, limit: 100 }),
    // The real open count: the list above is capped and mixes every status.
    psychologistApi.listAlerts({ status: "OPEN", page: 1, limit: 1 }),
    psychologistApi.listWeeklyReports(),
    psychologistApi.getMe(),
  ]);

  const clinicianName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "Doctor";

  const pendingRequests = dashboard.stats.pendingRequests ?? 0;

  return (
    <div className="space-y-6">
      {pendingRequests > 0 && (
        <Link
          href="/dashboard/requests"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-white px-5 py-3.5 transition-colors hover:border-amber-300"
        >
          <span className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <Inbox size={17} aria-hidden />
            </span>
            <span>
              <span className="block text-sm font-semibold text-amber-950">
                {pendingRequests} patient request{pendingRequests === 1 ? "" : "s"} waiting for your answer
              </span>
              <span className="block text-xs text-amber-900/70">The SynQ team proposed {pendingRequests === 1 ? "a patient" : "patients"} to you. Accept or decline to start care.</span>
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-amber-900">
            Review <ArrowRight size={13} aria-hidden className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      )}
      <PracticeOverview
        data={{
          dashboard,
          caseload: caseload.data,
          sessions: sessions.data,
          alerts: alerts.data,
          openAlertTotal: openAlerts.meta.total,
          reports,
          clinicianName,
        }}
      />
    </div>
  );
}
