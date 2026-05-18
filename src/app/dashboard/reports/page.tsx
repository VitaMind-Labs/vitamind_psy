"use client";

import { Suspense, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { FileText, ArrowRight } from "lucide-react";
import { ReportCard } from "@/components/dashboard/ReportCard";
import { CreateReportDialog } from "@/components/dashboard/CreateReportDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { mockReports } from "@/lib/mock-data";
import type { Report } from "@/types/patient";

function ReportsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPatient = searchParams.get("patientId");

  const [reports, setReports] = useState<Report[]>(mockReports);

  const handleCreateReport = (data: { patientId: string; patientName: string; title: string; summary: string; details: string }) => {
    const newReport: Report = {
      id: `R-${String(reports.length + 1).padStart(3, "0")}`,
      patientId: data.patientId,
      patientName: data.patientName,
      title: data.title,
      summary: data.summary,
      details: data.details,
      status: "pending",
      submittedBy: "Dr. Sarah Belkacem",
      submittedAt: new Date().toISOString(),
      reviewedAt: null,
      reviewedBy: null,
      doctorNotes: null,
      doctorRevision: null,
    };
    setReports((prev) => [newReport, ...prev]);
  };

  const handleAction = (id: string, status: "approved" | "rejected", notes?: string, revision?: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, status, reviewedAt: new Date().toISOString(), reviewedBy: "Dr. Sarah Belkacem", doctorNotes: notes || r.doctorNotes, doctorRevision: revision || r.doctorRevision } : r
      )
    );
  };

  const pending = reports.filter((r) => r.status === "pending");
  const approved = reports.filter((r) => r.status === "approved");
  const rejected = reports.filter((r) => r.status === "rejected");

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="text-lg font-bold tracking-tight" style={{ color: "var(--foreground)" }}>Rapports cliniques</h2>
          <p className="text-sm mt-0.5" style={{ color: "var(--foreground-muted)" }}>
            {pending.length} en attente · {approved.length} approuvés · {rejected.length} rejetés
          </p>
        </motion.div>
        <CreateReportDialog onSave={handleCreateReport} />
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">En attente ({pending.length})</TabsTrigger>
          <TabsTrigger value="approved">Approuvés ({approved.length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés ({rejected.length})</TabsTrigger>
        </TabsList>

        {(["pending", "approved", "rejected"] as const).map((key) => {
          const items = key === "pending" ? pending : key === "approved" ? approved : rejected;
          return (
            <TabsContent key={key} value={key}>
              {items.length === 0 ? (
                <div className="text-center py-12">
                  <FileText size={40} className="mx-auto mb-3" style={{ color: "var(--foreground-soft)" }} />
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>
                    Aucun rapport {key === "pending" ? "en attente" : key === "approved" ? "approuvé" : "rejeté"}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {items.map((r) => (
                    <div key={r.id} className="relative">
                      <ReportCard report={r} onAction={handleAction} />
                      <Button variant="ghost" size="sm" onClick={() => router.push(`/dashboard/reports/${r.id}`)}
                        className="absolute top-3 right-3">
                        Voir <ArrowRight size={14} />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <Suspense fallback={<div className="py-8 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>Chargement...</div>}>
      <ReportsContent />
    </Suspense>
  );
}
