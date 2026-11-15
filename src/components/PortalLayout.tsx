import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Eye,
  FileBarChart2,
  GitBranch,
  HeartPulse,
  HelpCircle,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  Users,
  X,
} from 'lucide-react';
import { useAurelix } from '../context/AurelixContext';
import { UserRole } from '../types/clinical';
import { formatDateTime } from '../utils/dateUtils';
import { BrandLogo } from './BrandLogo';

import avatarDoctor from '../assets/images/avatar_doctor_maya_1794731370235.jpg';
import avatarPatient from '../assets/images/avatar_patient_aisha_1794731370216.jpg';

interface NavTab {
  to: string;
  label: string;
  icon: React.FC<{ className?: string }>;
}

const PATIENT_TABS: NavTab[] = [
  { to: '/patient/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { to: '/patient/timeline', label: 'Health Timeline', icon: Activity },
  { to: '/patient/insights', label: 'AI Risk Insights', icon: Sparkles },
  { to: '/patient/eye-screening', label: 'Eye Screening', icon: Eye },
  { to: '/patient/kidney-health', label: 'Kidney Health', icon: HeartPulse },
  { to: '/patient/care-plan', label: 'My Care Plan', icon: ListChecks },
  { to: '/patient/appointments', label: 'Appointments & Messages', icon: Calendar },
];

const DOCTOR_TABS: NavTab[] = [
  { to: '/doctor/dashboard', label: 'Command Center', icon: LayoutDashboard },
  { to: '/doctor/patients', label: 'Patient Registry', icon: Users },
  { to: '/doctor/triage', label: 'AI Triage Queue', icon: GitBranch },
  { to: '/doctor/retinal', label: 'Retinal Screening', icon: Eye },
  { to: '/doctor/kidney', label: 'Kidney Intelligence', icon: HeartPulse },
  { to: '/doctor/decisions', label: 'Clinical Decision Support', icon: Stethoscope },
  { to: '/doctor/reports', label: 'Reports & Audit', icon: FileBarChart2 },
];

interface PortalLayoutProps {
  role: UserRole;
  pageTitle: string;
  pageSubtitle?: string;
  headerAction?: React.ReactNode;
  children: React.ReactNode;
}

export const PortalLayout: React.FC<PortalLayoutProps> = ({
  role,
  pageTitle,
  pageSubtitle,
  headerAction,
  children,
}) => {
  const {
    session,
    logout,
    notifications,
    markNotificationsRead,
    resetDemoData,
  } = useAurelix();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState(false);

  const tabs = role === 'patient' ? PATIENT_TABS : DOCTOR_TABS;
  const roleNotifs = notifications.filter((n) => n.role === role);
  const unreadCount = roleNotifs.filter((n) => !n.read).length;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleReset = () => {
    resetDemoData();
    setNotifOpen(false);
  };

  const SidebarContent = (isMobile = false) => (
    <div className="flex flex-col h-full bg-[#0B1F3A] text-slate-100 select-none">
      {/* Top Brand */}
      <div
        className={`flex items-center justify-between px-4 py-4 border-b border-white/10 ${
          collapsed && !isMobile ? 'justify-center px-2' : ''
        }`}
      >
        {collapsed && !isMobile ? (
          <BrandLogo variant="light" size="sm" />
        ) : (
          <BrandLogo variant="light" size="sm" showTagline />
        )}
        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="hidden lg:flex p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-md text-slate-300 hover:text-white hover:bg-white/10"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Portal Role Label */}
      {(!collapsed || isMobile) && (
        <div className="px-4 pt-3 pb-1.5">
          <div className="text-[11px] font-medium text-teal-300/90 tracking-wide">
            {role === 'doctor' ? 'Clinician Intelligence ERP' : 'Patient Health Portal'}
          </div>
        </div>
      )}

      {/* 7 Navigation Tabs — Compact so no vertical scrolling needed at 100% laptop zoom */}
      <nav className="flex-1 px-2.5 py-2 space-y-1 overflow-y-auto" aria-label="Primary navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              onClick={() => setMobileOpen(false)}
              title={collapsed && !isMobile ? tab.label : undefined}
              className={({ isActive }) =>
                `group relative flex items-center gap-3 px-3 py-2.5 rounded-md text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'bg-white/12 text-white'
                    : 'text-slate-300 hover:text-white hover:bg-white/6'
                } ${collapsed && !isMobile ? 'justify-center px-2' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r bg-[#2DD4BF]"
                      aria-hidden="true"
                    />
                  )}
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#2DD4BF]' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  {(!collapsed || isMobile) && (
                    <span className="truncate">{tab.label}</span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom User Identity & Logout */}
      <div className="p-3 border-t border-white/10 space-y-2.5 bg-[#07162B]">
        <div
          className={`flex items-center gap-2.5 ${
            collapsed && !isMobile ? 'justify-center' : ''
          }`}
        >
          <img
            src={role === 'doctor' ? avatarDoctor : avatarPatient}
            alt={session?.name ?? 'User avatar'}
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-full object-cover object-top border border-white/20 shrink-0 bg-slate-800"
          />
          {(!collapsed || isMobile) && (
            <div className="min-w-0 flex-1">
              <div className="text-xs font-semibold text-white truncate">
                {session?.name ?? (role === 'doctor' ? 'Dr. Maya Tan' : 'Aisha Rahman')}
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {role === 'doctor' ? 'Attending Physician · ID MD-204' : 'Patient · PT-1001'}
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-slate-200 bg-white/8 hover:bg-white/14 transition-colors ${
            collapsed && !isMobile ? 'justify-center px-2' : 'justify-between'
          }`}
          title="Sign out of demo session"
        >
          {(!collapsed || isMobile) && <span>Sign Out</span>}
          <LogOut className="w-3.5 h-3.5 text-slate-300 shrink-0" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-[#F4F7FA] text-[#0F172A]">
      {/* Fixed Desktop Sidebar */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-30 transition-all duration-200 ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        {SidebarContent(false)}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-72 max-w-[85vw] h-full z-10 shadow-xl">
            {SidebarContent(true)}
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-200 ${
          collapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
        }`}
      >
        {/* Page-Specific ERP Header */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-md text-slate-600 hover:bg-slate-100"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-lg sm:text-xl font-semibold text-[#0B1F3A] tracking-tight truncate">
                    {pageTitle}
                  </h1>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 border-l border-slate-200 pl-2.5 whitespace-nowrap">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
                    Demo Environment · Synthetic Data
                  </span>
                </div>
                {pageSubtitle && (
                  <p className="text-xs sm:text-[13px] text-slate-500 truncate mt-0.5">
                    {pageSubtitle}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <span className="hidden xl:inline text-xs text-slate-500 tabular-nums mr-1">
                {todayFormatted}
              </span>

              {headerAction}

              <button
                type="button"
                onClick={() => setStoryOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                title="Open guided demo scenario steps"
              >
                <HelpCircle className="w-3.5 h-3.5 text-[#0D9488]" />
                <span className="hidden sm:inline">Demo Guide</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-slate-200 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors whitespace-nowrap"
                title="Reset simulated demo changes back to baseline"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden md:inline">Reset Demo</span>
              </button>

              {/* Notification Popover Trigger */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((v) => !v)}
                  className="relative p-2 rounded-md border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#0D9488] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-30"
                      onClick={() => setNotifOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-lg border border-slate-200 shadow-lg z-40 overflow-hidden">
                      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                        <span className="text-xs font-semibold text-[#0B1F3A]">
                          Workspace Notifications
                        </span>
                        <button
                          type="button"
                          onClick={() => markNotificationsRead(role)}
                          className="text-[11px] font-medium text-[#0D9488] hover:underline"
                        >
                          Mark all read
                        </button>
                      </div>
                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                        {roleNotifs.length === 0 ? (
                          <div className="p-4 text-xs text-slate-500 text-center">
                            No notifications at this time.
                          </div>
                        ) : (
                          roleNotifs.map((n) => (
                            <button
                              key={n.id}
                              type="button"
                              onClick={() => {
                                setNotifOpen(false);
                                navigate(n.linkTo);
                              }}
                              className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors ${
                                !n.read ? 'bg-teal-50/40' : ''
                              }`}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-semibold text-slate-900">
                                  {n.title}
                                </span>
                                {!n.read && (
                                  <span className="text-[10px] font-semibold text-[#0D9488] shrink-0">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                                {n.description}
                              </p>
                              <span className="text-[11px] text-slate-400 mt-1 block">
                                {formatDateTime(n.timestamp)}
                              </span>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable Workspace Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Discreet Demo Scenario Helper Modal */}
      {storyOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-[#0D9488]" />
                <h3 className="text-sm font-semibold text-[#0B1F3A]">
                  End-to-End Demo Storyline Guide
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setStoryOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3 text-xs text-slate-600 leading-relaxed">
              <p>
                This prototype demonstrates how longitudinal patient data, simulated AI risk detection, and physician supervision connect across portals:
              </p>
              <ol className="list-decimal pl-4 space-y-2 text-slate-700">
                <li>
                  <strong>Patient View (Aisha Rahman · PT-1001):</strong> Inspect her 24h CGM curve, improving HbA1c (8.1% → 7.4%), rising UACR (21 → 44 mg/g), and unconfirmed Mild NPDR screening in <em>Eye Screening</em> and <em>Kidney Health</em>.
                </li>
                <li>
                  <strong>Switch to Doctor View (Dr. Maya Tan):</strong> Sign out and log in as Doctor. Open <em>AI Triage Queue</em>, <em>Retinal Screening</em>, or <em>Clinical Decision Support</em> with Aisha Rahman selected.
                </li>
                <li>
                  <strong>Record Physician Decision:</strong> Confirm or update Aisha&apos;s retinal assessment and save a clinical decision in <em>Clinical Decision Support</em>.
                </li>
                <li>
                  <strong>Verify Cross-Portal Update:</strong> Return to Aisha&apos;s <em>My Care Plan</em> and <em>Eye Screening</em> tabs to see Dr. Maya Tan&apos;s physician-approved updates reflected immediately.
                </li>
              </ol>
              <div className="p-3 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-500">
                All patient records, risk indicators, and model metrics are synthetic demonstration data stored locally in your browser.
              </div>
            </div>
            <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setStoryOpen(false)}
                className="px-4 py-2 rounded-md bg-[#0B1F3A] text-white text-xs font-medium hover:bg-[#132F54]"
              >
                Close Guide
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
