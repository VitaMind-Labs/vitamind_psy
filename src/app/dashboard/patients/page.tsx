"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, AlertTriangle, UserCheck, Activity } from "lucide-react";
import { PatientsTable } from "@/components/dashboard/PatientsTable";
import { StatCard } from "@/components/dashboard/StatCard";
import { mockPatients } from "@/lib/mock-data";

export default function PatientsPage() {
  const stats = useMemo(() => {
    const total = mockPatients.length;
    const red = mockPatients.filter((p) => p.riskLevel === "red").length;
    const orange = mockPatients.filter((p) => p.riskLevel === "orange").length;
    const today = mockPatients.filter(
      (p) => p.nextAppointment === new Date().toISOString().slice(0, 10)
    ).length;
    return { total, red, orange, today };
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Patients
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          {mockPatients.length} patients sous votre suivi
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Total patients" value={stats.total} icon={<Users size={16} style={{ color: "var(--primary)" }} />} delay={0.05} />
        <StatCard label="Cas critiques" value={stats.red} icon={<AlertTriangle size={16} style={{ color: "var(--danger)" }} />} trend="Intervention rapide" delay={0.1} />
        <StatCard label="Sous surveillance" value={stats.orange} icon={<UserCheck size={16} style={{ color: "var(--accent)" }} />} delay={0.15} />
        <StatCard label="RDV aujourd'hui" value={stats.today} icon={<Activity size={16} style={{ color: "var(--chart-3)" }} />} delay={0.2} />
      </div>

      <div className="dashboard-card">
        <div className="p-5">
          <PatientsTable patients={mockPatients} />
        </div>
      </div>
    </div>
  );
}
