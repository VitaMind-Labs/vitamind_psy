"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNowStrict, isToday, isYesterday } from "date-fns";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { AlertTriangle, BarChart3, Bell, CalendarDays, Check, CheckCheck, ChevronRight, ClipboardCheck, Inbox, MessageSquareText, Search, ShieldPlus, type LucideIcon } from "lucide-react";
import { markAllNotificationsReadServer, markNotificationReadServer } from "@/features/notifications/actions/notifications";
import { notificationHref } from "@/features/notifications/lib/notification-links";
import type { PsychologistNotification } from "@/lib/api/psychologist";
import { Button } from "@/components/ui/button";
import { DashboardPageHeader } from "@/components/layout/DashboardUI";
import { KpiCell, KpiGrid, Panel, Segmented } from "@/components/layout/Kpi";
import { ChartEmpty } from "@/features/dashboard/components/overview/cards";
import { bucketByDay, windowDelta } from "@/features/dashboard/lib/metrics";
import { useNow } from "@/hooks/use-now";
import { cn } from "@/lib/utils";

type Category = { key: string; label: string; icon: LucideIcon; tone: string };

const CATEGORIES: Category[] = [
  { key: "assign", label: "Requests", icon: Inbox, tone: "bg-amber-50 text-amber-700" },
  { key: "alert", label: "Alerts", icon: AlertTriangle, tone: "bg-red-50 text-red-600" },
  { key: "message", label: "Messages", icon: MessageSquareText, tone: "bg-violet-50 text-violet-700" },
  { key: "report", label: "Reports", icon: BarChart3, tone: "bg-orange-50 text-orange-600" },
  { key: "session", label: "Sessions", icon: CalendarDays, tone: "bg-teal-50 text-teal-700" },
  { key: "assessment", label: "Assessments", icon: ClipboardCheck, tone: "bg-sky-50 text-sky-700" },
  { key: "coverage", label: "Coverage", icon: ShieldPlus, tone: "bg-indigo-50 text-indigo-700" },
];
const GENERAL: Category = { key: "general", label: "General", icon: Bell, tone: "bg-slate-100 text-slate-600" };

// The backend's NotificationType, by category. Anything unlisted falls back to a keyword match, then "General".
const CATEGORY_BY_TYPE: Record<string, string> = {
  CLINICAL_ALERT: "alert",
  RISK_ALERT: "alert",
  CRISIS: "alert",
  SECURE_MESSAGE: "message",
  WEEKLY_REPORT_READY: "report",
  REPORT_READY: "report",
  REPORT_ESCALATION: "report",
  PATIENT_ASSIGNED: "assign",
  ASSIGNMENT_ACCEPTED: "assign",
  ASSIGNMENT_DECLINED: "assign",
  SESSION_REMINDER: "session",
  ASSESSMENT_READY: "assessment",
  COVERAGE_ASSIGNED: "coverage",
};

const categoryOf = (item: PsychologistNotification) => {
  const key = CATEGORY_BY_TYPE[item.type];
  return (key ? CATEGORIES.find((category) => category.key === key) : CATEGORIES.find((category) => item.type.toLowerCase().includes(category.key))) ?? GENERAL;
};

function dayLabel(date: Date) {
  if (isToday(date)) return "Today";
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE, MMM d");
}

export function NotificationsView({ initialNotifications }: { initialNotifications: PsychologistNotification[] }) {
  const router = useRouter();
  const now = useNow();
  const [, startTransition] = useTransition();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [category, setCategory] = useState<string>("all");
  const [markingAll, setMarkingAll] = useState(false);

  // Keep the header bell badge (server-rendered in the layout) in sync.
  const syncShell = () => startTransition(() => router.refresh());

  const stats = useMemo(() => {
    const unread = notifications.filter((item) => !item.read);
    return {
      unread: unread.length,
      urgentUnread: unread.filter((item) => categoryOf(item).key === "alert").length,
      today: notifications.filter((item) => isToday(new Date(item.createdAt))).length,
      week: windowDelta(notifications, (item) => item.createdAt, 7, now),
      spark: bucketByDay(notifications, (item) => item.createdAt, 14, now).map((row) => row.value),
      categories: [...CATEGORIES, GENERAL]
        .map((cat) => ({ cat, count: notifications.filter((item) => categoryOf(item).key === cat.key).length }))
        .filter((entry) => entry.count > 0),
    };
  }, [notifications, now]);

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = notifications
      .filter((item) => (filter === "all" || !item.read) && (category === "all" || categoryOf(item).key === category) && (!needle || item.title.toLowerCase().includes(needle)))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const map = new Map<string, PsychologistNotification[]>();
    filtered.forEach((item) => {
      const key = item.createdAt.slice(0, 10);
      map.set(key, [...(map.get(key) ?? []), item]);
    });
    return [...map.entries()];
  }, [notifications, filter, category, query]);

  const markRead = async (id: string) => {
    setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: true } : item)));
    try {
      await markNotificationReadServer(id);
      syncShell();
    } catch {
      setNotifications((current) => current.map((item) => (item.id === id ? { ...item, read: false } : item)));
      toast.error("Could not mark as read");
    }
  };

  const markAll = async () => {
    if (stats.unread === 0) return;
    setMarkingAll(true);
    const before = notifications;
    setNotifications((current) => current.map((item) => ({ ...item, read: true })));
    try {
      await markAllNotificationsReadServer();
      toast.success("All notifications marked as read");
    } catch {
      setNotifications(before);
      toast.error("Could not mark notifications as read");
    }
    setMarkingAll(false);
    syncShell();
  };

  const open = (item: PsychologistNotification) => {
    if (!item.read) void markRead(item.id);
    const href = notificationHref(item);
    if (href) router.push(href);
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        eyebrow="Practice"
        title="Notifications"
        description="System updates about alerts, reports, sessions and your coverage."
        action={
          <Button size="sm" variant="secondary" loading={markingAll} disabled={stats.unread === 0} onClick={() => void markAll()}>
            {!markingAll && <CheckCheck size={14} aria-hidden />} Mark all as read
          </Button>
        }
      />

      <KpiGrid>
        <KpiCell label="Unread" value={stats.unread} tone={stats.urgentUnread > 0 ? "danger" : undefined} hint={stats.urgentUnread > 0 ? `${stats.urgentUnread} alert-related` : "Nothing urgent"} />
        <KpiCell label="Received today" value={stats.today} />
        <KpiCell label="This week" value={stats.week.current} delta={{ pct: stats.week.pct, goodWhen: "down", caption: "vs last week" }} spark={stats.spark} sparkColor="var(--chart-2)" />
        <KpiCell label="Total" value={notifications.length} hint={`${stats.categories.length} categories`} />
      </KpiGrid>

      <div className="grid gap-6 xl:grid-cols-[220px_minmax(0,1fr)]">
        {/* Categories */}
        <nav aria-label="Notification categories" className="xl:sticky xl:top-[4.5rem] xl:self-start">
          <ul className="flex gap-1 overflow-x-auto xl:flex-col">
            {[{ key: "all", label: "All notifications", icon: Bell, count: notifications.length }, ...stats.categories.map(({ cat, count }) => ({ key: cat.key, label: cat.label, icon: cat.icon, count }))].map((entry) => (
              <li key={entry.key} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setCategory(entry.key)}
                  aria-current={category === entry.key ? "true" : undefined}
                  className={cn(
                    "flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] font-medium transition-colors",
                    category === entry.key ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/80" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
                  )}
                >
                  <entry.icon size={15} aria-hidden className={category === entry.key ? "text-teal-700" : "text-slate-400"} />
                  <span className="flex-1 truncate">{entry.label}</span>
                  <span className="tabular text-xs text-slate-400">{entry.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Inbox */}
        <Panel
          title="Inbox"
          description={filter === "unread" ? `${stats.unread} unread` : `${notifications.length} notifications`}
          flush
          action={
            <div className="flex items-center gap-2">
              <div className="relative hidden w-52 sm:block">
                <Search size={14} aria-hidden className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" aria-label="Search notifications" className="input-ui h-8 rounded-lg pl-8 text-[13px]" />
              </div>
              <Segmented label="Read filter" value={filter} onChange={setFilter} options={[{ value: "all", label: "All" }, { value: "unread", label: "Unread", count: stats.unread }]} />
            </div>
          }
        >
          {groups.length === 0 ? (
            <div className="px-5 pb-5">
              <ChartEmpty
                title={filter === "unread" ? "You're all caught up" : "No notifications"}
                hint={filter === "unread" ? "New notifications will appear here." : query ? "Try a different search." : "Nothing in this category yet."}
              />
            </div>
          ) : (
            <div className="border-t border-slate-100">
              {groups.map(([key, items]) => (
                <section key={key} aria-label={dayLabel(new Date(key))}>
                  <h3 className="sticky top-14 z-[1] border-b border-slate-100 bg-slate-50/90 px-5 py-1.5 text-[11px] font-medium text-slate-500 backdrop-blur">
                    {dayLabel(new Date(key))}
                  </h3>
                  <ul className="divide-y divide-slate-100">
                    <AnimatePresence initial={false}>
                      {items.map((item) => {
                        const cat = categoryOf(item);
                        return (
                          <motion.li key={item.id} layout="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="group relative flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50/70">
                            {!item.read && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] bg-teal-600" />}
                            <span aria-hidden className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", cat.tone)}>
                              <cat.icon size={15} />
                            </span>
                            <button type="button" onClick={() => open(item)} className="min-w-0 flex-1 cursor-pointer text-left after:absolute after:inset-0">
                              <span className={cn("block truncate text-[13px]", item.read ? "text-slate-600" : "font-semibold text-slate-900")}>{item.title}</span>
                              {item.message && <span className="block truncate text-xs text-slate-500">{item.message}</span>}
                              <span className="block text-xs text-slate-500">
                                {cat.label} · <time dateTime={item.createdAt} title={format(new Date(item.createdAt), "MMM d, yyyy · HH:mm")}>{formatDistanceToNowStrict(new Date(item.createdAt), { addSuffix: true })}</time>
                              </span>
                            </button>
                            {!item.read && (
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Mark "${item.title}" as read`}
                                onClick={() => void markRead(item.id)}
                                className="relative z-[1] opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100"
                              >
                                <Check size={14} aria-hidden />
                              </Button>
                            )}
                            {notificationHref(item) && <ChevronRight size={15} aria-hidden className="shrink-0 text-slate-300 transition-colors group-hover:text-slate-500" />}
                          </motion.li>
                        );
                      })}
                    </AnimatePresence>
                  </ul>
                </section>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
