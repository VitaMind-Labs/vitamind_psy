import type { RiskLevel } from "@/types/dashboard";
import { Badge } from "@/components/ui/badge";

interface RiskBadgeProps {
  level: RiskLevel;
}

export function RiskBadge({ level }: RiskBadgeProps) {
  const map: Record<RiskLevel, { label: string; variant: "success" | "warning" | "danger" }> = {
    green: { label: "Stable", variant: "success" },
    orange: { label: "Surveillance", variant: "warning" },
    red: { label: "Critique", variant: "danger" },
  };
  const c = map[level];
  return <Badge variant={c.variant} dot>{c.label}</Badge>;
}
