import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardCheck,
  FileSearch,
  History,
  Save,
  ShieldCheck,
  Sparkles,
  Stethoscope,
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { analyzePatientRisk } from '../../services/simulatedAiEngine';
import { ClinicalReviewStatus } from '../../types/clinical';
import { formatShortDate } from '../../utils/dateUtils';

const OUTCOMES: ClinicalReviewStatus[] = [
  'Pending Review',
  'Under Review',
  'Additional Evidence Required',
  'Physician Reviewed',
  'Follow-up Requested',
];

const TEST_OPTIONS = [
  'Repeat Morning UACR',
  'Repeat BMP / eGFR & Creatinine',
  'HbA1c Follow-up Panel',
  'Ophthalmology Dilated Exam',
  '14-Day Ambulatory BP Log',
];

export const DoctorDecisionSupport: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    saveClinicalDecision,
  } = useAurelix();
  const navigate = useNavigate();

  const patient =
    patients.find((p) => p.id === selectedPatientId) ?? patients[0];
  const analysis = analyzePatientRisk(patient);
  const latestLab = patient.labs[patient.labs.length - 1];
  const prevLab = patient.labs.length > 1 ? patient.labs[patient.labs.length - 2] : undefined;
  const latestRetinal =
    patient.retinalScreenings[patient.retinalScreenings.length - 1];
  const latestVital = patient.vitals24h[patient.vitals24h.length - 1];

  const [evidenceReviewed, setEvidenceReviewed] = useState(false);
  const [outcome, setOutcome] = useState<ClinicalReviewStatus>(
    patient.reviewStatus
  );
  const [doctorAssessment, setDoctorAssessment] = useState(
    'Multi-marker metabolic, renal & retinal review'
  );
  const [selectedTests, setSelectedTests] = useState<string[]>([
    'Repeat Morning UACR',
    'Ophthalmology Dilated Exam',
  ]);
  const [specialistRequested, setSpecialistRequested] = useState(false);
  const [followUpTiming, setFollowUpTiming] = useState('4 weeks');
  const [clinicalNote, setClinicalNote] = useState('');
  const [patientSummary, setPatientSummary] = useState('');
  const [savedBanner, setSavedBanner] = useState('');

  useEffect(() => {
    setEvidenceReviewed(patient.reviewStatus === 'Physician Reviewed');
    setOutcome(
      patient.reviewStatus === 'Pending Review'
        ? 'Physician Reviewed'
        : patient.reviewStatus
    );
    setDoctorAssessment(
      patient.id === 'PT-1001'
        ? 'Improving glycemic control; verify mild UACR elevation & retinal screening'
        : `${analysis.primarySignalSummary} — clinical review`
    );
    setClinicalNote('');
    setPatientSummary(
      patient.id === 'PT-1001'
        ? 'Your HbA1c improved to 7.4%. We are repeating your morning urine albumin test and confirming your eye screening at our upcoming visit.'
        : 'Clinician reviewed longitudinal labs and monitoring trends; follow-up plan updated.'
    );
    setSavedBanner('');
  }, [patient.id]);

  const toggleTest = (test: string) => {
    setSelectedTests((prev) =>
      prev.includes(test) ? prev.filter((t) => t !== test) : [...prev, test]
    );
  };

  const handleSaveDecision = (overrideOutcome?: ClinicalReviewStatus) => {
    const finalOutcome = overrideOutcome ?? outcome;
    saveClinicalDecision(patient.id, {
      outcome: finalOutcome,
      doctorAssessment: doctorAssessment.trim() || 'Physician clinical review',
      clinicalNote:
        clinicalNote.trim() ||
        'Reviewed longitudinal metabolic, renal, and screening evidence.',
      patientFacingSummary:
        patientSummary.trim() ||
        'Your care plan has been updated following physician review.',
      additionalTests: selectedTests,
      specialistReviewRequested: specialistRequested,
      followUpTiming,
    });
    setSavedBanner(
      `Decision saved (${finalOutcome}) for ${patient.name}. Care Plan, Registry, Triage Queue, and Audit Log updated.`
    );
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="Clinical Decision Support"
      pageSubtitle="AI assists. Doctors decide. Structured 3-column evidence-to-decision workflow."
      headerAction={
        <div className="flex items-center gap-2">
          <select
            value={patient.id}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-[#0B1F3A]"
            aria-label="Select patient for clinical decision support"
          >
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.id})
              </option>
            ))}
          </select>
        </div>
      }
    >
      <div className="space-y-5">
        <DemoNoticeBanner
          title="Physician Governance Principle"
          message="AI assists. Doctors decide. Simulated AI observations are never automatically approved, and this system never generates medication doses or automatic prescriptions."
          tags={['Human-in-the-Loop', 'No Automated Prescriptions']}
        />

        {/* Staged Workflow Stepper */}
        <div className="bg-white rounded-lg border border-slate-200 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-[#0B1F3A] inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center text-[11px] font-bold">
                1
              </span>
              AI Flags Signal
            </span>
            <span className="text-slate-300">→</span>
            <span
              className={`font-semibold inline-flex items-center gap-1.5 ${
                evidenceReviewed ? 'text-emerald-700' : 'text-[#0B1F3A]'
              }`}
            >
              <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0B1F3A] flex items-center justify-center text-[11px] font-bold">
                2
              </span>
              Doctor Reviews Evidence
            </span>
            <span className="text-slate-300">→</span>
            <span className="font-semibold text-[#0B1F3A] inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-[#0B1F3A] flex items-center justify-center text-[11px] font-bold">
                3
              </span>
              Document Judgment &amp; Save
            </span>
            <span className="text-slate-300">→</span>
            <span className="text-slate-600 inline-flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center text-[11px] font-bold">
                4
              </span>
              Patient Portal Care Plan Synced
            </span>
          </div>
          <StatusBadge label={patient.reviewStatus} compact />
        </div>

        {/* 3-Column Workspace */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
          {/* COLUMN 1: PATIENT CONTEXT */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  1. Patient Context
                </h2>
                <p className="text-[11px] text-slate-500">
                  Longitudinal profile &amp; clinical history
                </p>
              </div>
              <span className="font-mono text-xs text-slate-500">{patient.id}</span>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-base font-semibold text-[#0B1F3A]">
                {patient.name}
              </div>
              <div className="text-slate-600">
                {patient.age} yrs · {patient.sex} · BMI {patient.bmi}
              </div>
              <div className="text-slate-600 pt-1">
                <strong>Conditions:</strong> {patient.conditions.join(', ')}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">HbA1c</div>
                <div className="font-semibold text-[#0B1F3A] tabular-nums">
                  {latestLab?.hba1c ?? '—'}%
                </div>
                {prevLab?.hba1c && (
                  <div className="text-[10px] text-slate-500">
                    Prior: {prevLab.hba1c}%
                  </div>
                )}
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">eGFR</div>
                <div className="font-semibold text-[#0B1F3A] tabular-nums">
                  {latestLab?.egfr ?? '—'} mL/min
                </div>
                {prevLab?.egfr && (
                  <div className="text-[10px] text-slate-500">
                    Prior: {prevLab.egfr}
                  </div>
                )}
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">UACR</div>
                <div className="font-semibold text-[#0B1F3A] tabular-nums">
                  {latestLab?.uacr ?? '—'} mg/g
                </div>
                {prevLab?.uacr && (
                  <div className="text-[10px] text-slate-500">
                    Prior: {prevLab.uacr} mg/g
                  </div>
                )}
              </div>
              <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                <div className="text-[11px] text-slate-500">Recent BP</div>
                <div className="font-semibold text-[#0B1F3A] tabular-nums">
                  {latestVital?.systolic}/{latestVital?.diastolic}
                </div>
                <div className="text-[10px] text-slate-500">mmHg</div>
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-[#0B1F3A]">
                Recent Retinal Screening
              </div>
              {latestRetinal ? (
                <>
                  <p className="text-slate-700">
                    {formatShortDate(latestRetinal.date)} ·{' '}
                    {latestRetinal.doctorAssessment ??
                      `Possible ${latestRetinal.possibleStage} (Unconfirmed)`}
                  </p>
                  <StatusBadge label={latestRetinal.reviewStatus} compact />
                </>
              ) : (
                <p className="text-slate-500">No retinal screening on file.</p>
              )}
            </div>
          </div>

          {/* COLUMN 2: AI-ASSISTED EVIDENCE */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                  <span>2. AI-Assisted Evidence</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Simulated signals · Never auto-approved
                </p>
              </div>
              <StatusBadge label={analysis.overallRisk} compact />
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 space-y-1">
                <div className="font-semibold text-[#0B1F3A]">
                  Flagged Clinical Indicators
                </div>
                <p className="text-slate-700">{analysis.primarySignalSummary}</p>
              </div>

              <div>
                <div className="font-semibold text-[#0B1F3A] mb-1">
                  Simulated Evidence Reasoning
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-600 leading-relaxed">
                  <li>{analysis.diabetes.explanation}</li>
                  <li>{analysis.kidney.explanation}</li>
                  <li>{analysis.retinal.explanation}</li>
                </ul>
              </div>

              <div className="p-3 rounded-md bg-amber-50/70 border border-amber-200 space-y-1 text-amber-950">
                <div className="font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Data Limitations &amp; Missing Information</span>
                </div>
                <p className="text-[11px] leading-relaxed">
                  {patient.missingDataNotes.length > 0
                    ? patient.missingDataNotes.join(' ')
                    : 'Single-site synthetic lab history. Confirming chronic kidney changes or diabetic retinopathy requires longitudinal verification and direct clinician exam.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setEvidenceReviewed(true)}
                className={`w-full py-2 px-3 rounded-md border text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors ${
                  evidenceReviewed
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-white border-slate-300 text-[#0B1F3A] hover:bg-slate-50'
                }`}
              >
                <FileSearch className="w-3.5 h-3.5" />
                <span>
                  {evidenceReviewed
                    ? 'Evidence Marked Inspected'
                    : 'Review Evidence'}
                </span>
              </button>
            </div>
          </div>

          {/* COLUMN 3: PHYSICIAN DECISION */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-semibold text-[#0B1F3A] flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-[#0B1F3A]" />
                  <span>3. Physician Decision</span>
                </h2>
                <p className="text-[11px] text-slate-500">
                  Independent clinician judgment (Dr. Maya Tan)
                </p>
              </div>
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Review Outcome Status
                </label>
                <select
                  value={outcome}
                  onChange={(e) =>
                    setOutcome(e.target.value as ClinicalReviewStatus)
                  }
                  className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900"
                >
                  {OUTCOMES.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Doctor Assessment Summary
                </label>
                <input
                  type="text"
                  value={doctorAssessment}
                  onChange={(e) => setDoctorAssessment(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">
                  Additional Testing Requests (Non-Prescriptive)
                </label>
                <div className="space-y-1.5">
                  {TEST_OPTIONS.map((test) => (
                    <label
                      key={test}
                      className="flex items-center gap-2 text-slate-700 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test)}
                        onChange={() => toggleTest(test)}
                        className="rounded border-slate-300 text-[#0D9488]"
                      />
                      <span>{test}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Follow-up Timing
                  </label>
                  <select
                    value={followUpTiming}
                    onChange={(e) => setFollowUpTiming(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-md border border-slate-300 bg-white"
                  >
                    <option>2 weeks</option>
                    <option>4 weeks</option>
                    <option>3 months</option>
                    <option>6 months</option>
                  </select>
                </div>
                <div className="flex items-end pb-1">
                  <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={specialistRequested}
                      onChange={(e) => setSpecialistRequested(e.target.checked)}
                      className="rounded border-slate-300 text-[#0D9488]"
                    />
                    <span>Specialist Review</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Clinical Notes (Internal Record)
                </label>
                <textarea
                  rows={2}
                  value={clinicalNote}
                  onChange={(e) => setClinicalNote(e.target.value)}
                  placeholder="Document clinical reasoning and follow-up rationale..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Patient-Facing Care Plan Update
                </label>
                <textarea
                  rows={2}
                  value={patientSummary}
                  onChange={(e) => setPatientSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-md border border-slate-300"
                />
              </div>

              {/* Explicit Workflow Buttons */}
              <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveDecision('Additional Evidence Required')}
                  className="px-2.5 py-2 rounded-md border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50"
                >
                  Request Additional Tests
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDecision('Physician Reviewed')}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-2 rounded-md border border-teal-300 bg-teal-50 text-teal-900 font-medium hover:bg-teal-100/70"
                >
                  <ClipboardCheck className="w-3.5 h-3.5" />
                  <span>Record Clinical Decision</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveDecision()}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-md bg-[#0B1F3A] text-white font-semibold hover:bg-[#132F54] transition-colors"
                >
                  <Save className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  <span>Save Review &amp; Sync Care Plan</span>
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/doctor/reports')}
                  className="col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-slate-600 hover:text-[#0B1F3A] hover:bg-slate-50"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>View Audit History</span>
                </button>
              </div>

              {savedBanner && (
                <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{savedBanner}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
