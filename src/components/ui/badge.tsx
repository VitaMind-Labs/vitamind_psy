import type { ReactNode } from "react";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "default";

interface BadgeProps {
  children?: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  success: "badge-success",
  warning: "badge-warning",
  danger: "badge-danger",
  info: "bg-[rgba(81,133,145,0.1)] text-[#518591]",
  default: "bg-[var(--surface-secondary)] text-[var(--foreground-muted)]",
};

export function Badge({ children, variant = "default", className = "", dot = false }: BadgeProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${variantStyles[variant]} ${className}`}>
      {dot && (
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{
            background:
              variant === "success" ? "var(--success)" :
              variant === "warning" ? "var(--warning)" :
              variant === "danger" ? "var(--danger)" :
              "var(--primary)",
          }}
        />
      )}
      {children}
    </span>
  );
}
