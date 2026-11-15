import React, { useState } from 'react';
import {
  Activity,
  Eye,
  HeartPulse,
  HelpCircle,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { analyzePatientRisk } from '../../services/simulatedAiEngine';
import { formatShortDate } from '../../utils/dateUtils';

export const PatientAiInsights: React.FC = () => {
  const { patients } = useAurelix();
  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];
  const analysis = analyzePatientRisk(patient);

  const [flaggedDrawer, setFlaggedDrawer] = useState<
    'diabetes' | 'kidney' | 'retinal' | null
  >(null);

  const factorChartData = analysis.kidney.factors.map((f) => ({
    name: f.factor,
    impact: f.impact,
    detail: f.detail,
    direction: f.direction,
  }));

  return (
    <PortalLayout
      role="patient"
      pageTitle="Understand your health trends"
      pageSubtitle="Transparent, explainable demonstration insights organized for physician review."
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          title="Important Medical Disclaimer"
          message="AI-generated demonstration insights are not medical diagnoses. Your doctor reviews clinical findings and determines appropriate care."
          tags={['Simulated AI Assessment', 'Not for Clinical Use']}
        />

        {/* Three Illustrated AI Monitoring Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 1. Diabetes Control Patterns */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0D9488]" />
                  <h2 className="text-sm font-semibold text-[#0B1F3A]">
                    Diabetes Control Patterns
                  </h2>
                </div>
                <StatusBadge label={`${analysis.diabetes.level} Signal`} compact />
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                <span className="text-slate-500">Trend Direction</span>
                <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5" />
                  {analysis.diabetes.trend} (HbA1c {analysis.diabetes.latestHba1c}%)
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {analysis.diabetes.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Analyzed {formatShortDate(analysis.diabetes.lastAnalyzed)}</span>
                <StatusBadge label={analysis.diabetes.reviewStatus} compact />
              </div>
              <button
                type="button"
                onClick={() => setFlaggedDrawer('diabetes')}
                className="w-full py-2 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-[#0B1F3A] flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Why was this noted?</span>
              </button>
            </div>
          </div>

          {/* 2. Kidney Health Risk Signals */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-amber-600" />
                  <h2 className="text-sm font-semibold text-[#0B1F3A]">
                    Kidney Health Risk Signals
                  </h2>
                </div>
                <StatusBadge label={`${analysis.kidney.level} Signal`} compact />
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                <span className="text-slate-500">Trend Direction</span>
                <span className="font-semibold text-amber-700 inline-flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {analysis.kidney.trend}
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {analysis.kidney.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Analyzed {formatShortDate(analysis.kidney.lastAnalyzed)}</span>
                <StatusBadge label={analysis.kidney.reviewStatus} compact />
              </div>
              <button
                type="button"
                onClick={() => setFlaggedDrawer('kidney')}
                className="w-full py-2 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-[#0B1F3A] flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Why was this flagged?</span>
              </button>
            </div>
          </div>

          {/* 3. Retinal Screening Observations */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#0B1F3A]" />
                  <h2 className="text-sm font-semibold text-[#0B1F3A]">
                    Retinal Screening Observations
                  </h2>
                </div>
                <StatusBadge label={`${analysis.retinal.level} Signal`} compact />
              </div>

              <div className="flex items-center justify-between text-xs py-2 border-y border-slate-100">
                <span className="text-slate-500">Illustrative Category</span>
                <span className="font-semibold text-[#0B1F3A]">
                  {analysis.retinal.latestStage}
                  {analysis.retinal.isUnconfirmed ? ' (Unconfirmed)' : ''}
                </span>
              </div>

              <ul className="space-y-1.5 text-xs text-slate-600 list-disc pl-4">
                {analysis.retinal.observations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  Screened{' '}
                  {analysis.retinal.screeningDate
                    ? formatShortDate(analysis.retinal.screeningDate)
                    : '—'}
                </span>
                <StatusBadge label={analysis.retinal.reviewStatus} compact />
              </div>
              <button
                type="button"
                onClick={() => setFlaggedDrawer('retinal')}
                className="w-full py-2 px-3 rounded-md border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-[#0B1F3A] flex items-center justify-center gap-1.5 transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Why was this flagged?</span>
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Explainability Factor Contribution Chart */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Illustrative factors influencing the demo risk assessment
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Transparent threshold-based demonstration showing how eGFR, UACR, blood pressure, diabetes duration, and HbA1c trend contribute to the simulated kidney-risk signal. Positive values increase simulated attention priority; negative values are protective.
              </p>
            </div>
            <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              Simulated Demo Logic · Not Validated Feature Attribution
            </span>
          </div>

          <div className="h-[260px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={factorChartData}
                layout="vertical"
                margin={{ top: 6, right: 28, left: 20, bottom: 6 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis
                  type="number"
                  domain={[-15, 35]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={185}
                  tick={{ fontSize: 11, fill: '#0F172A' }}
                  tickLine={false}
                />
                <ReferenceLine x={0} stroke="#475569" />
                <Tooltip
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                  formatter={(val, _name, item) => [
                    `${Number(val) > 0 ? `+${val}` : val} illustrative pts`,
                    item.payload.detail,
                  ]}
                />
                <Bar dataKey="impact" radius={[0, 4, 4, 0]} maxBarSize={24}>
                  {factorChartData.map((entry, idx) => (
                    <Cell
                      key={idx}
                      fill={
                        entry.impact > 15
                          ? '#D97706'
                          : entry.impact > 0
                          ? '#0B1F3A'
                          : '#0D9488'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Plain-English "Why was this flagged?" Explainability Drawer */}
      {flaggedDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Plain-English Explanation (Simulated)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setFlaggedDrawer(null)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto text-xs text-slate-700 leading-relaxed">
              {flaggedDrawer === 'diabetes' && (
                <>
                  <h4 className="text-base font-semibold text-[#0B1F3A]">
                    Diabetes Control Patterns
                  </h4>
                  <p>{analysis.diabetes.explanation}</p>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-[#0B1F3A]">
                      What your numbers show:
                    </div>
                    <p>
                      Your HbA1c steadily decreased from <strong>8.1%</strong> (~6 months ago) to <strong>7.7%</strong> (~3 months ago) to <strong>7.4%</strong> in your latest test. Your continuous glucose sensor shows <strong>{analysis.diabetes.timeInRangePct}%</strong> of readings in the 70–180 mg/dL target band.
                    </p>
                  </div>
                </>
              )}

              {flaggedDrawer === 'kidney' && (
                <>
                  <h4 className="text-base font-semibold text-[#0B1F3A]">
                    Why Kidney Markers Were Flagged
                  </h4>
                  <p>{analysis.kidney.explanation}</p>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-[#0B1F3A]">
                      Underlying observations:
                    </div>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>eGFR moved from 83 → 79 → 72 mL/min/1.73 m².</li>
                      <li>Urine albumin-to-creatinine ratio (UACR) moved from 21 → 36 → 44 mg/g.</li>
                      <li>Recent blood pressure readings averaged ~136/86 mmHg alongside 7 years of Type 2 diabetes.</li>
                    </ul>
                  </div>
                  <p className="text-slate-500">
                    Important: A single elevated UACR or mild eGFR change does not diagnose chronic kidney disease. Dr. Maya Tan reviews trends and confirms whether repeat tests are needed.
                  </p>
                </>
              )}

              {flaggedDrawer === 'retinal' && (
                <>
                  <h4 className="text-base font-semibold text-[#0B1F3A]">
                    Why Retinal Screening Was Flagged
                  </h4>
                  <p>{analysis.retinal.explanation}</p>
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="font-semibold text-[#0B1F3A]">
                      What happens next:
                    </div>
                    <p>
                      Your prior eye exam showed no apparent retinopathy. The latest simulated sample includes subtle microaneurysm-like dots classified as <strong>Possible Mild NPDR — unconfirmed</strong>. Dr. Maya Tan or an eye specialist must examine the images directly to confirm any finding.
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setFlaggedDrawer(null)}
                className="px-4 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
