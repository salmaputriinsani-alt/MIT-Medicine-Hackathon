import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Eye,
  HeartPulse,
  Sparkles,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { Sparkline } from '../../components/Sparkline';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { analyzePatientRisk } from '../../services/simulatedAiEngine';
import { formatShortDate, getGreetingByHour } from '../../utils/dateUtils';

export const PatientDashboard: React.FC = () => {
  const { patients, appointments } = useAurelix();
  const navigate = useNavigate();

  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];
  const analysis = analyzePatientRisk(patient);

  const latestLab = patient.labs[patient.labs.length - 1];
  const prevLab = patient.labs[patient.labs.length - 2];
  const latestGlucose = patient.glucose24h[patient.glucose24h.length - 1];
  const firstGlucose24h = patient.glucose24h[0];
  const latestRetinal =
    patient.retinalScreenings[patient.retinalScreenings.length - 1];

  const upcomingApt = appointments
    .filter((a) => a.patientId === patient.id && a.status !== 'Completed')
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  const glucoseSpark = patient.glucose24h
    .filter((_, idx) => idx % 8 === 0)
    .map((g) => g.value);
  const hba1cSpark = patient.labs
    .map((l) => l.hba1c)
    .filter((v): v is number => v !== undefined);
  const egfrSpark = patient.labs
    .map((l) => l.egfr)
    .filter((v): v is number => v !== undefined);

  const glucose24Chart = patient.glucose24h.filter((_, idx) => idx % 2 === 0);

  const attentionItems: {
    id: string;
    title: string;
    detail: string;
    status: string;
    to: string;
  }[] = [];

  if (latestRetinal && latestRetinal.reviewStatus !== 'Physician Reviewed') {
    attentionItems.push({
      id: 'att-retinal',
      title: 'Eye screening awaiting doctor review',
      detail: `Illustrative screening (${formatShortDate(latestRetinal.date)}) noted possible ${latestRetinal.possibleStage} — unconfirmed.`,
      status: latestRetinal.reviewStatus,
      to: '/patient/eye-screening',
    });
  }

  if ((latestLab?.uacr ?? 0) >= 30) {
    attentionItems.push({
      id: 'att-kidney',
      title: 'Kidney monitoring markers shifted',
      detail: `UACR moved from ${prevLab?.uacr ?? '—'} to ${latestLab?.uacr} mg/g and eGFR from ${prevLab?.egfr ?? '—'} to ${latestLab?.egfr}. Only a doctor can evaluate chronicity.`,
      status: patient.reviewStatus,
      to: '/patient/kidney-health',
    });
  }

  const pendingTasks = patient.carePlan.filter((c) => !c.completed);
  if (pendingTasks.length > 0) {
    attentionItems.push({
      id: 'att-care',
      title: `${pendingTasks.length} care plan action${pendingTasks.length > 1 ? 's' : ''} open`,
      detail: pendingTasks[0].title,
      status: pendingTasks[0].sourceType,
      to: '/patient/care-plan',
    });
  }

  return (
    <PortalLayout
      role="patient"
      pageTitle={`${getGreetingByHour()}, ${patient.name.split(' ')[0]}`}
      pageSubtitle="Your health overview and latest doctor-reviewed updates."
      headerAction={
        <button
          type="button"
          onClick={() => navigate('/patient/appointments')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54] transition-colors whitespace-nowrap"
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Appointments</span>
        </button>
      }
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="This patient workspace displays synthetic health records for Aisha Rahman (PT-1001). Simulated AI observations never replace clinical diagnosis by Dr. Maya Tan."
          tags={['Synthetic Patient Data', 'Physician Review Required']}
        />

        {/* Top 4 Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {/* Card 1: Latest Glucose */}
          <button
            type="button"
            onClick={() => navigate('/patient/timeline')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-600/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">
                  Latest Glucose Reading
                </p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-[#0B1F3A] tabular-nums">
                    {latestGlucose?.value ?? '—'}
                  </span>
                  <span className="text-xs text-slate-500">mg/dL</span>
                </div>
              </div>
              <Sparkline data={glucoseSpark} color="#0D9488" />
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>
                CGM · {analysis.diabetes.timeInRangePct}% in range
              </span>
              <span className="text-[#0D9488] font-medium group-hover:underline inline-flex items-center gap-0.5">
                {latestGlucose && firstGlucose24h
                  ? `${latestGlucose.value - firstGlucose24h.value >= 0 ? '+' : ''}${
                      latestGlucose.value - firstGlucose24h.value
                    } vs 24h ago`
                  : 'Timeline'}
              </span>
            </div>
          </button>

          {/* Card 2: Latest HbA1c */}
          <button
            type="button"
            onClick={() => navigate('/patient/timeline')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-600/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Latest HbA1c</p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-[#0B1F3A] tabular-nums">
                    {latestLab?.hba1c ?? '—'}
                  </span>
                  <span className="text-xs text-slate-500">%</span>
                </div>
              </div>
              <Sparkline data={hba1cSpark} color="#0F766E" />
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{formatShortDate(latestLab?.date ?? '')}</span>
              <span className="text-emerald-700 font-medium">
                Improved from {prevLab?.hba1c ?? '—'}%
              </span>
            </div>
          </button>

          {/* Card 3: Latest eGFR */}
          <button
            type="button"
            onClick={() => navigate('/patient/kidney-health')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-600/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-medium text-slate-500">Latest eGFR</p>
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-2xl font-semibold text-[#0B1F3A] tabular-nums">
                    {latestLab?.egfr ?? '—'}
                  </span>
                  <span className="text-xs text-slate-500">mL/min/1.73m²</span>
                </div>
              </div>
              <Sparkline data={egfrSpark} color="#D97706" />
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{formatShortDate(latestLab?.date ?? '')}</span>
              <span className="text-amber-700 font-medium">
                Down from {prevLab?.egfr ?? '—'} · Monitor
              </span>
            </div>
          </button>

          {/* Card 4: Upcoming Appointment */}
          <button
            type="button"
            onClick={() => navigate('/patient/appointments')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-teal-600/50 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-500">
                  Upcoming Appointment
                </p>
                <div className="mt-1.5 text-lg font-semibold text-[#0B1F3A] truncate tabular-nums">
                  {upcomingApt ? formatShortDate(upcomingApt.date) : 'None scheduled'}
                </div>
                <p className="text-xs text-slate-600 mt-0.5 truncate">
                  {upcomingApt
                    ? `${upcomingApt.time} · ${upcomingApt.clinician}`
                    : 'Request a visit'}
                </p>
              </div>
              <div className="p-2 rounded-md bg-slate-100 text-[#0B1F3A] shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="truncate">{upcomingApt?.type ?? 'Clinic portal'}</span>
              <span className="text-[#0D9488] font-medium shrink-0">View details →</span>
            </div>
          </button>
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 24-Hour CGM Glucose Chart */}
          <div className="lg:col-span-2 bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  24-Hour Blood Glucose Curve (Simulated CGM)
                </h2>
                <p className="text-xs text-slate-500">
                  15-minute sensor samples · Target band 70–180 mg/dL · CV{' '}
                  {analysis.diabetes.glucoseVariabilityCV}%
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/timeline')}
                className="text-xs font-medium text-[#0D9488] hover:underline inline-flex items-center gap-1"
              >
                <span>Open Full Timeline</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={glucose24Chart}
                  margin={{ top: 8, right: 12, left: -12, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="cgmGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0D9488" stopOpacity={0.22} />
                      <stop offset="95%" stopColor="#0D9488" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    interval={7}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    domain={[50, 240]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                    unit=" mg/dL"
                    width={72}
                  />
                  <ReferenceLine
                    y={180}
                    stroke="#D97706"
                    strokeDasharray="4 4"
                    label={{ value: '180 target', position: 'insideTopRight', fontSize: 10, fill: '#B45309' }}
                  />
                  <ReferenceLine
                    y={70}
                    stroke="#0F766E"
                    strokeDasharray="4 4"
                    label={{ value: '70 low', position: 'insideBottomRight', fontSize: 10, fill: '#0F766E' }}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                    }}
                    formatter={(val) => [`${val} mg/dL`, 'CGM Glucose']}
                  />
                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#0D9488"
                    strokeWidth={2}
                    fill="url(#cgmGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 7-Day Daily Glucose Average */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col">
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                7-Day Daily Average Glucose
              </h2>
              <p className="text-xs text-slate-500">
                Daily mean (mg/dL) from simulated CGM telemetry
              </p>
            </div>
            <div className="h-[210px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={patient.glucose7d}
                  margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={{ stroke: '#CBD5E1' }}
                  />
                  <YAxis
                    domain={[80, 210]}
                    tick={{ fontSize: 11, fill: '#64748B' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                    }}
                    formatter={(val) => [`${val} mg/dL`, 'Daily Mean']}
                  />
                  <Bar dataKey="value" fill="#0B1F3A" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-600 flex items-center justify-between">
              <span>Target fasting/mean zone</span>
              <span className="font-mono tabular-nums font-medium text-[#0B1F3A]">
                70–180 mg/dL
              </span>
            </div>
          </div>
        </div>

        {/* What Needs Attention + Domain Summaries */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* What Needs Attention? */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <div className="flex items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  What Needs Attention?
                </h2>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tabular-nums">
                {attentionItems.length} item{attentionItems.length === 1 ? '' : 's'}
              </span>
            </div>

            {attentionItems.length === 0 ? (
              <div className="p-4 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All recent screenings and care-plan items have been reviewed.</span>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {attentionItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.to)}
                    className="w-full text-left py-3 first:pt-0 last:pb-0 hover:bg-slate-50/80 transition-colors rounded group"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-[#0B1F3A] group-hover:text-[#0D9488]">
                        {item.title}
                      </span>
                      <StatusBadge label={item.status} compact />
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.detail}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Eye Screening & Kidney Monitoring Summaries */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-5">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#0D9488]" />
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Eye Screening Status
                  </h3>
                </div>
                <StatusBadge
                  label={latestRetinal?.reviewStatus ?? 'No Record'}
                  compact
                />
              </div>
              <p className="text-xs text-slate-700 font-medium">
                {latestRetinal?.doctorAssessment
                  ? `Confirmed assessment: ${latestRetinal.doctorAssessment}`
                  : latestRetinal
                  ? `Possible ${latestRetinal.possibleStage} — unconfirmed`
                  : 'No screening recorded'}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {latestRetinal
                  ? `Screened ${formatShortDate(latestRetinal.date)} · Prior exam: No apparent retinopathy`
                  : 'Annual eye screening recommended.'}
              </p>
              <button
                type="button"
                onClick={() => navigate('/patient/eye-screening')}
                className="mt-2.5 text-xs font-medium text-[#0D9488] hover:underline inline-flex items-center gap-1"
              >
                <span>Inspect retinal comparison</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <HeartPulse className="w-4 h-4 text-[#0B1F3A]" />
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Kidney Monitoring Summary
                  </h3>
                </div>
                <StatusBadge label={`${analysis.kidney.level} Signal`} compact />
              </div>
              <div className="grid grid-cols-2 gap-3 my-2 text-xs">
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-500">Latest eGFR</div>
                  <div className="font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {latestLab?.egfr ?? '—'} mL/min
                  </div>
                </div>
                <div className="p-2.5 rounded bg-slate-50 border border-slate-200/80">
                  <div className="text-[11px] text-slate-500">Latest UACR</div>
                  <div className="font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {latestLab?.uacr ?? '—'} mg/g
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/patient/kidney-health')}
                className="mt-1 text-xs font-medium text-[#0D9488] hover:underline inline-flex items-center gap-1"
              >
                <span>View kidney trends & KDIGO grid</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Latest AI Observations & Doctor-Reviewed Updates */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#0D9488]" />
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Simulated AI Observations
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/patient/insights')}
                  className="text-xs font-medium text-[#0D9488] hover:underline"
                >
                  Explain
                </button>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {analysis.diabetes.explanation}
              </p>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Illustrative AI summary · Pending physician verification
              </p>
            </div>

            <div className="pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#0B1F3A]" />
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Recent Doctor-Reviewed Update
                  </h3>
                </div>
                <StatusBadge label={patient.reviewStatus} compact />
              </div>
              {patient.clinicalNotes[0] ? (
                <div className="text-xs text-slate-600 space-y-1">
                  <p className="leading-relaxed">{patient.clinicalNotes[0].note}</p>
                  <p className="text-[11px] text-slate-400">
                    {patient.clinicalNotes[0].author} ·{' '}
                    {formatShortDate(patient.clinicalNotes[0].date)}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">No clinician notes yet.</p>
              )}
              <button
                type="button"
                onClick={() => navigate('/patient/care-plan')}
                className="mt-2.5 text-xs font-medium text-[#0D9488] hover:underline inline-flex items-center gap-1"
              >
                <span>Open My Care Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
