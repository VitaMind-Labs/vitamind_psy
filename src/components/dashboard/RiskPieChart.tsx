"use client";

import { motion } from "framer-motion";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface RiskPieChartProps {
  data: { name: string; value: number }[];
  delay?: number;
}

const COLORS = ["var(--success)", "var(--warning)", "var(--danger)"];

export function RiskPieChart({ data, delay = 0 }: RiskPieChartProps) {
  const total = data.reduce((a, b) => a + b.value, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5 }}
      className="dashboard-card p-5"
    >
      <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
        Répartition par niveau de risque
      </h3>
      <div className="h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={4}
              dataKey="value"
              stroke="none"
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={`var(--chart-${index + 1})`} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "var(--radius-sm)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-md)",
              }}
              formatter={(value: number) => [`${value} patients`, ""]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span style={{ color: "var(--foreground-muted)", fontSize: 12 }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs mt-2" style={{ color: "var(--foreground-soft)" }}>
        <span>{total} patients suivis</span>
      </div>
    </motion.div>
  );
}
