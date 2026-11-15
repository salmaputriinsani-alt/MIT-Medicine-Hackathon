import React from 'react';

interface BrandLogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'dark',
  size = 'md',
  showTagline = false,
}) => {
  const iconDim = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleClass =
    size === 'sm' ? 'text-base' : size === 'lg' ? 'text-xl' : 'text-lg';
  const textColor = variant === 'light' ? 'text-white' : 'text-[#0B1F3A]';
  const subColor = variant === 'light' ? 'text-slate-300' : 'text-slate-500';

  return (
    <div className="flex items-center gap-2.5 shrink-0">
      <svg
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={iconDim}
        aria-hidden="true"
      >
        <path
          d="M20 3.5L32.5 8.5V18.8C32.5 26.8 27.1 33.4 20 36.2C12.9 33.4 7.5 26.8 7.5 18.8V8.5L20 3.5Z"
          fill={variant === 'light' ? '#0D9488' : '#0B1F3A'}
          fillOpacity={variant === 'light' ? '0.2' : '0.96'}
          stroke={variant === 'light' ? '#2DD4BF' : '#0B1F3A'}
          strokeWidth="1.6"
        />
        <ellipse
          cx="20"
          cy="19.5"
          rx="10.5"
          ry="4.2"
          transform="rotate(-24 20 19.5)"
          stroke="#0D9488"
          strokeWidth="1.3"
          strokeOpacity="0.85"
        />
        <path
          d="M11 19.5H15.2L17.3 14.5L20.1 24.5L22.5 17.5L24.2 19.5H29"
          stroke={variant === 'light' ? '#5EEAD4' : '#2DD4BF'}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <div className="min-w-0">
        <div
          className={`font-display font-semibold tracking-tight leading-none whitespace-nowrap ${titleClass} ${textColor}`}
        >
          Aurelix <span className="text-[#0D9488]">AI</span>
        </div>
        {showTagline && (
          <p className={`text-[11px] leading-tight mt-0.5 truncate ${subColor}`}>
            Predictive Health Intelligence
          </p>
        )}
      </div>
    </div>
  );
};
