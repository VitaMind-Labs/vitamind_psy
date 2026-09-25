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
  try {
    const [me, list] = await Promise.all([psychologistApi.getMe(), psychologistApi.listNotifications()]);
    profile = me;
    notifications = list.data;
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

  return (
    <SidebarProvider>
      <SidebarClient
        profile={profile}
        notifications={notifications}
        unreadCount={notifications.filter((item) => !item.read).length}
        openAlertCount={openAlertCount}
      >
        {children}
      </SidebarClient>
    </SidebarProvider>
  );
}
