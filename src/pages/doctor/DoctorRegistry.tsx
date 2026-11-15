import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  HeartPulse,
  Search,
  Stethoscope,
  X,
} from 'lucide-react';
import {
  CartesianGrid,
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
import { PatientProfile, RiskLevel } from '../../types/clinical';
import { formatShortDate } from '../../utils/dateUtils';

type SortField = 'name' | 'age' | 'hba1c' | 'egfr' | 'lastVisit';

export const DoctorRegistry: React.FC = () => {
  const { patients, setSelectedPatientId } = useAurelix();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const [drawerPatientId, setDrawerPatientId] = useState<string | null>(null);

  const enriched = useMemo(() => {
    return patients.map((p) => ({
      patient: p,
      analysis: analyzePatientRisk(p),
      latestLab: p.labs[p.labs.length - 1],
      latestRetinal: p.retinalScreenings[p.retinalScreenings.length - 1],
    }));
  }, [patients]);

  const filtered = useMemo(() => {
    return enriched
      .filter(({ patient, analysis }) => {
        const q = search.trim().toLowerCase();
        const matchesQuery =
          !q ||
          patient.name.toLowerCase().includes(q) ||
          patient.id.toLowerCase().includes(q) ||
          patient.conditions.some((c) => c.toLowerCase().includes(q));
        const matchesStatus =
          statusFilter === 'All' || patient.reviewStatus === statusFilter;
        const matchesRisk =
          riskFilter === 'All' || analysis.overallRisk === riskFilter;
        return matchesQuery && matchesStatus && matchesRisk;
      })
      .sort((a, b) => {
        const dir = sortAsc ? 1 : -1;
        if (sortField === 'name') {
          return a.patient.name.localeCompare(b.patient.name) * dir;
        }
        if (sortField === 'age') {
          return (a.patient.age - b.patient.age) * dir;
        }
        if (sortField === 'hba1c') {
          return ((a.latestLab?.hba1c ?? 0) - (b.latestLab?.hba1c ?? 0)) * dir;
        }
        if (sortField === 'egfr') {
          return ((a.latestLab?.egfr ?? 0) - (b.latestLab?.egfr ?? 0)) * dir;
        }
        return a.patient.lastVisitDate.localeCompare(b.patient.lastVisitDate) * dir;
      });
  }, [enriched, search, statusFilter, riskFilter, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const drawerEntry = enriched.find((e) => e.patient.id === drawerPatientId);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc((v) => !v);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const jumpToModule = (patient: PatientProfile, route: string) => {
    setSelectedPatientId(patient.id);
    setDrawerPatientId(null);
    navigate(route);
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="Patient Registry"
      pageSubtitle="Complete synthetic cohort directory with search, filtering, sorting, and Patient 360 inspection."
    >
      <div className="space-y-5">
        <DemoNoticeBanner
          message="All 12 patient records are fictional profiles designed to demonstrate diverse longitudinal trajectories. Click any patient row to open their Patient 360 clinical profile."
          tags={['Synthetic Cohort (12 Patients)']}
        />

        {/* Search & Filter Toolbar */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by patient name, ID (e.g. PT-1001), or condition..."
              className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 text-xs">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700"
              aria-label="Filter by review status"
            >
              <option value="All">All Review Statuses</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Under Review">Under Review</option>
              <option value="Additional Evidence Required">
                Additional Evidence Required
              </option>
              <option value="Follow-up Requested">Follow-up Requested</option>
              <option value="Physician Reviewed">Physician Reviewed</option>
            </select>

            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 rounded-md border border-slate-300 bg-white text-slate-700"
              aria-label="Filter by simulated risk level"
            >
              <option value="All">All Risk Levels</option>
              {(['High Priority', 'Elevated', 'Moderate', 'Low'] as RiskLevel[]).map(
                (r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* ERP Patient Table */}
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600">
                  <th className="py-3 px-4 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('name')}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A]"
                    >
                      <span>Patient</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">ID</th>
                  <th className="py-3 px-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('age')}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A]"
                    >
                      <span>Age</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">Known Conditions</th>
                  <th className="py-3 px-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('hba1c')}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A]"
                    >
                      <span>HbA1c</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('egfr')}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A]"
                    >
                      <span>eGFR</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                  <th className="py-3 px-3 font-semibold">Retinal Screening</th>
                  <th className="py-3 px-3 font-semibold">AI Signal</th>
                  <th className="py-3 px-3 font-semibold">Review Status</th>
                  <th className="py-3 px-4 font-semibold">
                    <button
                      type="button"
                      onClick={() => toggleSort('lastVisit')}
                      className="inline-flex items-center gap-1 hover:text-[#0B1F3A]"
                    >
                      <span>Last Visit</span>
                      <ArrowUpDown className="w-3 h-3" />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paged.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-10 text-center text-slate-500">
                      No matching synthetic patients found. Try clearing your search or filters.
                    </td>
                  </tr>
                ) : (
                  paged.map(({ patient, analysis, latestLab, latestRetinal }) => (
                    <tr
                      key={patient.id}
                      onClick={() => setDrawerPatientId(patient.id)}
                      className="hover:bg-teal-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-semibold text-[#0B1F3A] whitespace-nowrap">
                        {patient.name}
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-600 tabular-nums whitespace-nowrap">
                        {patient.id}
                      </td>
                      <td className="py-3 px-3 tabular-nums text-slate-700 whitespace-nowrap">
                        {patient.age} · {patient.sex[0]}
                      </td>
                      <td className="py-3 px-3 text-slate-600 max-w-[200px] truncate">
                        {patient.conditions.join(', ')}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums font-medium text-[#0B1F3A] whitespace-nowrap">
                        {latestLab?.hba1c !== undefined ? `${latestLab.hba1c}%` : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700 whitespace-nowrap">
                        {latestLab?.egfr !== undefined ? `${latestLab.egfr}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-700 whitespace-nowrap">
                        {latestRetinal
                          ? latestRetinal.doctorAssessment ??
                            `${latestRetinal.possibleStage} (unconf.)`
                          : 'No exam'}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={analysis.overallRisk} compact />
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge label={patient.reviewStatus} compact />
                      </td>
                      <td className="py-3 px-4 text-slate-500 tabular-nums whitespace-nowrap">
                        {formatShortDate(patient.lastVisitDate)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Bar */}
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
            <span className="tabular-nums">
              Showing {filtered.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}–
              {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length}{' '}
              patients
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <span className="px-2 tabular-nums">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Patient 360 Detail Drawer */}
      {drawerEntry && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/45">
          <div className="w-full max-w-2xl bg-white h-full shadow-2xl border-l border-slate-200 flex flex-col">
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h2 className="text-base font-semibold text-[#0B1F3A]">
                    Patient 360 · {drawerEntry.patient.name}
                  </h2>
                  <span className="font-mono text-xs text-slate-500">
                    {drawerEntry.patient.id}
                  </span>
                  <StatusBadge label={drawerEntry.patient.reviewStatus} compact />
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {drawerEntry.patient.age} yrs · {drawerEntry.patient.sex} · BMI{' '}
                  {drawerEntry.patient.bmi} · {drawerEntry.patient.trajectoryTag}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setDrawerPatientId(null)}
                className="p-1.5 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Workspace Launch Buttons */}
            <div className="px-6 py-3 border-b border-slate-200 bg-white flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  jumpToModule(drawerEntry.patient, '/doctor/decisions')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54]"
              >
                <Stethoscope className="w-3.5 h-3.5 text-[#2DD4BF]" />
                <span>Open Clinical Decision Support</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  jumpToModule(drawerEntry.patient, '/doctor/retinal')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B1F3A] hover:bg-slate-50"
              >
                <Eye className="w-3.5 h-3.5 text-[#0D9488]" />
                <span>Retinal Workspace</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  jumpToModule(drawerEntry.patient, '/doctor/kidney')
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-[#0B1F3A] hover:bg-slate-50"
              >
                <HeartPulse className="w-3.5 h-3.5 text-amber-600" />
                <span>Kidney Intelligence</span>
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
              {/* Conditions & Latest Measurements */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Latest HbA1c</div>
                  <div className="text-lg font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {drawerEntry.latestLab?.hba1c ?? '—'}%
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Latest eGFR</div>
                  <div className="text-lg font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {drawerEntry.latestLab?.egfr ?? '—'}
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Latest UACR</div>
                  <div className="text-lg font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {drawerEntry.latestLab?.uacr ?? '—'} mg/g
                  </div>
                </div>
                <div className="p-3 rounded-md bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Latest BP</div>
                  <div className="text-lg font-semibold text-[#0B1F3A] tabular-nums mt-0.5">
                    {drawerEntry.patient.vitals24h.slice(-1)[0]?.systolic}/
                    {drawerEntry.patient.vitals24h.slice(-1)[0]?.diastolic}
                  </div>
                </div>
              </div>

              {/* Lab History Table */}
              <div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  Laboratory History
                </h3>
                <div className="border border-slate-200 rounded-md overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                      <tr>
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">HbA1c</th>
                        <th className="py-2 px-3">eGFR</th>
                        <th className="py-2 px-3">UACR</th>
                        <th className="py-2 px-3">Creatinine</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                      {[...drawerEntry.patient.labs].reverse().map((l) => (
                        <tr key={l.id}>
                          <td className="py-2 px-3 font-sans">
                            {formatShortDate(l.date)}
                          </td>
                          <td className="py-2 px-3">{l.hba1c ?? '—'}%</td>
                          <td className="py-2 px-3">{l.egfr ?? '—'}</td>
                          <td className="py-2 px-3">{l.uacr ?? '—'}</td>
                          <td className="py-2 px-3">{l.creatinine ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Vital Sign Trend */}
              <div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  6-Month Blood Pressure & Heart Rate Trend
                </h3>
                <div className="h-[170px] w-full border border-slate-200 rounded-md p-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={drawerEntry.patient.vitals6m}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} />
                      <YAxis domain={[55, 165]} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                      <Line type="monotone" dataKey="systolic" name="Systolic" stroke="#0B1F3A" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="diastolic" name="Diastolic" stroke="#0D9488" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="heartRate" name="HR (bpm)" stroke="#0891B2" strokeWidth={1.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Simulated AI Observations & Retinal Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-semibold text-[#0B1F3A]">
                    Simulated AI Observations
                  </div>
                  <p className="text-slate-600">
                    {drawerEntry.analysis.kidney.explanation}
                  </p>
                </div>
                <div className="p-3.5 rounded-md bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="font-semibold text-[#0B1F3A]">
                    Retinal Screening Summary
                  </div>
                  <p className="text-slate-600">
                    {drawerEntry.latestRetinal
                      ? `${formatShortDate(drawerEntry.latestRetinal.date)} · ${
                          drawerEntry.latestRetinal.doctorAssessment ??
                          `${drawerEntry.latestRetinal.possibleStage} (Unconfirmed)`
                        }`
                      : 'No retinal screening recorded on file.'}
                  </p>
                </div>
              </div>

              {/* Doctor Notes & Care Plan */}
              <div>
                <h3 className="font-semibold text-[#0B1F3A] mb-2">
                  Clinician Notes & Care Plan ({drawerEntry.patient.carePlan.length})
                </h3>
                <div className="space-y-2">
                  {drawerEntry.patient.clinicalNotes.map((cn) => (
                    <div
                      key={cn.id}
                      className="p-3 rounded border border-slate-200 bg-white space-y-1"
                    >
                      <div className="flex justify-between text-slate-500">
                        <span className="font-semibold text-slate-800">{cn.author}</span>
                        <span>{formatShortDate(cn.date)}</span>
                      </div>
                      <p className="text-slate-700">{cn.note}</p>
                    </div>
                  ))}
                  {drawerEntry.patient.clinicalNotes.length === 0 && (
                    <p className="text-slate-500">No saved physician notes yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </PortalLayout>
  );
};
