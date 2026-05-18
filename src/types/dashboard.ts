export type RiskLevel = "green" | "orange" | "red";

export interface DashboardStats {
  totalPatients: number;
  todayConsultations: number;
  workloadPercentage: number;
  alertRatePercentage: number;
}

export interface WorkloadChartPoint {
  day: string;
  consultations: number;
  alerts: number;
}

export interface OverviewData {
  stats: DashboardStats;
  workloadChart: WorkloadChartPoint[];
}

export interface AvailabilitySlot {
  day: string;
  start: string;
  end: string;
}

export interface PsychiatristProfile {
  id: string;
  name: string;
  email: string;
  bio: string;
  speciality: string;
  licenseNumber: string;
  availability: AvailabilitySlot[];
  subscriptionStatus: "active" | "inactive" | "trial";
  subscriptionEndsAt: string | null;
}

export interface Notification {
  id: string;
  type: "critical" | "info" | "assignment";
  title: string;
  message: string;
  patientId?: string;
  appointmentId?: string;
  read: boolean;
  createdAt: string;
}
