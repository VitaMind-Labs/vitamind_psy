"use client";

import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { WorkloadChartPoint } from "@/types/dashboard";

interface WorkloadChartProps {
  data: WorkloadChartPoint[];
}

export function WorkloadChart({ data }: WorkloadChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="dashboard-card p-5"
    >
      <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--foreground)" }}>
        Charge de travail hebdomadaire
      </h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
            />
            <Legend />
            <Bar dataKey="consultations" name="Consultations" fill="var(--primary)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="alerts" name="Alertes" fill="var(--danger)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
