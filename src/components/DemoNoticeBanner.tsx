import React from 'react';
import { ShieldAlert } from 'lucide-react';

interface DemoNoticeBannerProps {
  title?: string;
  message: string;
  tags?: string[];
}

export const DemoNoticeBanner: React.FC<DemoNoticeBannerProps> = ({
  title = 'Clinical Decision Support Notice',
  message,
  tags = ['Simulated AI Assessment', 'Physician Review Required'],
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
      <div className="flex items-start sm:items-center gap-2.5">
        <ShieldAlert className="w-4 h-4 text-[#0B1F3A] shrink-0 mt-0.5 sm:mt-0" aria-hidden="true" />
        <div>
          <span className="font-semibold text-[#0B1F3A]">{title}: </span>
          <span>{message}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-slate-500 shrink-0 flex-wrap">
        {tags.map((t, i) => (
          <React.Fragment key={t}>
            {i > 0 && <span aria-hidden="true">·</span>}
            <span className="font-medium text-slate-600 whitespace-nowrap">{t}</span>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};
