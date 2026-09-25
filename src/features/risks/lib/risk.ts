import type { AlertStatus, RiskLevel, TrafficLight } from "@/lib/api/psychologist";
import type { BadgeVariant } from "@/components/ui/badge";

type Meta = { label: string; variant: BadgeVariant; color: string; rank: number };

/** Clinical severity scale. `rank` sorts most urgent first. */
export const RISK_META: Record<RiskLevel, Meta> = {
  CRITICAL: { label: "Critical", variant: "danger", color: "#ef4444", rank: 0 },
  HIGH: { label: "High", variant: "high", color: "#f97316", rank: 1 },
  MODERATE: { label: "Moderate", variant: "warning", color: "#f59e0b", rank: 2 },
  LOW: { label: "Low", variant: "success", color: "#10b981", rank: 3 },
};

export const RISK_ORDER: RiskLevel[] = ["CRITICAL", "HIGH", "MODERATE", "LOW"];

export const TRAFFIC_META: Record<TrafficLight, Meta> = {
  RED: { label: "Priority", variant: "danger", color: "#ef4444", rank: 0 },
  AMBER: { label: "Watch", variant: "warning", color: "#f59e0b", rank: 1 },
  GREEN: { label: "Stable", variant: "success", color: "#10b981", rank: 2 },
};

export const ALERT_STATUS_META: Record<AlertStatus, { label: string; variant: BadgeVariant }> = {
  OPEN: { label: "Open", variant: "danger" },
  ESCALATED: { label: "Escalated", variant: "high" },
  ACKNOWLEDGED: { label: "Acknowledged", variant: "info" },
  RESOLVED: { label: "Resolved", variant: "success" },
  DISMISSED: { label: "Dismissed", variant: "default" },
};

export const isUrgent = (level: RiskLevel | null | undefined) => level === "CRITICAL" || level === "HIGH";

/** Accepts free-form API strings (e.g. assessment `riskLevel: string | null`). */
export function toRiskLevel(value: string | null | undefined): RiskLevel | null {
  const upper = value?.toUpperCase();
  return upper && upper in RISK_META ? (upper as RiskLevel) : null;
}
