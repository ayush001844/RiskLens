import React, { useState, useEffect } from 'react';
import {
  Sliders,
  TrendingDown,
  DollarSign,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  RefreshCw,
  Zap,
  CheckCircle2,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { simulationApi } from '../api/client';
import type { StrategicInitiative, SimulationResponse, SimulatedRisk } from '../types';
import { getBandClass } from '../utils';

export const SimulationPlaygroundView: React.FC = () => {
  const [initiatives, setInitiatives] = useState<StrategicInitiative[]>([]);
  const [selectedInitiatives, setSelectedInitiatives] = useState<string[]>([
    'INIT-FIDO2',
    'INIT-CLOUD-GUARD',
  ]);
  const [threatMultiplier, setThreatMultiplier] = useState<number>(1.0);
  const [simulationResult, setSimulationResult] = useState<SimulationResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Load initiatives catalog
  useEffect(() => {
    simulationApi
      .getInitiatives()
      .then((data) => {
        setInitiatives(data);
      })
      .catch((err) => console.error('Failed to load initiatives:', err));
  }, []);

  // Run simulation model when initiatives or multiplier changes
  useEffect(() => {
    const runModel = async () => {
      try {
        setSimulating(true);
        const res = await simulationApi.runModel({
          threat_multiplier: threatMultiplier,
          enabled_initiatives: selectedInitiatives,
        });
        setSimulationResult(res);
      } catch (err) {
        console.error('Simulation calculation failed:', err);
      } finally {
        setSimulating(false);
        setLoading(false);
      }
    };

    runModel();
  }, [threatMultiplier, selectedInitiatives]);

  const toggleInitiative = (id: string) => {
    setSelectedInitiatives((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedInitiatives(initiatives.map((i) => i.id));
  };

  const resetAll = () => {
    setSelectedInitiatives([]);
    setThreatMultiplier(1.0);
  };

  // Filtered risks list
  const filteredRisks: SimulatedRisk[] = (simulationResult?.simulated_risks || []).filter((r) => {
    const matchesCategory = filterCategory === 'all' || r.category === filterCategory;
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.risk_id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = Array.from(
    new Set((simulationResult?.simulated_risks || []).map((r) => r.category))
  );

  return (
    <div className="space-y-6 animate-in">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-lg text-white shadow-md shadow-blue-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              "What-If" Scenario Simulator & Risk Modeling Playground
            </h1>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              Interactive Modeling
            </span>
          </div>
          <p className="text-xs text-slate-400 max-w-3xl">
            Simulate strategic investments, adjust macroeconomic or adversarial threat multipliers, and calculate real-time
            residual risk reductions, appetite compliance deltas, and estimated Return on Security Investment (ROSI).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white bg-navy-800 hover:bg-navy-700 border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Baseline
          </button>
          <button
            onClick={selectAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm shadow-blue-600/30 transition"
          >
            <Zap className="w-3.5 h-3.5" />
            Activate All Initiatives
          </button>
        </div>
      </div>

      {/* Main Simulation Control Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Adversarial Threat Multiplier */}
        <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-200">Threat Environment Multiplier</h2>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full border ${
                threatMultiplier > 1.2
                  ? 'bg-red-500/10 text-red-400 border-red-500/30'
                  : threatMultiplier > 1.0
                  ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                  : threatMultiplier < 1.0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
              }`}
            >
              {threatMultiplier.toFixed(2)}× {threatMultiplier > 1.0 ? 'Elevated' : threatMultiplier < 1.0 ? 'Benign' : 'Nominal'}
            </span>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Scales inherent likelihood and impact across all digital banking assets to simulate sudden threat wave surges
            (e.g., zero-day campaigns, targeted phishing campaigns, geopolitical tensions).
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-[11px] text-slate-400 font-mono">
              <span>0.50× (Benign)</span>
              <span>1.00× (Baseline)</span>
              <span>2.00× (Extreme)</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={threatMultiplier}
              onChange={(e) => setThreatMultiplier(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer h-2 bg-navy-900 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => setThreatMultiplier(0.8)}
              className={`text-[11px] py-1 px-2 rounded border font-medium transition ${
                threatMultiplier === 0.8
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-navy-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              0.8× Calmer
            </button>
            <button
              onClick={() => setThreatMultiplier(1.0)}
              className={`text-[11px] py-1 px-2 rounded border font-medium transition ${
                threatMultiplier === 1.0
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                  : 'bg-navy-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              1.0× Baseline
            </button>
            <button
              onClick={() => setThreatMultiplier(1.4)}
              className={`text-[11px] py-1 px-2 rounded border font-medium transition ${
                threatMultiplier === 1.4
                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                  : 'bg-navy-900/60 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              1.4× Cyber Surge
            </button>
          </div>
        </div>

        {/* Right 2 Columns: One-Click Strategic Initiatives Selection */}
        <div className="lg:col-span-2 bg-navy-800/90 border border-slate-700/60 rounded-xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <h2 className="text-sm font-bold text-slate-200">
                Proposed Strategic Initiatives ({selectedInitiatives.length} / {initiatives.length} Active)
              </h2>
            </div>
            <span className="text-xs text-slate-400">Click card to toggle initiative</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {initiatives.map((init) => {
              const isSelected = selectedInitiatives.includes(init.id);
              return (
                <div
                  key={init.id}
                  onClick={() => toggleInitiative(init.id)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-200 relative ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-950/60 to-cyan-950/40 border-cyan-500/50 shadow-md shadow-cyan-900/20'
                      : 'bg-navy-900/40 border-slate-700/70 hover:border-slate-600 opacity-70 hover:opacity-100'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center border text-[10px] ${
                          isSelected
                            ? 'bg-cyan-500 border-cyan-400 text-navy-950'
                            : 'border-slate-600 text-transparent'
                        }`}
                      >
                        ✓
                      </div>
                      <span className="font-semibold text-xs text-slate-200 leading-snug">
                        {init.name}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-400 whitespace-nowrap bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      ${init.estimated_cost_usd.toLocaleString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {init.rationale}
                  </p>

                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-800/80 text-[10px]">
                    <span className="text-slate-400 font-medium">{init.category}</span>
                    <span className="text-slate-400">•</span>
                    <span className="text-cyan-400 font-medium">
                      {init.affected_controls.map((c) => c.control_id).join(', ')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Executive Comparison KPI Deck */}
      {simulationResult && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Average Residual Score */}
          <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Avg Residual Score</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-slate-200">
                {simulationResult.simulated_summary.avg_residual_score}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {simulationResult.baseline_summary.avg_residual_score}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <TrendingDown className="w-3 h-3" />
              <span>{simulationResult.simulated_summary.risk_reduction_pct}% delta</span>
            </div>
          </div>

          {/* Critical Risks */}
          <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Critical Risks</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-red-400">
                {simulationResult.simulated_summary.critical_risks}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {simulationResult.baseline_summary.critical_risks}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {simulationResult.baseline_summary.critical_risks -
                simulationResult.simulated_summary.critical_risks >
              0
                ? `-${simulationResult.baseline_summary.critical_risks - simulationResult.simulated_summary.critical_risks} reduced`
                : 'No change'}
            </span>
          </div>

          {/* High Risks */}
          <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">High Risks</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-amber-400">
                {simulationResult.simulated_summary.high_risks}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {simulationResult.baseline_summary.high_risks}
              </span>
            </div>
            <span className="text-[10px] text-slate-400">
              {simulationResult.baseline_summary.high_risks -
                simulationResult.simulated_summary.high_risks >
              0
                ? `-${simulationResult.baseline_summary.high_risks - simulationResult.simulated_summary.high_risks} reduced`
                : 'Controlled'}
            </span>
          </div>

          {/* Appetite Violations Resolved */}
          <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Appetite Compliance</span>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-bold font-mono text-emerald-400">
                {simulationResult.simulated_summary.risks_exceeding_appetite}
              </span>
              <span className="text-xs text-slate-400 line-through font-mono">
                {simulationResult.baseline_summary.risks_exceeding_appetite}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400">
              <CheckCircle2 className="w-3 h-3" />
              <span>{simulationResult.simulated_summary.appetite_violations_resolved} resolved</span>
            </div>
          </div>

          {/* Total Capital Investment */}
          <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl p-3.5 space-y-1">
            <span className="text-[11px] font-medium text-slate-400">Investment Cost</span>
            <div className="text-xl font-bold font-mono text-slate-100">
              ${simulationResult.total_investment_cost_usd.toLocaleString()}
            </div>
            <span className="text-[10px] text-slate-400">
              {simulationResult.active_initiative_count} initiatives active
            </span>
          </div>

          {/* Return on Security Investment (ROSI) */}
          <div className="bg-gradient-to-br from-blue-900/40 via-indigo-900/40 to-cyan-900/40 border border-cyan-500/40 rounded-xl p-3.5 space-y-1 shadow-inner">
            <span className="text-[11px] font-bold text-cyan-300 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> ROSI Ratio
            </span>
            <div className="text-xl font-extrabold font-mono text-cyan-300">
              {simulationResult.simulated_summary.return_on_security_investment_rosi_pct}%
            </div>
            <span className="text-[10px] text-slate-300">
              ${(simulationResult.simulated_summary.estimated_monetary_risk_reduction_usd / 1000).toFixed(0)}k loss prevented
            </span>
          </div>
        </div>
      )}

      {/* Detailed Risk Modeling Impact Table */}
      <div className="bg-navy-800/90 border border-slate-700/60 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-slate-400" />
            <h3 className="text-sm font-bold text-slate-200">
              Simulated Risk Registry Impact ({filteredRisks.length} Risks)
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Search risk ID or title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-navy-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 w-48"
            />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="bg-navy-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Risk Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-navy-900/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-700/60">
              <tr>
                <th className="py-3 px-4">Risk ID</th>
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4 text-center">Baseline Score</th>
                <th className="py-3 px-4 text-center">Simulated Score</th>
                <th className="py-3 px-4 text-center">Delta (Δ)</th>
                <th className="py-3 px-4 text-center">Appetite Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRisks.map((r) => {
                const improved = r.delta < 0;
                const degraded = r.delta > 0;
                return (
                  <tr key={r.risk_id} className="hover:bg-navy-700/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-blue-400 whitespace-nowrap">
                      {r.risk_id}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{r.title}</div>
                      <div className="text-[11px] text-slate-400">{r.category}</div>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${getBandClass(
                          r.baseline_band
                        )}`}
                      >
                        {r.baseline_residual} ({r.baseline_band})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-block font-mono font-bold text-xs px-2 py-0.5 rounded ${getBandClass(
                          r.simulated_band
                        )}`}
                      >
                        {r.simulated_residual} ({r.simulated_band})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <span
                        className={`font-mono font-bold text-xs px-2 py-0.5 rounded-full ${
                          improved
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : degraded
                            ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                            : 'text-slate-400'
                        }`}
                      >
                        {r.delta > 0 ? `+${r.delta}` : r.delta}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {r.appetite_compliant ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Within Appetite
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                          <AlertTriangle className="w-3 h-3" /> Exceeds Appetite
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
