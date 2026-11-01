import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  AlertTriangle,
  TrendingDown,
  ArrowRight,
  ShieldCheck,
  Scale,
  Activity,
  X,
  RefreshCw,
} from 'lucide-react';
import { advisorApi } from '../api/client';

interface AdvisorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdvisorModal: React.FC<AdvisorModalProps> = ({ isOpen, onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadAnalysis();
    }
  }, [isOpen]);

  const loadAnalysis = async () => {
    try {
      setLoading(true);
      const res = await advisorApi.analyze();
      setData(res);
    } catch (err) {
      console.error('Failed to load advisor analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="card max-w-4xl w-full p-6 max-h-[90vh] overflow-y-auto space-y-6 border border-blue-500/30 shadow-2xl shadow-blue-500/10">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700/80 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 text-white">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">AI Risk Advisor & Prioritization Engine</h3>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                  Automated Synthesis
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Cross-correlating risks, control gaps, and regulatory crosswalks for Apex Financial Services
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAnalysis}
              disabled={loading}
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
              title="Refresh Analysis"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-slate-400">Synthesizing threat correlations and priority ROI...</p>
          </div>
        ) : !data ? (
          <div className="text-center py-12 text-slate-400">
            Unable to compile advisor recommendations. Ensure backend is running.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Posture Summary Box */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-950/60 via-indigo-950/40 to-navy-900 border border-blue-500/30 space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-300">
                <Activity className="w-4 h-4 text-cyan-400" />
                <span>Executive AI Posture Summary</span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {data.posture_summary}
              </p>
            </div>

            {/* Cascading Vulnerabilities */}
            {data.cascading_findings && data.cascading_findings.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Cascading Root-Cause Vulnerabilities</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.cascading_findings.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-navy-900/90 border border-slate-700/80 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-white text-xs">{item.domain}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            item.impact_severity === 'Critical'
                              ? 'bg-red-500/20 text-red-400 border-red-500/40'
                              : 'bg-orange-500/20 text-orange-400 border-orange-500/40'
                          }`}
                        >
                          {item.impact_severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{item.root_cause}</p>

                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                        <div className="text-slate-400">
                          Impacted: <span className="font-mono text-blue-400">{item.impacted_risks.join(', ')}</span>
                        </div>
                        <div className="text-emerald-400 font-bold flex items-center gap-1">
                          <TrendingDown className="w-3 h-3" />
                          <span>-{item.estimated_risk_reduction_pct}% Risk</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Prioritized Action Sequencing */}
            {data.prioritized_actions && data.prioritized_actions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Prioritized Action Sequencing (ROI-Ranked)</span>
                </div>

                <div className="space-y-2">
                  {data.prioritized_actions.map((act: any) => (
                    <div
                      key={act.sequence}
                      className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 rounded-lg bg-navy-900/80 border border-slate-800 gap-3 text-xs hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center text-xs shrink-0 border border-blue-500/30">
                          {act.sequence}
                        </span>
                        <div>
                          <div className="font-semibold text-white">{act.title}</div>
                          <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                            <span className="text-blue-300">{act.phase}</span>
                            <span>•</span>
                            <span>Target: <span className="font-mono text-slate-300">{act.target_control}</span></span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                        <div className="text-right text-[10px]">
                          <span className="text-slate-500 block">Effort / Impact</span>
                          <span className="text-slate-300 font-medium">{act.effort} / {act.risk_impact}</span>
                        </div>
                        <span className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono font-bold text-xs">
                          {act.estimated_delta_risk} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Regulatory Exposure Forecast */}
            {data.regulatory_exposure && data.regulatory_exposure.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                  <Scale className="w-4 h-4 text-purple-400" />
                  <span>Regulatory Non-Compliance Penalty Exposure</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {data.regulatory_exposure.map((reg: any, i: number) => (
                    <div key={i} className="p-3 rounded-xl bg-navy-900/60 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{reg.framework}</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/30">
                          {reg.exposure_tier} Exposure
                        </span>
                      </div>
                      <p className="text-[11px] text-red-300 font-mono leading-tight">{reg.penalty_provision}</p>
                      <p className="text-[10px] text-slate-400 leading-relaxed pt-1">{reg.rationale}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-500">
                Automated Synthesis • Apex Financial Services Synthetic Governance Model
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-blue-600/20"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
