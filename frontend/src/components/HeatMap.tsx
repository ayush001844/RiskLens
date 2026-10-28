import React, { useState } from 'react'
import type { Risk } from '../types'
import { getBand, LIKELIHOOD_LABELS, IMPACT_LABELS } from '../utils'

interface HeatMapProps {
  risks: Risk[]
  onSelectCell?: (likelihood: number, impact: number) => void
}

export const HeatMap: React.FC<HeatMapProps> = ({ risks, onSelectCell }) => {
  const [hoveredCell, setHoveredCell] = useState<{
    likelihood: number
    impact: number
    risks: Risk[]
  } | null>(null)

  // Rows: Impact 5 to 1
  const impacts = [5, 4, 3, 2, 1]
  // Columns: Likelihood 1 to 5
  const likelihoods = [1, 2, 3, 4, 5]

  // Count risks per cell
  const getCellRisks = (l: number, i: number) => {
    return risks.filter((r) => r.likelihood === l && r.impact === i)
  }

  // Get background color based on score band
  const getCellBg = (score: number, count: number) => {
    const band = getBand(score)
    switch (band) {
      case 'Critical':
        return count > 0
          ? 'bg-red-500/80 text-white hover:bg-red-500 ring-2 ring-red-400'
          : 'bg-red-950/40 text-red-400 hover:bg-red-900/60'
      case 'High':
        return count > 0
          ? 'bg-orange-500/85 text-white hover:bg-orange-500 ring-2 ring-orange-400'
          : 'bg-orange-950/40 text-orange-400 hover:bg-orange-900/60'
      case 'Medium':
        return count > 0
          ? 'bg-amber-500/80 text-slate-900 font-black hover:bg-amber-500 ring-2 ring-amber-300'
          : 'bg-amber-950/40 text-amber-400 hover:bg-amber-900/60'
      case 'Low':
      default:
        return count > 0
          ? 'bg-emerald-600/85 text-white hover:bg-emerald-600 ring-2 ring-emerald-400'
          : 'bg-emerald-950/30 text-emerald-400 hover:bg-emerald-900/50'
    }
  }

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-700/60">
        <div>
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <span>5 × 5 Inherent Risk Heat Matrix</span>
            <span className="text-xs font-normal text-slate-400">
              (Likelihood × Business Impact = 1–25)
            </span>
          </h3>
          <p className="text-xs text-slate-400">
            Interactive heat map showing synthetic risk distribution across severity bands.
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-emerald-600"></span>
            <span className="text-slate-300">Low (1–4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-amber-500"></span>
            <span className="text-slate-300">Med (5–9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-orange-500"></span>
            <span className="text-slate-300">High (10–14)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-red-500"></span>
            <span className="text-slate-300">Crit (15–25)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center">
        {/* Heat Map Grid */}
        <div className="relative inline-block overflow-x-auto p-2">
          {/* Y-Axis Label */}
          <div className="absolute -left-6 top-1/2 -rotate-90 -translate-y-1/2 text-xs font-bold tracking-wider text-slate-400 uppercase">
            Impact
          </div>

          <div className="ml-6">
            <div className="grid grid-cols-6 gap-1.5 items-center">
              {/* Header Corner */}
              <div className="h-9 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                Imp \ Lkh
              </div>

              {/* Likelihood Headers (1 to 5) */}
              {likelihoods.map((l) => (
                <div
                  key={l}
                  className="h-9 flex flex-col items-center justify-center text-center px-1"
                >
                  <span className="text-xs font-bold text-slate-300">{l}</span>
                  <span className="text-[9px] text-slate-400 truncate max-w-[65px]">
                    {LIKELIHOOD_LABELS[l]}
                  </span>
                </div>
              ))}

              {/* Rows */}
              {impacts.map((i) => (
                <React.Fragment key={i}>
                  {/* Impact Row Label */}
                  <div className="h-12 flex flex-col justify-center pr-2 text-right">
                    <span className="text-xs font-bold text-slate-300">{i}</span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[70px]">
                      {IMPACT_LABELS[i]}
                    </span>
                  </div>

                  {/* 5 Cells for this impact row */}
                  {likelihoods.map((l) => {
                    const cellRisks = getCellRisks(l, i)
                    const count = cellRisks.length
                    const score = l * i
                    const bgClass = getCellBg(score, count)

                    return (
                      <button
                        key={`${l}-${i}`}
                        type="button"
                        onClick={() => onSelectCell && onSelectCell(l, i)}
                        onMouseEnter={() =>
                          setHoveredCell({ likelihood: l, impact: i, risks: cellRisks })
                        }
                        className={`h-12 w-14 sm:w-16 rounded-lg flex flex-col items-center justify-center transition-all duration-150 cursor-pointer shadow-sm relative group ${bgClass}`}
                        title={`L${l} × I${i} = Score ${score} (${getBand(score)}): ${count} risk(s)`}
                      >
                        <span className="text-[10px] opacity-75 font-mono">{score}</span>
                        {count > 0 ? (
                          <span className="text-sm font-black tracking-tight">{count}</span>
                        ) : (
                          <span className="text-[11px] opacity-30">—</span>
                        )}
                      </button>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* X-Axis Label */}
            <div className="text-center mt-3 text-xs font-bold tracking-wider text-slate-400 uppercase">
              Likelihood
            </div>
          </div>
        </div>

        {/* Hover / Detail Panel */}
        <div className="flex-1 w-full bg-navy-900/70 border border-slate-700/60 rounded-xl p-4 min-h-[260px] flex flex-col justify-between">
          {hoveredCell ? (
            <div>
              <div className="flex items-center justify-between pb-2 border-b border-slate-700/60 mb-3">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Cell Details:
                  </span>
                  <h4 className="text-sm font-bold text-slate-200">
                    Likelihood {hoveredCell.likelihood} ({LIKELIHOOD_LABELS[hoveredCell.likelihood]}) × Impact {hoveredCell.impact} ({IMPACT_LABELS[hoveredCell.impact]})
                  </h4>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Score:</span>
                  <div className="text-base font-black text-slate-100">
                    {hoveredCell.likelihood * hoveredCell.impact}{' '}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 border border-slate-700 ml-1">
                      {getBand(hoveredCell.likelihood * hoveredCell.impact)}
                    </span>
                  </div>
                </div>
              </div>

              {hoveredCell.risks.length === 0 ? (
                <p className="text-xs text-slate-500 italic py-4 text-center">
                  No synthetic risks mapped to this score coordinate.
                </p>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-1">
                  {hoveredCell.risks.map((r) => (
                    <div
                      key={r.risk_id}
                      className="p-2 rounded-lg bg-navy-800/80 border border-slate-700/50 hover:border-slate-600 transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-mono font-bold text-blue-400">{r.risk_id}</span>
                        <span className="text-[10px] text-slate-400">{r.category}</span>
                      </div>
                      <p className="text-xs font-medium text-slate-200 mt-0.5 line-clamp-1">
                        {r.title}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                        <span>Asset: {r.affected_asset}</span>
                        <span className="text-emerald-400 font-medium">
                          Residual: {r.residual_risk_score}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full py-8 text-slate-400">
              <p className="text-sm font-medium text-slate-300">Hover over any cell</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Examine specific risks, likelihood, impact ratings, and residual mitigation scores.
              </p>
            </div>
          )}

          <div className="mt-4 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Formula: Inherent Score = Likelihood × Impact</span>
            <span>Total Assessed: {risks.length} Scenarios</span>
          </div>
        </div>
      </div>
    </div>
  )
}
