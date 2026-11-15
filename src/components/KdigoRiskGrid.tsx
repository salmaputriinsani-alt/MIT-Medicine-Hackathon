import React from 'react';
import { Info } from 'lucide-react';

interface KdigoRiskGridProps {
  kdigoG: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5' | 'Unknown';
  kdigoA: 'A1' | 'A2' | 'A3' | 'Unknown';
  latestEgfr?: number;
  latestUacr?: number;
}

const G_ROWS: { code: 'G1' | 'G2' | 'G3a' | 'G3b' | 'G4' | 'G5'; label: string; range: string }[] = [
  { code: 'G1', label: 'G1', range: '≥90' },
  { code: 'G2', label: 'G2', range: '60–89' },
  { code: 'G3a', label: 'G3a', range: '45–59' },
  { code: 'G3b', label: 'G3b', range: '30–44' },
  { code: 'G4', label: 'G4', range: '15–29' },
  { code: 'G5', label: 'G5', range: '<15' },
];

const A_COLS: { code: 'A1' | 'A2' | 'A3'; label: string; range: string }[] = [
  { code: 'A1', label: 'A1', range: '<30 mg/g' },
  { code: 'A2', label: 'A2', range: '30–300 mg/g' },
  { code: 'A3', label: 'A3', range: '>300 mg/g' },
];

type CellSeverity = 'low' | 'moderate' | 'high' | 'very-high';

const CELL_MATRIX: Record<string, Record<string, { severity: CellSeverity; text: string }>> = {
  G1: {
    A1: { severity: 'low', text: 'Low' },
    A2: { severity: 'moderate', text: 'Moderate' },
    A3: { severity: 'high', text: 'High' },
  },
  G2: {
    A1: { severity: 'low', text: 'Low' },
    A2: { severity: 'moderate', text: 'Moderate' },
    A3: { severity: 'high', text: 'High' },
  },
  G3a: {
    A1: { severity: 'moderate', text: 'Moderate' },
    A2: { severity: 'high', text: 'High' },
    A3: { severity: 'very-high', text: 'Very High' },
  },
  G3b: {
    A1: { severity: 'high', text: 'High' },
    A2: { severity: 'very-high', text: 'Very High' },
    A3: { severity: 'very-high', text: 'Very High' },
  },
  G4: {
    A1: { severity: 'very-high', text: 'Very High' },
    A2: { severity: 'very-high', text: 'Very High' },
    A3: { severity: 'very-high', text: 'Very High' },
  },
  G5: {
    A1: { severity: 'very-high', text: 'Very High' },
    A2: { severity: 'very-high', text: 'Very High' },
    A3: { severity: 'very-high', text: 'Very High' },
  },
};

const SEVERITY_CLASS: Record<CellSeverity, string> = {
  low: 'bg-emerald-50 text-emerald-900 border-emerald-200',
  moderate: 'bg-amber-50 text-amber-900 border-amber-200',
  high: 'bg-orange-100/80 text-orange-950 border-orange-200',
  'very-high': 'bg-rose-100/80 text-rose-950 border-rose-200',
};

export const KdigoRiskGrid: React.FC<KdigoRiskGridProps> = ({
  kdigoG,
  kdigoA,
  latestEgfr,
  latestUacr,
}) => {
  const canPlot = kdigoG !== 'Unknown' && kdigoA !== 'Unknown';

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-sm font-semibold text-[#0B1F3A]">
            Educational KDIGO-Style Risk Grid (Illustrative)
          </h4>
          <p className="text-xs text-slate-500">
            Maps eGFR category (G1–G5) against urine albuminuria (A1–A3). Chronicity requires clinical verification.
          </p>
        </div>
        {canPlot && (
          <div className="text-xs font-mono tabular-nums text-[#0B1F3A] bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
            Latest: {kdigoG} ({latestEgfr}) · {kdigoA} ({latestUacr} mg/g)
          </div>
        )}
      </div>

      {!canPlot && (
        <div className="flex items-start gap-2.5 p-3 rounded-md bg-amber-50 border border-amber-200 text-xs text-amber-900">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            Insufficient paired measurements to highlight a cell (eGFR:{' '}
            {latestEgfr ?? 'missing'}, UACR: {latestUacr ?? 'missing'}). Both measurements are required.
          </span>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr>
              <th className="p-2 text-left text-[11px] font-semibold text-slate-600 border border-slate-200 bg-slate-50">
                eGFR (mL/min/1.73 m²)
              </th>
              {A_COLS.map((col) => (
                <th
                  key={col.code}
                  className="p-2 text-center font-semibold text-slate-700 border border-slate-200 bg-slate-50"
                >
                  <div>{col.label}</div>
                  <div className="text-[10px] font-normal text-slate-500">{col.range}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {G_ROWS.map((row) => (
              <tr key={row.code}>
                <td className="p-2 border border-slate-200 bg-slate-50 font-medium text-slate-700 whitespace-nowrap">
                  <span className="font-semibold">{row.label}</span>{' '}
                  <span className="text-slate-500 font-mono text-[11px]">({row.range})</span>
                </td>
                {A_COLS.map((col) => {
                  const cell = CELL_MATRIX[row.code][col.code];
                  const isActive = canPlot && kdigoG === row.code && kdigoA === col.code;
                  return (
                    <td
                      key={col.code}
                      className={`p-2 text-center border transition-all ${
                        SEVERITY_CLASS[cell.severity]
                      } ${
                        isActive
                          ? 'ring-2 ring-inset ring-[#0B1F3A] font-semibold'
                          : 'opacity-85'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center gap-0.5">
                        <span>{cell.text}</span>
                        {isActive && (
                          <span className="text-[10px] font-semibold text-[#0B1F3A] underline underline-offset-2">
                            Latest Reading
                          </span>
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
