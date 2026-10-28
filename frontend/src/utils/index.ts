import type { ScoreBand } from '../types'

export const BAND_COLORS: Record<ScoreBand, string> = {
  Critical: '#ef4444',
  High: '#f97316',
  Medium: '#eab308',
  Low: '#22c55e',
}

export const BAND_BG: Record<string, string> = {
  Critical: 'bg-risk-critical/20 text-risk-critical border-risk-critical/30',
  High: 'bg-risk-high/20 text-risk-high border-risk-high/30',
  Medium: 'bg-risk-medium/20 text-risk-medium border-risk-medium/30',
  Low: 'bg-risk-low/20 text-risk-low border-risk-low/30',
}

export function getBand(score: number): ScoreBand {
  if (score <= 4) return 'Low'
  if (score <= 9) return 'Medium'
  if (score <= 14) return 'High'
  return 'Critical'
}

export function getBadgeClass(band: string): string {
  return BAND_BG[band] ?? 'bg-slate-700/60 text-slate-300 border-slate-600/40'
}

export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    Open: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    'In Progress': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Completed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Closed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    Overdue: 'bg-red-500/20 text-red-400 border-red-500/30',
    Deferred: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    Accepted: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    Transferred: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  }
  return map[status] ?? 'bg-slate-700/60 text-slate-300 border-slate-600/40'
}

export function getEffectivenessClass(e: string): string {
  const map: Record<string, string> = {
    Effective: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    'Partially Effective': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    Ineffective: 'bg-red-500/20 text-red-400 border-red-500/30',
    'Not Tested': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  }
  return map[e] ?? 'bg-slate-700/60 text-slate-300 border-slate-600/40'
}

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export function isOverdue(dateStr?: string): boolean {
  if (!dateStr) return false
  return new Date(dateStr) < new Date()
}

export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Rare', 2: 'Unlikely', 3: 'Possible', 4: 'Likely', 5: 'Almost Certain',
}

export const IMPACT_LABELS: Record<number, string> = {
  1: 'Negligible', 2: 'Minor', 3: 'Moderate', 4: 'Major', 5: 'Catastrophic',
}

export const CHART_COLORS = [
  '#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b',
  '#ef4444', '#f97316', '#84cc16', '#ec4899', '#6366f1',
]
