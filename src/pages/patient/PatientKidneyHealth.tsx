import React, { useState } from 'react';
import { HeartPulse, ShieldAlert } from 'lucide-react';
import {
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

type MonthWindow = 3 | 6 | 12;

export const PatientKidneyHealth: React.FC = () => {
  const { patients } = useAurelix();
  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];
  const analysis = analyzePatientRisk(patient);

  const [months, setMonths] = useState<MonthWindow>(12);

  const nowMs = Date.now();
  const cutoffMs = nowMs - months * 31 * 24 * 3600 * 1000;
  const filteredLabs = patient.labs.filter(
    (l) => new Date(`${l.date}T12:00:00`).getTime() >= cutoffMs
  );
  const displayLabs = filteredLabs.length >= 2 ? filteredLabs : patient.labs.slice(-2);

  const latestLab = patient.labs[patient.labs.length - 1];

  // Historical eGFR + clearly separated illustrative forecast section
  const trendWithForecast = [
    ...displayLabs.map((l) => ({
      label: formatShortDate(l.date),
      observedEgfr: l.egfr,
      illustrativeProjection: null as number | null,
      uacr: l.uacr,
      creatinine: l.creatinine,
    })),
    {
      label: '+3 mo (Illustrative)',
      observedEgfr: null as number | null,
      illustrativeProjection: Math.max(40, (latestLab?.egfr ?? 72) - 2),
      uacr: null as number | null,
      creatinine: null as number | null,
    },
    {
      label: '+6 mo (Illustrative)',
      observedEgfr: null as number | null,
      illustrativeProjection: Math.max(38, (latestLab?.egfr ?? 72) - 4),
      uacr: null as number | null,
      creatinine: null as number | null,
    },
  ];
  // Connect last observed point to projection seamlessly
  if (displayLabs.length > 0) {
    const lastIdx = displayLabs.length - 1;
    trendWithForecast[lastIdx].illustrativeProjection =
      trendWithForecast[lastIdx].observedEgfr ?? null;
  }

  const bpTrend =
    months === 3
      ? patient.vitals30d
      : months === 6
      ? patient.vitals6m
      : patient.vitals12m;

  return (
    <PortalLayout
      role="patient"
      pageTitle="Kidney Health Monitoring"
      pageSubtitle="Longitudinal eGFR, albuminuria (UACR), serum creatinine, and blood pressure trends."
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          title="Clinical Interpretation Notice"
          message="Only a qualified physician can confirm chronic kidney disease or determine its stage, which requires longitudinal evidence of chronicity."
          tags={['Illustrative Interpretation', 'Physician Review Required']}
        />

        {/* Filter & Top Summary Strip */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-slate-100 text-[#0B1F3A]">
              <HeartPulse className="w-5 h-5 text-[#0D9488]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  Longitudinal Kidney Risk Signal
                </h2>
                <StatusBadge label={`${analysis.kidney.level} Signal`} compact />
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Latest eGFR: <strong className="tabular-nums">{latestLab?.egfr} mL/min/1.73 m²</strong> · UACR:{' '}
                <strong className="tabular-nums">{latestLab?.uacr} mg/g</strong> · Creatinine:{' '}
                <strong className="tabular-nums">{latestLab?.creatinine} mg/dL</strong>
              </p>
            </div>
          </div>

          <div className="inline-flex items-center p-1 rounded-lg bg-slate-100">
            {([3, 6, 12] as MonthWindow[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMonths(m)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  months === m
                    ? 'bg-white text-[#0B1F3A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {m} Months
              </button>
            ))}
          </div>
        </div>

        {/* Kidney Health Trend + Illustrative Forecast */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Kidney Health Trend (eGFR)
                </h3>
                <p className="text-xs text-slate-500">
                  Solid line shows recorded laboratory values; dashed segment is an illustrative demonstration only (not a clinically validated progression estimate).
                </p>
              </div>
            </div>
            <div className="h-[270px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={trendWithForecast}
                  margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis
                    domain={[45, 100]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    unit=" eGFR"
                    width={65}
                    axisLine={false}
                    tickLine={false}
                  />
                  <ReferenceLine
                    y={60}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    label={{ value: '60 threshold', position: 'insideBottomRight', fontSize: 10, fill: '#B45309' }}
                  />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="observedEgfr"
                    name="Observed eGFR (mL/min/1.73m²)"
                    stroke="#0B1F3A"
                    strokeWidth={2.5}
                    dot={{ r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="illustrativeProjection"
                    name="Illustrative Demo Trajectory (Unvalidated)"
                    stroke="#94A3B8"
                    strokeWidth={2}
                    strokeDasharray="6 4"
                    dot={{ r: 3, fill: '#94A3B8' }}
                    connectNulls={false}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* UACR & Creatinine History */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Albuminuria (UACR) Progression
              </h3>
              <p className="text-xs text-slate-500">
                Urine albumin-to-creatinine ratio (mg/g)
              </p>
            </div>
            <div className="h-[180px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={displayLabs.map((l) => ({
                    label: formatShortDate(l.date),
                    uacr: l.uacr,
                  }))}
                  margin={{ top: 8, right: 12, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis domain={[0, 65]} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <ReferenceLine y={30} stroke="#D97706" strokeDasharray="4 4" />
                  <Tooltip
                    contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                    formatter={(v) => [`${v} mg/g`, 'UACR']}
                  />
                  <Line
                    type="monotone"
                    dataKey="uacr"
                    stroke="#D97706"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: '#D97706' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-2 border-t border-slate-100 space-y-1.5 text-xs">
              {displayLabs.map((l) => (
                <div key={l.id} className="flex items-center justify-between text-slate-600">
                  <span>{formatShortDate(l.date)}</span>
                  <span className="font-mono tabular-nums">
                    Cr {l.creatinine} mg/dL · UACR {l.uacr} mg/g
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KDIGO Grid + Contributing Factors & Blood Pressure */}
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
                Factors Included in Simulated Monitoring
              </h3>
              <p className="text-xs text-slate-500">
                Observations reviewed alongside blood pressure trends ({months}-month window).
              </p>
            </div>
            <div className="divide-y divide-slate-100">
              {analysis.kidney.factors.map((f) => (
                <div key={f.factor} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="font-semibold text-[#0B1F3A]">{f.factor}</div>
                    <div className="text-slate-500 mt-0.5">{f.detail}</div>
                  </div>
                  <span
                    className={`font-mono tabular-nums font-medium shrink-0 ${
                      f.direction === 'increases_risk'
                        ? 'text-amber-700'
                        : f.direction === 'protective'
                        ? 'text-emerald-700'
                        : 'text-slate-600'
                    }`}
                  >
                    {f.impact > 0 ? `+${f.impact}` : f.impact} pts
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100">
              <div className="text-xs font-semibold text-[#0B1F3A] mb-2">
                Blood Pressure Context ({months} Months)
              </div>
              <div className="h-[130px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bpTrend} margin={{ top: 4, right: 12, left: -18, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis domain={[65, 160]} tick={{ fontSize: 10, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#0B1F3A" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#0D9488" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="flex items-start gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
              <ShieldAlert className="w-4 h-4 text-[#0B1F3A] shrink-0" />
              <span>
                Only Dr. Maya Tan can confirm chronic kidney disease or determine staging after evaluating repeat laboratory evidence.
              </span>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
