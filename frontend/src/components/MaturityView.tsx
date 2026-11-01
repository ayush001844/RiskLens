import { useState, useEffect } from 'react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell,
} from 'recharts';
import { maturityApi } from '../api/client';
import type { MaturityAssessment, GapAnalysisItem } from '../types';
import { getTierValue, getTierColor, getTierShort, fmtDate } from '../utils';

const FUNCTIONS = ['GOVERN', 'IDENTIFY', 'PROTECT', 'DETECT', 'RESPOND', 'RECOVER'] as const;
type NISTFunction = typeof FUNCTIONS[number];

const FUNCTION_COLORS: Record<NISTFunction, string> = {
  GOVERN:   '#8b5cf6',
  IDENTIFY: '#3b82f6',
  PROTECT:  '#22c55e',
  DETECT:   '#f97316',
  RESPOND:  '#ef4444',
  RECOVER:  '#06b6d4',
};

interface Props {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function MaturityView({ onNotify }: Props) {
  const [assessment, setAssessment] = useState<MaturityAssessment | null>(null);
  const [gaps, setGaps] = useState<GapAnalysisItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const ma = await maturityApi.latest();
      setAssessment(ma);
      if (ma) {
        const gapData = await maturityApi.gapAnalysis(ma.assessment_id);
        setGaps(gapData.gap_analysis);
      }
    } catch (err) {
      onNotify?.('Failed to load maturity assessment', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Build radar chart data
  const radarData = FUNCTIONS.map(fn => {
    const fnl = fn.toLowerCase() as Lowercase<NISTFunction>;
    const currentTier = assessment ? (assessment as any)[`${fnl}_current`] : null;
    const targetTier = assessment ? (assessment as any)[`${fnl}_target`] : null;
    return {
      subject: fn,
      Current: getTierValue(currentTier),
      Target: getTierValue(targetTier),
      fullMark: 4,
    };
  });

  // Build gap bar chart data
  const barData = FUNCTIONS.map(fn => {
    const fnl = fn.toLowerCase() as Lowercase<NISTFunction>;
    const gapItem = gaps.find(g => g.function === fn);
    const currentTier = assessment ? (assessment as any)[`${fnl}_current`] : null;
    const targetTier = assessment ? (assessment as any)[`${fnl}_target`] : null;
    return {
      function: fn,
      current: getTierValue(currentTier),
      target: getTierValue(targetTier),
      gap: gapItem?.gap ?? 0,
      currentLabel: getTierShort(currentTier),
      targetLabel: getTierShort(targetTier),
      color: FUNCTION_COLORS[fn],
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="text-slate-400 text-lg">No maturity assessment found.</div>
        <p className="text-slate-500 text-sm">Run <code className="text-accent">POST /api/admin/reseed</code> to load synthetic data.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="section-title">NIST CSF 2.0 Maturity Assessment</h1>
          <p className="section-subtitle">
            {assessment.organisation_name} · Assessment date: {fmtDate(assessment.assessment_date)}
            {assessment.assessor && ` · Assessor: ${assessment.assessor}`}
          </p>
        </div>
        <div className="badge badge-neutral text-xs">
          Assessment {assessment.assessment_id}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 leading-relaxed">
        ⚠️ {assessment.disclaimer}
      </div>

      {/* Tier Legend */}
      <div className="card">
        <h2 className="text-sm font-semibold text-slate-300 mb-3">Implementation Tier Scale</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { tier: 'Tier 1 - Partial', desc: 'Ad hoc, reactive risk management' },
            { tier: 'Tier 2 - Risk Informed', desc: 'Risk-aware but inconsistently applied' },
            { tier: 'Tier 3 - Repeatable', desc: 'Formal policies, consistently practiced' },
            { tier: 'Tier 4 - Adaptive', desc: 'Continuous improvement, threat-informed' },
          ].map(({ tier, desc }, i) => (
            <div key={tier} className="p-3 rounded-lg border border-slate-700/50 bg-navy-700/30">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                  style={{ backgroundColor: getTierColor(tier) }}>
                  {i + 1}
                </span>
                <span className="text-xs font-semibold text-slate-200">T{i + 1}</span>
              </div>
              <p className="text-xs text-slate-400 leading-snug">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Current vs. Target Profile</h2>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#334155" />
              <PolarAngleAxis dataKey="subject" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <PolarRadiusAxis
                angle={30} domain={[0, 4]} tickCount={5}
                tick={{ fill: '#64748b', fontSize: 10 }}
              />
              <Radar
                name="Current"
                dataKey="Current"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.25}
                strokeWidth={2}
              />
              <Radar
                name="Target"
                dataKey="Target"
                stroke="#22c55e"
                fill="#22c55e"
                fillOpacity={0.15}
                strokeWidth={2}
                strokeDasharray="5 3"
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 12, color: '#94a3b8' }}
              />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                labelStyle={{ color: '#f1f5f9' }}
                formatter={(v: number, name: string) => {
                  const labels = ['', 'Partial', 'Risk Informed', 'Repeatable', 'Adaptive'];
                  return [`T${v} — ${labels[v] || '—'}`, name];
                }}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Gap Bar Chart */}
        <div className="card">
          <h2 className="text-sm font-semibold text-slate-300 mb-4">Gap by Function (Current vs. Target Tier)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="function" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis domain={[0, 4]} tickCount={5} tick={{ fill: '#64748b', fontSize: 10 }} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                formatter={(v: number, name: string) => [`Tier ${v}`, name]}
              />
              <Legend wrapperStyle={{ fontSize: 12, color: '#94a3b8' }} />
              <Bar dataKey="current" name="Current" radius={[3, 3, 0, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} fillOpacity={0.7} />
                ))}
              </Bar>
              <Bar dataKey="target" name="Target" fill="#22c55e" fillOpacity={0.4} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Function Detail Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {FUNCTIONS.map(fn => {
          const fnl = fn.toLowerCase() as Lowercase<NISTFunction>;
          const currentTier = (assessment as any)[`${fnl}_current`];
          const targetTier = (assessment as any)[`${fnl}_target`];
          const justification = (assessment as any)[`${fnl}_justification`];
          const currentVal = getTierValue(currentTier);
          const targetVal = getTierValue(targetTier);
          const gap = targetVal - currentVal;

          return (
            <div key={fn} className="card space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: FUNCTION_COLORS[fn] }}
                  />
                  <span className="text-sm font-semibold text-slate-200">{fn}</span>
                </div>
                {gap > 0 ? (
                  <span className="badge badge-high text-xs">{gap} tier gap</span>
                ) : (
                  <span className="badge badge-low text-xs">On target</span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="text-center">
                  <div
                    className="text-xl font-bold"
                    style={{ color: getTierColor(currentTier) }}
                  >
                    {getTierShort(currentTier)}
                  </div>
                  <div className="text-xs text-slate-500">Current</div>
                </div>
                <div className="flex-1 h-1.5 bg-slate-700 rounded-full">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${(currentVal / 4) * 100}%`,
                      backgroundColor: getTierColor(currentTier),
                    }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-xl font-bold text-emerald-400">
                    {getTierShort(targetTier)}
                  </div>
                  <div className="text-xs text-slate-500">Target</div>
                </div>
              </div>

              {justification && (
                <p className="text-xs text-slate-400 leading-relaxed line-clamp-4">
                  {justification}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Assessment */}
      {(assessment.overall_assessment || assessment.improvement_roadmap) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {assessment.overall_assessment && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Overall Assessment</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{assessment.overall_assessment}</p>
            </div>
          )}
          {assessment.improvement_roadmap && (
            <div className="card">
              <h2 className="text-sm font-semibold text-slate-300 mb-2">Improvement Roadmap</h2>
              <p className="text-sm text-slate-400 leading-relaxed">{assessment.improvement_roadmap}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MaturityView;
