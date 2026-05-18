import type { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradientBorder?: boolean;
}

export function Card({ children, className = "", hover = false, gradientBorder = false }: CardProps) {
  const Tag = gradientBorder ? "div" : "div";
  const cls = gradientBorder
    ? `gradient-border ${className}`
    : `dashboard-card ${hover ? "hover:translate-y-[-4px]" : ""} ${className}`;

  return <Tag className={cls}>{children}</Tag>;
}

export function CardHeader({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 pb-0 ${className}`}>{children}</div>;
}

export function CardContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}
