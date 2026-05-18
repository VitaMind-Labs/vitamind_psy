import type { OverviewData, PsychiatristProfile, Notification } from "@/types/dashboard";
import type { Patient, PatientDetail, Report } from "@/types/patient";

export const mockOverview: OverviewData = {
  stats: {
    totalPatients: 128,
    todayConsultations: 8,
    workloadPercentage: 72,
    alertRatePercentage: 14,
  },
  workloadChart: [
    { day: "Lun", consultations: 6, alerts: 1 },
    { day: "Mar", consultations: 8, alerts: 2 },
    { day: "Mer", consultations: 5, alerts: 0 },
    { day: "Jeu", consultations: 7, alerts: 1 },
    { day: "Ven", consultations: 9, alerts: 3 },
    { day: "Sam", consultations: 4, alerts: 0 },
    { day: "Dim", consultations: 2, alerts: 0 },
  ],
};

export const mockPatients: Patient[] = [
  { id: "P-001", name: "Léa Moreau", age: 29, gender: "F", email: "lea.moreau@email.com", phone: "+33 6 12 34 56 01", riskLevel: "red", lastConsultation: "2026-05-17", nextAppointment: "2026-05-20", diagnosis: ["Trouble anxieux généralisé", "Insomnie"], updatedAt: "2026-05-17T10:30:00Z" },
  { id: "P-002", name: "Thomas Petit", age: 42, gender: "M", email: "thomas.petit@email.com", phone: "+33 6 12 34 56 02", riskLevel: "orange", lastConsultation: "2026-05-16", nextAppointment: "2026-05-22", diagnosis: ["Dépression majeure"], updatedAt: "2026-05-16T14:00:00Z" },
  { id: "P-003", name: "Camille Dubois", age: 35, gender: "F", email: "camille.dubois@email.com", phone: "+33 6 12 34 56 03", riskLevel: "green", lastConsultation: "2026-05-15", nextAppointment: "2026-06-01", diagnosis: ["Burnout"], updatedAt: "2026-05-15T09:00:00Z" },
  { id: "P-004", name: "Antoine Bernard", age: 51, gender: "M", email: "antoine.bernard@email.com", phone: "+33 6 12 34 56 04", riskLevel: "red", lastConsultation: "2026-05-17", nextAppointment: "2026-05-19", diagnosis: ["Trouble bipolaire", "Anxiété sociale"], updatedAt: "2026-05-17T08:00:00Z" },
  { id: "P-005", name: "Sophie Laurent", age: 27, gender: "F", email: "sophie.laurent@email.com", phone: "+33 6 12 34 56 05", riskLevel: "orange", lastConsultation: "2026-05-16", nextAppointment: "2026-05-25", diagnosis: ["TCA", "Dépression"], updatedAt: "2026-05-16T11:00:00Z" },
  { id: "P-006", name: "Marc Leroy", age: 38, gender: "M", email: "marc.leroy@email.com", phone: "+33 6 12 34 56 06", riskLevel: "green", lastConsultation: "2026-05-14", nextAppointment: "2026-06-05", diagnosis: ["Stress professionnel"], updatedAt: "2026-05-14T16:00:00Z" },
  { id: "P-007", name: "Julie Martin", age: 33, gender: "F", email: "julie.martin@email.com", phone: "+33 6 12 34 56 07", riskLevel: "orange", lastConsultation: "2026-05-15", nextAppointment: "2026-05-26", diagnosis: ["Trouble panique", "Agoraphobie"], updatedAt: "2026-05-15T13:00:00Z" },
  { id: "P-008", name: "Nicolas Garcia", age: 45, gender: "M", email: "nicolas.garcia@email.com", phone: "+33 6 12 34 56 08", riskLevel: "red", lastConsultation: "2026-05-17", nextAppointment: "2026-05-18", diagnosis: ["Trouble de la personnalité borderline"], updatedAt: "2026-05-17T07:30:00Z" },
  { id: "P-009", name: "Emma Rousseau", age: 31, gender: "F", email: "emma.rousseau@email.com", phone: "+33 6 12 34 56 09", riskLevel: "orange", lastConsultation: "2026-05-13", nextAppointment: "2026-05-28", diagnosis: ["Trouble obsessionnel compulsif"], updatedAt: "2026-05-13T10:00:00Z" },
  { id: "P-010", name: "Lucas Fontaine", age: 24, gender: "M", email: "lucas.fontaine@email.com", phone: "+33 6 12 34 56 10", riskLevel: "green", lastConsultation: "2026-05-12", nextAppointment: "2026-06-10", diagnosis: ["Anxiété sociale légère"], updatedAt: "2026-05-12T15:00:00Z" },
];

export const mockProfile: PsychiatristProfile = {
  id: "PSY-001",
  name: "Dr. Sarah Belkacem",
  email: "sarah.belkacem@vitamind.com",
  bio: "Psychiatre clinicienne spécialisée dans les troubles anxieux et les thérapies cognitives et comportementales (TCC). Pratique fondée sur les données probantes.",
  speciality: "Psychiatrie générale & TCC",
  licenseNumber: "RPPS-123456789",
  subscriptionStatus: "active",
  subscriptionEndsAt: "2027-01-15",
  availability: [
    { day: "Lundi", start: "09:00", end: "17:00" },
    { day: "Mardi", start: "09:00", end: "17:00" },
    { day: "Mercredi", start: "10:00", end: "18:00" },
    { day: "Jeudi", start: "09:00", end: "17:00" },
    { day: "Vendredi", start: "09:00", end: "16:00" },
  ],
};

export const mockNotifications: Notification[] = [
  { id: "N-001", type: "critical", title: "Alerte patient critique", message: "Léa Moreau présente des signes de crise sévère. Intervention recommandée immédiatement.", patientId: "P-001", read: false, createdAt: "2026-05-17T08:30:00Z" },
  { id: "N-002", type: "critical", title: "Alerte patient critique", message: "Antoine Bernard montre une détérioration rapide de son état. Score de risque à 92%.", patientId: "P-004", read: false, createdAt: "2026-05-17T06:15:00Z" },
  { id: "N-003", type: "assignment", title: "Nouveau patient attribué", message: "Emma Rousseau vous a été attribuée par l'administration. Dossier disponible.", patientId: "P-009", read: false, createdAt: "2026-05-16T14:00:00Z" },
  { id: "N-004", type: "info", title: "Rappel de rendez-vous", message: "Vous avez 3 consultations prévues demain : Léa Moreau, Thomas Petit, Sophie Laurent.", patientId: undefined, appointmentId: "APT-001", read: true, createdAt: "2026-05-16T09:00:00Z" },
  { id: "N-005", type: "info", title: "Mise à jour disponible", message: "Une nouvelle version de la plateforme (v2.4.1) est disponible. Nouveaux outils d'analyse.", read: true, createdAt: "2026-05-15T11:00:00Z" },
  { id: "N-006", type: "critical", title: "Alerte patient critique", message: "Nicolas Garcia signale une crise imminente. Contacter les urgences si nécessaire.", patientId: "P-008", read: false, createdAt: "2026-05-17T09:45:00Z" },
  { id: "N-007", type: "assignment", title: "Rapport en attente", message: "Le rapport pour Thomas Petit est en attente de votre validation.", patientId: "P-002", read: true, createdAt: "2026-05-16T16:00:00Z" },
  { id: "N-008", type: "info", title: "Mission TCC complétée", message: "Sophie Laurent a complété sa mission d'exposition graduée. Consultez les résultats.", patientId: "P-005", read: true, createdAt: "2026-05-15T18:00:00Z" },
];

export const mockReports: Report[] = [
  { id: "R-001", patientId: "P-002", patientName: "Thomas Petit", title: "Rapport d'évaluation initiale", summary: "Évaluation complète du trouble dépressif majeur avec suivi des indicateurs cliniques.", details: "Le patient présente une humeur dépressive persistante depuis 8 semaines, anhédonie marquée, troubles du sommeil et de l'appétit. Les scores PHQ-9 indiquent une dépression sévère (score 22). Aucune idée suicidaire active déclarée. Réponse partielle à la sertraline 100 mg/j.", status: "pending", submittedBy: "Admin", submittedAt: "2026-05-16T10:00:00Z", reviewedAt: null, reviewedBy: null, doctorNotes: null, doctorRevision: null },
  { id: "R-002", patientId: "P-005", patientName: "Sophie Laurent", title: "Rapport de suivi mensuel", summary: "Suivi de l'évolution du trouble des conduites alimentaires avec comorbidité dépressive.", details: "L'IMC est stable à 19.2. Fréquence des crises boulimiques réduite de 60% (3/semaine à 1/semaine). Persistance d'une image corporelle négative. L'humeur s'améliore lentement sous traitement. Poursuite de la TCC recommandée.", status: "pending", submittedBy: "Admin", submittedAt: "2026-05-15T14:00:00Z", reviewedAt: null, reviewedBy: null, doctorNotes: null, doctorRevision: null },
  { id: "R-003", patientId: "P-001", patientName: "Léa Moreau", title: "Rapport de synthèse clinique", summary: "Synthèse des 3 mois de suivi pour trouble anxieux généralisé avec insomnie comorbide.", details: "Amélioration modérée de l'anxiété (GAD-7 de 18 à 12). L'insomnie persiste malgré l'hygiène du sommeil. La patiente a adhéré à 70% des séances TCC. Proposition : ajustement du traitement médicamenteux et introduction de la thérapie par exposition.", status: "approved", submittedBy: "Admin", submittedAt: "2026-05-14T09:00:00Z", reviewedAt: "2026-05-15T11:00:00Z", reviewedBy: "Dr. Sarah Belkacem", doctorNotes: "Rapport approuvé. Ajuster la prescription de zolpidem et programmer une séance supplémentaire cette semaine.", doctorRevision: null },
  { id: "R-004", patientId: "P-004", patientName: "Antoine Bernard", title: "Rapport d'urgence", summary: "Évaluation urgente suite à la dégradation rapide de l'état du patient bipolaire.", details: "Le patient est en phase maniaque modérée depuis 72h. Euphorie, logorrhée, réduction du besoin de sommeil (3h/nuit), comportements à risque (dépenses excessives). Score MRS à 28. Risque d'escalade nécessitant une intervention rapide.", status: "pending", submittedBy: "Admin", submittedAt: "2026-05-17T07:00:00Z", reviewedAt: null, reviewedBy: null, doctorNotes: null, doctorRevision: null },
];

export function getPatientById(id: string): PatientDetail | undefined {
  const patient = mockPatients.find((p) => p.id === id);
  if (!patient) return undefined;
  return {
    ...patient,
    clinicalData: {
      sleep: [
        { date: "2026-05-10", value: 6.5 },
        { date: "2026-05-11", value: 5.2 },
        { date: "2026-05-12", value: 7.1 },
        { date: "2026-05-13", value: 4.8 },
        { date: "2026-05-14", value: 6.0 },
        { date: "2026-05-15", value: 5.5 },
        { date: "2026-05-16", value: 6.8 },
      ],
      mood: [
        { date: "2026-05-10", value: 3 },
        { date: "2026-05-11", value: 2 },
        { date: "2026-05-12", value: 4 },
        { date: "2026-05-13", value: 2 },
        { date: "2026-05-14", value: 3 },
        { date: "2026-05-15", value: 5 },
        { date: "2026-05-16", value: 4 },
      ],
      activity: [
        { date: "2026-05-10", value: 40 },
        { date: "2026-05-11", value: 25 },
        { date: "2026-05-12", value: 55 },
        { date: "2026-05-13", value: 20 },
        { date: "2026-05-14", value: 35 },
        { date: "2026-05-15", value: 60 },
        { date: "2026-05-16", value: 45 },
      ],
    },
    tccMissions: [
      { id: "TCC-001", title: "Journal des pensées automatiques", description: "Noter 3 pensées automatiques négatives par jour et les analyser avec la grille cognitive.", assignedAt: "2026-05-01", completedAt: null, status: "in_progress" },
      { id: "TCC-002", title: "Exposition graduée", description: "S'exposer à une situation anxiogène par jour, en commençant par la hiérarchie la moins difficile.", assignedAt: "2026-05-01", completedAt: "2026-05-10", status: "completed" },
      { id: "TCC-003", title: "Relaxation musculaire progressive", description: "Pratiquer la relaxation progressive de Jacobson 2x par jour pendant 15 minutes.", assignedAt: "2026-05-08", completedAt: null, status: "pending" },
    ],
    aiReports: [
      {
        id: "AI-001",
        summary: "Le patient montre une corrélation négative entre qualité de sommeil et niveau d'anxiété rapporté. Les scores d'humeur fluctuent avec une tendance à la baisse sur les 7 derniers jours.",
        recommendations: [
          "Envisager une augmentation progressive des exercices d'exposition",
          "Surveiller l'observance du traitement médicamenteux",
          "Proposer une séance supplémentaire cette semaine",
        ],
        generatedAt: "2026-05-16T06:00:00Z",
        editedByDoctor: true,
        doctorNotes: "Le patient semble répondre partiellement au traitement. Maintenir la dose actuelle et renforcer le suivi.",
      },
    ],
    notes: [
      { id: "NOTE-001", patientId: "P-001", title: "Anxiété matinale", content: "Patient rapportant une amélioration de l'anxiété matinale. À revoir la semaine prochaine.", createdAt: "2026-05-15T14:30:00Z", createdBy: "Dr. Sarah Belkacem" },
      { id: "NOTE-002", patientId: "P-001", title: "Ajustement thérapeutique", content: "Discuté des options thérapeutiques. Patient ouvert à l'ajustement du traitement.", createdAt: "2026-05-10T11:00:00Z", createdBy: "Dr. Sarah Belkacem" },
    ],
  };
}

export function getReportById(id: string): Report | undefined {
  return mockReports.find((r) => r.id === id);
}

export function searchPatients(query: string): Patient[] {
  const q = query.toLowerCase();
  return mockPatients.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q) ||
      p.diagnosis.some((d) => d.toLowerCase().includes(q))
  );
}
