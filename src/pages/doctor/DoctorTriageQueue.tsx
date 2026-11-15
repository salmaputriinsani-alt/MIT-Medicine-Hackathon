import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  FileQuestion,
  Stethoscope,
  X,
  XCircle,
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { TriageCategory, TriageStatus } from '../../types/clinical';
import { formatShortDate } from '../../utils/dateUtils';

const STATUS_TABS: ('All' | TriageStatus)[] = [
  'Pending',
  'Under Review',
  'Reviewed',
  'Follow-up Requested',
  'All',
];

const CATEGORIES: ('All' | TriageCategory)[] = [
  'All',
  'Retinal screening observation',
  'Kidney-risk signal',
  'Glucose variability',
  'Abnormal trend',
  'Missing screening',
  'Incomplete follow-up',
];

export const DoctorTriageQueue: React.FC = () => {
  const { triageItems, updateTriageStatus, setSelectedPatientId } =
    useAurelix();
  const navigate = useNavigate();

  const [statusTab, setStatusTab] = useState<'All' | TriageStatus>('Pending');
  const [categoryFilter, setCategoryFilter] =
    useState<'All' | TriageCategory>('All');
  const [dismissTargetId, setDismissTargetId] = useState<string | null>(null);
  const [dismissReason, setDismissReason] = useState('');

  const filtered = triageItems.filter((item) => {
    const matchStatus =
      statusTab === 'All' ? item.status !== 'Dismissed' : item.status === statusTab;
    const matchCategory =
      categoryFilter === 'All' || item.category === categoryFilter;
    return matchStatus && matchCategory;
  });

  const handleOpenDecision = (patientId: string) => {
    setSelectedPatientId(patientId);
    navigate('/doctor/decisions');
  };

  const handleConfirmDismiss = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dismissTargetId || !dismissReason.trim()) return;
    updateTriageStatus(dismissTargetId, 'Dismissed', dismissReason.trim());
    setDismissTargetId(null);
    setDismissReason('');
  };

  return (
    <PortalLayout
      role="doctor"
      pageTitle="AI Triage Queue"
      pageSubtitle="Simulated review prioritization workspace — clinical judgment governs all actions."
    >
      <div className="space-y-5">
        <DemoNoticeBanner
          title="Simulated Triage Prioritization"
          message="Risk categorization is a simulated threshold-based queue organizer, not a validated medical emergency scoring tool."
          tags={['Simulated Triage Queue', 'Physician Decision Required']}
        />

        {/* Status Tabs + Category Filter */}
        <div className="bg-white rounded-lg border border-slate-200 p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100">
            {STATUS_TABS.map((tab) => {
              const count =
                tab === 'All'
                  ? triageItems.filter((t) => t.status !== 'Dismissed').length
                  : triageItems.filter((t) => t.status === tab).length;
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatusTab(tab)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    statusTab === tab
                      ? 'bg-white text-[#0B1F3A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>{tab}</span>
                  <span className="text-[11px] text-slate-400 tabular-nums">
                    ({count})
                  </span>
                </button>
              );
            })}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) =>
              setCategoryFilter(e.target.value as 'All' | TriageCategory)
            }
            className="px-3 py-2 rounded-md border border-slate-300 bg-white text-xs text-slate-700"
            aria-label="Filter by triage category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c === 'All' ? 'All Triage Categories' : c}
              </option>
            ))}
          </select>
        </div>

        {/* Triage Cards List */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center space-y-2">
            <ClipboardCheck className="w-8 h-8 text-slate-400 mx-auto" />
            <div className="text-sm font-semibold text-[#0B1F3A]">
              No items in &ldquo;{statusTab}&rdquo;
            </div>
            <p className="text-xs text-slate-500">
              Switch status tabs or reset demo data to inspect other simulated triage cases.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-slate-200 p-5 space-y-4"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-base font-semibold text-[#0B1F3A]">
                        {item.patientName}
                      </span>
                      <span className="font-mono text-xs text-slate-500">
                        {item.patientId}
                      </span>
                      <span className="text-xs text-slate-500">
                        · {item.category}
                      </span>
                    </div>
                    <div className="text-sm font-medium text-slate-900">
                      {item.triggeringObservation}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <StatusBadge
                      label={`${item.priority} Priority (Sim.)`}
                      tone={
                        item.priority === 'High'
                          ? 'danger'
                          : item.priority === 'Moderate'
                          ? 'warning'
                          : 'neutral'
                      }
                      compact
                    />
                    <StatusBadge label={item.status} compact />
                  </div>
                </div>

                {/* Measurements & Completeness Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3.5 rounded-md bg-slate-50 border border-slate-200/80 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-500">
                      Relevant Measurements
                    </div>
                    <div className="font-mono font-medium text-[#0B1F3A] mt-0.5 tabular-nums">
                      {item.relevantMeasurements}
                    </div>
                  </div>
                  <div>
                    <div className="text-[11px] text-slate-500">
                      Historical Change
                    </div>
                    <div className="font-medium text-slate-800 mt-0.5">
                      {item.historicalChange}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Data Completeness</span>
                      <span className="font-mono tabular-nums font-semibold text-[#0B1F3A]">
                        {item.dataCompleteness}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-[#0D9488]"
                        style={{ width: `${item.dataCompleteness}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="text-xs text-slate-600 leading-relaxed">
                  <strong className="text-[#0B1F3A]">
                    Simulated AI Explanation:{' '}
                  </strong>
                  {item.aiExplanation}{' '}
                  <span className="text-slate-400">
                    (Updated {formatShortDate(item.updatedAt)})
                  </span>
                </div>

                {/* Action Bar */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenDecision(item.patientId)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54] transition-colors"
                    >
                      <Stethoscope className="w-3.5 h-3.5 text-[#2DD4BF]" />
                      <span>Review Evidence</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTriageStatus(
                          item.id,
                          'Follow-up Requested',
                          'Physician requested clinical follow-up.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <span>Mark for Follow-up</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTriageStatus(
                          item.id,
                          'Under Review',
                          'Requested additional diagnostic context.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50"
                    >
                      <FileQuestion className="w-3.5 h-3.5 text-slate-500" />
                      <span>Request Info</span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        updateTriageStatus(
                          item.id,
                          'Reviewed',
                          'Observation reviewed by Dr. Maya Tan.'
                        )
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-emerald-200 bg-emerald-50 text-xs font-medium text-emerald-800 hover:bg-emerald-100/80"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Reviewed</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setDismissTargetId(item.id)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Dismiss Flag</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss Reason Modal */}
      {dismissTargetId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
          <form
            onSubmit={handleConfirmDismiss}
            className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Dismiss Synthetic Flag (Document Reason)
              </h3>
              <button
                type="button"
                onClick={() => setDismissTargetId(null)}
                className="p-1 text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs">
              <p className="text-slate-600">
                Clinical governance requires documenting why a simulated triage alert is being dismissed. This action is recorded in the audit log.
              </p>
              <textarea
                rows={3}
                required
                value={dismissReason}
                onChange={(e) => setDismissReason(e.target.value)}
                placeholder="e.g., Transient post-exercise fluctuation; repeat values within baseline..."
                className="w-full px-3 py-2 rounded-md border border-slate-300"
              />
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDismissTargetId(null)}
                className="px-3 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-md bg-rose-700 text-white text-xs font-medium hover:bg-rose-800"
              >
                Confirm Dismissal
              </button>
            </div>
          </form>
        </div>
      )}
    </PortalLayout>
  );
};
