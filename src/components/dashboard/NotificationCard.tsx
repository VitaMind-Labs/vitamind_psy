"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { AlertTriangle, Info, UserPlus } from "lucide-react";
import type { Notification } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";

const typeConfig = {
  critical: { icon: AlertTriangle, color: "var(--danger)", label: "Critique" },
  info: { icon: Info, color: "var(--chart-3)", label: "Information" },
  assignment: { icon: UserPlus, color: "var(--accent)", label: "Attribution" },
};

interface NotificationCardProps {
  notification: Notification;
  index: number;
  onMarkRead: (id: string) => void;
}

export function NotificationCard({ notification, index, onMarkRead }: NotificationCardProps) {
  const router = useRouter();
  const config = typeConfig[notification.type];
  const Icon = config.icon;

  const handleClick = () => {
    onMarkRead(notification.id);
    if (notification.patientId) {
      router.push(`/dashboard/patients/${notification.patientId}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
      onClick={handleClick}
      className={`dashboard-card p-4 flex items-start gap-4 cursor-pointer transition-all`}
      style={{
        borderLeft: !notification.read ? `3px solid ${config.color}` : undefined,
      }}
    >
      <div
        className="w-10 h-10 rounded-[var(--radius-sm)] flex items-center justify-center shrink-0"
        style={{ background: `${config.color}15` }}
      >
        <Icon size={18} style={{ color: config.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h4 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{notification.title}</h4>
          <Badge variant={notification.type === "critical" ? "danger" : notification.type === "info" ? "info" : "warning"}>
            {config.label}
          </Badge>
        </div>
        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{notification.message}</p>
        <p className="text-xs mt-1.5" style={{ color: "var(--foreground-soft)" }}>
          {new Date(notification.createdAt).toLocaleDateString("fr-FR", {
            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
          })}
          {notification.patientId && <span> · Patient: {notification.patientId}</span>}
        </p>
      </div>
    </motion.div>
  );
}
