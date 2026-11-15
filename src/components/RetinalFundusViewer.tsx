import React, { useState } from 'react';
import { Eye, Layers, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { RetinalLesionMarker } from '../types/clinical';

interface RetinalFundusViewerProps {
  title: string;
  subtitle?: string;
  variant: 'normal' | 'mild_npdr' | 'moderate_npdr' | 'missing';
  lesions?: RetinalLesionMarker[];
  defaultShowOverlays?: boolean;
  compact?: boolean;
}

export const RetinalFundusViewer: React.FC<RetinalFundusViewerProps> = ({
  title,
  subtitle,
  variant,
  lesions = [],
  defaultShowOverlays = true,
  compact = false,
}) => {
  const [zoom, setZoom] = useState<number>(1);
  const [showOverlays, setShowOverlays] = useState<boolean>(defaultShowOverlays);
  const [showAnatomy, setShowAnatomy] = useState<boolean>(false);
  const [selectedLesionId, setSelectedLesionId] = useState<string | null>(
    lesions[0]?.id ?? null
  );

  const selectedLesion = lesions.find((l) => l.id === selectedLesionId);

  if (variant === 'missing') {
    return (
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
        <Eye className="w-8 h-8 text-slate-400 mb-2" />
        <p className="text-sm font-semibold text-slate-700">{title}</p>
        <p className="text-xs text-slate-500 mt-1 max-w-xs">
          No retinal photography record is currently available for this patient.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white overflow-hidden flex flex-col">
      {/* Header & Controls */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 bg-slate-50/70">
        <div className="min-w-0">
          <h4 className="text-sm font-semibold text-[#0B1F3A] truncate">{title}</h4>
          {subtitle && (
            <p className="text-xs text-slate-500 truncate">{subtitle}</p>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowOverlays((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              showOverlays
                ? 'bg-[#0B1F3A] text-white border-[#0B1F3A]'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle illustrative markers"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Overlays</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAnatomy((v) => !v)}
            className={`px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
              showAnatomy
                ? 'bg-teal-700 text-white border-teal-700'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            Anatomy
          </button>
          <div className="flex items-center border border-slate-200 rounded-md bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.5).toFixed(1))))}
              disabled={zoom <= 1}
              className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Zoom out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 text-[11px] font-mono tabular-nums text-slate-700">
              {zoom.toFixed(1)}x
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, Number((z + 0.5).toFixed(1))))}
              disabled={zoom >= 2.5}
              className="p-1.5 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              aria-label="Zoom in"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoom > 1 && (
              <button
                type="button"
                onClick={() => setZoom(1)}
                className="p-1.5 text-slate-500 hover:bg-slate-50 border-l border-slate-200"
                aria-label="Reset zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Fundus Canvas */}
      <div
        className={`relative bg-[#080C12] flex items-center justify-center overflow-hidden ${
          compact ? 'h-[260px]' : 'h-[340px]'
        }`}
      >
        <div
          className="transition-transform duration-200 ease-out w-full h-full flex items-center justify-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <svg
            viewBox="0 0 400 400"
            className="w-full h-full max-w-[340px] max-h-[340px]"
            role="img"
            aria-label={`Illustrative retinal fundus visualization: ${title}`}
          >
            <defs>
              <radialGradient id={`fundusBg-${variant}`} cx="48%" cy="50%" r="48%">
                <stop offset="0%" stopColor="#9A3B23" />
                <stop offset="48%" stopColor="#7C2918" />
                <stop offset="82%" stopColor="#4A150D" />
                <stop offset="100%" stopColor="#1E0705" />
              </radialGradient>
              <radialGradient id="opticDiscGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFF0C2" />
                <stop offset="45%" stopColor="#F5BA7A" />
                <stop offset="100%" stopColor="#D67642" stopOpacity="0.85" />
              </radialGradient>
              <radialGradient id="maculaGrad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2E0B07" stopOpacity="0.82" />
                <stop offset="65%" stopColor="#52160D" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#7C2918" stopOpacity="0" />
              </radialGradient>
              <clipPath id="fundusCircleClip">
                <circle cx="200" cy="200" r="172" />
              </clipPath>
            </defs>

            {/* Circular Fundus Field */}
            <circle cx="200" cy="200" r="172" fill={`url(#fundusBg-${variant})`} />

            <g clipPath="url(#fundusCircleClip)">
              {/* Macula & Fovea */}
              <circle cx="236" cy="202" r="46" fill="url(#maculaGrad)" />
              <circle cx="236" cy="202" r="4" fill="#FDE68A" fillOpacity="0.22" />

              {/* Optic Disc & Cup */}
              <ellipse cx="116" cy="198" rx="22" ry="26" fill="url(#opticDiscGrad)" />
              <ellipse cx="118" cy="198" rx="9" ry="11" fill="#FFFBEB" fillOpacity="0.72" />

              {/* Major Venous Arcades (darker crimson) */}
              <g stroke="#430D0A" strokeLinecap="round" fill="none" opacity="0.82">
                <path d="M116 186 C142 135, 195 112, 268 122 C305 127, 336 146, 360 165" strokeWidth="4.2" />
                <path d="M198 118 C222 96, 255 86, 294 82" strokeWidth="2.4" />
                <path d="M270 123 C286 142, 292 158, 302 174" strokeWidth="1.8" />
                <path d="M116 210 C145 262, 198 286, 272 276 C312 270, 342 252, 362 232" strokeWidth="4.2" />
                <path d="M204 280 C228 302, 260 315, 298 320" strokeWidth="2.3" />
                <path d="M268 276 C282 255, 290 238, 298 220" strokeWidth="1.7" />
                <path d="M108 190 C84 156, 62 128, 38 112" strokeWidth="3.2" />
                <path d="M108 208 C82 242, 60 270, 36 288" strokeWidth="3.2" />
              </g>

              {/* Major Arterial Arcades (brighter red-orange, slightly thinner) */}
              <g stroke="#B82A1E" strokeLinecap="round" fill="none" opacity="0.86">
                <path d="M119 190 C148 144, 202 120, 274 134 C310 141, 338 158, 355 174" strokeWidth="2.8" />
                <path d="M180 128 C202 104, 234 92, 268 92" strokeWidth="1.7" />
                <path d="M119 206 C150 256, 206 276, 276 266 C312 260, 338 242, 354 226" strokeWidth="2.8" />
                <path d="M188 269 C212 290, 240 302, 274 304" strokeWidth="1.6" />
                <path d="M105 196 C78 164, 58 142, 38 134" strokeWidth="2.1" />
                <path d="M105 204 C76 234, 56 256, 36 268" strokeWidth="2.1" />
              </g>

              {/* Illustrative Lesion Rendering */}
              {lesions.map((lesion) => {
                const isSelected = lesion.id === selectedLesionId;
                return (
                  <g
                    key={lesion.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedLesionId(lesion.id)}
                  >
                    {lesion.type === 'microaneurysm' && (
                      <circle cx={lesion.x} cy={lesion.y} r="3.2" fill="#EF4444" stroke="#7F1D1D" strokeWidth="0.8" />
                    )}
                    {lesion.type === 'hemorrhage' && (
                      <path
                        d={`M${lesion.x - 4} ${lesion.y} Q${lesion.x} ${lesion.y - 5} ${lesion.x + 5} ${lesion.y - 1} Q${lesion.x + 3} ${lesion.y + 5} ${lesion.x - 3} ${lesion.y + 3} Z`}
                        fill="#991B1B"
                      />
                    )}
                    {lesion.type === 'exudate' && (
                      <g fill="#FDE047" opacity="0.92">
                        <circle cx={lesion.x} cy={lesion.y} r="2.8" />
                        <circle cx={lesion.x + 5} cy={lesion.y + 3} r="2.1" />
                        <circle cx={lesion.x - 4} cy={lesion.y + 4} r="1.8" />
                      </g>
                    )}

                    {/* Illustrative Overlay Ring */}
                    {showOverlays && (
                      <circle
                        cx={lesion.x}
                        cy={lesion.y}
                        r={isSelected ? 14 : 11}
                        fill="none"
                        stroke={
                          lesion.type === 'exudate'
                            ? '#FACC15'
                            : lesion.type === 'hemorrhage'
                            ? '#FB7185'
                            : '#38BDF8'
                        }
                        strokeWidth={isSelected ? '2' : '1.4'}
                        strokeDasharray="3 2"
                      />
                    )}
                  </g>
                );
              })}

              {/* Educational Anatomy Labels */}
              {showAnatomy && (
                <g className="pointer-events-none" fontSize="10" fontWeight="600">
                  <line x1="116" y1="172" x2="116" y2="128" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="64" y="108" width="104" height="18" rx="4" fill="#0F172A" fillOpacity="0.88" stroke="#475569" strokeWidth="0.7" />
                  <text x="116" y="120" textAnchor="middle" fill="#F8FAFC">Optic Disc (Nerve)</text>

                  <line x1="236" y1="202" x2="236" y2="262" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="2 2" />
                  <rect x="182" y="262" width="108" height="18" rx="4" fill="#0F172A" fillOpacity="0.88" stroke="#475569" strokeWidth="0.7" />
                  <text x="236" y="274" textAnchor="middle" fill="#F8FAFC">Macula & Fovea</text>

                  <rect x="242" y="76" width="114" height="18" rx="4" fill="#0F172A" fillOpacity="0.88" stroke="#475569" strokeWidth="0.7" />
                  <text x="299" y="88" textAnchor="middle" fill="#F8FAFC">Temporal Vessels</text>
                </g>
              )}
            </g>

            {/* Outer optical bezel */}
            <circle cx="200" cy="200" r="172" fill="none" stroke="#334155" strokeWidth="2" />
          </svg>
        </div>

        {/* Bottom Left Watermark Notice inside Viewer */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
          <span className="px-2 py-0.5 rounded bg-black/70 text-[10px] text-slate-200 border border-white/10">
            Illustrative Sample Graphic · Not Real Image Inference
          </span>
          {lesions.length > 0 && showOverlays && (
            <span className="px-2 py-0.5 rounded bg-black/70 text-[10px] text-sky-200 border border-white/10 tabular-nums">
              {lesions.length} illustrative marker{lesions.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Interactive Selected Lesion Legend Footer */}
      {lesions.length > 0 && (
        <div className="px-4 py-2.5 border-t border-slate-200 bg-slate-50 text-xs">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            {lesions.map((l) => (
              <button
                key={l.id}
                type="button"
                onClick={() => setSelectedLesionId(l.id)}
                className={`px-2 py-1 rounded border text-[11px] font-medium transition-colors ${
                  selectedLesionId === l.id
                    ? 'bg-white border-[#0B1F3A] text-[#0B1F3A] shadow-xs'
                    : 'bg-white/60 border-slate-200 text-slate-600 hover:bg-white'
                }`}
              >
                {l.type === 'microaneurysm'
                  ? 'Microaneurysm-like'
                  : l.type === 'hemorrhage'
                  ? 'Hemorrhage-like'
                  : 'Exudate-like'}
              </button>
            ))}
          </div>
          {selectedLesion && (
            <p className="text-slate-600 leading-relaxed">
              <span className="font-semibold text-slate-800">{selectedLesion.label}: </span>
              {selectedLesion.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
