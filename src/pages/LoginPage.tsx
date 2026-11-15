import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Lock,
  ShieldCheck,
  Sparkles,
  Stethoscope,
  User,
} from 'lucide-react';
import { BrandLogo } from '../components/BrandLogo';
import { useAurelix } from '../context/AurelixContext';
import { UserRole } from '../types/clinical';
import loginHeroImg from '../assets/images/login_medical_workstation_1794731369537.jpg';

const DEMO_CREDS: Record<
  UserRole,
  { name: string; userId: string; email: string; password: string; roleTitle: string }
> = {
  patient: {
    name: 'Aisha Rahman',
    userId: 'PT-1001',
    email: 'aisha.patient@demo.aurelix.ai',
    password: 'demo123',
    roleTitle: 'Patient Portal · PT-1001',
  },
  doctor: {
    name: 'Dr. Maya Tan',
    userId: 'MD-204',
    email: 'doctor@demo.aurelix.ai',
    password: 'demo123',
    roleTitle: 'Clinician ERP · Attending Physician',
  },
};

export const LoginPage: React.FC = () => {
  const { login } = useAurelix();
  const navigate = useNavigate();

  const [role, setRole] = useState<UserRole>('patient');
  const [email, setEmail] = useState<string>(DEMO_CREDS.patient.email);
  const [password, setPassword] = useState<string>(DEMO_CREDS.patient.password);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [remember, setRemember] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [scenarioOpen, setScenarioOpen] = useState<boolean>(false);

  const handleRoleSwitch = (nextRole: UserRole) => {
    setRole(nextRole);
    setEmail(DEMO_CREDS[nextRole].email);
    setPassword(DEMO_CREDS[nextRole].password);
    setError('');
  };

  const handleTryDemo = () => {
    setEmail(DEMO_CREDS[role].email);
    setPassword(DEMO_CREDS[role].password);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const expected = DEMO_CREDS[role];
    if (
      email.trim().toLowerCase() !== expected.email.toLowerCase() ||
      password !== expected.password
    ) {
      setError(
        `Use demo credentials (${expected.email} / ${expected.password}) or click "Try Demo Account".`
      );
      return;
    }
    login({
      role,
      userId: expected.userId,
      name: expected.name,
      email: expected.email,
      remember,
    });
    navigate(role === 'patient' ? '/patient/dashboard' : '/doctor/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* LEFT PANEL: 52-55% width */}
      <div className="relative lg:w-[54%] min-h-[340px] lg:min-h-screen bg-[#071326] overflow-hidden flex flex-col justify-between p-8 sm:p-12 lg:p-14 text-white">
        <img
          src={loginHeroImg}
          alt="Modern hospital diagnostic intelligence workstation"
          referrerPolicy="no-referrer"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-55"
        />
        {/* Measured contrast scrim */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-[#071326] via-[#0B1F3A]/80 to-[#0B1F3A]/60"
          aria-hidden="true"
        />

        {/* Top Left Tag */}
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-teal-200 tracking-wide">
            <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
            <span>Demo Environment · Synthetic Clinical Prototype</span>
          </div>
        </div>

        {/* Center/Bottom Narrative */}
        <div className="relative z-10 max-w-xl my-auto py-8 lg:py-0">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#2DD4BF] uppercase mb-3">
            AURELIX AI
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-[42px] font-semibold leading-[1.15] tracking-tight text-white [text-wrap:balance]">
            Predictive Health Intelligence
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-200 leading-relaxed max-w-lg">
            &ldquo;Turning patient data into earlier insights and doctor-guided decisions.&rdquo;
          </p>

          <div className="mt-8 pt-6 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-start gap-2.5">
              <Activity className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Continuous Health Monitoring
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Longitudinal CGM, vitals & labs
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Predictive Risk Intelligence
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Explainable early-signal screening
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Stethoscope className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
              <div>
                <div className="text-xs font-semibold text-white">
                  Doctor-Verified Decisions
                </div>
                <div className="text-[11px] text-slate-300 mt-0.5">
                  Clinician judgment stays central
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal/Safety Footer */}
        <div className="relative z-10 text-xs text-slate-300/90 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span>Not for Clinical Use</span>
          <span aria-hidden="true">·</span>
          <span>Fictional Synthetic Dataset</span>
          <span aria-hidden="true">·</span>
          <span>Physician Review Required</span>
        </div>
      </div>

      {/* RIGHT PANEL: 45-48% width */}
      <div className="lg:w-[46%] flex flex-col justify-center px-6 py-10 sm:px-12 lg:px-14 bg-white">
        <div className="w-full max-w-md mx-auto">
          <BrandLogo variant="dark" size="lg" showTagline />

          <div className="mt-7">
            <h2 className="font-display text-2xl font-semibold text-[#0B1F3A] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Access your intelligent healthcare workspace
            </p>
          </div>

          {/* Role Selection Cards */}
          <div className="mt-6">
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Select Workspace Role
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleRoleSwitch('patient')}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  role === 'patient'
                    ? 'border-[#0B1F3A] bg-slate-50 ring-1 ring-[#0B1F3A]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-md shrink-0 ${
                    role === 'patient'
                      ? 'bg-[#0B1F3A] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0B1F3A]">Patient</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Aisha Rahman
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleRoleSwitch('doctor')}
                className={`flex items-start gap-3 p-3.5 rounded-lg border text-left transition-all ${
                  role === 'doctor'
                    ? 'border-[#0B1F3A] bg-slate-50 ring-1 ring-[#0B1F3A]'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div
                  className={`p-2 rounded-md shrink-0 ${
                    role === 'doctor'
                      ? 'bg-[#0D9488] text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-[#0B1F3A]">Doctor</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    Dr. Maya Tan
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Try Demo Account Quick-Fill Bar */}
          <div className="mt-4 flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-lg bg-teal-50/70 border border-teal-200/80">
            <div className="min-w-0">
              <div className="text-xs font-semibold text-teal-900">
                {DEMO_CREDS[role].roleTitle}
              </div>
              <div className="text-[11px] text-teal-800/80 font-mono truncate">
                {DEMO_CREDS[role].email}
              </div>
            </div>
            <button
              type="button"
              onClick={handleTryDemo}
              className="px-3 py-1.5 rounded-md bg-[#0D9488] text-white text-xs font-medium hover:bg-[#0F766E] transition-colors whitespace-nowrap shrink-0"
            >
              Try Demo Account
            </button>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <div>
              <label
                htmlFor="demo-email"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Demo Email
              </label>
              <input
                id="demo-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                placeholder="name@demo.aurelix.ai"
              />
            </div>

            <div>
              <label
                htmlFor="demo-password"
                className="block text-xs font-semibold text-slate-700 mb-1.5"
              >
                Demo Password
              </label>
              <div className="relative">
                <input
                  id="demo-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-lg border border-slate-300 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]/30 focus:border-[#0D9488]"
                  placeholder="Enter demo password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <label className="inline-flex items-center gap-2 text-slate-600 cursor-pointer">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span>Remember demo session</span>
              </label>
              <span className="inline-flex items-center gap-1 text-slate-400">
                <Lock className="w-3 h-3" />
                Local demo auth
              </span>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-[#0B1F3A] text-white text-sm font-semibold hover:bg-[#132F54] transition-colors shadow-xs"
            >
              <span>Sign In to {role === 'patient' ? 'Patient Portal' : 'Doctor Workspace'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Compact Demo Scenario Helper */}
          <div className="mt-6 border border-slate-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setScenarioOpen((v) => !v)}
              className="w-full px-3.5 py-2.5 bg-slate-50 flex items-center justify-between text-xs font-semibold text-[#0B1F3A] hover:bg-slate-100/80 transition-colors"
            >
              <span>Demo Scenario Walkthrough & Fictional Credentials</span>
              {scenarioOpen ? (
                <ChevronUp className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              )}
            </button>
            {scenarioOpen && (
              <div className="p-3.5 bg-white border-t border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[11px] bg-slate-50 p-2.5 rounded border border-slate-200">
                  <div>
                    <div className="font-sans font-semibold text-slate-800">Patient Demo</div>
                    <div>aisha.patient@demo.aurelix.ai</div>
                    <div>Pass: demo123</div>
                  </div>
                  <div>
                    <div className="font-sans font-semibold text-slate-800">Doctor Demo</div>
                    <div>doctor@demo.aurelix.ai</div>
                    <div>Pass: demo123</div>
                  </div>
                </div>
                <p>
                  <strong>Recommended flow:</strong> Sign in as <em>Aisha Rahman</em> to inspect her CGM curves, kidney trends, and unconfirmed eye screening. Then sign in as <em>Dr. Maya Tan</em> to review her evidence, save a clinical decision, and verify the approved update back in Aisha&apos;s Care Plan.
                </p>
              </div>
            )}
          </div>

          <p className="mt-4 text-[11px] text-slate-400 text-center">
            Fictional demonstration credentials only · Not connected to live patient records.
          </p>
        </div>
      </div>
    </div>
  );
};
