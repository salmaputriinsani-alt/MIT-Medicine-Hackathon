export type UserRole = 'patient' | 'doctor';

export interface AuthSession {
  role: UserRole;
  userId: string;
  name: string;
  email: string;
  remember: boolean;
}

export type ClinicalReviewStatus =
  | 'Pending Review'
  | 'Under Review'
  | 'Additional Evidence Required'
  | 'Physician Reviewed'
  | 'Follow-up Requested';

export type TriageStatus =
  | 'Pending'
  | 'Under Review'
  | 'Reviewed'
  | 'Follow-up Requested'
  | 'Dismissed';

export type TriageCategory =
  | 'Glucose variability'
  | 'Kidney-risk signal'
  | 'Retinal screening observation'
  | 'Abnormal trend'
  | 'Incomplete follow-up'
  | 'Missing screening';

export type RiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High Priority';

export type RetinalStage =
  | 'No apparent retinopathy'
  | 'Mild NPDR'
  | 'Moderate NPDR'
  | 'Severe NPDR'
  | 'Proliferative DR';

export interface GlucosePoint {
  timestamp: string; // ISO
  label: string;
  value: number; // mg/dL
  min?: number;
  max?: number;
  source: 'CGM' | 'Fingerstick';
}

export interface VitalPoint {
  timestamp: string;
  label: string;
  systolic: number;
  diastolic: number;
  heartRate: number;
  weightKg?: number;
}

export interface LabRecord {
  id: string;
  date: string; // YYYY-MM-DD
  label: string;
  hba1c?: number; // %
  egfr?: number; // mL/min/1.73 m²
  uacr?: number; // mg/g
  creatinine?: number; // mg/dL
  fastingGlucose?: number; // mg/dL
  notes?: string;
}

export interface RetinalLesionMarker {
  id: string;
  type: 'microaneurysm' | 'hemorrhage' | 'exudate';
  label: string;
  x: number; // 0-400 SVG coordinate
  y: number; // 0-400 SVG coordinate
  description: string;
}

export interface RetinalScreeningRecord {
  id: string;
  date: string; // YYYY-MM-DD
  eye: 'Bilateral (OD/OS)' | 'Right Eye (OD)' | 'Left Eye (OS)';
  exampleVariant: 'normal' | 'mild_npdr' | 'moderate_npdr' | 'missing';
  simulatedObservation: string;
  possibleStage: RetinalStage;
  isUnconfirmed: boolean;
  reviewStatus: ClinicalReviewStatus;
  doctorAssessment?: RetinalStage | string;
  doctorNote?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  specialistRequested?: boolean;
  repeatRequested?: boolean;
  lesions: RetinalLesionMarker[];
}

export interface ClinicalEvent {
  id: string;
  date: string; // ISO or YYYY-MM-DD
  type: 'glucose' | 'lab' | 'retinal' | 'doctor_review' | 'appointment';
  title: string;
  summary: string;
  details: string;
  actor: string;
  reviewStatus?: ClinicalReviewStatus;
}

export interface CarePlanItem {
  id: string;
  title: string;
  description: string;
  category: 'Monitoring' | 'Laboratory' | 'Screening' | 'Lifestyle' | 'Follow-up';
  sourceType:
    | 'AI Observation'
    | 'Awaiting Clinician Review'
    | 'Physician Approved'
    | 'Completed Follow-up';
  completed: boolean;
  dueDate?: string;
  approvedBy?: string;
  approvedAt?: string;
}

export interface ClinicalNote {
  id: string;
  date: string;
  author: string;
  role: string;
  note: string;
  outcome?: ClinicalReviewStatus;
}

export interface AppointmentRecord {
  id: string;
  patientId: string;
  date: string; // YYYY-MM-DD
  time: string;
  clinician: string;
  specialty: string;
  type: 'In-Clinic Review' | 'Telehealth Check-in' | 'Retinal & Lab Follow-up';
  status: 'Upcoming' | 'Completed' | 'Requested (Demo)';
  location: string;
  notes?: string;
}

export interface PatientMessage {
  id: string;
  patientId: string;
  sender: string;
  senderRole: 'doctor' | 'patient' | 'care-coordinator';
  timestamp: string;
  subject: string;
  body: string;
  unread: boolean;
}

export interface PatientJournalEntry {
  id: string;
  patientId: string;
  timestamp: string;
  note: string;
  glucoseReading?: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  age: number;
  sex: 'Female' | 'Male';
  conditions: string[];
  diabetesYears?: number;
  hasCgm: boolean;
  assignedDoctor: string;
  trajectoryTag: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  lastVisitDate: string;
  reviewStatus: ClinicalReviewStatus;
  glucose24h: GlucosePoint[];
  glucose7d: GlucosePoint[];
  glucose30d: GlucosePoint[];
  vitals24h: VitalPoint[];
  vitals7d: VitalPoint[];
  vitals30d: VitalPoint[];
  vitals6m: VitalPoint[];
  vitals12m: VitalPoint[];
  labs: LabRecord[]; // Sorted oldest -> newest
  retinalScreenings: RetinalScreeningRecord[]; // Sorted oldest -> newest
  events: ClinicalEvent[];
  carePlan: CarePlanItem[];
  clinicalNotes: ClinicalNote[];
  missingDataNotes: string[];
}

export interface TriageItem {
  id: string;
  patientId: string;
  patientName: string;
  category: TriageCategory;
  triggeringObservation: string;
  relevantMeasurements: string;
  historicalChange: string;
  priority: 'High' | 'Moderate' | 'Low';
  dataCompleteness: number; // 0-100
  aiExplanation: string;
  status: TriageStatus;
  dismissReason?: string;
  updatedAt: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  doctor: string;
  patientId: string;
  patientName: string;
  reviewAction: string;
  previousStatus: string;
  newStatus: string;
  notes?: string;
}

export interface AppNotification {
  id: string;
  role: UserRole;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  linkTo: string;
}

export interface FactorContribution {
  factor: string;
  impact: number; // illustrative relative points (-15 to +35)
  direction: 'increases_risk' | 'protective' | 'neutral';
  detail: string;
}

export interface PatientRiskAnalysis {
  overallRisk: RiskLevel;
  dataCompleteness: number;
  diabetes: {
    level: RiskLevel;
    trend: 'Improving' | 'Stable' | 'Worsening' | 'Insufficient Data';
    latestHba1c?: number;
    previousHba1c?: number;
    latestGlucose: number;
    glucoseVariabilityCV: number;
    timeInRangePct: number;
    observations: string[];
    explanation: string;
    lastAnalyzed: string;
    reviewStatus: ClinicalReviewStatus;
  };
  kidney: {
    level: RiskLevel;
    trend: 'Improving' | 'Stable' | 'Declining Signal' | 'Insufficient Data';
    latestEgfr?: number;
    previousEgfr?: number;
    latestUacr?: number;
    previousUacr?: number;
    latestCreatinine?: number;
    hasSufficientData: boolean;
    kdigoG: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5' | 'Unknown';
    kdigoA: 'A1' | 'A2' | 'A3' | 'Unknown';
    observations: string[];
    factors: FactorContribution[];
    explanation: string;
    lastAnalyzed: string;
    reviewStatus: ClinicalReviewStatus;
  };
  retinal: {
    level: RiskLevel;
    latestStage: RetinalStage | 'No Screening Record';
    screeningDate?: string;
    isUnconfirmed: boolean;
    observations: string[];
    explanation: string;
    lastAnalyzed: string;
    reviewStatus: ClinicalReviewStatus;
  };
  primarySignalSummary: string;
}
