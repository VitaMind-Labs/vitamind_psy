import { API_BASE } from '@/lib/api/config';
import {
    clearAuthCookies,
    parseSetCookieFromHeader,
    setAuthCookies,
} from '@/lib/api/api-client';
import { apiClient } from '@/lib/api/api-client';
import { ApiError } from '@/lib/api/errors';

export const PSYCHOLOGIST_API_PREFIX = '/v1';

export type ClinicianRole = 'PSYCHIATRIST' | 'PSYCHOLOGIST' | 'THERAPIST' | 'NURSE' | 'CARE_COORDINATOR';
export type PsychologistStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'DEACTIVATED';
export type PatientStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'BLOCKED';
export type TrafficLight = 'GREEN' | 'AMBER' | 'RED';
export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'ESCALATED' | 'DISMISSED';
export type AlertResolution = 'GROUNDING_COMPLETED' | 'CONTACT_MADE' | 'UNRESOLVED' | 'FALSE_ALERT';
export type AssessmentStatus = 'ACTIVE' | 'COMPLETED' | 'ABANDONED' | 'EXPIRED' | 'BLOCKED';
export type AssessmentReviewStatus = 'DRAFT' | 'REVIEWED' | 'FOLLOW_UP_REQUIRED';
export type TherapySessionStatus = 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW' | 'PROPOSED';
export type TherapySessionType = 'INITIAL' | 'FOLLOW_UP' | 'REVIEW' | 'EMERGENCY';

export interface PsychologistRegisterDto {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    licenseNumber: string;
    authority: 'DOH_ABU_DHABI' | 'DHA' | 'MOHAP' | 'OTHER';
    authorityName?: string;
    clinicalRole?: ClinicianRole;
    termsAccepted: boolean;
    safetyAlertsAccepted: boolean;
    monitoringNoticeAccepted: boolean;
}

export interface PsychologistRegistrationResponse {
    message: string;
    psychologistId: string;
    status: PsychologistStatus;
    licenseStatus: string;
}

export interface PsychologistLoginDto {
    email: string;
    password: string;
}

export interface PsychologistRefreshDto {
    refresh_token?: string;
}

export interface UpdatePsychologistDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
    specialties?: string[];
    avatarUrl?: string;
}

export interface PatientListQueryDto {
    page?: number;
    limit?: number;
    search?: string;
    status?: PatientStatus;
    sortBy?: 'lastActivityAt' | 'lastAssessmentAt' | 'nickname' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
}

export interface AssessmentListQueryDto {
    page?: number;
    limit?: number;
    status?: AssessmentStatus;
}

export interface PatientDateRangeQueryDto {
    from?: string;
    to?: string;
}

export interface JournalListQueryDto extends PatientDateRangeQueryDto {
    page?: number;
    limit?: number;
}

export interface SessionListQueryDto extends PatientDateRangeQueryDto {
    status?: TherapySessionStatus;
    page?: number;
    limit?: number;
}

export interface AssessmentReviewDto {
    summary: string;
    observations?: string[];
    followUp?: string;
    status?: AssessmentReviewStatus;
}

export interface CreateNoteDto {
    title?: string;
    content: string;
}

export interface UpdateNoteDto {
    title?: string;
    content?: string;
}

export interface CreateSessionDto {
    patientId: string;
    scheduledAt: string;
    durationMinutes?: number;
    type?: TherapySessionType;
    notes?: string;
}

export interface UpdateSessionDto {
    scheduledAt?: string;
    durationMinutes?: number;
    status?: TherapySessionStatus;
    notes?: string;
}

export interface CompleteSessionDto {
    summary: string;
    followUpRequired?: boolean;
    followUpDate?: string;
}

export interface PsychologistAuthUser {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: ClinicianRole;
    clinicalRole: ClinicianRole;
}

export interface PsychologistAuthResponse {
    access_token: string;
    refresh_token?: string;
    user: PsychologistAuthUser;
}

export interface TwoFactorEnrollment {
    secret: string;
    otpauth_url: string;
    qr_code: string;
}

export interface PsychologistConfirmResponse {
    is2FAEnabled: boolean;
    backup_codes: string[];
    access_token: string;
    user: PsychologistAuthUser;
}

/** Password login either opens a session or yields a short-lived 2FA token. */
export type PsychologistLoginResponse =
    | PsychologistAuthResponse
    | { requires_2fa: true; temp_token: string }
    | { requires_2fa_setup: true; setup_token: string };

export interface PsychologistProfile {
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    phone: string | null;
    specialties: string[];
    status: PsychologistStatus;
    role: ClinicianRole;
    clinicalRole: ClinicianRole;
    avatarUrl: string | null;
    clinic: { id: string; name: string; country: string; emergencyNumber: string | null } | null;
    license: { status: string; authority: string; authorityName: string | null; expiresAt: string | null } | null;
    termsAcceptedAt: string | null;
    termsVersion: string | null;
    isClinicAdmin: boolean;
    is2FAEnabled: boolean;
    createdAt: string;
}

export interface CaseloadQuery {
    sort?: 'risk' | 'drift';
    trafficLight?: TrafficLight;
    role?: ClinicianRole | 'ALL';
    search?: string;
    page?: number;
    limit?: number;
}

export interface CaseloadItem {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string | null;
    lastActivityAt: string | null;
    trafficLight: TrafficLight;
    previousTrafficLight: TrafficLight | null;
    riskLevel: RiskLevel;
    driftScore: number | null;
    driftLevel: RiskLevel | null;
    openAlertCount: number;
    trend: string;
    alerts: Array<{
        id: string;
        severity: RiskLevel;
        status: AlertStatus;
        type: string;
        title: string;
        triggeredAt: string;
    }>;
}

export interface ClinicalAlert {
    id: string;
    userId: string;
    type: string;
    severity: RiskLevel;
    status: AlertStatus;
    title: string;
    description: string | null;
    context: Record<string, unknown> | null;
    triggeredAt: string;
    acknowledgedAt: string | null;
    resolvedAt: string | null;
    resolution: AlertResolution | null;
    resolutionNote: string | null;
    escalationLevel: number;
    patientCode?: string;
    patientName?: string;
}

export interface AlertQuery {
    status?: AlertStatus;
    severity?: RiskLevel;
    page?: number;
    limit?: number;
}

export interface WeeklyReport {
    id: string;
    userId: string;
    user?: { id: string; patientNumber: number; nickname: string };
    weekStart: string;
    weekEnd: string;
    status: string;
    trafficLight: TrafficLight;
    previousTrafficLight: TrafficLight | null;
    headline: string | null;
    metrics: Record<string, unknown>;
    clinicianContent: Record<string, unknown>;
    patientContent: Record<string, unknown>;
    discussionPoints: string[];
    patientNote: string | null;
    clinicianNote: string | null;
    acknowledgedAt: string | null;
    releasedToPatientAt: string | null;
    reminderSentAt: string | null;
    escalatedAt: string | null;
}

export interface ConsentResponse {
    assignmentId: string;
    status: string;
    consentedAt: string | null;
    categories: {
        diagnostics: boolean;
        mood: boolean;
        sleep: boolean;
        medication: boolean;
        exercises: boolean;
        biometrics: boolean;
        journal: string;
    };
    safetyAlertsConsentAt: string | null;
    monitoringNoticeAckAt: string | null;
}

export interface ThresholdItem {
    id?: string;
    metric: 'DRIFT_SCORE' | 'SLEEP_HOURS_DROP' | 'CHECKIN_MISSED_DAYS' | 'MOOD_LOW' | 'ANXIETY_HIGH' | 'MEDICATION_MISSED_DOSES';
    value: number;
    windowDays: number;
    severity: RiskLevel;
    isActive: boolean;
}

export interface RelapseSignature {
    id: string;
    userId: string;
    label: string;
    description: string | null;
    metric: string | null;
    keywords: string[];
    source: 'PATIENT' | 'CLINICIAN' | 'MIRA';
    isActive: boolean;
    hits?: Array<{ id: string; detectedAt: string; evidence: Record<string, unknown> | null }>;
}

export interface Medication {
    id: string;
    userId: string;
    name: string;
    dosage: string | null;
    frequency: string | null;
    instructions: string | null;
    startDate: string;
    endDate: string | null;
    isActive: boolean;
}

export interface TimelineEvent {
    id: string;
    userId: string;
    type: string;
    title: string;
    details: Record<string, unknown> | null;
    occurredAt: string;
    medicationId: string | null;
    createdById: string | null;
}

export interface SecureMessage {
    id: string;
    senderRole: 'PATIENT' | 'CLINICIAN' | 'SYSTEM';
    content: string;
    isUrgent: boolean;
    readAt: string | null;
    createdAt: string;
}

export interface SecureMessagesResponse {
    emergencyNotice: { clinicName: string | null; emergencyNumber: string | null; message: string };
    data: SecureMessage[];
}

export interface CoverageShift {
    id: string;
    type: 'ON_CALL' | 'LEAVE_COVER';
    startsAt: string;
    endsAt: string;
    covering: { id: string; firstName: string; lastName: string };
    absent: { id: string; firstName: string; lastName: string } | null;
}

export interface ExerciseCatalogItem {
    id: string;
    title: string;
    type: string;
    durationMinutes: number | null;
}

export interface ExerciseAssignment {
    id: string;
    exerciseId: string;
    status: string;
    frequency: string | null;
    note: string | null;
    startsAt: string;
    endsAt: string | null;
    exercise: { id: string; title: string; type: string; durationMinutes: number | null };
    completions: Array<{ id: string; completedAt: string; durationSeconds: number | null; hrvBeforeMs: number | null; hrvAfterMs: number | null }>;
}

export interface FocusGoal {
    id: string;
    title: string;
    description: string | null;
    status: string;
    weekStart: string | null;
}

export interface ConfirmedDiagnosis {
    id: string;
    diagnosis: string | null;
    diagnosisLabel: string | null;
    status: string;
    isCurrent: boolean;
    notes: string | null;
    confirmedAt: string;
}

export interface LifeChartResponse {
    period: { from: string; to: string };
    checkins: Array<{ checkinDate: string; moodScore: number; sleepHours: number | null; anxietyLevel: number | null; energyLevel: number | null; medicationTaken: boolean | null }>;
    driftScores: Array<{ score: number; level: RiskLevel; components: Record<string, unknown> | null; computedAt: string }>;
    sessions: Array<{ id: string; scheduledAt: string; status: string; type: string }>;
    notShared: string[];
}

export interface DashboardResponse {
    stats: {
        totalPatients: number;
        activePatients: number;
        pendingAssessments: number;
        upcomingSessions: number;
    };
    recentPatients: Array<{
        id: string;
        firstName: string;
        lastName: string | null;
        lastActivityAt: string | null;
        status: PatientStatus;
    }>;
    pendingItems: Array<{
        type: 'ASSESSMENT_REVIEW';
        patientId: string;
        assessmentId: string;
        createdAt: string;
    }>;
    upcomingSessions: Array<{
        id: string;
        patientId: string;
        scheduledAt: string;
        status: TherapySessionStatus;
    }>;
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: { page: number; limit: number; total: number; totalPages: number };
}

export interface PatientListItem {
    id: string;
    patientCode: string;
    firstName: string;
    lastName: string | null;
    dateOfBirth: string | null;
    status: PatientStatus;
    lastActivityAt: string | null;
    lastAssessmentAt: string | null;
}

export interface PatientDetailResponse {
    patient: {
        id: string;
        patientCode: string;
        firstName: string;
        lastName: string | null;
        dateOfBirth: string | null;
        preferredLanguage: string;
        status: PatientStatus;
        createdAt: string;
    };
    careContext: {
        assignedAt: string;
        lastSessionAt: string | null;
        nextSessionAt: string | null;
    };
    recentActivity: Array<{
        type: 'ASSESSMENT_COMPLETED';
        assessmentId: string;
        createdAt: string | null;
        orientation: string | null;
        riskLevel: string | null;
    }>;
}

export interface ProgressResponse {
    period: { from: string; to: string };
    entries: Array<{
        date: string;
        mood: number | null;
        stress: number | null;
        energy: number | null;
        sleepHours: number | null;
        source: 'PATIENT_REPORTED';
    }>;
}

export interface JournalEntry {
    id: string;
    createdAt: string;
    content: string;
    mood: number | null;
    tags: string[];
}

export interface AssessmentListItem {
    id: string;
    type: 'MIRA_DIAGNOSTIC';
    status: AssessmentStatus;
    language: string;
    startedAt: string;
    completedAt: string | null;
    reviewStatus: AssessmentReviewStatus | 'PENDING';
}

export interface MiraObservedPattern {
    label?: string;
    value?: string | number | boolean | null;
    description?: string;
}

export interface AssessmentDetailResponse {
    id: string;
    type: 'MIRA_DIAGNOSTIC';
    status: AssessmentStatus;
    language: string;
    stage: string;
    startedAt: string;
    completedAt: string | null;
    orientation: string | null;
    riskLevel: string | null;
    confidence: number | null;
    patientResponses: Array<{
        messageId: string;
        sequence: number;
        question: string | null;
        answer: string;
        createdAt: string;
    }>;
    aiAnalysis: {
        agent: 'MIRA';
        label: string;
        summary: string | null;
        observedPatterns: MiraObservedPattern[];
    };
    professionalReview: ProfessionalReview | null;
}

export interface ProfessionalReview {
    id: string;
    summary: string;
    observations: string[];
    followUp: string | null;
    status: AssessmentReviewStatus;
    reviewedAt: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface PsychologistNote {
    id: string;
    title: string | null;
    content: string;
    createdAt: string;
    updatedAt?: string;
}

export interface SessionListItem {
    id: string;
    patientId: string;
    patientName: string;
    scheduledAt: string;
    durationMinutes: number;
    status: TherapySessionStatus;
    type: TherapySessionType;
}

export interface SessionDetailResponse {
    id: string;
    patient: { id: string; patientCode: string; name: string };
    scheduledAt: string;
    durationMinutes: number;
    type: TherapySessionType;
    status: TherapySessionStatus;
    notes: string | null;
    summary: string | null;
    followUpRequired: boolean;
    followUpDate: string | null;
    completedAt: string | null;
}

export interface PsychologistNotification {
    id: string;
    type: string;
    title: string;
    read: boolean;
    createdAt: string;
}

function queryString(filters: object = {}) {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') params.set(key, String(value));
    });
    const result = params.toString();
    return result ? `?${result}` : '';
}

async function psychologistAuthRequest<T>(endpoint: string, body?: unknown, bearer?: string): Promise<T> {
    const response = await fetch(`${API_BASE}${PSYCHOLOGIST_API_PREFIX}${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
        },
        credentials: 'include',
        body: body === undefined ? undefined : JSON.stringify(body),
        cache: 'no-store',
    });

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
        const message = Array.isArray(payload?.message) ? payload.message.join(', ') : payload?.message;
        throw new ApiError(message || `Psychologist authentication failed (${response.status})`, response.status);
    }

    const result = (
        payload && typeof payload === 'object' && 'data' in payload
            ? (payload as { data: T }).data
            : payload
    ) as T;
    const refreshToken = parseSetCookieFromHeader(response.headers.get('set-cookie')).psychologist_refresh_token ?? (result as PsychologistAuthResponse).refresh_token;
    if ((result as PsychologistAuthResponse).access_token) {
        await setAuthCookies((result as PsychologistAuthResponse).access_token, refreshToken);
    }
    return result;
}

export const psychologistApi = {
    register: (dto: PsychologistRegisterDto) => psychologistAuthRequest<PsychologistRegistrationResponse>('/auth/psychologist/register', dto),

    login: (dto: PsychologistLoginDto) =>
        psychologistAuthRequest<PsychologistLoginResponse>('/auth/psychologist/login', dto),

    /** Completes login with a TOTP code or recovery code; persists the session cookies. */
    login2fa: (dto: { temp_token: string; token: string }) =>
        psychologistAuthRequest<PsychologistAuthResponse>('/auth/psychologist/login/2fa', dto),

    /**
     * Starts 2FA enrolment (QR + secret). Pass the setup token during sign-in;
     * omit it in-session — the session cookie bearer is attached automatically.
     */
    enable2fa: (bearer?: string) =>
        bearer
            ? psychologistAuthRequest<TwoFactorEnrollment>('/auth/psychologist/2fa/enable', {}, bearer)
            : apiClient<TwoFactorEnrollment>('/v1/auth/psychologist/2fa/enable', { method: 'POST' }),

    /**
     * Confirms enrolment; returns recovery codes exactly once. Session cookies
     * are persisted on the sign-in path; in-session the existing session continues.
     */
    confirm2fa: (token: string, bearer?: string) =>
        bearer
            ? psychologistAuthRequest<PsychologistConfirmResponse>('/auth/psychologist/2fa/confirm', { token }, bearer)
            : apiClient<PsychologistConfirmResponse>('/v1/auth/psychologist/2fa/confirm', {
                method: 'POST',
                body: JSON.stringify({ token }),
            }),

    refresh: (dto?: PsychologistRefreshDto) =>
        psychologistAuthRequest<PsychologistAuthResponse>('/auth/psychologist/refresh', dto),

    async logout() {
        try {
            return await apiClient<{ message: string }>('/v1/auth/psychologist/logout', { method: 'POST' });
        } finally {
            await clearAuthCookies();
        }
    },

    getMe: () => apiClient<PsychologistProfile>('/v1/psychologist/me'),
    updateMe: (dto: UpdatePsychologistDto) =>
        apiClient<{ message: string; psychologist: PsychologistProfile }>('/v1/psychologist/me', {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }),
    getDashboard: () => apiClient<DashboardResponse>('/v1/psychologist/dashboard'),
    getCaseload: (filters?: CaseloadQuery) => apiClient<PaginatedResponse<CaseloadItem>>(`/v1/psychologist/caseload${queryString(filters)}`),
    listAlerts: (filters?: AlertQuery) => apiClient<PaginatedResponse<ClinicalAlert>>(`/v1/psychologist/alerts${queryString(filters)}`),
    acknowledgeAlert: (alertId: string) => apiClient<ClinicalAlert>(`/v1/psychologist/alerts/${alertId}/acknowledge`, { method: 'PATCH' }),
    resolveAlert: (alertId: string, resolution: AlertResolution, resolutionNote?: string) => apiClient<ClinicalAlert>(`/v1/psychologist/alerts/${alertId}/resolve`, { method: 'POST', body: JSON.stringify({ resolution, resolutionNote }) }),
    proposeSession: (alertId: string) => apiClient<SessionListItem>(`/v1/psychologist/alerts/${alertId}/propose-session`, { method: 'POST' }),
    listWeeklyReports: () => apiClient<WeeklyReport[]>('/v1/psychologist/weekly-reports'),
    getWeeklyReport: (reportId: string) => apiClient<WeeklyReport>(`/v1/psychologist/weekly-reports/${reportId}`),
    exportWeeklyReport: (reportId: string) => apiClient<{ filename: string; contentType: string; report: WeeklyReport }>(`/v1/psychologist/weekly-reports/${reportId}/export`),
    acknowledgeWeeklyReport: (reportId: string) => apiClient<WeeklyReport>(`/v1/psychologist/weekly-reports/${reportId}/acknowledge`, { method: 'POST' }),
    annotateWeeklyReport: (reportId: string, note: string) => apiClient<WeeklyReport>(`/v1/psychologist/weekly-reports/${reportId}/annotate`, { method: 'POST', body: JSON.stringify({ note }) }),
    getLifeChart: (patientId: string, filters?: PatientDateRangeQueryDto) => apiClient<LifeChartResponse>(`/v1/psychologist/patients/${patientId}/life-chart${queryString(filters)}`),
    getConsent: (patientId: string) => apiClient<ConsentResponse>(`/v1/psychologist/patients/${patientId}/consent`),
    getThresholds: (patientId: string) => apiClient<{ data: ThresholdItem[] }>(`/v1/psychologist/patients/${patientId}/thresholds`),
    updateThresholds: (patientId: string, thresholds: ThresholdItem[]) => apiClient<{ data: ThresholdItem[] }>(`/v1/psychologist/patients/${patientId}/thresholds`, { method: 'PUT', body: JSON.stringify({ thresholds }) }),
    getRelapseSignatures: (patientId: string) => apiClient<{ data: RelapseSignature[] }>(`/v1/psychologist/patients/${patientId}/relapse-signature`),
    createRelapseSignature: (patientId: string, dto: Partial<RelapseSignature>) => apiClient<RelapseSignature>(`/v1/psychologist/patients/${patientId}/relapse-signature`, { method: 'POST', body: JSON.stringify(dto) }),
    updateRelapseSignature: (patientId: string, signatureId: string, dto: Partial<RelapseSignature>) => apiClient<RelapseSignature>(`/v1/psychologist/patients/${patientId}/relapse-signature/${signatureId}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    getMedications: (patientId: string) => apiClient<{ data: Medication[] }>(`/v1/psychologist/patients/${patientId}/medications`),
    createMedication: (patientId: string, dto: Pick<Medication, 'name' | 'dosage' | 'frequency' | 'instructions' | 'startDate' | 'endDate'>) => apiClient<Medication>(`/v1/psychologist/patients/${patientId}/medications`, { method: 'POST', body: JSON.stringify(dto) }),
    updateMedication: (patientId: string, medicationId: string, dto: Partial<Medication>) => apiClient<Medication>(`/v1/psychologist/patients/${patientId}/medications/${medicationId}`, { method: 'PATCH', body: JSON.stringify(dto) }),
    getTimelineEvents: (patientId: string) => apiClient<{ data: TimelineEvent[] }>(`/v1/psychologist/patients/${patientId}/timeline-events`),
    createTimelineEvent: (patientId: string, dto: { title: string; details?: string; occurredAt: string; medicationId?: string }) => apiClient<TimelineEvent>(`/v1/psychologist/patients/${patientId}/timeline-events`, { method: 'POST', body: JSON.stringify(dto) }),
    reviseDiagnosis: (patientId: string, dto: { diagnosis?: string; diagnosisLabel?: string; status?: string; notes?: string }) => apiClient<{ id: string; diagnosis: string | null; diagnosisLabel: string | null }>(`/v1/psychologist/patients/${patientId}/diagnosis`, { method: 'POST', body: JSON.stringify(dto) }),
    getExerciseCatalog: () => apiClient<{ data: ExerciseCatalogItem[] }>('/v1/psychologist/exercises/catalog'),
    getExercises: (patientId: string) => apiClient<{ data: ExerciseAssignment[] }>(`/v1/psychologist/patients/${patientId}/exercises`),
    assignExercise: (patientId: string, dto: { exerciseId: string; frequency?: string; note?: string; startsAt?: string; endsAt?: string }) => apiClient<{ id: string }>(`/v1/psychologist/patients/${patientId}/exercises`, { method: 'POST', body: JSON.stringify(dto) }),
    getGoals: (patientId: string) => apiClient<{ data: FocusGoal[] }>(`/v1/psychologist/patients/${patientId}/goals`),
    createGoal: (patientId: string, dto: { title: string; description?: string; weekStart?: string }) => apiClient<{ id: string }>(`/v1/psychologist/patients/${patientId}/goals`, { method: 'POST', body: JSON.stringify(dto) }),
    getDiagnoses: (patientId: string) => apiClient<{ data: ConfirmedDiagnosis[] }>(`/v1/psychologist/patients/${patientId}/diagnosis`),
    getMessages: (patientId: string) => apiClient<SecureMessagesResponse>(`/v1/psychologist/patients/${patientId}/messages`),
    sendMessage: (patientId: string, content: string, isUrgent = false) => apiClient<SecureMessage>(`/v1/psychologist/patients/${patientId}/messages`, { method: 'POST', body: JSON.stringify({ content, isUrgent }) }),
    getCoverage: () => apiClient<{ data: CoverageShift[] }>('/v1/psychologist/coverage'),
    createCoverage: (dto: { coveringId: string; absentId?: string; type?: 'ON_CALL' | 'LEAVE_COVER'; startsAt: string; endsAt: string }) => apiClient<CoverageShift>('/v1/psychologist/coverage', { method: 'POST', body: JSON.stringify(dto) }),

    listPatients: (filters?: PatientListQueryDto) =>
        apiClient<PaginatedResponse<PatientListItem>>(`/v1/psychologist/patients${queryString(filters)}`),
    getPatient: (patientId: string) =>
        apiClient<PatientDetailResponse>(`/v1/psychologist/patients/${patientId}`),
    getPatientProgress: (patientId: string, filters?: PatientDateRangeQueryDto) =>
        apiClient<ProgressResponse>(`/v1/psychologist/patients/${patientId}/progress${queryString(filters)}`),
    getPatientJournal: (patientId: string, filters?: JournalListQueryDto) =>
        apiClient<PaginatedResponse<JournalEntry>>(
            `/v1/psychologist/patients/${patientId}/journal${queryString(filters)}`,
        ),

    listAssessments: (patientId: string, filters?: AssessmentListQueryDto) =>
        apiClient<PaginatedResponse<AssessmentListItem>>(
            `/v1/psychologist/patients/${patientId}/assessments${queryString(filters)}`,
        ),
    getAssessment: (patientId: string, assessmentId: string) =>
        apiClient<AssessmentDetailResponse>(
            `/v1/psychologist/patients/${patientId}/assessments/${assessmentId}`,
        ),
    reviewAssessment: (patientId: string, assessmentId: string, dto: AssessmentReviewDto) =>
        apiClient<ProfessionalReview>(
            `/v1/psychologist/patients/${patientId}/assessments/${assessmentId}/review`,
            { method: 'POST', body: JSON.stringify(dto) },
        ),

    listNotes: (patientId: string) =>
        apiClient<{ data: PsychologistNote[] }>(`/v1/psychologist/patients/${patientId}/notes`),
    createNote: (patientId: string, dto: CreateNoteDto) =>
        apiClient<PsychologistNote>(`/v1/psychologist/patients/${patientId}/notes`, {
            method: 'POST',
            body: JSON.stringify(dto),
        }),
    updateNote: (patientId: string, noteId: string, dto: UpdateNoteDto) =>
        apiClient<PsychologistNote>(`/v1/psychologist/patients/${patientId}/notes/${noteId}`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }),
    deleteNote: (patientId: string, noteId: string) =>
        apiClient<{ message: string }>(`/v1/psychologist/patients/${patientId}/notes/${noteId}`, {
            method: 'DELETE',
        }),

    listSessions: (filters?: SessionListQueryDto) =>
        apiClient<PaginatedResponse<SessionListItem>>(
            `/v1/psychologist/sessions${queryString(filters)}`,
        ),
    createSession: (dto: CreateSessionDto) =>
        apiClient<SessionListItem>('/v1/psychologist/sessions', {
            method: 'POST',
            body: JSON.stringify(dto),
        }),
    getSession: (sessionId: string) =>
        apiClient<SessionDetailResponse>(`/v1/psychologist/sessions/${sessionId}`),
    updateSession: (sessionId: string, dto: UpdateSessionDto) =>
        apiClient<Partial<SessionDetailResponse>>(`/v1/psychologist/sessions/${sessionId}`, {
            method: 'PATCH',
            body: JSON.stringify(dto),
        }),
    completeSession: (sessionId: string, dto: CompleteSessionDto) =>
        apiClient<{ id: string; status: 'COMPLETED'; completedAt: string }>(
            `/v1/psychologist/sessions/${sessionId}/complete`,
            { method: 'POST', body: JSON.stringify(dto) },
        ),

    listNotifications: () =>
        apiClient<{ data: PsychologistNotification[] }>('/v1/psychologist/notifications'),
    markNotificationRead: (notificationId: string) =>
        apiClient<{ message: string }>(`/v1/psychologist/notifications/${notificationId}/read`, {
            method: 'PATCH',
        }),
};