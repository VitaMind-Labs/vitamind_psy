"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, ClipboardList, Brain, FileText } from "lucide-react";
import { RiskBadge } from "@/components/dashboard/RiskBadge";
import { ActivityChart } from "@/components/dashboard/ActivityChart";
import { NoteDialog } from "@/components/dashboard/NoteDialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { getPatientById } from "@/lib/mock-data";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patient = getPatientById(params.id as string);
  const [notes, setNotes] = useState(patient?.notes ?? []);

  if (!patient) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-lg" style={{ color: "var(--foreground-muted)" }}>Patient introuvable</p>
        <Button onClick={() => router.push("/dashboard/patients")}>Retour à la liste</Button>
      </div>
    );
  }

  const handleAddNote = ({ title, content }: { title: string; content: string }) => {
    const newNote = {
      id: `NOTE-${Date.now()}`,
      patientId: patient.id,
      title,
      content,
      createdAt: new Date().toISOString(),
      createdBy: "Dr. Sarah Belkacem",
    };
    setNotes((prev) => [newNote, ...prev]);
  };

  return (
    <div>
      <button onClick={() => router.push("/dashboard/patients")}
        className="flex items-center gap-2 text-sm mb-4 cursor-pointer" style={{ color: "var(--foreground-muted)" }}>
        <ArrowLeft size={16} /> Retour aux patients
      </button>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="dashboard-card p-5 md:p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <h2 className="text-xl md:text-2xl" style={{ color: "var(--foreground)" }}>{patient.name}</h2>
              <RiskBadge level={patient.riskLevel} />
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm" style={{ color: "var(--foreground-muted)" }}>
              <span>{patient.age} ans · {patient.gender === "M" ? "Homme" : "Femme"}</span>
              <span>Dernière consultation: {patient.lastConsultation}</span>
              {patient.nextAppointment && <span>Prochain RDV: {patient.nextAppointment}</span>}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {patient.diagnosis.map((d) => (<Badge key={d} variant="info">{d}</Badge>))}
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Navigation uniquement */}
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(e) => {
                e.stopPropagation();
                router.push(`/dashboard/reports?patientId=${patient.id}`);
              }}
            >
              <FileText size={15} />
              Rapport
            </Button>

            {/* Dialog uniquement */}
            <div
              onClick={(e) => {
                e.stopPropagation();
              }}
className="bg-black rounded-md p-1 text-white hover:bg-gray-800 transition-colors"
            >
              <NoteDialog
                
                patientId={patient.id}
                onSave={handleAddNote}
              />
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <ActivityChart data={patient.clinicalData.sleep} color="var(--chart-1)" label="Sommeil (heures)" unit="h" delay={0.1} />
        <ActivityChart data={patient.clinicalData.mood} color="var(--chart-2)" label="Humeur (/5)" delay={0.15} />
        <ActivityChart data={patient.clinicalData.activity} color="var(--chart-3)" label="Activité (%)" unit="%" delay={0.2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} style={{ color: "var(--primary)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Missions TCC</h3>
            </div>
            <div className="flex flex-col gap-3">
              {patient.tccMissions.map((mission) => (
                <div key={mission.id} className="flex items-center justify-between p-3 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)" }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{mission.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground-muted)" }}>{mission.description.slice(0, 60)}...</p>
                  </div>
                  <Badge variant={mission.status === "completed" ? "success" : mission.status === "in_progress" ? "warning" : "default"} className="shrink-0 ml-2">
                    {mission.status === "completed" ? "Fait" : mission.status === "in_progress" ? "En cours" : "À faire"}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} style={{ color: "var(--accent)" }} />
              <h3 className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>Pré-rapport IA</h3>
            </div>
            {patient.aiReports.map((report) => (
              <div key={report.id}>
                <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>{report.summary}</p>
                {report.doctorNotes && (
                  <div className="mt-4 p-3 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)", border: "1px solid rgba(81,133,145,0.15)" }}>
                    <p className="text-xs font-semibold mb-1" style={{ color: "var(--primary)" }}>Notes du médecin</p>
                    <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{report.doctorNotes}</p>
                  </div>
                )}
                <Separator className="my-4" />
                <div>
                  <p className="text-xs font-semibold mb-2" style={{ color: "var(--primary)" }}>Recommandations</p>
                  <ul className="flex flex-col gap-1.5">
                    {report.recommendations.map((rec, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm" style={{ color: "var(--foreground-muted)" }}>
                        <FileText size={14} className="mt-0.5 shrink-0" style={{ color: "var(--primary)" }} />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: "var(--foreground)" }}>
            Notes cliniques ({notes.length})
          </h3>
          {notes.length === 0 ? (
            <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>Aucune note pour ce patient.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {notes.map((note) => (
                <div key={note.id} className="p-3 rounded-[var(--radius-sm)]" style={{ background: "var(--gradient-soft)" }}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>{note.title}</p>
                    <span className="text-xs" style={{ color: "var(--foreground-soft)" }}>
                      {new Date(note.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: "var(--foreground-muted)" }}>{note.content}</p>
                  <p className="text-xs mt-1" style={{ color: "var(--foreground-soft)" }}>{note.createdBy}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
