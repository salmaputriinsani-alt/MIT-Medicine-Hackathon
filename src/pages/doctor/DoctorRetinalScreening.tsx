import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  FileWarning,
  Save,
  UserCheck,
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { RetinalFundusViewer } from '../../components/RetinalFundusViewer';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { ClinicalReviewStatus, RetinalStage } from '../../types/clinical';
import { formatShortDate } from '../../utils/dateUtils';

const RETINAL_STAGES: RetinalStage[] = [
  'No apparent retinopathy',
  'Mild NPDR',
  'Moderate NPDR',
  'Severe NPDR',
  'Proliferative DR',
];

export const DoctorRetinalScreening: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    saveRetinalReview,
  } = useAurelix();

  const activePatient =
    patients.find((p) => p.id === selectedPatientId) ?? patients[0];
  const latestScreening =
    activePatient.retinalScreenings[activePatient.retinalScreenings.length - 1];
  const prevScreening =
    activePatient.retinalScreenings.length > 1
      ? activePatient.retinalScreenings[
          activePatient.retinalScreenings.length - 2
        ]
      : undefined;

  const [compareMode, setCompareMode] = useState<'latest' | 'compare'>('compare');
  const [assessment, setAssessment] = useState<string>(
    latestScreening?.doctorAssessment ??
      latestScreening?.possibleStage ??
      'Mild NPDR'
  );
  const [doctorNote, setDoctorNote] = useState<string>(
    latestScreening?.doctorNote ?? ''
  );
  const [specialistReq, setSpecialistReq] = useState<boolean>(
    latestScreening?.specialistRequested ?? false
  );
  const [repeatReq, setRepeatReq] = useState<boolean>(
    latestScreening?.repeatRequested ?? false
  );
  const [savedNotice, setSavedNotice] = useState<string>('');

  useEffect(() => {
    setAssessment(
      latestScreening?.doctorAssessment ??
        latestScreening?.possibleStage ??
        'Mild NPDR'
    );
    setDoctorNote(latestScreening?.doctorNote ?? '');
    setSpecialistReq(latestScreening?.specialistRequested ?? false);
    setRepeatReq(latestScreening?.repeatRequested ?? false);
    setSavedNotice('');
  }, [activePatient.id, latestScreening?.id]);

  const handleSave = (
    status: ClinicalReviewStatus,
    overrideAssessment?: string,
    extraSpecialist?: boolean,
    extraRepeat?: boolean
  ) => {
    if (!latestScreening) return;
    const finalAssessment = overrideAssessment ?? assessment;
    const finalSpecialist = extraSpecialist ?? specialistReq;
    const finalRepeat = extraRepeat ?? repeatReq;
    const finalNote =
      doctorNote.trim() ||
      `Clinician reviewed bilateral fundus illustration; assessment: ${finalAssessment}.`;

    saveRetinalReview(activePatient.id, latestScreening.id, {
      reviewStatus: status,
      doctorAssessment: finalAssessment,
      doctorNote: finalNote,
      specialistRequested: finalSpecialist,
      repeatRequested: finalRepeat,
    });
    setSavedNotice(
      `Saved (${status}) for ${activePatient.name}. Updated in Patient Eye Screening & Care Plan.`
    );
    setTimeout(() => setSavedNotice(''), 4500);
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="Retinal Screening Workspace"
      pageSubtitle="Diagnostic-style fundus review queue — simulated AI observations require clinician confirmation."
    >
      <div className="space-y-5">
        <DemoNoticeBanner
          message="Retinal fundus imagery is illustrative sample artwork. Simulated AI findings are never automatically converted into confirmed clinical diagnoses."
          tags={['Illustrative Fundus Graphics', 'Doctor Confirmation Required']}
        />

        {/* Screening Queue Selector Strip */}
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between gap-2 mb-3">
            <h2 className="text-xs font-semibold text-[#0B1F3A] uppercase tracking-wider">
              Patient Retinal Screening Queue
            </h2>
            <span className="text-xs text-slate-500">
              Select a patient to inspect screening history
            </span>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {patients.map((p) => {
              const latest = p.retinalScreenings[p.retinalScreenings.length - 1];
              const isSelected = p.id === activePatient.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPatientId(p.id)}
                  className={`shrink-0 text-left px-3 py-2 rounded-md border text-xs transition-colors ${
                    isSelected
                      ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <div className="font-semibold whitespace-nowrap">
                    {p.name}{' '}
                    <span className="font-mono text-[10px] opacity-75">
                      {p.id}
                    </span>
                  </div>
                  <div
                    className={`text-[11px] mt-0.5 whitespace-nowrap ${
                      isSelected ? 'text-teal-200' : 'text-slate-500'
                    }`}
                  >
                    {latest
                      ? `${latest.possibleStage} · ${
                          latest.reviewStatus === 'Physician Reviewed'
                            ? 'Reviewed'
                            : 'Pending'
                        }`
                      : 'No screening'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Workspace: Left Image Panels + Right Clinical Assessment */}
        {!latestScreening ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center space-y-2">
            <FileWarning className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="text-sm font-semibold text-[#0B1F3A]">
              No Retinal Screening Recorded for {activePatient.name}
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              This patient does not have a retinal fundus examination on file. Use Clinical Decision Support or Care Plan coordination to request an initial screening.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            {/* LEFT PANEL (7 cols): Retinal Images & Stage Reference */}
            <div className="xl:col-span-7 space-y-5">
              <div className="flex items-center justify-between gap-2 bg-white px-4 py-3 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#0B1F3A]">
                  <Eye className="w-4 h-4 text-[#0D9488]" />
                  <span>
                    {activePatient.name} · {latestScreening.eye}
                  </span>
                </div>
                <div className="inline-flex items-center p-0.5 rounded-md bg-slate-100 text-xs">
                  <button
                    type="button"
                    onClick={() => setCompareMode('compare')}
                    className={`px-2.5 py-1 rounded font-medium ${
                      compareMode === 'compare'
                        ? 'bg-white text-[#0B1F3A] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Compare Prior & Latest
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareMode('latest')}
                    className={`px-2.5 py-1 rounded font-medium ${
                      compareMode === 'latest'
                        ? 'bg-white text-[#0B1F3A] shadow-xs'
                        : 'text-slate-600'
                    }`}
                  >
                    Latest Single View
                  </button>
                </div>
              </div>

              {compareMode === 'compare' && prevScreening ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <RetinalFundusViewer
                    title="Prior Screening Example"
                    subtitle={`${formatShortDate(prevScreening.date)} · ${prevScreening.possibleStage}`}
                    variant={prevScreening.exampleVariant}
                    lesions={prevScreening.lesions}
                    defaultShowOverlays={false}
                    compact
                  />
                  <RetinalFundusViewer
                    title="Recent Screening Example"
                    subtitle={`${formatShortDate(latestScreening.date)} · ${latestScreening.possibleStage}`}
                    variant={latestScreening.exampleVariant}
                    lesions={latestScreening.lesions}
                    defaultShowOverlays={true}
                    compact
                  />
                </div>
              ) : (
                <RetinalFundusViewer
                  title="Latest Screening Visualization"
                  subtitle={`${formatShortDate(latestScreening.date)} · ${latestScreening.possibleStage}`}
                  variant={latestScreening.exampleVariant}
                  lesions={latestScreening.lesions}
                  defaultShowOverlays={true}
                />
              )}

              {/* Stage Classification Reference Diagram */}
              <div className="bg-white rounded-lg border border-slate-200 p-4 space-y-2.5">
                <div className="text-xs font-semibold text-[#0B1F3A]">
                  Clinical Retinopathy Stage Spectrum (Reference Only)
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {RETINAL_STAGES.map((stage) => {
                    const isSimulated = latestScreening.possibleStage === stage;
                    const isConfirmed = latestScreening.doctorAssessment === stage;
                    return (
                      <div
                        key={stage}
                        className={`p-2 rounded border text-[11px] ${
                          isConfirmed
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold'
                            : isSimulated
                            ? 'bg-amber-50 border-amber-300 text-amber-950 font-semibold'
                            : 'bg-slate-50 border-slate-200 text-slate-600'
                        }`}
                      >
                        <div>{stage}</div>
                        {isSimulated && (
                          <div className="text-[10px] font-normal mt-0.5 text-amber-700">
                            Sim. AI Signal
                          </div>
                        )}
                        {isConfirmed && (
                          <div className="text-[10px] font-normal mt-0.5 text-emerald-700">
                            Doctor Assessment
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* RIGHT PANEL (5 cols): Patient Summary, Simulated Evidence, Physician Actions */}
            <div className="xl:col-span-5 space-y-5">
              <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-[#0B1F3A]">
                      Evidence & Physician Review Controls
                    </h3>
                    <p className="text-xs text-slate-500">
                      {activePatient.age} yrs · {activePatient.conditions.join(', ')}
                    </p>
                  </div>
                  <StatusBadge label={latestScreening.reviewStatus} compact />
                </div>

                {/* Simulated AI Observation */}
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                  <div className="font-semibold text-[#0B1F3A]">
                    Simulated AI Screening Observation ({formatShortDate(latestScreening.date)})
                  </div>
                  <p className="text-slate-700 leading-relaxed">
                    {latestScreening.simulatedObservation}
                  </p>
                  <div className="text-[11px] text-amber-800 font-medium">
                    Preliminary Category: Possible {latestScreening.possibleStage} (Unconfirmed)
                  </div>
                </div>

                {/* Physician Assessment Form */}
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Doctor&apos;s Clinical Assessment
                    </label>
                    <select
                      value={assessment}
                      onChange={(e) => setAssessment(e.target.value)}
                      className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-900"
                    >
                      {RETINAL_STAGES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                      <option value="Inconclusive — Repeat Photography Required">
                        Inconclusive — Repeat Photography Required
                      </option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={specialistReq}
                        onChange={(e) => setSpecialistReq(e.target.checked)}
                        className="rounded border-slate-300 text-[#0D9488]"
                      />
                      <span>Request Ophthalmology Specialist Review</span>
                    </label>
                    <label className="inline-flex items-center gap-2 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={repeatReq}
                        onChange={(e) => setRepeatReq(e.target.checked)}
                        className="rounded border-slate-300 text-[#0D9488]"
                      />
                      <span>Request Repeat Retinal Screening</span>
                    </label>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Physician Review Note (Shared with Patient Record)
                    </label>
                    <textarea
                      rows={3}
                      value={doctorNote}
                      onChange={(e) => setDoctorNote(e.target.value)}
                      placeholder="Document direct retinal findings, comparison with prior scan, and follow-up plan..."
                      className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSave('Physician Reviewed')}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54] transition-colors"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                    <span>Confirm Reviewed Observations</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSave(
                        'Physician Reviewed',
                        assessment === latestScreening.possibleStage
                          ? 'No apparent retinopathy'
                          : assessment
                      )
                    }
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B1F3A] hover:bg-slate-50"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                    <span>Record Different Assessment</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSpecialistReq(true);
                      handleSave('Follow-up Requested', assessment, true, repeatReq);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span>Request Specialist Review</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRepeatReq(true);
                      handleSave('Follow-up Requested', assessment, specialistReq, true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <span>Request Repeat Screening</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSave(latestScreening.reviewStatus)}
                    className="sm:col-span-2 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-[#0F766E] transition-colors"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Save Review Note</span>
                  </button>
                </div>

                {savedNotice && (
                  <div className="p-3 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 font-medium">
                    {savedNotice}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
};
