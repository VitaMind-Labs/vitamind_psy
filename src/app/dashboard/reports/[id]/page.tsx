"use client";

import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, User, Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { getReportById, getPatientById } from "@/lib/mock-data";

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const report = getReportById(params.id as string);
  const patient = report ? getPatientById(report.patientId) : undefined;

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg" style={{ color: "var(--foreground-muted)" }}>Rapport introuvable</p>
        <Button onClick={() => router.push("/dashboard/reports")}>Retour aux rapports</Button>
      </div>
    );
  }

  return (
    <div>
      <button onClick={() => router.push("/dashboard/reports")}
        className="flex items-center gap-2 text-sm mb-4 cursor-pointer" style={{ color: "var(--foreground-muted)" }}>
        <ArrowLeft size={16} /> Retour aux rapports
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="dashboard-card p-5 md:p-6 mb-6">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl font-bold" style={{ color: "var(--foreground)" }}>{report.title}</h2>
              <Badge variant={report.status === "pending" ? "warning" : report.status === "approved" ? "success" : "danger"} dot>
                {report.status === "pending" ? "En attente" : report.status === "approved" ? "Approuvé" : "Rejeté"}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
              <span className="flex items-center gap-1.5"><User size={14} /> {report.patientName}</span>
              <span className="flex items-center gap-1.5"><Calendar size={14} /> {new Date(report.submittedAt).toLocaleDateString("fr-FR")}</span>
              <span className="flex items-center gap-1.5"><Clock size={14} /> Rapport #{report.id}</span>
            </div>
          </div>
          {patient && (
            <Button variant="secondary" size="sm" onClick={() => router.push(`/dashboard/patients/${patient.id}`)}>
              Voir le patient
            </Button>
          )}
        </div>

        <Separator className="mb-4" />

        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>Résumé</h3>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{report.summary}</p>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--foreground)" }}>Détails</h3>
          <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: "var(--foreground-muted)" }}>{report.details}</p>
        </div>

        {report.doctorRevision && (
          <div className="mb-4 p-4 rounded-[var(--radius-sm)]" style={{ background: "rgba(81,133,145,0.06)", border: "1px solid rgba(81,133,145,0.15)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--primary)" }}>Révision du médecin</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{report.doctorRevision}</p>
          </div>
        )}

        {report.doctorNotes && (
          <div className="mb-4 p-4 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)" }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: "var(--accent)" }}>Note du médecin</h3>
            <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{report.doctorNotes}</p>
          </div>
        )}

        {report.reviewedBy && (
          <div className="flex items-center gap-2 text-xs pt-3" style={{ color: "var(--foreground-soft)" }}>
            {report.status === "approved" ? <CheckCircle size={14} style={{ color: "var(--success)" }} /> : <XCircle size={14} style={{ color: "var(--danger)" }} />}
            <span>Révisé par {report.reviewedBy} le {report.reviewedAt && new Date(report.reviewedAt).toLocaleDateString("fr-FR")}</span>
          </div>
        )}
      </motion.div>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push("/dashboard/reports")}>
          <ArrowLeft size={16} /> Tous les rapports
        </Button>
        {patient && (
          <Button onClick={() => router.push(`/dashboard/patients/${patient.id}`)}>
            Voir le dossier patient
          </Button>
        )}
      </div>
    </div>
  );
}
