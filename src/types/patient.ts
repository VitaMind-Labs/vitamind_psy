import type { RiskLevel } from "./dashboard";

export interface Report {
  id: string;
  patientId: string;
  patientName: string;
  title: string;
  summary: string;
  details: string;
  status: "pending" | "approved" | "rejected";
  submittedBy: string;
  submittedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
  doctorNotes: string | null;
  doctorRevision: string | null;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: "M" | "F" | "other";
  email: string;
  phone: string;
  riskLevel: RiskLevel;
  lastConsultation: string;
  nextAppointment: string | null;
  diagnosis: string[];
  avatarUrl?: string;
  updatedAt: string;
}

export interface ClinicalData {
  sleep: ChartDataPoint[];
  mood: ChartDataPoint[];
  activity: ChartDataPoint[];
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface TccMission {
  id: string;
  title: string;
  description: string;
  assignedAt: string;
  completedAt: string | null;
  status: "pending" | "in_progress" | "completed";
}

export interface AiPreReport {
  id: string;
  summary: string;
  recommendations: string[];
  generatedAt: string;
  editedByDoctor: boolean;
  doctorNotes?: string;
}

export interface PatientNote {
  id: string;
  patientId: string;
  title: string;
  content: string;
  createdAt: string;
  createdBy: string;
}

export interface PatientDetail extends Patient {
  clinicalData: ClinicalData;
  tccMissions: TccMission[];
  aiReports: AiPreReport[];
  notes: PatientNote[];
}
