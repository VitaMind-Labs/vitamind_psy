import type { RiskLevel, TrafficLight } from "@/lib/api/psychologist";
import { Badge } from "@/components/ui/badge";
import { RISK_META, TRAFFIC_META } from "@/features/risks/lib/risk";

export function RiskBadge({ level, className }: { level: RiskLevel; className?: string }) {
  const meta = RISK_META[level];
  return (
    <Badge variant={meta.variant} dot className={className}>
      {meta.label}
      <span className="sr-only"> risk</span>
    </Badge>
  );
}

export function TrafficLightBadge({ light, className }: { light: TrafficLight; className?: string }) {
  const meta = TRAFFIC_META[light];
  return (
    <Badge variant={meta.variant} dot className={className}>
      {meta.label}
    </Badge>
  );
}
