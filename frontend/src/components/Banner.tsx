import React from 'react'
import { AlertTriangle, Database, RefreshCw } from 'lucide-react'

interface BannerProps {
  onReseed: () => void
  reseeding: boolean
}

export const Banner: React.FC<BannerProps> = ({ onReseed, reseeding }) => {
  return (
    <div className="bg-gradient-to-r from-amber-950/80 via-navy-800 to-amber-950/80 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-200">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
          </span>
          <span className="font-bold tracking-wide uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
            Simulated Engagement
          </span>
          <span className="text-slate-300">
            Client: <strong className="text-amber-200">Apex Financial Services Ltd. (Fictional Indian NBFC / FinTech)</strong> — All data, metrics, assets, controls & findings are <strong>100% Synthetic Demo Records</strong>. Not real compliance determinations.
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-400 hidden sm:inline">
            NIST CSF 2.0 & ISO 27001:2022 Simulation
          </span>
          <button
            onClick={onReseed}
            disabled={reseeding}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-medium transition-colors disabled:opacity-50"
            title="Reset and reload synthetic database with 25+ risks, 30+ controls, 15+ remediation items, 10+ vendors"
          >
            <RefreshCw className={`w-3 h-3 ${reseeding ? 'animate-spin' : ''}`} />
            {reseeding ? 'Resetting DB...' : 'Reset Demo Data'}
          </button>
        </div>
      </div>
    </div>
  )
}
