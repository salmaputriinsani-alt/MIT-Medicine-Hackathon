import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AurelixProvider, useAurelix } from './context/AurelixContext';
import { LoginPage } from './pages/LoginPage';
import { PatientAiInsights } from './pages/patient/PatientAiInsights';
import { PatientAppointments } from './pages/patient/PatientAppointments';
import { PatientCarePlan } from './pages/patient/PatientCarePlan';
import { PatientDashboard } from './pages/patient/PatientDashboard';
import { PatientEyeScreening } from './pages/patient/PatientEyeScreening';
import { PatientKidneyHealth } from './pages/patient/PatientKidneyHealth';
import { PatientTimeline } from './pages/patient/PatientTimeline';
import { DoctorCommandCenter } from './pages/doctor/DoctorCommandCenter';
import { DoctorDecisionSupport } from './pages/doctor/DoctorDecisionSupport';
import { DoctorKidneyIntelligence } from './pages/doctor/DoctorKidneyIntelligence';
import { DoctorRegistry } from './pages/doctor/DoctorRegistry';
import { DoctorReportsAudit } from './pages/doctor/DoctorReportsAudit';
import { DoctorRetinalScreening } from './pages/doctor/DoctorRetinalScreening';
import { DoctorTriageQueue } from './pages/doctor/DoctorTriageQueue';
import { UserRole } from './types/clinical';

const RoleGuard: React.FC<{
  allowedRole: UserRole;
  children: React.ReactNode;
}> = ({ allowedRole, children }) => {
  const { session } = useAurelix();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  if (session.role !== allowedRole) {
    return (
      <Navigate
        to={
          session.role === 'patient'
            ? '/patient/dashboard'
            : '/doctor/dashboard'
        }
        replace
      />
    );
  }
  return <>{children}</>;
};

const RootRedirect: React.FC = () => {
  const { session } = useAurelix();
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return (
    <Navigate
      to={
        session.role === 'patient'
          ? '/patient/dashboard'
          : '/doctor/dashboard'
      }
      replace
    />
  );
};

export default function App() {
  return (
    <AurelixProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Patient Portal Routes (7 Tabs) */}
          <Route
            path="/patient/dashboard"
            element={
              <RoleGuard allowedRole="patient">
                <PatientDashboard />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/timeline"
            element={
              <RoleGuard allowedRole="patient">
                <PatientTimeline />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/insights"
            element={
              <RoleGuard allowedRole="patient">
                <PatientAiInsights />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/eye-screening"
            element={
              <RoleGuard allowedRole="patient">
                <PatientEyeScreening />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/kidney-health"
            element={
              <RoleGuard allowedRole="patient">
                <PatientKidneyHealth />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/care-plan"
            element={
              <RoleGuard allowedRole="patient">
                <PatientCarePlan />
              </RoleGuard>
            }
          />
          <Route
            path="/patient/appointments"
            element={
              <RoleGuard allowedRole="patient">
                <PatientAppointments />
              </RoleGuard>
            }
          />

          {/* Doctor Portal Routes (7 Tabs) */}
          <Route
            path="/doctor/dashboard"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorCommandCenter />
              </RoleGuard>
            }
          />
          <Route
            path="/doctor/patients"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorRegistry />
              </RoleGuard>
            }
          />
          <Route
            path="/doctor/triage"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorTriageQueue />
              </RoleGuard>
            }
          />
          <Route
            path="/doctor/retinal"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorRetinalScreening />
              </RoleGuard>
            }
          />
          <Route
            path="/doctor/kidney"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorKidneyIntelligence />
              </RoleGuard>
            }
          />
          <Route
            path="/doctor/decisions"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorDecisionSupport />
              </RoleGuard>
            }
          />
          <Route
            path="/doctor/reports"
            element={
              <RoleGuard allowedRole="doctor">
                <DoctorReportsAudit />
              </RoleGuard>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<RootRedirect />} />
        </Routes>
      </BrowserRouter>
    </AurelixProvider>
  );
}
