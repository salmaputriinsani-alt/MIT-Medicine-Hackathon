import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  INITIAL_APPOINTMENTS,
  INITIAL_AUDIT_LOGS,
  INITIAL_MESSAGES,
  INITIAL_PATIENTS,
} from '../data/patients';
import { generateInitialTriageQueue } from '../services/simulatedAiEngine';
import {
  AppNotification,
  AppointmentRecord,
  AuditLogEntry,
  AuthSession,
  ClinicalReviewStatus,
  PatientJournalEntry,
  PatientMessage,
  PatientProfile,
  TriageItem,
  TriageStatus,
} from '../types/clinical';
import { daysAgoDateStr, daysAgoISO } from '../utils/dateUtils';

const STORAGE_KEY = 'aurelix_erp_demo_state_v1';

interface PersistedDemoState {
  session: AuthSession | null;
  patients: PatientProfile[];
  triageItems: TriageItem[];
  auditLogs: AuditLogEntry[];
  appointments: AppointmentRecord[];
  messages: PatientMessage[];
  journalEntries: PatientJournalEntry[];
  notifications: AppNotification[];
  selectedPatientId: string;
}

const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-p-1',
    role: 'patient',
    title: 'Retinal screening awaiting doctor review',
    description:
      'Your recent illustrative eye screening is queued for Dr. Maya Tan to review.',
    timestamp: daysAgoISO(1, 10),
    read: false,
    linkTo: '/patient/eye-screening',
  },
  {
    id: 'notif-p-2',
    role: 'patient',
    title: 'Latest lab panel added',
    description: 'HbA1c 7.4%, eGFR 72, and UACR 44 mg/g are ready to view.',
    timestamp: daysAgoISO(10, 9),
    read: false,
    linkTo: '/patient/kidney-health',
  },
  {
    id: 'notif-d-1',
    role: 'doctor',
    title: 'Aisha Rahman (PT-1001) flagged for multi-marker review',
    description:
      'Possible mild NPDR (unconfirmed) and mild UACR elevation awaiting assessment.',
    timestamp: daysAgoISO(1, 9),
    read: false,
    linkTo: '/doctor/decisions',
  },
  {
    id: 'notif-d-2',
    role: 'doctor',
    title: 'Nurul Huda (PT-1005) retinal scan ready',
    description:
      'Stored sample case suggests possible moderate NPDR features for confirmation.',
    timestamp: daysAgoISO(3, 15),
    read: false,
    linkTo: '/doctor/retinal',
  },
];

const INITIAL_JOURNAL: PatientJournalEntry[] = [
  {
    id: 'jr-1',
    patientId: 'PT-1001',
    timestamp: daysAgoISO(2, 20),
    note: 'Evening walk 25 minutes after dinner; felt well with steady energy.',
    glucoseReading: 138,
  },
];

function createDefaultState(): PersistedDemoState {
  return {
    session: null,
    patients: INITIAL_PATIENTS,
    triageItems: generateInitialTriageQueue(INITIAL_PATIENTS),
    auditLogs: INITIAL_AUDIT_LOGS,
    appointments: INITIAL_APPOINTMENTS,
    messages: INITIAL_MESSAGES,
    journalEntries: INITIAL_JOURNAL,
    notifications: INITIAL_NOTIFICATIONS,
    selectedPatientId: 'PT-1001',
  };
}

function loadState(): PersistedDemoState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    const parsed = JSON.parse(raw) as PersistedDemoState;
    if (!parsed.patients || parsed.patients.length === 0) {
      return createDefaultState();
    }
    return parsed;
  } catch {
    return createDefaultState();
  }
}

export interface ClinicalDecisionPayload {
  outcome: ClinicalReviewStatus;
  doctorAssessment: string;
  clinicalNote: string;
  patientFacingSummary: string;
  additionalTests: string[];
  specialistReviewRequested: boolean;
  followUpTiming: string;
}

export interface RetinalReviewPayload {
  reviewStatus: ClinicalReviewStatus;
  doctorAssessment: string;
  doctorNote: string;
  specialistRequested: boolean;
  repeatRequested: boolean;
}

interface AurelixContextValue {
  session: AuthSession | null;
  patients: PatientProfile[];
  triageItems: TriageItem[];
  auditLogs: AuditLogEntry[];
  appointments: AppointmentRecord[];
  messages: PatientMessage[];
  journalEntries: PatientJournalEntry[];
  notifications: AppNotification[];
  selectedPatientId: string;
  setSelectedPatientId: (id: string) => void;
  login: (session: AuthSession) => void;
  logout: () => void;
  updateTriageStatus: (triageId: string, newStatus: TriageStatus, note?: string) => void;
  saveRetinalReview: (
    patientId: string,
    screeningId: string,
    payload: RetinalReviewPayload
  ) => void;
  saveKidneyReview: (
    patientId: string,
    interpretationNote: string,
    requestAdditionalTesting: boolean
  ) => void;
  saveClinicalDecision: (
    patientId: string,
    payload: ClinicalDecisionPayload
  ) => void;
  toggleCarePlanTask: (patientId: string, itemId: string) => void;
  addJournalEntry: (patientId: string, note: string, glucoseReading?: number) => void;
  sendPatientMessage: (patientId: string, subject: string, body: string) => void;
  requestAppointment: (
    patientId: string,
    date: string,
    time: string,
    type: AppointmentRecord['type'],
    reason: string
  ) => void;
  markNotificationsRead: (role: 'patient' | 'doctor') => void;
  resetDemoData: () => void;
}

const AurelixContext = createContext<AurelixContextValue | null>(null);

export const AurelixProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PersistedDemoState>(() => loadState());

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors in demo mode
    }
  }, [state]);

  const setSelectedPatientId = (id: string) => {
    setState((prev) => ({ ...prev, selectedPatientId: id }));
  };

  const login = (session: AuthSession) => {
    setState((prev) => ({
      ...prev,
      session,
      selectedPatientId: session.role === 'patient' ? 'PT-1001' : prev.selectedPatientId,
    }));
  };

  const logout = () => {
    setState((prev) => ({ ...prev, session: null }));
  };

  const updateTriageStatus = (
    triageId: string,
    newStatus: TriageStatus,
    note?: string
  ) => {
    setState((prev) => {
      const target = prev.triageItems.find((t) => t.id === triageId);
      if (!target) return prev;
      const prevStatus = target.status;

      const updatedTriage = prev.triageItems.map((t) =>
        t.id === triageId
          ? {
              ...t,
              status: newStatus,
              dismissReason: newStatus === 'Dismissed' ? note : t.dismissReason,
              updatedAt: daysAgoDateStr(0),
            }
          : t
      );

      let mappedPatientStatus: ClinicalReviewStatus = 'Under Review';
      if (newStatus === 'Reviewed') mappedPatientStatus = 'Physician Reviewed';
      else if (newStatus === 'Follow-up Requested')
        mappedPatientStatus = 'Follow-up Requested';
      else if (newStatus === 'Pending') mappedPatientStatus = 'Pending Review';

      const updatedPatients = prev.patients.map((p) => {
        if (p.id !== target.patientId) return p;
        return {
          ...p,
          reviewStatus:
            newStatus === 'Dismissed' ? 'Physician Reviewed' : mappedPatientStatus,
          clinicalNotes: note
            ? [
                {
                  id: `cn-${Date.now()}`,
                  date: daysAgoDateStr(0),
                  author: 'Dr. Maya Tan',
                  role: 'Attending Endocrinologist',
                  note: `[Triage · ${target.category}] ${note}`,
                  outcome: mappedPatientStatus,
                },
                ...p.clinicalNotes,
              ]
            : p.clinicalNotes,
        };
      });

      const auditEntry: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        doctor: 'Dr. Maya Tan',
        patientId: target.patientId,
        patientName: target.patientName,
        reviewAction: `Triage (${target.category}) -> ${newStatus}`,
        previousStatus: prevStatus,
        newStatus,
        notes: note,
      };

      return {
        ...prev,
        triageItems: updatedTriage,
        patients: updatedPatients,
        auditLogs: [auditEntry, ...prev.auditLogs],
      };
    });
  };

  const saveRetinalReview = (
    patientId: string,
    screeningId: string,
    payload: RetinalReviewPayload
  ) => {
    setState((prev) => {
      const patient = prev.patients.find((p) => p.id === patientId);
      if (!patient) return prev;

      const prevScreening = patient.retinalScreenings.find(
        (s) => s.id === screeningId
      );
      const prevStatus = prevScreening?.reviewStatus ?? 'Pending Review';

      const updatedPatients = prev.patients.map((p) => {
        if (p.id !== patientId) return p;

        const updatedScreenings = p.retinalScreenings.map((s) =>
          s.id === screeningId
            ? {
                ...s,
                reviewStatus: payload.reviewStatus,
                isUnconfirmed: payload.reviewStatus !== 'Physician Reviewed',
                doctorAssessment: payload.doctorAssessment,
                doctorNote: payload.doctorNote,
                reviewedBy: 'Dr. Maya Tan',
                reviewedAt: daysAgoDateStr(0),
                specialistRequested: payload.specialistRequested,
                repeatRequested: payload.repeatRequested,
              }
            : s
        );

        const newCarePlanItem = {
          id: `cp-ret-${Date.now()}`,
          title: `Retinal Screening Review: ${payload.doctorAssessment}`,
          description: `${payload.doctorNote}${
            payload.specialistRequested ? ' · Ophthalmology review requested.' : ''
          }${payload.repeatRequested ? ' · Repeat imaging scheduled.' : ''}`,
          category: 'Screening' as const,
          sourceType:
            payload.reviewStatus === 'Physician Reviewed'
              ? ('Physician Approved' as const)
              : ('Awaiting Clinician Review' as const),
          completed: payload.reviewStatus === 'Physician Reviewed',
          dueDate: daysAgoDateStr(0),
          approvedBy: 'Dr. Maya Tan',
          approvedAt: daysAgoDateStr(0),
        };

        const newEvent = {
          id: `ev-ret-${Date.now()}`,
          date: new Date().toISOString(),
          type: 'doctor_review' as const,
          title: 'Retinal screening reviewed by Dr. Maya Tan',
          summary: `Assessment: ${payload.doctorAssessment} (${payload.reviewStatus})`,
          details: payload.doctorNote,
          actor: 'Dr. Maya Tan',
          reviewStatus: payload.reviewStatus,
        };

        return {
          ...p,
          retinalScreenings: updatedScreenings,
          events: [newEvent, ...p.events],
          carePlan: [
            newCarePlanItem,
            ...p.carePlan.filter((c) => !c.id.startsWith('cp-ret-')),
          ],
          clinicalNotes: [
            {
              id: `cn-ret-${Date.now()}`,
              date: daysAgoDateStr(0),
              author: 'Dr. Maya Tan',
              role: 'Attending Endocrinologist',
              note: `Retinal review (${payload.doctorAssessment}): ${payload.doctorNote}`,
              outcome: payload.reviewStatus,
            },
            ...p.clinicalNotes,
          ],
        };
      });

      const updatedTriage = prev.triageItems.map((t) =>
        t.patientId === patientId && t.category === 'Retinal screening observation'
          ? {
              ...t,
              status:
                payload.reviewStatus === 'Physician Reviewed'
                  ? ('Reviewed' as const)
                  : ('Follow-up Requested' as const),
              updatedAt: daysAgoDateStr(0),
            }
          : t
      );

      const auditEntry: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        doctor: 'Dr. Maya Tan',
        patientId,
        patientName: patient.name,
        reviewAction: `Retinal Screening Review (${payload.doctorAssessment})`,
        previousStatus: prevStatus,
        newStatus: payload.reviewStatus,
        notes: payload.doctorNote,
      };

      const patientNotif: AppNotification = {
        id: `notif-ret-${Date.now()}`,
        role: 'patient',
        title: 'Eye screening report updated by Dr. Maya Tan',
        description: `Physician assessment recorded: ${payload.doctorAssessment}.`,
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: '/patient/eye-screening',
      };

      return {
        ...prev,
        patients: updatedPatients,
        triageItems: updatedTriage,
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [patientNotif, ...prev.notifications],
      };
    });
  };

  const saveKidneyReview = (
    patientId: string,
    interpretationNote: string,
    requestAdditionalTesting: boolean
  ) => {
    setState((prev) => {
      const patient = prev.patients.find((p) => p.id === patientId);
      if (!patient) return prev;

      const prevStatus = patient.reviewStatus;
      const newStatus: ClinicalReviewStatus = requestAdditionalTesting
        ? 'Follow-up Requested'
        : 'Physician Reviewed';

      const updatedPatients = prev.patients.map((p) => {
        if (p.id !== patientId) return p;
        return {
          ...p,
          reviewStatus: newStatus,
          clinicalNotes: [
            {
              id: `cn-kid-${Date.now()}`,
              date: daysAgoDateStr(0),
              author: 'Dr. Maya Tan',
              role: 'Attending Endocrinologist',
              note: `[Kidney Monitoring] ${interpretationNote}${
                requestAdditionalTesting ? ' · Repeat eGFR & UACR ordered.' : ''
              }`,
              outcome: newStatus,
            },
            ...p.clinicalNotes,
          ],
          events: [
            {
              id: `ev-kid-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'doctor_review' as const,
              title: 'Kidney monitoring review recorded',
              summary: requestAdditionalTesting
                ? 'Repeat renal & urine albumin testing requested by Dr. Maya Tan.'
                : 'Longitudinal kidney markers reviewed by Dr. Maya Tan.',
              details: interpretationNote,
              actor: 'Dr. Maya Tan',
              reviewStatus: newStatus,
            },
            ...p.events,
          ],
          carePlan: [
            {
              id: `cp-kid-${Date.now()}`,
              title: requestAdditionalTesting
                ? 'Repeat serum creatinine, eGFR & morning UACR test'
                : 'Continue routine kidney health monitoring',
              description: interpretationNote,
              category: 'Laboratory' as const,
              sourceType: 'Physician Approved' as const,
              completed: false,
              dueDate: daysAgoDateStr(-14),
              approvedBy: 'Dr. Maya Tan',
              approvedAt: daysAgoDateStr(0),
            },
            ...p.carePlan,
          ],
        };
      });

      const updatedTriage = prev.triageItems.map((t) =>
        t.patientId === patientId && t.category === 'Kidney-risk signal'
          ? {
              ...t,
              status: requestAdditionalTesting
                ? ('Follow-up Requested' as const)
                : ('Reviewed' as const),
              updatedAt: daysAgoDateStr(0),
            }
          : t
      );

      const auditEntry: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        doctor: 'Dr. Maya Tan',
        patientId,
        patientName: patient.name,
        reviewAction: requestAdditionalTesting
          ? 'Kidney Review · Repeat Lab Ordered'
          : 'Kidney Review Completed',
        previousStatus: prevStatus,
        newStatus,
        notes: interpretationNote,
      };

      const patientNotif: AppNotification = {
        id: `notif-kid-${Date.now()}`,
        role: 'patient',
        title: 'Kidney monitoring update from Dr. Maya Tan',
        description: requestAdditionalTesting
          ? 'Repeat kidney laboratory verification has been added to your care plan.'
          : 'Dr. Maya Tan reviewed your latest eGFR and UACR trends.',
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: '/patient/care-plan',
      };

      return {
        ...prev,
        patients: updatedPatients,
        triageItems: updatedTriage,
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [patientNotif, ...prev.notifications],
      };
    });
  };

  const saveClinicalDecision = (
    patientId: string,
    payload: ClinicalDecisionPayload
  ) => {
    setState((prev) => {
      const patient = prev.patients.find((p) => p.id === patientId);
      if (!patient) return prev;
      const prevStatus = patient.reviewStatus;

      const updatedPatients = prev.patients.map((p) => {
        if (p.id !== patientId) return p;

        const testsSummary =
          payload.additionalTests.length > 0
            ? ` Ordered: ${payload.additionalTests.join(', ')}.`
            : '';
        const specialistSummary = payload.specialistReviewRequested
          ? ' Specialist review requested.'
          : '';

        const updatedCarePlan = p.carePlan.map((item) =>
          item.sourceType === 'Awaiting Clinician Review' ||
          item.sourceType === 'AI Observation'
            ? {
                ...item,
                sourceType: 'Physician Approved' as const,
                approvedBy: 'Dr. Maya Tan',
                approvedAt: daysAgoDateStr(0),
              }
            : item
        );

        const newCareItem = {
          id: `cp-cds-${Date.now()}`,
          title: `Physician Decision (${payload.followUpTiming} follow-up)`,
          description: `${payload.patientFacingSummary}${testsSummary}${specialistSummary}`,
          category: 'Follow-up' as const,
          sourceType: 'Physician Approved' as const,
          completed: false,
          dueDate: daysAgoDateStr(-7),
          approvedBy: 'Dr. Maya Tan',
          approvedAt: daysAgoDateStr(0),
        };

        return {
          ...p,
          reviewStatus: payload.outcome,
          clinicalNotes: [
            {
              id: `cn-cds-${Date.now()}`,
              date: daysAgoDateStr(0),
              author: 'Dr. Maya Tan',
              role: 'Attending Endocrinologist',
              note: `${payload.doctorAssessment} — ${payload.clinicalNote}${testsSummary}${specialistSummary}`,
              outcome: payload.outcome,
            },
            ...p.clinicalNotes,
          ],
          events: [
            {
              id: `ev-cds-${Date.now()}`,
              date: new Date().toISOString(),
              type: 'doctor_review' as const,
              title: 'Clinical decision documented by Dr. Maya Tan',
              summary: `${payload.doctorAssessment} · Follow-up: ${payload.followUpTiming}`,
              details: `${payload.patientFacingSummary}${testsSummary}${specialistSummary}`,
              actor: 'Dr. Maya Tan',
              reviewStatus: payload.outcome,
            },
            ...p.events,
          ],
          carePlan: [newCareItem, ...updatedCarePlan],
        };
      });

      const updatedTriage = prev.triageItems.map((t) =>
        t.patientId === patientId
          ? {
              ...t,
              status:
                payload.outcome === 'Follow-up Requested'
                  ? ('Follow-up Requested' as const)
                  : payload.outcome === 'Physician Reviewed'
                  ? ('Reviewed' as const)
                  : ('Under Review' as const),
              updatedAt: daysAgoDateStr(0),
            }
          : t
      );

      const auditEntry: AuditLogEntry = {
        id: `aud-${Date.now()}`,
        timestamp: new Date().toISOString(),
        doctor: 'Dr. Maya Tan',
        patientId,
        patientName: patient.name,
        reviewAction: `Clinical Decision Saved (${payload.doctorAssessment})`,
        previousStatus: prevStatus,
        newStatus: payload.outcome,
        notes: payload.clinicalNote,
      };

      const patientNotif: AppNotification = {
        id: `notif-cds-${Date.now()}`,
        role: 'patient',
        title: 'New physician-reviewed update in your Care Plan',
        description: `Dr. Maya Tan recorded a clinical decision (${payload.outcome}).`,
        timestamp: new Date().toISOString(),
        read: false,
        linkTo: '/patient/care-plan',
      };

      return {
        ...prev,
        patients: updatedPatients,
        triageItems: updatedTriage,
        auditLogs: [auditEntry, ...prev.auditLogs],
        notifications: [patientNotif, ...prev.notifications],
      };
    });
  };

  const toggleCarePlanTask = (patientId: string, itemId: string) => {
    setState((prev) => ({
      ...prev,
      patients: prev.patients.map((p) =>
        p.id !== patientId
          ? p
          : {
              ...p,
              carePlan: p.carePlan.map((item) =>
                item.id === itemId
                  ? {
                      ...item,
                      completed: !item.completed,
                      sourceType:
                        !item.completed && item.sourceType === 'Physician Approved'
                          ? 'Completed Follow-up'
                          : item.completed && item.sourceType === 'Completed Follow-up'
                          ? 'Physician Approved'
                          : item.sourceType,
                    }
                  : item
              ),
            }
      ),
    }));
  };

  const addJournalEntry = (
    patientId: string,
    note: string,
    glucoseReading?: number
  ) => {
    setState((prev) => ({
      ...prev,
      journalEntries: [
        {
          id: `jr-${Date.now()}`,
          patientId,
          timestamp: new Date().toISOString(),
          note,
          glucoseReading,
        },
        ...prev.journalEntries,
      ],
    }));
  };

  const sendPatientMessage = (
    patientId: string,
    subject: string,
    body: string
  ) => {
    setState((prev) => {
      const patient = prev.patients.find((p) => p.id === patientId);
      const newMsg: PatientMessage = {
        id: `msg-${Date.now()}`,
        patientId,
        sender: patient?.name ?? 'Aisha Rahman',
        senderRole: 'patient',
        timestamp: new Date().toISOString(),
        subject,
        body,
        unread: false,
      };
      return {
        ...prev,
        messages: [newMsg, ...prev.messages],
      };
    });
  };

  const requestAppointment = (
    patientId: string,
    date: string,
    time: string,
    type: AppointmentRecord['type'],
    reason: string
  ) => {
    setState((prev) => {
      const newApt: AppointmentRecord = {
        id: `apt-${Date.now()}`,
        patientId,
        date,
        time,
        clinician: 'Dr. Maya Tan',
        specialty: 'Endocrinology & Predictive Care',
        type,
        status: 'Requested (Demo)',
        location:
          type === 'Telehealth Check-in'
            ? 'Virtual Clinic Portal'
            : 'Aurelix Medical Center · Suite 4B',
        notes: reason,
      };
      return {
        ...prev,
        appointments: [newApt, ...prev.appointments],
      };
    });
  };

  const markNotificationsRead = (role: 'patient' | 'doctor') => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) =>
        n.role === role ? { ...n, read: true } : n
      ),
    }));
  };

  const resetDemoData = () => {
    const fresh = createDefaultState();
    setState((prev) => ({
      ...fresh,
      session: prev.session,
    }));
  };

  return (
    <AurelixContext.Provider
      value={{
        session: state.session,
        patients: state.patients,
        triageItems: state.triageItems,
        auditLogs: state.auditLogs,
        appointments: state.appointments,
        messages: state.messages,
        journalEntries: state.journalEntries,
        notifications: state.notifications,
        selectedPatientId: state.selectedPatientId,
        setSelectedPatientId,
        login,
        logout,
        updateTriageStatus,
        saveRetinalReview,
        saveKidneyReview,
        saveClinicalDecision,
        toggleCarePlanTask,
        addJournalEntry,
        sendPatientMessage,
        requestAppointment,
        markNotificationsRead,
        resetDemoData,
      }}
    >
      {children}
    </AurelixContext.Provider>
  );
};

export function useAurelix() {
  const ctx = useContext(AurelixContext);
  if (!ctx) {
    throw new Error('useAurelix must be used inside AurelixProvider');
  }
  return ctx;
}
