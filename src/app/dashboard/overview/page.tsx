"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, TrendingUp, AlertTriangle, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { StatCard } from "@/components/dashboard/StatCard";
import { WorkloadChart } from "@/components/dashboard/WorkloadChart";
import { RiskPieChart } from "@/components/dashboard/RiskPieChart";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockOverview, mockPatients, mockNotifications } from "@/lib/mock-data";

export function OverviewPage() {
  const router = useRouter();
  const { stats, workloadChart } = mockOverview;

  const riskDistribution = useMemo(() => {
    const red = mockPatients.filter((p) => p.riskLevel === "red").length;
    const orange = mockPatients.filter((p) => p.riskLevel === "orange").length;
    const green = mockPatients.filter((p) => p.riskLevel === "green").length;
    return [
      { name: "Stable", value: green },
      { name: "Surveillance", value: orange },
      { name: "Critique", value: red },
    ];
  }, []);

  const recentPatients = [...mockPatients]
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 3);

  const criticalNotifs = mockNotifications
    .filter((n) => n.type === "critical" && !n.read)
    .slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h2 className="text-2xl md:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
          Bienvenue sur votre tableau de bord
        </h2>
        <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>
          Résumé de votre activité et alertes importantes
        </p>
      </motion.div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Patients actifs" value={stats.totalPatients} icon={<Users size={16} style={{ color: "var(--primary)" }} />} trend="+5% ce mois" delay={0.05} />
        <StatCard label="Consultations aujourd'hui" value={stats.todayConsultations} icon={<Calendar size={16} style={{ color: "var(--accent)" }} />} trend="3 en attente" delay={0.1} />
        <StatCard label="Charge de travail" value={`${stats.workloadPercentage}%`} icon={<TrendingUp size={16} style={{ color: "var(--chart-3)" }} />} delay={0.15} />
        <StatCard label="Taux d'alertes" value={`${stats.alertRatePercentage}%`} icon={<AlertTriangle size={16} style={{ color: "var(--danger)" }} />} trend="2 urgences" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="lg:col-span-1">
          <WorkloadChart data={workloadChart} />
        </div>
        <RiskPieChart data={riskDistribution} delay={0.25} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="dashboard-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Derniers patients
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/patients")}>
              Voir tout <ArrowRight size={14} />
            </Button>
          </div>
          <div className="flex flex-col gap-2">
            {recentPatients.map((p) => (
              <button
                key={p.id}
                onClick={() => router.push(`/dashboard/patients/${p.id}`)}
                className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] text-left w-full transition-colors cursor-pointer hover:bg-[var(--surface-secondary)]"
              >
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{p.name}</p>
                  <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>{p.diagnosis[0]}</p>
                </div>
                <Badge variant={p.riskLevel === "red" ? "danger" : p.riskLevel === "orange" ? "warning" : "success"} dot />
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="dashboard-card p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
              Alertes critiques
            </h3>
            <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/notifications")}>
              Voir tout <ArrowRight size={14} />
            </Button>
          </div>
          {criticalNotifs.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Aucune alerte critique</p>
          ) : (
            <div className="flex flex-col gap-2">
              {criticalNotifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => router.push(n.patientId ? `/dashboard/patients/${n.patientId}` : "/dashboard/notifications")}
                  className="p-2.5 rounded-[var(--radius-sm)] text-left w-full transition-colors cursor-pointer hover:bg-[var(--surface-secondary)]"
                >
                  <p className="text-sm font-medium" style={{ color: "var(--danger)" }}>{n.title}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{n.message.slice(0, 60)}...</p>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default OverviewPage;
