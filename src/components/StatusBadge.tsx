import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  Info,
} from 'lucide-react';

export type Tone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'teal';

interface StatusBadgeProps {
  label: string;
  tone?: Tone;
  icon?: 'check' | 'clock' | 'warning' | 'alert' | 'info' | 'eye' | 'none';
  compact?: boolean;
}

const TONE_STYLES: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  danger: 'bg-rose-50 text-rose-800 border-rose-200',
  info: 'bg-sky-50 text-sky-800 border-sky-200',
  teal: 'bg-teal-50 text-teal-800 border-teal-200',
};

export function mapStatusToTone(status: string): {
  tone: Tone;
  icon: StatusBadgeProps['icon'];
} {
  const s = status.toLowerCase();
  if (
    s.includes('reviewed') ||
    s.includes('approved') ||
    s.includes('completed') ||
    s.includes('low') ||
    s.includes('stable') ||
    s.includes('improving') ||
    s.includes('no apparent')
  ) {
    return { tone: 'success', icon: 'check' };
  }
  if (
    s.includes('high') ||
    s.includes('worsening') ||
    s.includes('declining') ||
    s.includes('moderate npdr') ||
    s.includes('severe') ||
    s.includes('proliferative')
  ) {
    return { tone: 'danger', icon: 'alert' };
  }
  if (
    s.includes('pending') ||
    s.includes('awaiting') ||
    s.includes('elevated') ||
    s.includes('mild npdr') ||
    s.includes('moderate') ||
    s.includes('additional')
  ) {
    return { tone: 'warning', icon: 'warning' };
  }
  if (s.includes('under review') || s.includes('follow-up') || s.includes('requested')) {
    return { tone: 'info', icon: 'eye' };
  }
  return { tone: 'neutral', icon: 'info' };
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label,
  tone,
  icon,
  compact = false,
}) => {
  const auto = mapStatusToTone(label);
  const resolvedTone = tone ?? auto.tone;
  const resolvedIcon = icon ?? auto.icon;

  const IconEl =
    resolvedIcon === 'check'
      ? CheckCircle2
      : resolvedIcon === 'clock'
      ? Clock
      : resolvedIcon === 'warning'
      ? AlertTriangle
      : resolvedIcon === 'alert'
      ? AlertCircle
      : resolvedIcon === 'eye'
      ? Eye
      : resolvedIcon === 'info'
      ? Info
      : null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-md border font-medium whitespace-nowrap shrink-0 ${
        compact ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      } ${TONE_STYLES[resolvedTone]}`}
    >
      {IconEl && <IconEl className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
      <span>{label}</span>
    </span>
  );
};
