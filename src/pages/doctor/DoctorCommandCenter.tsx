import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ClipboardList,
  Eye,
  GitBranch,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
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
import { RiskLevel } from '../../types/clinical';

export const DoctorCommandCenter: React.FC = () => {
  const { patients, triageItems, setSelectedPatientId } = useAurelix();
  const navigate = useNavigate();

  const analyzed = patients.map((p) => ({
    patient: p,
    analysis: analyzePatientRisk(p),
  }));

  const totalMonitored = patients.length;
  const requiringReview = patients.filter(
    (p) => p.reviewStatus !== 'Physician Reviewed'
  ).length;
  const pendingRetinal = patients.filter((p) => {
    const latest = p.retinalScreenings[p.retinalScreenings.length - 1];
    return latest && latest.reviewStatus !== 'Physician Reviewed';
  }).length;
  const pendingDecisions = triageItems.filter(
    (t) => t.status === 'Pending' || t.status === 'Under Review'
  ).length;

  // Risk distribution chart data
  const riskCounts: Record<RiskLevel, number> = {
    'High Priority': 0,
    Elevated: 0,
    Moderate: 0,
    Low: 0,
  };
  analyzed.forEach(({ analysis }) => {
    riskCounts[analysis.overallRisk] += 1;
  });
  const riskChartData = [
    { name: 'High Priority', count: riskCounts['High Priority'], color: '#E11D48' },
    { name: 'Elevated', count: riskCounts['Elevated'], color: '#D97706' },
    { name: 'Moderate', count: riskCounts['Moderate'], color: '#0891B2' },
    { name: 'Low', count: riskCounts['Low'], color: '#0D9488' },
  ];

  // Workload by category from triage queue
  const categoryMap: Record<string, number> = {};
  triageItems
    .filter((t) => t.status !== 'Dismissed')
    .forEach((t) => {
      categoryMap[t.category] = (categoryMap[t.category] ?? 0) + 1;
    });
  const workloadData = Object.entries(categoryMap).map(([name, count]) => ({
    name: name.replace(' observation', '').replace(' signal', ''),
    count,
  }));

  // Illustrative weekly screening completion & review activity
  const weeklyActivity = [
    { week: 'W-5', reviewed: 6, screened: 5 },
    { week: 'W-4', reviewed: 8, screened: 7 },
    { week: 'W-3', reviewed: 7, screened: 8 },
    { week: 'W-2', reviewed: 10, screened: 9 },
    { week: 'W-1', reviewed: 9, screened: 11 },
    { week: 'Current', reviewed: 12 - requiringReview + 4, screened: 10 },
  ];

  const attentionList = analyzed
    .filter(
      ({ patient, analysis }) =>
        patient.reviewStatus !== 'Physician Reviewed' ||
        analysis.overallRisk === 'High Priority' ||
        analysis.overallRisk === 'Elevated'
    )
    .sort((a, b) => {
      const rank: Record<RiskLevel, number> = {
        'High Priority': 4,
        Elevated: 3,
        Moderate: 2,
        Low: 1,
      };
      return rank[b.analysis.overallRisk] - rank[a.analysis.overallRisk];
    });

  const handleOpenPatient = (patientId: string) => {
    setSelectedPatientId(patientId);
    navigate('/doctor/decisions');
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="Clinical Intelligence Command Center"
      pageSubtitle="Prioritize patient reviews through longitudinal data and AI-assisted signals."
      headerAction={
        <button
          type="button"
          onClick={() => navigate('/doctor/triage')}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54] whitespace-nowrap"
        >
          <GitBranch className="w-3.5 h-3.5 text-[#2DD4BF]" />
          <span>Open AI Triage Queue</span>
        </button>
      }
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="Simulated triage counts and risk distributions are derived from the 12-patient synthetic registry. Clinician review and judgment remain authoritative."
          tags={['Simulated AI Triage', 'Physician Decision Authority']}
        />

        {/* Top 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <button
            type="button"
            onClick={() => navigate('/doctor/patients')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-[#0D9488] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Total Monitored Patients
              </span>
              <Users className="w-4 h-4 text-[#0B1F3A]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0B1F3A] tabular-nums">
              {totalMonitored}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Active synthetic cohort · Dr. Maya Tan
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/doctor/patients')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-[#0D9488] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Patients Requiring Review
              </span>
              <ClipboardList className="w-4 h-4 text-amber-600" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0B1F3A] tabular-nums">
              {requiringReview}
            </div>
            <div className="mt-2 text-[11px] text-amber-700 font-medium">
              Pending or follow-up status
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/doctor/retinal')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-[#0D9488] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Pending Retinal Screenings
              </span>
              <Eye className="w-4 h-4 text-[#0D9488]" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0B1F3A] tabular-nums">
              {pendingRetinal}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Awaiting physician assessment
            </div>
          </button>

          <button
            type="button"
            onClick={() => navigate('/doctor/triage')}
            className="text-left bg-white rounded-lg border border-slate-200 p-4 hover:border-[#0D9488] transition-colors"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                Pending Clinical Decisions
              </span>
              <GitBranch className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-2 text-2xl font-semibold text-[#0B1F3A] tabular-nums">
              {pendingDecisions}
            </div>
            <div className="mt-2 text-[11px] text-slate-500">
              Open triage signals across cohort
            </div>
          </button>
        </div>

        {/* Analytics Row (3 compact, purposeful charts) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Distribution */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-[#0B1F3A]">
              Patient Risk-Category Distribution
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Simulated cohort stratification (N={totalMonitored})
            </p>
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={riskChartData}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Patients" radius={[4, 4, 0, 0]} maxBarSize={36}>
                    {riskChartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Workload by Clinical Category */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-[#0B1F3A]">
              Review Workload by Clinical Category
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Active triage items grouped by domain
            </p>
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={workloadData}
                  layout="vertical"
                  margin={{ top: 4, right: 16, left: 10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                  <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={118}
                    tick={{ fontSize: 10, fill: '#334155' }}
                  />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Items" fill="#0B1F3A" radius={[0, 4, 4, 0]} maxBarSize={18} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Weekly Monitoring & Screening Completion */}
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-[#0B1F3A]">
              Weekly Screening & Review Activity
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              6-week illustrative clinical review cadence
            </p>
            <div className="h-[190px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={weeklyActivity}
                  margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#64748B' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Line
                    type="monotone"
                    dataKey="screened"
                    name="Screenings Completed"
                    stroke="#0D9488"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="reviewed"
                    name="Physician Reviews"
                    stroke="#0B1F3A"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Prominent "Needs Clinical Attention" Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Needs Clinical Attention
              </h2>
              <p className="text-xs text-slate-500">
                Patients prioritized by simulated longitudinal trends, kidney markers, or unconfirmed retinal findings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/doctor/decisions')}
              className="text-xs font-medium text-[#0D9488] hover:underline inline-flex items-center gap-1"
            >
              <span>Go to Decision Support</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Patient</th>
                  <th className="py-2.5 px-4 font-semibold">ID</th>
                  <th className="py-2.5 px-4 font-semibold">Clinical Signal</th>
                  <th className="py-2.5 px-4 font-semibold">Supporting Evidence</th>
                  <th className="py-2.5 px-4 font-semibold">Priority</th>
                  <th className="py-2.5 px-4 font-semibold">Review Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {attentionList.map(({ patient, analysis }) => {
                  const latestLab = patient.labs[patient.labs.length - 1];
                  return (
                    <tr
                      key={patient.id}
                      className="hover:bg-slate-50/80 transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-[#0B1F3A] whitespace-nowrap">
                        {patient.name}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {patient.id}
                      </td>
                      <td className="py-3 px-4 text-slate-800 max-w-[260px]">
                        {analysis.primarySignalSummary}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-mono tabular-nums whitespace-nowrap">
                        HbA1c {latestLab?.hba1c ?? '—'}% · eGFR {latestLab?.egfr ?? '—'} · UACR{' '}
                        {latestLab?.uacr ?? '—'}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge label={analysis.overallRisk} compact />
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge label={patient.reviewStatus} compact />
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenPatient(patient.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-[#0B1F3A] text-white text-[11px] font-medium hover:bg-[#132F54] transition-colors"
                        >
                          <span>View Patient</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
