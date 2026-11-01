/**
 * RiskLens frontend utility functions v2.0
 * Score bands mirror backend scoring.py exactly.
 */

// ─── Score Bands ─────────────────────────────────────────────────────────────

export type ScoreBand = 'Critical' | 'High' | 'Medium' | 'Low';

export function getBand(score: number): ScoreBand {
  if (score >= 15) return 'Critical';
  if (score >= 10) return 'High';
  if (score >= 5)  return 'Medium';
  return 'Low';
}

export const BAND_COLORS: Record<ScoreBand, string> = {
  Critical: '#ef4444',
  High:     '#f97316',
  Medium:   '#eab308',
  Low:      '#22c55e',
};

export const BAND_BG: Record<ScoreBand, string> = {
  Critical: 'bg-risk-critical/20 text-risk-critical border-risk-critical/30',
  High:     'bg-risk-high/20 text-risk-high border-risk-high/30',
  Medium:   'bg-risk-medium/20 text-risk-medium border-risk-medium/30',
  Low:      'bg-risk-low/20 text-risk-low border-risk-low/30',
};

export function getBandClass(band: string | null | undefined): string {
  const map: Record<string, string> = {
    Critical: 'badge-critical',
    High:     'badge-high',
    Medium:   'badge-medium',
    Low:      'badge-low',
  };
  return map[band ?? ''] ?? 'badge-neutral';
}

// ─── Severity Classes ─────────────────────────────────────────────────────────

export function getSeverityClass(severity: string): string {
  const map: Record<string, string> = {
    Critical:      'badge-critical',
    High:          'badge-high',
    Medium:        'badge-medium',
    Low:           'badge-low',
    Informational: 'badge-info',
  };
  return map[severity] ?? 'badge-neutral';
}

// ─── Status Classes ──────────────────────────────────────────────────────────

export function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    Open:                 'badge-high',
    'In Progress':        'badge-medium',
    Assigned:             'badge-info',
    'Pending Verification': 'badge-info',
    Completed:            'badge-low',
    Closed:               'badge-low',
    Overdue:              'badge-critical',
    Deferred:             'badge-neutral',
    'Risk Accepted':      'badge-neutral',
    Accepted:             'badge-neutral',
    Transferred:          'badge-info',
  };
  return map[status] ?? 'badge-neutral';
}

export function getEffectivenessClass(eff: string): string {
  const map: Record<string, string> = {
    'Effective':           'badge-low',
    'Adequate':            'badge-low',
    'Partially Effective': 'badge-medium',
    'Partially Adequate':  'badge-medium',
    'Ineffective':         'badge-critical',
    'Inadequate':          'badge-critical',
    'Not Tested':          'badge-neutral',
    'Not Assessed':        'badge-neutral',
  };
  return map[eff] ?? 'badge-neutral';
}

export function getComplianceClass(status: string): string {
  const map: Record<string, string> = {
    'Compliant':           'badge-low',
    'Partially Compliant': 'badge-medium',
    'Non-Compliant':       'badge-critical',
    'Not Assessed':        'badge-neutral',
    'Not Applicable':      'badge-neutral',
  };
  return map[status] ?? 'badge-neutral';
}

// ─── Maturity Tier helpers ────────────────────────────────────────────────────

export const MATURITY_TIERS = [
  'Tier 1 - Partial',
  'Tier 2 - Risk Informed',
  'Tier 3 - Repeatable',
  'Tier 4 - Adaptive',
] as const;

export function getTierValue(tier: string | null | undefined): number {
  const map: Record<string, number> = {
    'Tier 1 - Partial':      1,
    'Tier 2 - Risk Informed': 2,
    'Tier 3 - Repeatable':   3,
    'Tier 4 - Adaptive':     4,
  };
  return map[tier ?? ''] ?? 0;
}

export function getTierColor(tier: string | null | undefined): string {
  const map: Record<string, string> = {
    'Tier 1 - Partial':      '#ef4444',
    'Tier 2 - Risk Informed': '#f97316',
    'Tier 3 - Repeatable':   '#eab308',
    'Tier 4 - Adaptive':     '#22c55e',
  };
  return map[tier ?? ''] ?? '#64748b';
}

export function getTierShort(tier: string | null | undefined): string {
  const map: Record<string, string> = {
    'Tier 1 - Partial':      'T1',
    'Tier 2 - Risk Informed': 'T2',
    'Tier 3 - Repeatable':   'T3',
    'Tier 4 - Adaptive':     'T4',
  };
  return map[tier ?? ''] ?? '—';
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function fmtDate(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch {
    return d;
  }
}

export function fmtDateTime(d: string | null | undefined): string {
  if (!d) return '—';
  try {
    return new Date(d).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return d;
  }
}

export function isOverdue(targetDate: string | null | undefined, status?: string): boolean {
  if (!targetDate) return false;
  if (status && ['Completed', 'Closed', 'Risk Accepted'].includes(status)) return false;
  return new Date(targetDate) < new Date();
}

export function daysUntil(d: string | null | undefined): number | null {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

// ─── Risk Matrix ─────────────────────────────────────────────────────────────

export function getHeatCellClass(score: number): string {
  const band = getBand(score);
  const map: Record<ScoreBand, string> = {
    Critical: 'bg-risk-critical/80 text-white',
    High:     'bg-risk-high/80 text-white',
    Medium:   'bg-risk-medium/80 text-black',
    Low:      'bg-risk-low/80 text-white',
  };
  return map[band];
}

// ─── Number formatting ────────────────────────────────────────────────────────

export function fmtScore(score: number | null | undefined): string {
  if (score == null) return '—';
  return score % 1 === 0 ? score.toString() : score.toFixed(1);
}

export function fmtPct(pct: number | null | undefined): string {
  if (pct == null) return '—';
  return `${pct.toFixed(1)}%`;
}

// ─── Role helpers ─────────────────────────────────────────────────────────────

export const USER_ROLES = [
  'Administrator',
  'Consultant',
  'Risk Owner',
  'Control Owner',
  'Auditor',
  'Executive',
] as const;

export function getRoleClass(role: string): string {
  const map: Record<string, string> = {
    Administrator:  'badge-critical',
    Consultant:     'badge-info',
    'Risk Owner':   'badge-medium',
    'Control Owner': 'badge-medium',
    Auditor:        'badge-neutral',
    Executive:      'badge-low',
  };
  return map[role] ?? 'badge-neutral';
}

// ─── Vendor helpers ───────────────────────────────────────────────────────────

export function getCriticalityClass(c: string): string {
  const map: Record<string, string> = {
    Critical: 'badge-critical',
    High:     'badge-high',
    Medium:   'badge-medium',
    Low:      'badge-low',
  };
  return map[c] ?? 'badge-neutral';
}

// ─── File size ───────────────────────────────────────────────────────────────

export function fmtFileSize(bytes: number | null | undefined): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Backward compatibility exports ──────────────────────────────────────────

export const LIKELIHOOD_LABELS: Record<number, string> = {
  1: 'Rare',
  2: 'Unlikely',
  3: 'Possible',
  4: 'Likely',
  5: 'Almost Certain',
};

export const IMPACT_LABELS: Record<number, string> = {
  1: 'Negligible',
  2: 'Minor',
  3: 'Moderate',
  4: 'Major',
  5: 'Critical',
};

export const formatDate = fmtDate;
export const getBadgeClass = getBandClass;

