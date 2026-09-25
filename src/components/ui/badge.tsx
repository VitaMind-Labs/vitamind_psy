import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "success" | "warning" | "high" | "danger" | "info" | "brand" | "default";

interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  high: "badge-high",
  danger: "badge-danger",
  info: "badge-info",
  brand: "bg-teal-50 text-teal-800 ring-1 ring-inset ring-teal-200",
  default: "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
};

const dotStyles: Record<BadgeVariant, string> = {
  success: "bg-emerald-500",
  warning: "bg-amber-500",
  high: "bg-orange-500",
  danger: "bg-red-500",
  info: "bg-sky-500",
  brand: "bg-teal-600",
  default: "bg-slate-400",
};

export function Badge({ children, variant = "default", className, dot = false }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium", variantStyles[variant], className)}>
      {dot && <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", dotStyles[variant])} />}
      {children}
    </span>
  );
}
