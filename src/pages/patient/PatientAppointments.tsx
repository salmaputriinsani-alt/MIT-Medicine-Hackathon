import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  MessageSquare,
  Send,
} from 'lucide-react';
import { DemoNoticeBanner } from '../../components/DemoNoticeBanner';
import { PortalLayout } from '../../components/PortalLayout';
import { StatusBadge } from '../../components/StatusBadge';
import { useAurelix } from '../../context/AurelixContext';
import { AppointmentRecord } from '../../types/clinical';
import { daysAheadDateStr, formatDateTime, formatShortDate } from '../../utils/dateUtils';
import avatarDoctor from '../../assets/images/avatar_doctor_maya_1794731370235.jpg';

export const PatientAppointments: React.FC = () => {
  const {
    patients,
    appointments,
    messages,
    requestAppointment,
    sendPatientMessage,
  } = useAurelix();
  const patient = patients.find((p) => p.id === 'PT-1001') ?? patients[0];
  const myApts = appointments.filter((a) => a.patientId === patient.id);
  const myMsgs = messages.filter((m) => m.patientId === patient.id);

  const [aptDate, setAptDate] = useState(daysAheadDateStr(14));
  const [aptTime, setAptTime] = useState('10:30 AM');
  const [aptType, setAptType] =
    useState<AppointmentRecord['type']>('In-Clinic Review');
  const [aptReason, setAptReason] = useState('');
  const [aptSavedBanner, setAptSavedBanner] = useState(false);

  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [msgSentBanner, setMsgSentBanner] = useState(false);

  const handleRequestApt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aptReason.trim()) return;
    requestAppointment(patient.id, aptDate, aptTime, aptType, aptReason.trim());
    setAptReason('');
    setAptSavedBanner(true);
    setTimeout(() => setAptSavedBanner(false), 3500);
  };

  const handleSendMsg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!msgSubject.trim() || !msgBody.trim()) return;
    sendPatientMessage(patient.id, msgSubject.trim(), msgBody.trim());
    setMsgSubject('');
    setMsgBody('');
    setMsgSentBanner(true);
    setTimeout(() => setMsgSentBanner(false), 3500);
  };

  const upcomingApts = myApts.filter((a) => a.status !== 'Completed');
  const pastApts = myApts.filter((a) => a.status === 'Completed');

  return (
    <PortalLayout
      role="patient"
      pageTitle="Appointments & Messages"
      pageSubtitle="Clinic visits, follow-up schedule, and simulated care-team messaging."
    >
      <div className="space-y-6">
        <DemoNoticeBanner
          message="Appointment requests and messages update local demo state only and are not transmitted to external medical staff."
          tags={['Simulated Messaging', 'Local Demo State']}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Appointments + Mock Request Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Upcoming & Requested Visits */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#0D9488]" />
                  <h2 className="text-sm font-semibold text-[#0B1F3A]">
                    Upcoming & Requested Visits
                  </h2>
                </div>
                <span className="text-xs text-slate-500 tabular-nums">
                  {upcomingApts.length} scheduled
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {upcomingApts.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg border border-slate-200 bg-slate-50/70 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-[#0B1F3A] tabular-nums">
                        {formatShortDate(apt.date)}
                      </span>
                      <StatusBadge label={apt.status} compact />
                    </div>
                    <div className="text-xs text-slate-700 font-medium">
                      {apt.type} · {apt.clinician}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {apt.time}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {apt.location}
                      </span>
                    </div>
                    {apt.notes && (
                      <p className="text-xs text-slate-600 pt-1 border-t border-slate-200/70">
                        {apt.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Past Visits */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-xs font-semibold text-slate-700 mb-2">
                  Past Visits
                </h3>
                <div className="divide-y divide-slate-100">
                  {pastApts.map((apt) => (
                    <div
                      key={apt.id}
                      className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[#0B1F3A] tabular-nums">
                          {formatShortDate(apt.date)}
                        </span>{' '}
                        <span className="text-slate-600">
                          · {apt.type} with {apt.clinician}
                        </span>
                        {apt.notes && (
                          <div className="text-slate-500 mt-0.5">{apt.notes}</div>
                        )}
                      </div>
                      <StatusBadge label={apt.status} compact />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Message Inbox + Composer */}
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#0D9488]" />
                <h2 className="text-sm font-semibold text-[#0B1F3A]">
                  Care Team Messages (Demo Inbox)
                </h2>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                {myMsgs.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-lg border text-xs space-y-1 ${
                      msg.senderRole === 'patient'
                        ? 'bg-teal-50/50 border-teal-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-[#0B1F3A]">
                        {msg.sender}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(msg.timestamp)}
                      </span>
                    </div>
                    <div className="font-medium text-slate-800">{msg.subject}</div>
                    <p className="text-slate-600 leading-relaxed">{msg.body}</p>
                  </div>
                ))}
              </div>

              <form onSubmit={handleSendMsg} className="pt-3 border-t border-slate-200 space-y-3">
                <div className="text-xs font-semibold text-[#0B1F3A]">
                  Compose Demo Message to Dr. Maya Tan
                </div>
                <input
                  type="text"
                  required
                  value={msgSubject}
                  onChange={(e) => setMsgSubject(e.target.value)}
                  placeholder="Subject (e.g., Question about morning BP log)"
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
                <textarea
                  rows={3}
                  required
                  value={msgBody}
                  onChange={(e) => setMsgBody(e.target.value)}
                  placeholder="Write a simulated message..."
                  className="w-full px-3 py-2 rounded-md border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Demo action · Saved locally only
                  </span>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54]"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Demo Message</span>
                  </button>
                </div>
                {msgSentBanner && (
                  <p className="text-xs text-emerald-700 font-medium">
                    Demo message added to your local conversation thread.
                  </p>
                )}
              </form>
            </div>
          </div>

          {/* Right Column: Assigned Doctor + Request Appointment Form */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={avatarDoctor}
                  alt="Dr. Maya Tan"
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-full object-cover object-top border border-slate-200"
                />
                <div>
                  <h3 className="text-sm font-semibold text-[#0B1F3A]">
                    Dr. Maya Tan
                  </h3>
                  <p className="text-xs text-slate-500">
                    Endocrinology & Predictive Care
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Supervises your longitudinal glucose monitoring, kidney biomarker reviews, and diabetic retinal screening evaluations.
              </p>
            </div>

            <div className="bg-white rounded-lg border border-slate-200 p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#0B1F3A]">
                Request Follow-Up Appointment (Demo)
              </h3>
              <form onSubmit={handleRequestApt} className="space-y-3 text-xs">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Preferred Date
                  </label>
                  <input
                    type="date"
                    required
                    value={aptDate}
                    onChange={(e) => setAptDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Preferred Time
                  </label>
                  <select
                    value={aptTime}
                    onChange={(e) => setAptTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white"
                  >
                    <option>09:00 AM</option>
                    <option>10:30 AM</option>
                    <option>02:00 PM</option>
                    <option>04:00 PM</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Visit Format
                  </label>
                  <select
                    value={aptType}
                    onChange={(e) =>
                      setAptType(e.target.value as AppointmentRecord['type'])
                    }
                    className="w-full px-3 py-2 rounded-md border border-slate-300 bg-white"
                  >
                    <option value="In-Clinic Review">In-Clinic Review</option>
                    <option value="Telehealth Check-in">Telehealth Check-in</option>
                    <option value="Retinal & Lab Follow-up">
                      Retinal & Lab Follow-up
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">
                    Reason / Notes
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={aptReason}
                    onChange={(e) => setAptReason(e.target.value)}
                    placeholder="e.g., Discuss recent UACR lab and eye screening..."
                    className="w-full px-3 py-2 rounded-md border border-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-md bg-[#0D9488] text-white font-medium hover:bg-[#0F766E] transition-colors"
                >
                  Submit Demo Appointment Request
                </button>
                {aptSavedBanner && (
                  <p className="text-emerald-700 font-medium">
                    Demo request added to your Upcoming Visits list.
                  </p>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
};
