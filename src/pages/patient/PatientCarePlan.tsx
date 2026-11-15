import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Square,
  Stethoscope,
  UserCheck,
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { formatDateTime, formatShortDate } from '../../utils/dateUtils';
import avatarDoctor from '../../assets/images/avatar_doctor_maya_1794731370235.jpg';

export const PatientCarePlan: React.FC = () => {
  const { patients, journalEntries, toggleCarePlanTask, addJournalEntry } =
    useAurelix();
  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];
  const myJournal = journalEntries.filter((j) => j.patientId === patient.id);

  const [noteInput, setNoteInput] = useState('');
  const [glucoseInput, setGlucoseInput] = useState('');

  const handleAddJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim()) return;
    const gVal = glucoseInput ? Number(glucoseInput) : undefined;
    addJournalEntry(
      patient.id,
      noteInput.trim(),
      gVal && !Number.isNaN(gVal) ? gVal : undefined
    );
    setNoteInput('');
    setGlucoseInput('');
  };

  return (
    <PortalLayout
      role="patient"
      pageTitle="My Care Plan"
      pageSubtitle="Physician-approved follow-up tasks, pending reviews, and personal tracking journal."
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="Patients can track personal tasks and log journal observations, but cannot approve clinical findings or issue prescriptions. Physician decisions from Dr. Maya Tan appear automatically once saved."
          tags={['Doctor-Guided Care Plan', 'Demo State Sync']}
        />

        {/* Assigned Doctor & Clinical Review Overview */}
        <div className="bg-white rounded-lg border border-slate-200 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={avatarDoctor}
              alt="Dr. Maya Tan"
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-full object-cover object-top border border-slate-200 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  {patient.assignedDoctor}
                </h2>
                <span className="text-xs text-slate-500">· Assigned Clinician</span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Endocrinology & Predictive Care · Latest visit:{' '}
                {formatShortDate(patient.lastVisitDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Overall Record Status:</span>
            <StatusBadge label={patient.reviewStatus} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Care Plan Items & Clinician Notes */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Care Coordination Tasks & Observations
                  </h3>
                  <p className="text-xs text-slate-500">
                    Clearly distinguishes physician-approved items from AI observations awaiting review.
                  </p>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {patient.carePlan.filter((c) => c.completed).length}/
                  {patient.carePlan.length} done
                </span>
              </div>

              <div className="divide-y divide-slate-100">
                {patient.carePlan.map((item) => {
                  const canToggle =
                    item.sourceType === 'Physician Approved' ||
                    item.sourceType === 'Completed Follow-up';

                  return (
                    <div
                      key={item.id}
                      className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <button
                          type="button"
                          disabled={!canToggle}
                          onClick={() => toggleCarePlanTask(patient.id, item.id)}
                          className={`mt-0.5 shrink-0 ${
                            canToggle
                              ? 'text-[#0D9488] hover:text-[#0F766E] cursor-pointer'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                          title={
                            canToggle
                              ? 'Toggle task completion'
                              : 'Awaiting clinician review before activation'
                          }
                        >
                          {item.completed ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                        <div className="min-w-0">
                          <div
                            className={`text-sm font-medium ${
                              item.completed
                                ? 'line-through text-slate-400'
                                : 'text-[#0B1F3A]'
                            }`}
                          >
                            {item.title}
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                            {item.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1.5">
                            <span>{item.category}</span>
                            {item.dueDate && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span>Target {formatShortDate(item.dueDate)}</span>
                              </>
                            )}
                            {item.approvedBy && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-emerald-700 font-medium inline-flex items-center gap-1">
                                  <UserCheck className="w-3 h-3" />
                                  Approved by {item.approvedBy}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <StatusBadge label={item.sourceType} compact />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clinician Notes Received */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-4 h-4 text-[#0B1F3A]" />
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  Notes Received from Clinician
                </h3>
              </div>
              {patient.clinicalNotes.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No clinician review notes recorded yet.
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {patient.clinicalNotes.map((cn) => (
                    <div key={cn.id} className="py-3 first:pt-0 last:pb-0 space-y-1">
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="font-semibold text-[#0B1F3A]">
                          {cn.author} · {cn.role}
                        </span>
                        <span className="text-slate-400 tabular-nums">
                          {formatShortDate(cn.date)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        {cn.note}
                      </p>
                      {cn.outcome && (
                        <div className="pt-1">
                          <StatusBadge label={cn.outcome} compact />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Personal Observation Journal */}
          <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4 h-fit">
            <div>
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Personal Health Journal
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Log daily meal, activity, or symptom notes to share at your next visit.
              </p>
            </div>

            <form onSubmit={handleAddJournal} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Observation Note
                </label>
                <textarea
                  rows={3}
                  required
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g., Morning BP 132/82 mmHg after 20 min walk..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Optional Glucose (mg/dL)
                </label>
                <input
                  type="number"
                  min={40}
                  max={450}
                  value={glucoseInput}
                  onChange={(e) => setGlucoseInput(e.target.value)}
                  placeholder="e.g., 128"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54] inline-flex items-center justify-center gap-1.5 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Journal Entry (Demo)</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 space-y-2.5">
              <div className="text-xs font-semibold text-slate-700">
                Recent Entries ({myJournal.length})
              </div>
              {myJournal.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 rounded-md bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>{formatDateTime(entry.timestamp)}</span>
                    {entry.glucoseReading && (
                      <span className="font-mono font-semibold text-[#0D9488] tabular-nums">
                        {entry.glucoseReading} mg/dL
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">{entry.note}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
