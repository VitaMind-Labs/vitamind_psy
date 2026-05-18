"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, CheckCircle, XCircle, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Report } from "@/types/patient";

interface ReportCardProps {
  report: Report;
  onAction: (id: string, action: "approved" | "rejected", notes?: string, revision?: string) => void;
}

export function ReportCard({ report, onAction }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [doctorNotes, setDoctorNotes] = useState(report.doctorNotes ?? "");
  const [doctorRevision, setDoctorRevision] = useState(report.doctorRevision ?? "");
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="dashboard-card overflow-hidden"
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{report.title}</h3>
              <Badge variant={report.status === "pending" ? "warning" : report.status === "approved" ? "success" : "danger"} dot>
                {report.status === "pending" ? "En attente" : report.status === "approved" ? "Approuvé" : "Rejeté"}
              </Badge>
            </div>
            <p className="text-xs" style={{ color: "var(--foreground-muted)" }}>
              {report.patientName} · {new Date(report.submittedAt).toLocaleDateString("fr-FR")} · par {report.submittedBy}
            </p>
          </div>
          <div className="flex gap-1 shrink-0">
            {report.status === "pending" ? (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Eye size={15} />
                    Réviser
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{report.title}</DialogTitle>
                  </DialogHeader>
                  <div className="max-h-[60vh] overflow-y-auto flex flex-col gap-4">
                    <div>
                      <Label>Résumé</Label>
                      <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>{report.summary}</p>
                    </div>
                    <div>
                      <Label>Détails du rapport</Label>
                      <p className="text-sm mt-1" style={{ color: "var(--foreground-muted)" }}>{report.details}</p>
                    </div>
                    <Separator />
                    <div>
                      <Label>Révision du rapport (optionnel)</Label>
                      <textarea
                        value={doctorRevision}
                        onChange={(e) => setDoctorRevision(e.target.value)}
                        rows={4}
                        className="input-ui w-full p-3 rounded-[var(--radius-sm)] text-sm resize-none mt-1"
                        placeholder="Modifier ou compléter le rapport..."
                      />
                    </div>
                    <div>
                      <Label>Note du médecin</Label>
                      <textarea
                        value={doctorNotes}
                        onChange={(e) => setDoctorNotes(e.target.value)}
                        rows={3}
                        className="input-ui w-full p-3 rounded-[var(--radius-sm)] text-sm resize-none mt-1"
                        placeholder="Ajouter vos observations et décisions..."
                      />
                    </div>
                    <div className="flex gap-2 justify-end pt-2">
                      <Button variant="danger" onClick={() => { onAction(report.id, "rejected", doctorNotes, doctorRevision); setDialogOpen(false); }}>
                        <XCircle size={16} />
                        Rejeter
                      </Button>
                      <Button onClick={() => { onAction(report.id, "approved", doctorNotes, doctorRevision); setDialogOpen(false); }}>
                        <CheckCircle size={16} />
                        Approuver
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)}>
                <ExternalLink size={15} />
              </Button>
            )}
          </div>
        </div>

        <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{report.summary}</p>

        {report.doctorNotes && (
          <div className="mt-3 p-3 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)" }}>
            <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>Note du médecin</p>
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{report.doctorNotes}</p>
          </div>
        )}

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <Separator className="my-3" />
              <p className="text-sm whitespace-pre-line" style={{ color: "var(--foreground-muted)" }}>{report.details}</p>
              {report.reviewedBy && (
                <p className="text-xs mt-2" style={{ color: "var(--foreground-soft)" }}>
                  Révisé par {report.reviewedBy} le {report.reviewedAt && new Date(report.reviewedAt).toLocaleDateString("fr-FR")}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
