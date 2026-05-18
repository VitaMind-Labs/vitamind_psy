"use client";

import { motion } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { ChartDataPoint } from "@/types/patient";

interface ActivityChartProps {
  data: ChartDataPoint[];
  color: string;
  label: string;
  unit?: string;
  delay?: number;
}

export function ActivityChart({ data, color, label, unit = "", delay = 0 }: ActivityChartProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="dashboard-card p-5"
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>{label}</h3>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
              formatter={(value) => [`${value}${unit}`, label]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
