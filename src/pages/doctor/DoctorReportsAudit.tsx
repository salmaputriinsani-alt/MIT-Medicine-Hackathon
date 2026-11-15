import React from 'react';
import { Download, FileBarChart2, ShieldCheck } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import {
  analyzePatientRisk,
  computeSyntheticEvaluationMetrics,
} from '../../services/simulatedAiEngine';
import { exportToCsv } from '../../utils/csvExport';
import { formatDateTime } from '../../utils/dateUtils';

export const DoctorReportsAudit: React.FC = () => {
  const { patients, auditLogs } = useAurelix();
  const evalMetrics = computeSyntheticEvaluationMetrics();

  // Review status breakdown
  const statusCounts: Record<string, number> = {};
  patients.forEach((p) => {
    statusCounts[p.reviewStatus] = (statusCounts[p.reviewStatus] ?? 0) + 1;
  });
  const outcomeChartData = Object.entries(statusCounts).map(([name, count]) => ({
    name: name.replace('Physician ', ''),
    count,
  }));

  // Screening completion counts
  const screeningData = [
    {
      name: 'Retinal Exam Reviewed',
      count: patients.filter(
        (p) =>
          p.retinalScreenings.slice(-1)[0]?.reviewStatus === 'Physician Reviewed'
      ).length,
    },
    {
      name: 'Retinal Exam Pending',
      count: patients.filter((p) => {
        const latest = p.retinalScreenings.slice(-1)[0];
        return latest && latest.reviewStatus !== 'Physician Reviewed';
      }).length,
    },
    {
      name: 'Missing Retinal Exam',
      count: patients.filter((p) => p.retinalScreenings.length === 0).length,
    },
  ];

  const handleExportAuditCsv = () => {
    exportToCsv(
      'aurelix-demo-audit-log.csv',
      ['Timestamp', 'Doctor', 'Patient ID', 'Patient Name', 'Action', 'Previous Status', 'New Status', 'Notes'],
      auditLogs.map((a) => [
        a.timestamp,
        a.doctor,
        a.patientId,
        a.patientName,
        a.reviewAction,
        a.previousStatus,
        a.newStatus,
        a.notes ?? '',
      ])
    );
  };

  const handleExportCohortCsv = () => {
    exportToCsv(
      'aurelix-demo-cohort-summary.csv',
      ['Patient ID', 'Name', 'Age', 'Sex', 'HbA1c (%)', 'eGFR', 'UACR (mg/g)', 'Simulated Overall Risk', 'Review Status'],
      patients.map((p) => {
        const l = p.labs[p.labs.length - 1];
        const a = analyzePatientRisk(p);
        return [
          p.id,
          p.name,
          p.age,
          p.sex,
          l?.hba1c ?? '',
          l?.egfr ?? '',
          l?.uacr ?? '',
          a.overallRisk,
          p.reviewStatus,
        ];
      })
    );
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="Reports & Audit Log"
      pageSubtitle="Cohort monitoring summaries, illustrative model evaluation demonstration, and physician audit trail."
      headerAction={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCohortCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B1F3A] hover:bg-slate-50 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#0D9488]" />
            <span>Export Cohort CSV</span>
          </button>
          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54] whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-[#2DD4BF]" />
            <span>Export Audit CSV</span>
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          title="Illustrative Evaluation & Audit Notice"
          message="All model evaluation metrics below are fictional synthetic demonstration numbers derived mathematically from a sample 300-case confusion matrix — not real-world clinical validation."
          tags={['Illustrative Model Metrics', 'Not for Clinical Use']}
        />

        {/* Cohort Analytics Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-[#0B1F3A]">
              Doctor Decision &amp; Review Outcomes (N={patients.length})
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Live status distribution across the 12-patient synthetic registry
            </p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={outcomeChartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Patients" fill="#0B1F3A" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-slate-200 p-5">
            <h2 className="text-sm font-semibold text-[#0B1F3A]">
              Retinal Screening Coverage Summary
            </h2>
            <p className="text-xs text-slate-500 mb-3">
              Cohort retinal examination and physician-review status
            </p>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={screeningData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                  <Bar dataKey="count" name="Patients" fill="#0D9488" radius={[4, 4, 0, 0]} maxBarSize={44} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* AI Model Evaluation — Synthetic Demonstration */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <FileBarChart2 className="w-4 h-4 text-[#0D9488]" />
                <h2 className="text-base font-semibold text-[#0B1F3A]">
                  AI Model Evaluation — Synthetic Demonstration
                </h2>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-3xl">
                Fictional demonstration evaluation on N={evalMetrics.sampleSize} synthetic test records. Precision, Recall/Sensitivity, Specificity, and F1 Score are derived directly from the confusion matrix below.
              </p>
            </div>
            <span className="text-[11px] font-medium text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded">
              Fictional Synthetic Metrics
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Coherent 2x2 Confusion Matrix */}
            <div className="lg:col-span-6 space-y-2">
              <div className="text-xs font-semibold text-[#0B1F3A]">
                Synthetic Confusion Matrix (N = {evalMetrics.sampleSize})
              </div>
              <table className="w-full border-collapse text-xs text-center">
                <thead>
                  <tr>
                    <th className="p-2 border border-slate-200 bg-slate-50" />
                    <th className="p-2 border border-slate-200 bg-slate-50 font-semibold text-slate-700">
                      Predicted Flag (+)
                    </th>
                    <th className="p-2 border border-slate-200 bg-slate-50 font-semibold text-slate-700">
                      Predicted Low Risk (-)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2.5 border border-slate-200 bg-slate-50 font-semibold text-slate-700 text-left">
                      Synthetic Reference (+)
                    </td>
                    <td className="p-3 border border-slate-200 bg-emerald-50 text-emerald-900">
                      <div className="text-lg font-semibold tabular-nums">
                        {evalMetrics.confusionMatrix.tp}
                      </div>
                      <div className="text-[10px]">True Positive (TP)</div>
                    </td>
                    <td className="p-3 border border-slate-200 bg-rose-50 text-rose-900">
                      <div className="text-lg font-semibold tabular-nums">
                        {evalMetrics.confusionMatrix.fn}
                      </div>
                      <div className="text-[10px]">False Negative (FN)</div>
                    </td>
                  </tr>
                  <tr>
                    <td className="p-2.5 border border-slate-200 bg-slate-50 font-semibold text-slate-700 text-left">
                      Synthetic Reference (-)
                    </td>
                    <td className="p-3 border border-slate-200 bg-amber-50 text-amber-900">
                      <div className="text-lg font-semibold tabular-nums">
                        {evalMetrics.confusionMatrix.fp}
                      </div>
                      <div className="text-[10px]">False Positive (FP)</div>
                    </td>
                    <td className="p-3 border border-slate-200 bg-teal-50 text-teal-900">
                      <div className="text-lg font-semibold tabular-nums">
                        {evalMetrics.confusionMatrix.tn}
                      </div>
                      <div className="text-[10px]">True Negative (TN)</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Derived Metrics + Real-World Deployment Disclaimer */}
            <div className="lg:col-span-6 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Precision</div>
                  <div className="text-xl font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {evalMetrics.precisionPct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    86 / (86+14)
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Recall / Sens.</div>
                  <div className="text-xl font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {evalMetrics.recallPct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    86 / (86+12)
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">Specificity</div>
                  <div className="text-xl font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {evalMetrics.specificityPct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    188 / (188+14)
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-[11px] text-slate-500">F1 Score</div>
                  <div className="text-xl font-semibold text-[#0D9488] tabular-nums mt-0.5">
                    {evalMetrics.f1ScorePct}%
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    2·P·R / (P+R)
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5" />
                <div>
                  <strong>Clinical Validation Requirements:</strong> Real clinical AI deployment requires representative multi-center datasets, independent prospective validation, probability calibration, demographic bias evaluation, and formal regulatory and clinical oversight.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Simulated Audit Log Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#0B1F3A]">
                Simulated Clinical Review Audit Log
              </h2>
              <p className="text-xs text-slate-500">
                Records all physician triage, screening, and clinical decision updates made during the session.
              </p>
            </div>
            <span className="text-xs text-slate-500 tabular-nums">
              {auditLogs.length} entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-2.5 px-4 font-semibold">Timestamp</th>
                  <th className="py-2.5 px-4 font-semibold">Doctor</th>
                  <th className="py-2.5 px-4 font-semibold">Patient ID</th>
                  <th className="py-2.5 px-4 font-semibold">Review Action</th>
                  <th className="py-2.5 px-4 font-semibold">Previous Status</th>
                  <th className="py-2.5 px-4 font-semibold">New Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4 tabular-nums text-slate-600 whitespace-nowrap">
                      {formatDateTime(log.timestamp)}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#0B1F3A] whitespace-nowrap">
                      {log.doctor}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {log.patientId} · {log.patientName}
                    </td>
                    <td className="py-3 px-4 text-slate-800">
                      <div>{log.reviewAction}</div>
                      {log.notes && (
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                          {log.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={log.previousStatus} compact />
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge label={log.newStatus} compact />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
