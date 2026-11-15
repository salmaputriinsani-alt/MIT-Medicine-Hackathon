import React, { useState } from 'react';
import {
  Activity,
  Calendar,
  Download,
  FileText,
  Info,
  X,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
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
import { ClinicalEvent } from '../../types/clinical';
import { exportToCsv } from '../../utils/csvExport';
import { formatDateTime, formatShortDate } from '../../utils/dateUtils';

type TimeRange = '24 Hours' | '7 Days' | '30 Days' | '6 Months' | '12 Months';
type MetricType =
  | 'Glucose'
  | 'Blood Pressure'
  | 'Heart Rate'
  | 'HbA1c'
  | 'Kidney Function'
  | 'Weight';

const TIME_RANGES: TimeRange[] = [
  '24 Hours',
  '7 Days',
  '30 Days',
  '6 Months',
  '12 Months',
];

const METRICS: MetricType[] = [
  'Glucose',
  'Blood Pressure',
  'Heart Rate',
  'HbA1c',
  'Kidney Function',
  'Weight',
];

export const PatientTimeline: React.FC = () => {
  const { patients } = useAurelix();
  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];

  const [range, setRange] = useState<TimeRange>('24 Hours');
  const [metric, setMetric] = useState<MetricType>('Glucose');
  const [selectedEvent, setSelectedEvent] = useState<ClinicalEvent | null>(null);

  const isLabOnlyMetric = metric === 'HbA1c' || metric === 'Kidney Function';
  const isShortRangeForLab =
    isLabOnlyMetric && (range === '24 Hours' || range === '7 Days');

  const latestLab = patient.labs[patient.labs.length - 1];
  const prevLab = patient.labs[patient.labs.length - 2];

  const handleDownloadReport = () => {
    exportToCsv(
      `aurelix-demo-timeline-${patient.id}.csv`,
      ['Date', 'HbA1c (%)', 'eGFR (mL/min/1.73m2)', 'UACR (mg/g)', 'Creatinine (mg/dL)'],
      patient.labs.map((l) => [l.date, l.hba1c, l.egfr, l.uacr, l.creatinine])
    );
  };

  // Build metric-specific chart data matching realistic clinical time scales
  const renderChartSection = () => {
    if (isShortRangeForLab) {
      return (
        <div className="p-6 rounded-lg bg-slate-50 border border-slate-200 space-y-4">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[#0B1F3A] shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Laboratory measurements are recorded on clinic test dates — not hourly
              </h3>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {metric} tests require laboratory blood or urine analysis and are not sampled continuously over {range.toLowerCase()}. Showing your latest recorded lab panel below. Switch to <strong>6 Months</strong> or <strong>12 Months</strong> to view longitudinal progression.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {metric === 'HbA1c' ? (
              <>
                <div className="bg-white p-4 rounded-md border border-slate-200">
                  <div className="text-xs text-slate-500">Latest HbA1c</div>
                  <div className="text-2xl font-semibold text-[#0B1F3A] tabular-nums mt-1">
                    {latestLab?.hba1c ?? '—'}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Tested {formatShortDate(latestLab?.date ?? '')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-slate-200">
                  <div className="text-xs text-slate-500">Previous HbA1c</div>
                  <div className="text-2xl font-semibold text-slate-700 tabular-nums mt-1">
                    {prevLab?.hba1c ?? '—'}%
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Tested {formatShortDate(prevLab?.date ?? '')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                  <div className="text-xs text-slate-500">Longitudinal Change</div>
                  <div className="text-lg font-semibold text-emerald-700 tabular-nums">
                    {latestLab?.hba1c && prevLab?.hba1c
                      ? `${(latestLab.hba1c - prevLab.hba1c).toFixed(1)}%`
                      : '—'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setRange('12 Months')}
                    className="text-xs font-medium text-[#0D9488] hover:underline text-left mt-1"
                  >
                    Switch to 12 Months view →
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white p-4 rounded-md border border-slate-200">
                  <div className="text-xs text-slate-500">Latest eGFR</div>
                  <div className="text-2xl font-semibold text-[#0B1F3A] tabular-nums mt-1">
                    {latestLab?.egfr ?? '—'} <span className="text-xs font-normal">mL/min</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Tested {formatShortDate(latestLab?.date ?? '')}
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-slate-200">
                  <div className="text-xs text-slate-500">Latest UACR</div>
                  <div className="text-2xl font-semibold text-[#0B1F3A] tabular-nums mt-1">
                    {latestLab?.uacr ?? '—'} <span className="text-xs font-normal">mg/g</span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Prior: {prevLab?.uacr ?? '—'} mg/g
                  </div>
                </div>
                <div className="bg-white p-4 rounded-md border border-slate-200 flex flex-col justify-between">
                  <div className="text-xs text-slate-500">Serum Creatinine</div>
                  <div className="text-2xl font-semibold text-slate-700 tabular-nums mt-1">
                    {latestLab?.creatinine ?? '—'} <span className="text-xs font-normal">mg/dL</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setRange('12 Months')}
                    className="text-xs font-medium text-[#0D9488] hover:underline text-left mt-1"
                  >
                    Switch to 12 Months view →
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      );
    }

    if (metric === 'Glucose') {
      const data =
        range === '24 Hours'
          ? patient.glucose24h.filter((_, i) => i % 2 === 0)
          : range === '7 Days'
          ? patient.glucose7d
          : range === '30 Days'
          ? patient.glucose30d
          : patient.labs.map((l) => ({
              label: formatShortDate(l.date),
              value: l.fastingGlucose ?? 138,
            }));

      return (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="tlGlucose" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#0D9488" stopOpacity={0.24} />
                  <stop offset="95%" stopColor="#0D9488" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#64748B' }}
                interval="preserveStartEnd"
                tickLine={false}
              />
              <YAxis
                domain={[60, 240]}
                tick={{ fontSize: 11, fill: '#64748B' }}
                unit=" mg/dL"
                width={74}
                tickLine={false}
                axisLine={false}
              />
              <ReferenceLine y={180} stroke="#D97706" strokeDasharray="4 4" />
              <ReferenceLine y={70} stroke="#0F766E" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                formatter={(val) => [
                  `${val} mg/dL`,
                  range === '6 Months' || range === '12 Months'
                    ? 'Clinic Fasting Glucose'
                    : 'Glucose',
                ]}
              />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#0D9488"
                strokeWidth={2}
                fill="url(#tlGlucose)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (metric === 'HbA1c') {
      const data = patient.labs
        .filter((l) => l.hba1c !== undefined)
        .map((l) => ({
          label: formatShortDate(l.date),
          hba1c: l.hba1c,
        }));
      return (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                domain={[5.5, 9.5]}
                tick={{ fontSize: 11, fill: '#64748B' }}
                unit="%"
                width={52}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine
                y={7.0}
                stroke="#0D9488"
                strokeDasharray="4 4"
                label={{ value: '7.0% reference', position: 'insideTopRight', fontSize: 10, fill: '#0F766E' }}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                formatter={(val) => [`${val}%`, 'HbA1c']}
              />
              <Line
                type="monotone"
                dataKey="hba1c"
                stroke="#0B1F3A"
                strokeWidth={2.5}
                dot={{ r: 5, fill: '#0D9488', stroke: '#fff', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (metric === 'Kidney Function') {
      const data = patient.labs.map((l) => ({
        label: formatShortDate(l.date),
        egfr: l.egfr,
        uacr: l.uacr,
      }));
      return (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 20, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                yAxisId="left"
                domain={[40, 100]}
                tick={{ fontSize: 11, fill: '#0B1F3A' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 80]}
                tick={{ fontSize: 11, fill: '#D97706' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="egfr"
                name="eGFR (mL/min/1.73 m²)"
                stroke="#0B1F3A"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="uacr"
                name="UACR (mg/g)"
                stroke="#D97706"
                strokeWidth={2.5}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    const vitalData =
      range === '24 Hours'
        ? patient.vitals24h
        : range === '7 Days'
        ? patient.vitals7d
        : range === '30 Days'
        ? patient.vitals30d
        : range === '6 Months'
        ? patient.vitals6m
        : patient.vitals12m;

    if (metric === 'Blood Pressure') {
      return (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={vitalData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                domain={[60, 165]}
                tick={{ fontSize: 11, fill: '#64748B' }}
                unit=" mmHg"
                width={72}
                axisLine={false}
                tickLine={false}
              />
              <ReferenceLine y={130} stroke="#D97706" strokeDasharray="4 4" />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              />
              <Line
                type="monotone"
                dataKey="systolic"
                name="Systolic (mmHg)"
                stroke="#0B1F3A"
                strokeWidth={2.2}
                dot={{ r: 3 }}
              />
              <Line
                type="monotone"
                dataKey="diastolic"
                name="Diastolic (mmHg)"
                stroke="#0D9488"
                strokeWidth={2.2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    if (metric === 'Heart Rate') {
      return (
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={vitalData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
              <YAxis
                domain={[50, 110]}
                tick={{ fontSize: 11, fill: '#64748B' }}
                unit=" bpm"
                width={64}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
                formatter={(val) => [`${val} bpm`, 'Heart Rate']}
              />
              <Area
                type="monotone"
                dataKey="heartRate"
                stroke="#0891B2"
                fill="#0891B2"
                fillOpacity={0.14}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Weight
    const weightData =
      range === '24 Hours'
        ? patient.vitals7d
        : vitalData.filter((v) => v.weightKg !== undefined);

    return (
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={weightData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748B' }} />
            <YAxis
              domain={['dataMin - 2', 'dataMax + 2']}
              tick={{ fontSize: 11, fill: '#64748B' }}
              unit=" kg"
              width={60}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #E2E8F0' }}
              formatter={(val) => [`${val} kg`, 'Weight']}
            />
            <Line
              type="monotone"
              dataKey="weightKg"
              stroke="#0B1F3A"
              strokeWidth={2.2}
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <PortalLayout
      role="patient"
      pageTitle="Health Timeline"
      pageSubtitle="Longitudinal glucose, vital signs, laboratory history, and clinical events."
      headerAction={
        <button
          type="button"
          onClick={handleDownloadReport}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B1F3A] hover:bg-slate-50 whitespace-nowrap"
        >
          <Download className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>Export Demo Report (CSV)</span>
        </button>
      }
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="Measurements follow clinical time scales: CGM telemetry appears across 24 hours, whereas HbA1c, eGFR, and UACR appear only on plausible clinic laboratory dates."
          tags={['Synthetic Longitudinal Record']}
        />

        {/* Controls & Chart Card */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Metric Selector */}
            <div className="flex flex-wrap items-center gap-1.5">
              {METRICS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetric(m)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    metric === m
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200/70'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Time Range Filter */}
            <div className="inline-flex items-center p-1 rounded-lg bg-slate-100 self-start">
              {TIME_RANGES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRange(r)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                    range === r
                      ? 'bg-white text-[#0B1F3A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 border-b border-slate-100 pb-3">
            <span>
              Viewing <strong className="text-[#0B1F3A]">{metric}</strong> over{' '}
              <strong className="text-[#0B1F3A]">{range}</strong>
            </span>
            <span>
              Latest clinic visit: {formatShortDate(patient.lastVisitDate)} · Weight {patient.weightKg} kg (BMI {patient.bmi})
            </span>
          </div>

          {renderChartSection()}
        </div>

        {/* Clinical Event Timeline */}
        <div className="bg-white rounded-lg border border-slate-200 p-5">
          <div className="flex items-center justify-between gap-2 mb-4">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Clinical Event & Observation Timeline
              </h2>
              <p className="text-xs text-slate-500">
                Select any recorded event to inspect detailed measurements and clinician notes.
              </p>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {patient.events.length} events
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {patient.events.map((ev) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => setSelectedEvent(ev)}
                className="w-full text-left py-3.5 px-3 -mx-3 rounded-md hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="p-2 rounded-md bg-slate-100 text-[#0B1F3A] shrink-0 mt-0.5">
                    {ev.type === 'lab' ? (
                      <FileText className="w-4 h-4" />
                    ) : ev.type === 'appointment' ? (
                      <Calendar className="w-4 h-4" />
                    ) : (
                      <Activity className="w-4 h-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-[#0B1F3A]">
                      {ev.title}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{ev.summary}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                      <span>{formatDateTime(ev.date)}</span>
                      <span aria-hidden="true">·</span>
                      <span>{ev.actor}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  {ev.reviewStatus && <StatusBadge label={ev.reviewStatus} compact />}
                  <span className="text-xs font-medium text-[#0D9488]">Details →</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Event Detail Slide-over Panel */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40">
          <div className="w-full max-w-md bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Clinical Event Details
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDateTime(selectedEvent.date)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 flex-1 overflow-y-auto text-sm">
              <div>
                <div className="text-xs font-medium text-slate-500">Event Title</div>
                <div className="text-base font-semibold text-[#0B1F3A] mt-0.5">
                  {selectedEvent.title}
                </div>
              </div>
              {selectedEvent.reviewStatus && (
                <div>
                  <div className="text-xs font-medium text-slate-500 mb-1">
                    Clinical Review Status
                  </div>
                  <StatusBadge label={selectedEvent.reviewStatus} />
                </div>
              )}
              <div>
                <div className="text-xs font-medium text-slate-500">Source / Actor</div>
                <div className="text-sm text-slate-800 mt-0.5">
                  {selectedEvent.actor}
                </div>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <div className="text-xs font-semibold text-[#0B1F3A] mb-1">
                  Recorded Summary
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedEvent.details}
                </p>
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
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
