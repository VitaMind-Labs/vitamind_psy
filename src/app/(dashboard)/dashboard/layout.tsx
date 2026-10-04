import { redirect } from "next/navigation";
import { ApiError } from "@/lib/api/errors";
import { psychologistApi, type PsychologistNotification, type PsychologistProfile } from "@/lib/api/psychologist";
import { SidebarProvider } from "@/providers/SidebarProvider";
import { SidebarClient } from "@/components/layout/SidebarClient";

export const dynamic = "force-dynamic";

const CLINICAL_ROLES = ["PSYCHIATRIST", "PSYCHOLOGIST", "THERAPIST", "NURSE", "CARE_COORDINATOR"];

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  let profile: PsychologistProfile;
  let notifications: PsychologistNotification[];
  let unreadCount: number;
  try {
    const [me, list, unread] = await Promise.all([
      psychologistApi.getMe(),
      psychologistApi.listNotifications(),
      // The list is capped at the latest 50; the badge must count every unread notification.
      psychologistApi.getUnreadNotificationCount().catch(() => null),
    ]);
    profile = me;
    notifications = list.data;
    unreadCount = unread?.unread ?? list.data.filter((item) => !item.read).length;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/signin");
    if (error instanceof ApiError && error.status === 403) redirect("/access-denied");
    throw error;
  }

  if (!CLINICAL_ROLES.includes(profile.role)) redirect("/access-denied");

  // Badge-only data: a failure here must never block the shell.
  const openAlertCount =
    profile.role === "CARE_COORDINATOR"
      ? 0
      : await psychologistApi
          .listAlerts({ status: "OPEN", page: 1, limit: 1 })
          .then((result) => result.meta.total)
          .catch(() => 0);

  const requestCount = await psychologistApi
    .listAssignmentRequests({ limit: 1 })
    .then((result) => result.awaitingMe)
    .catch(() => 0);

  return (
    <SidebarProvider>
      <SidebarClient
        profile={profile}
        notifications={notifications}
        unreadCount={unreadCount}
        openAlertCount={openAlertCount}
        requestCount={requestCount}
      >
        {children}
      </SidebarClient>
    </SidebarProvider>
  );
}
