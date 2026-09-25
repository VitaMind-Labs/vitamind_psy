import { psychologistApi } from "@/lib/api/psychologist";
import { NotificationsView } from "@/features/notifications/components/NotificationsView";

export default async function NotificationsPage() {
  const response = await psychologistApi.listNotifications();
  return <NotificationsView initialNotifications={response.data} />;
}
