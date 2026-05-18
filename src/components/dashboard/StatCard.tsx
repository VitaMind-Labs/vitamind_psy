"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: string;
  delay?: number;
}

export function StatCard({ label, value, icon, trend, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="dashboard-card p-5"
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: "var(--foreground-muted)" }}>
          {label}
        </span>
        <div className="w-9 h-9 rounded-[var(--radius-sm)] flex items-center justify-center" style={{ background: "var(--gradient-soft)" }}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>{value}</p>
      {trend && (
        <p className="text-xs mt-1 font-medium" style={{ color: "var(--primary)" }}>
          {trend}
        </p>
      )}
    </motion.div>
  );
}
