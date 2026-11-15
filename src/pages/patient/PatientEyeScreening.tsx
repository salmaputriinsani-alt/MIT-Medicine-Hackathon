import React, { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Eye,
  Info,
  Upload,
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { RetinalFundusViewer } from '../../components/RetinalFundusViewer';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { RetinalStage } from '../../types/clinical';
import { formatShortDate } from '../../utils/dateUtils';

const STAGES: { stage: RetinalStage; description: string }[] = [
  {
    stage: 'No apparent retinopathy',
    description: 'No visible microaneurysms or retinal vessel abnormalities on exam.',
  },
  {
    stage: 'Mild NPDR',
    description: 'Isolated microaneurysm-like dots; routine monitoring advised by clinician.',
  },
  {
    stage: 'Moderate NPDR',
    description: 'More than microaneurysms alone; possible dot-blot hemorrhages or exudates.',
  },
  {
    stage: 'Severe NPDR',
    description: 'Widespread intraretinal hemorrhages or venous beading requiring prompt specialist review.',
  },
  {
    stage: 'Proliferative DR',
    description: 'Neovascular changes requiring urgent ophthalmologic management.',
  },
];

export const PatientEyeScreening: React.FC = () => {
  const { patients } = useAurelix();
  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];

  const prevScreening = patient.retinalScreenings[0];
  const latestScreening =
    patient.retinalScreenings[patient.retinalScreenings.length - 1];

  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [localFileName, setLocalFileName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLocalFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setLocalPreviewUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <PortalLayout
      role="patient"
      pageTitle="Eye Screening & Retinal Monitoring"
      pageSubtitle="Longitudinal diabetic retinopathy screening history and physician-reviewed status."
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="Retinal fundus panels below use illustrative synthetic graphics. All overlays are educational and do not represent live automated medical image inference."
          tags={['Illustrative Sample Graphics', 'Physician Review Required']}
        />

        {/* Top Summary Status Bar */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <Eye className="w-4 h-4 text-[#0D9488]" />
              <h2 className="text-base font-semibold text-[#0B1F3A]">
                {latestScreening?.doctorAssessment
                  ? `Physician-Reviewed Result: ${latestScreening.doctorAssessment}`
                  : `Latest Screening Result: Possible ${
                      latestScreening?.possibleStage.toLowerCase() ?? 'observation'
                    } — unconfirmed`}
              </h2>
              <StatusBadge
                label={latestScreening?.reviewStatus ?? 'Pending Review'}
              />
            </div>
            <p className="text-xs text-slate-600">
              Latest scan date:{' '}
              <strong>
                {latestScreening ? formatShortDate(latestScreening.date) : '—'}
              </strong>{' '}
              · {latestScreening?.eye ?? 'Bilateral'} · Assigned physician:{' '}
              {patient.assignedDoctor}
            </p>
          </div>
        </div>

        {/* Side-by-Side Comparison Panels */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RetinalFundusViewer
            title="Previous Screening Example"
            subtitle={
              prevScreening
                ? `${formatShortDate(prevScreening.date)} · ${prevScreening.possibleStage}`
                : 'No prior exam'
            }
            variant={prevScreening?.exampleVariant ?? 'normal'}
            lesions={prevScreening?.lesions ?? []}
            defaultShowOverlays={false}
          />
          <RetinalFundusViewer
            title="Recent Screening Example"
            subtitle={
              latestScreening
                ? `${formatShortDate(latestScreening.date)} · ${
                    latestScreening.isUnconfirmed
                      ? `Possible ${latestScreening.possibleStage} (Unconfirmed)`
                      : latestScreening.doctorAssessment ?? latestScreening.possibleStage
                  }`
                : 'No recent exam'
            }
            variant={latestScreening?.exampleVariant ?? 'mild_npdr'}
            lesions={latestScreening?.lesions ?? []}
            defaultShowOverlays={true}
          />
        </div>

        {/* Physician-Confirmed Report & Clinical Stage Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Physician Report Panel */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-[#0B1F3A]">
              Physician Review Report
            </h3>
            {latestScreening?.reviewStatus === 'Physician Reviewed' ? (
              <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 space-y-2 text-xs text-emerald-950">
                <div className="flex items-center gap-2 font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>
                    Reviewed by {latestScreening.reviewedBy ?? 'Dr. Maya Tan'} on{' '}
                    {formatShortDate(latestScreening.reviewedAt ?? '')}
                  </span>
                </div>
                <p>
                  <strong>Recorded Clinical Assessment:</strong>{' '}
                  {latestScreening.doctorAssessment}
                </p>
                {latestScreening.doctorNote && (
                  <p className="leading-relaxed">{latestScreening.doctorNote}</p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-50 border border-amber-200 space-y-2 text-xs text-amber-950">
                <div className="flex items-center gap-2 font-semibold">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Awaiting Physician Confirmation</span>
                </div>
                <p className="leading-relaxed">
                  {latestScreening?.simulatedObservation} These clinical categories are used for review and education — not an automated diagnosis. Once Dr. Maya Tan completes her review, her confirmed report will appear here automatically.
                </p>
                {latestScreening?.doctorNote && (
                  <p className="pt-1 border-t border-amber-200/80">
                    <strong>Clinician Note:</strong> {latestScreening.doctorNote}
                  </p>
                )}
              </div>
            )}

            {/* Screening History Table */}
            <div>
              <h4 className="text-xs font-semibold text-slate-700 mb-2">
                Screening Timeline
              </h4>
              <div className="border border-slate-200 rounded-md overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3 text-left font-semibold">Date</th>
                      <th className="py-2 px-3 text-left font-semibold">Observation</th>
                      <th className="py-2 px-3 text-left font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {[...patient.retinalScreenings].reverse().map((s) => (
                      <tr key={s.id}>
                        <td className="py-2.5 px-3 tabular-nums text-slate-700">
                          {formatShortDate(s.date)}
                        </td>
                        <td className="py-2.5 px-3 text-slate-800">
                          {s.doctorAssessment ?? `${s.possibleStage} (unconfirmed)`}
                        </td>
                        <td className="py-2.5 px-3">
                          <StatusBadge label={s.reviewStatus} compact />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Retinopathy Clinical Categories & Education */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Diabetic Retinopathy Reference Categories
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Standard clinical categories used for physician communication and education.
              </p>
            </div>
            <div className="space-y-2">
              {STAGES.map((item) => {
                const isCurrent =
                  (latestScreening?.doctorAssessment ?? latestScreening?.possibleStage) ===
                  item.stage;
                return (
                  <div
                    key={item.stage}
                    className={`p-3 rounded-md border text-xs ${
                      isCurrent
                        ? 'bg-teal-50/70 border-teal-300'
                        : 'bg-slate-50/60 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0B1F3A]">
                        {item.stage}
                      </span>
                      {isCurrent && (
                        <span className="text-[11px] font-semibold text-teal-800">
                          {latestScreening?.reviewStatus === 'Physician Reviewed'
                            ? 'Doctor Assessment'
                            : 'Possible (Unconfirmed)'}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 mt-1">{item.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* How Screening Works + Local Image Preview Uploader */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-[#0D9488]" />
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                How Retinal Screening Works
              </h3>
            </div>
            <ol className="list-decimal pl-4 space-y-2 text-xs text-slate-600 leading-relaxed">
              <li>
                <strong>Fundus Photography:</strong> Specialized retinal cameras capture the optic disc, macula, and blood vessels at the back of your eye without surgery.
              </li>
              <li>
                <strong>Preliminary Triage Assistance:</strong> Decision-support software highlights potential vessel spots (such as microaneurysms or exudates) to prioritize clinician review queues.
              </li>
              <li>
                <strong>Clinician Verification:</strong> A qualified physician or ophthalmologist inspects the images, compares them against your prior year, and confirms any follow-up plan.
              </li>
            </ol>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Local Image Preview (No Live AI Analysis)
              </h3>
              <span className="text-[11px] text-slate-500">Local browser only</span>
            </div>
            <p className="text-xs text-slate-600">
              You may preview a local fundus image file here. Live AI image inference is not connected in this frontend prototype — no automated screening result will be generated for uploaded files.
            </p>
            <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 cursor-pointer text-xs font-medium text-[#0B1F3A] transition-colors">
              <Upload className="w-4 h-4 text-[#0D9488]" />
              <span>{localFileName ? `Selected: ${localFileName}` : 'Choose local image to preview'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
            {localPreviewUrl && (
              <div className="mt-2 p-3 rounded-lg border border-slate-200 bg-slate-50 flex items-center gap-4">
                <img
                  src={localPreviewUrl}
                  alt="Local retinal preview"
                  className="w-20 h-20 rounded object-cover border border-slate-300"
                />
                <div className="text-xs text-slate-600 space-y-1">
                  <div className="font-semibold text-[#0B1F3A]">{localFileName}</div>
                  <div>
                    Local preview only · Live AI retinal image analysis is disabled in this demo.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
