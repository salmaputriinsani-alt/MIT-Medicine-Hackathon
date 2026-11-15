import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  HeartPulse,
  Sliders,
} from 'lucide-react';
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { KdigoRiskGrid } from '../../components/KdigoRiskGrid';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { analyzePatientRisk } from '../../services/simulatedAiEngine';
import { formatShortDate } from '../../utils/dateUtils';

export const DoctorKidneyIntelligence: React.FC = () => {
  const {
    patients,
    selectedPatientId,
    setSelectedPatientId,
    saveKidneyReview,
  } = useAurelix();

  const patient =
    patients.find((p) => p.id === selectedPatientId) ?? patients[0];
  const analysis = analyzePatientRisk(patient);
  const latestLab = patient.labs[patient.labs.length - 1];
  const latestVital = patient.vitals24h[patient.vitals24h.length - 1];

  // Hypothetical Scenario Sandbox Sliders
  const [simBp, setSimBp] = useState<number>(latestVital?.systolic ?? 136);
  const [simHba1c, setSimHba1c] = useState<number>(latestLab?.hba1c ?? 7.4);
  const [simUacr, setSimUacr] = useState<number>(latestLab?.uacr ?? 44);

  const [interpretationNote, setInterpretationNote] = useState('');
  const [savedMsg, setSavedMsg] = useState('');

  useEffect(() => {
    setSimBp(latestVital?.systolic ?? 136);
    setSimHba1c(latestLab?.hba1c ?? 7.4);
    setSimUacr(latestLab?.uacr ?? 44);
    setInterpretationNote('');
    setSavedMsg('');
  }, [patient.id]);

  // Build Kidney Trend Analysis + Illustrative Forecast Sandbox
  const baseEgfr = latestLab?.egfr ?? 72;
  // Illustrative sensitivity adjustment (purely visual demonstration)
  const bpFactor = (simBp - 125) * 0.08;
  const hba1cFactor = (simHba1c - 7.0) * 0.6;
  const uacrFactor = (simUacr - 30) * 0.03;
  const annualIllustrativeSlope = Math.max(
    0.5,
    Math.min(9.5, 2.2 + bpFactor + hba1cFactor + uacrFactor)
  );

  const chartSeries = [
    ...patient.labs.map((l) => ({
      label: formatShortDate(l.date),
      observedEgfr: l.egfr ?? null,
      sandboxMean: null as number | null,
      sandboxBand: null as [number, number] | null,
    })),
    {
      label: '+6 mo (Sim.)',
      observedEgfr: null as number | null,
      sandboxMean: Number(
        Math.max(20, baseEgfr - annualIllustrativeSlope * 0.5).toFixed(1)
      ),
      sandboxBand: [
        Number(
          Math.max(15, baseEgfr - annualIllustrativeSlope * 0.5 - 3.5).toFixed(1)
        ),
        Number(
          Math.min(110, baseEgfr - annualIllustrativeSlope * 0.5 + 3.0).toFixed(1)
        ),
      ] as [number, number],
    },
    {
      label: '+12 mo (Sim.)',
      observedEgfr: null as number | null,
      sandboxMean: Number(
        Math.max(18, baseEgfr - annualIllustrativeSlope).toFixed(1)
      ),
      sandboxBand: [
        Number(Math.max(12, baseEgfr - annualIllustrativeSlope - 5.5).toFixed(1)),
        Number(
          Math.min(110, baseEgfr - annualIllustrativeSlope + 4.5).toFixed(1)
        ),
      ] as [number, number],
    },
  ];
  if (patient.labs.length > 0 && latestLab?.egfr !== undefined) {
    const lastIdx = patient.labs.length - 1;
    chartSeries[lastIdx].sandboxMean = latestLab.egfr;
    chartSeries[lastIdx].sandboxBand = [latestLab.egfr, latestLab.egfr];
  }

  const handleAction = (requestTesting: boolean) => {
    const note =
      interpretationNote.trim() ||
      (requestTesting
        ? 'Requested repeat serum creatinine, eGFR, and morning UACR to verify longitudinal chronicity.'
        : `Reviewed longitudinal eGFR (${latestLab?.egfr}) and UACR (${latestLab?.uacr} mg/g) markers.`);
    saveKidneyReview(patient.id, note, requestTesting);
    setSavedMsg(
      requestTesting
        ? `Repeat renal testing requested for ${patient.name} and added to patient Care Plan.`
        : `Kidney monitoring interpretation saved for ${patient.name}.`
    );
    setTimeout(() => setSavedMsg(''), 4500);
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="Kidney Intelligence"
      pageSubtitle="Longitudinal eGFR, albuminuria, KDIGO matrix, and illustrative forecast sandbox."
      headerAction={
        <select
          value={patient.id}
          onChange={(e) => setSelectedPatientId(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-slate-300 bg-white text-xs font-medium text-[#0B1F3A]"
          aria-label="Select patient"
        >
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.id})
            </option>
          ))}
        </select>
      }
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="Observed history uses synthetic laboratory dates. The forecast sandbox is an illustrative simulation only — not a validated patient-specific progression model."
          tags={['Simulated Sandbox', 'Physician Judgment Required']}
        />

        {/* Data Availability Check Banner */}
        {!analysis.kidney.hasSufficientData ? (
          <div className="p-4 rounded-lg bg-amber-50 border border-amber-300 flex items-start gap-3 text-xs text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold">
                Data Availability Check: Missing Required Renal Markers
              </div>
              <p className="mt-0.5">
                {patient.name} ({patient.id}) is missing paired UACR or eGFR measurements ({patient.missingDataNotes.join(' ')}). Complete laboratory data is required before interpreting kidney risk categories.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <HeartPulse className="w-5 h-5 text-[#0D9488]" />
              <div className="text-xs">
                <div className="font-semibold text-[#0B1F3A]">
                  {patient.name} ({patient.id}) · Data Availability Check Passed
                </div>
                <div className="text-slate-500 mt-0.5 tabular-nums">
                  Latest eGFR: <strong>{latestLab?.egfr}</strong> mL/min/1.73m² · UACR:{' '}
                  <strong>{latestLab?.uacr}</strong> mg/g · Creatinine:{' '}
                  <strong>{latestLab?.creatinine}</strong> mg/dL · BP:{' '}
                  <strong>
                    {latestVital?.systolic}/{latestVital?.diastolic}
                  </strong>{' '}
                  mmHg
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge label={`${analysis.kidney.level} Signal`} compact />
              <StatusBadge label={patient.reviewStatus} compact />
            </div>
          </div>
        )}

        {/* Kidney Trend Analysis + Illustrative Forecast Sandbox */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  KIDNEY TREND ANALYSIS &amp; ILLUSTRATIVE FORECAST SANDBOX
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Illustrative simulation — not a validated patient-specific forecast. Shaded band reflects hypothetical scenario uncertainty.
                </p>
              </div>
            </div>

            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={chartSeries}
                  margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    domain={[25, 110]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    unit=" eGFR"
                    width={64}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    label={{ value: 'eGFR 60', position: 'insideBottomRight', fontSize: 10, fill: '#B45309' }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Area
                    type="monotone"
                    dataKey="sandboxBand"
                    name="Illustrative Uncertainty Band"
                    fill="#94A3B8"
                    fillOpacity={0.22}
                    stroke="none"
                  />
                  <Line
                    type="monotone"
                    dataKey="observedEgfr"
                    name="Observed Historical eGFR"
                    stroke="#0B1F3A"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sandboxMean"
                    name="Illustrative Sandbox Trajectory"
                    stroke="#0891B2"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 4, fill: '#0891B2' }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Scenario Testing Sliders */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#0D9488]" />
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Hypothetical Scenario Controls
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Adjust hypothetical inputs to observe sandbox sensitivity. Does not establish causal clinical effects or treatment outcomes.
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Hypothetical Systolic BP</span>
                  <span className="font-mono tabular-nums text-[#0B1F3A]">
                    {simBp} mmHg
                  </span>
                </div>
                <input
                  type="range"
                  min={105}
                  max={170}
                  value={simBp}
                  onChange={(e) => setSimBp(Number(e.target.value))}
                  className="w-full accent-[#0D9488]"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Hypothetical HbA1c</span>
                  <span className="font-mono tabular-nums text-[#0B1F3A]">
                    {simHba1c.toFixed(1)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={5.8}
                  max={10.5}
                  step={0.1}
                  value={simHba1c}
                  onChange={(e) => setSimHba1c(Number(e.target.value))}
                  className="w-full accent-[#0D9488]"
                />
              </div>

              <div>
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span>Hypothetical UACR</span>
                  <span className="font-mono tabular-nums text-[#0B1F3A]">
                    {simUacr} mg/g
                  </span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={300}
                  step={2}
                  value={simUacr}
                  onChange={(e) => setSimUacr(Number(e.target.value))}
                  className="w-full accent-[#0D9488]"
                />
              </div>
            </div>

            <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              Illustrative 12-month sandbox shift:{' '}
              <strong className="font-mono tabular-nums text-[#0B1F3A]">
                -{annualIllustrativeSlope.toFixed(1)} mL/min/1.73m²
              </strong>{' '}
              (educational visual only).
            </div>
          </div>
        </div>

        {/* KDIGO Matrix + UACR/Creatinine & Physician Review Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <KdigoRiskGrid
              kdigoG={analysis.kidney.kdigoG}
              kdigoA={analysis.kidney.kdigoA}
              latestEgfr={analysis.kidney.latestEgfr}
              latestUacr={analysis.kidney.latestUacr}
            />
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                UACR Progression &amp; Clinical Documentation
              </h3>
              <p className="text-xs text-slate-500">
                Explainability signals and physician review controls.
              </p>
            </div>

            <div className="h-[150px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={patient.labs.map((l) => ({
                    label: formatShortDate(l.date),
                    uacr: l.uacr,
                    creatinine: l.creatinine,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="uacr"
                    name="UACR (mg/g)"
                    stroke="#D97706"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2.5 text-xs">
              <label className="block font-semibold text-slate-700">
                Clinician Interpretation Note
              </label>
              <textarea
                rows={2}
                value={interpretationNote}
                onChange={(e) => setInterpretationNote(e.target.value)}
                placeholder="Document clinical context, chronicity assessment, or repeat test rationale..."
                className="w-full px-3 py-2 rounded-md border border-slate-300"
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleAction(true)}
                  className="px-3.5 py-2 rounded-md border border-slate-200 bg-white text-[#0B1F3A] font-medium hover:bg-slate-50"
                >
                  Request Additional Renal Testing
                </button>
                <button
                  type="button"
                  onClick={() => handleAction(false)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-[#0B1F3A] text-white font-medium hover:bg-[#132F54]"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#2DD4BF]" />
                  <span>Mark Kidney Record Reviewed</span>
                </button>
              </div>
              {savedMsg && (
                <div className="p-2.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-900 font-medium">
                  {savedMsg}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
