import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Target,
  Scale,
  DollarSign,
  Presentation,
  Volume2,
  Sparkles,
  Server,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import type { DashboardStats, Risk, Control, RemediationItem } from '../types';
import { getBandClass } from '../utils';

interface BoardroomPresentationModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats | null;
  risks: Risk[];
  controls: Control[];
  remediation: RemediationItem[];
}

export const BoardroomPresentationModal: React.FC<BoardroomPresentationModalProps> = ({
  isOpen,
  onClose,
  stats,
  risks,
  controls,
  remediation,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPrompter, setShowPrompter] = useState(true);
  const [selectedHeatmapCell, setSelectedHeatmapCell] = useState<{ l: number; i: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const totalSlides = 6;

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        setCurrentSlide((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, totalSlides]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!isOpen) return null;

  // NIST CSF Function Tiers
  const nistFunctions = [
    { name: 'GOVERN (GV)', current: 2.2, target: 3.5, gap: 1.3, highlight: 'Risk appetite and policy established; oversight cadence requires formalization.' },
    { name: 'IDENTIFY (ID)', current: 2.4, target: 3.5, gap: 1.1, highlight: 'Asset inventory mapped; data classification tooling needs automated tagging.' },
    { name: 'PROTECT (PR)', current: 1.8, target: 3.5, gap: 1.7, highlight: 'CRITICAL DEFICIENCY: Core banking portal lacks MFA; privileged access unsegmented.' },
    { name: 'DETECT (DE)', current: 1.6, target: 3.5, gap: 1.9, highlight: 'CRITICAL DEFICIENCY: SIEM log retention < 90 days; no 24/7 SOC correlation.' },
    { name: 'RESPOND (RS)', current: 1.9, target: 3.5, gap: 1.6, highlight: 'IRP outdated since 2021; ransomware playbook never tabletop tested.' },
    { name: 'RECOVER (RC)', current: 2.1, target: 3.5, gap: 1.4, highlight: 'Backups exist but restoration failover untested under production load.' },
  ];

  // Top critical risks
  const criticalRisks = risks
    .filter((r) => r.residual_band === 'Critical' || r.residual_risk_score >= 12.0)
    .slice(0, 4);

  // Heatmap drilldown helper
  const cellRisks = selectedHeatmapCell
    ? risks.filter(
        (r) =>
          r.likelihood === selectedHeatmapCell.l &&
          r.impact === selectedHeatmapCell.i
      )
    : [];

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-navy-950/98 backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
      {/* Top Slide Control Strip */}
      <header className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-navy-900/80 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
            <Presentation className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100 uppercase tracking-wider text-[11px]">
                Board of Directors Executive Session
              </span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Slide {currentSlide + 1} of {totalSlides}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Cybersecurity Risk & Capital Allocation Briefing • Apex Financial Services Ltd.
            </p>
          </div>
        </div>

        {/* Slide Indicator Dots */}
        <div className="hidden md:flex items-center gap-1.5">
          {Array.from({ length: totalSlides }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                currentSlide === idx
                  ? 'w-6 bg-gradient-to-r from-purple-500 to-cyan-400'
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPrompter(!showPrompter)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition ${
              showPrompter
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                : 'bg-navy-800 text-slate-400 border-slate-700 hover:text-slate-200'
            }`}
            title="Toggle CISO Executive Speaking Prompter"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CISO Prompter</span>
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-400 hover:text-slate-200 border border-slate-700"
            title="Toggle Fullscreen Mode (F)"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-navy-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-700"
            title="Exit Presentation (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Slide Body Canvas */}
      <main
        ref={containerRef}
        className="flex-1 max-w-6xl w-full mx-auto p-6 md:p-8 flex flex-col justify-center overflow-y-auto"
      >
        {/* ========================================================================= */}
        {/* SLIDE 1: Executive Scope & Board Briefing Overview                       */}
        {/* ========================================================================= */}
        {currentSlide === 0 && (
          <div className="space-y-6 animate-in">
            <div className="text-center space-y-2 max-w-3xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30">
                Annual Cybersecurity Governance Review • FY2025
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Cybersecurity Risk, Controls & Regulatory Posture
              </h1>
              <p className="text-sm md:text-base text-slate-300">
                Executive Briefing for the Board Risk Committee and Chief Executive Officer
              </p>
            </div>

            {/* Verdict Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Assessed Risks
                </span>
                <div className="text-4xl font-extrabold font-mono text-white mt-1">
                  {stats?.total_risks || 20}
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Across 6 Critical Business Units
                </span>
              </div>

              <div className="bg-navy-900/90 border border-red-500/30 rounded-2xl p-5 text-center shadow-lg bg-gradient-to-b from-navy-900/90 to-red-950/20">
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wider flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Appetite Breaches
                </span>
                <div className="text-4xl font-extrabold font-mono text-red-400 mt-1">
                  {stats?.risks_exceeding_appetite || 7}
                </div>
                <span className="text-[11px] text-red-300/80 mt-1 block">
                  Exceeds Board Risk Appetite (Score &gt; 9.0)
                </span>
              </div>

              <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  NIST CSF 2.0 Maturity
                </span>
                <div className="text-4xl font-extrabold font-mono text-amber-400 mt-1">
                  2.0 / 4.0
                </div>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Tier 2 (Risk-Informed) • Target: 3.5
                </span>
              </div>

              <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Requested Allocation
                </span>
                <div className="text-4xl font-extrabold font-mono text-cyan-400 mt-1">
                  $140k
                </div>
                <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
                  +700% Projected ROSI
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-navy-900/60 border border-slate-800 text-xs text-slate-300 leading-relaxed text-center max-w-2xl mx-auto">
              <strong>Assessment Mandate:</strong> Independent evaluation of Apex Financial Services' core digital banking applications, API integration bastions, and AWS production infrastructure aligned to NIST CSF 2.0, RBI Cyber Security Framework, and India DPDP Act 2023.
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 2: 5x5 Risk Heatmap & Appetite Threshold Matrix                     */}
        {/* ========================================================================= */}
        {currentSlide === 1 && (
          <div className="space-y-4 animate-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h2 className="text-2xl font-black text-white flex items-center gap-2">
                  <span>5×5 Residual Risk Matrix & Appetite Threshold</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                    7 Breaching Tolerance
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Click any matrix cell to inspect matching risk profiles and control effectiveness ratings.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded bg-red-500 inline-block"></span> Critical (&ge;15)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded bg-amber-500 inline-block"></span> High (10–14)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded bg-yellow-500 inline-block"></span> Medium (5–9)
                </span>
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-3 h-3 rounded bg-emerald-500 inline-block"></span> Low (1–4)
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
              {/* 5x5 Heatmap Grid */}
              <div className="lg:col-span-2 bg-navy-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold uppercase text-slate-400">
                    Likelihood (1 to 5) vs Impact (1 to 5)
                  </span>
                  <span className="text-[10px] text-cyan-400 font-mono">
                    Red Border = Exceeds Appetite Limit (&gt;9)
                  </span>
                </div>

                <div className="space-y-1.5">
                  {[5, 4, 3, 2, 1].map((lhood) => (
                    <div key={lhood} className="flex items-center gap-1.5">
                      <span className="w-6 text-right font-mono text-xs text-slate-400 font-bold">
                        L{lhood}
                      </span>
                      <div className="grid grid-cols-5 gap-1.5 flex-1">
                        {[1, 2, 3, 4, 5].map((imp) => {
                          const matching = risks.filter(
                            (r) => r.likelihood === lhood && r.impact === imp
                          );
                          const count = matching.length;
                          const rawScore = lhood * imp;
                          const isBreaching = rawScore > 9;
                          const isSelected =
                            selectedHeatmapCell?.l === lhood && selectedHeatmapCell?.i === imp;

                          let bgClass = 'bg-emerald-950/40 text-emerald-400 border-emerald-800/40';
                          if (rawScore >= 15) {
                            bgClass = 'bg-red-950/60 text-red-300 border-red-700/60';
                          } else if (rawScore >= 10) {
                            bgClass = 'bg-amber-950/60 text-amber-300 border-amber-700/60';
                          } else if (rawScore >= 5) {
                            bgClass = 'bg-yellow-950/40 text-yellow-300 border-yellow-800/40';
                          }

                          return (
                            <button
                              key={imp}
                              onClick={() => setSelectedHeatmapCell({ l: lhood, i: imp })}
                              className={`h-12 rounded-xl border flex flex-col items-center justify-center font-mono transition-all relative ${bgClass} ${
                                isBreaching ? 'ring-1 ring-red-500/60' : ''
                              } ${
                                isSelected
                                  ? 'ring-2 ring-cyan-400 scale-105 shadow-lg shadow-cyan-900/40'
                                  : 'hover:scale-102 hover:border-slate-400'
                              }`}
                            >
                              <span className="text-sm font-extrabold">{count}</span>
                              <span className="text-[9px] opacity-70">
                                {count === 1 ? 'risk' : 'risks'}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center gap-1.5 pt-1 pl-6">
                    {['I1', 'I2', 'I3', 'I4', 'I5'].map((imp) => (
                      <div key={imp} className="flex-1 text-center font-mono text-xs text-slate-400 font-bold">
                        {imp}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cell Drilldown List */}
              <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col">
                <div className="border-b border-slate-800 pb-2 mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    {selectedHeatmapCell
                      ? `Likelihood ${selectedHeatmapCell.l} × Impact ${selectedHeatmapCell.i} (${cellRisks.length} Risks)`
                      : 'Cell Risk Drilldown'}
                  </h3>
                  <span className="text-[10px] text-slate-400">
                    {selectedHeatmapCell ? 'Identified exposure details' : 'Click any cell on the matrix to view risks'}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-2 max-h-[260px]">
                  {cellRisks.length > 0 ? (
                    cellRisks.map((r) => (
                      <div
                        key={r.risk_id}
                        className="p-2.5 rounded-xl bg-navy-950/80 border border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-400">{r.risk_id}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${getBandClass(r.residual_band)}`}>
                            {r.residual_band} ({r.residual_risk_score})
                          </span>
                        </div>
                        <div className="font-semibold text-slate-200 leading-snug">{r.title}</div>
                        <div className="text-[11px] text-slate-400">Asset: {r.affected_asset}</div>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-center text-slate-500 text-xs py-8">
                      {selectedHeatmapCell
                        ? 'No risks mapped to this specific coordinates.'
                        : 'Select a cell on the left to drill down.'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 3: Top Critical Risks & Root Cause Analysis                         */}
        {/* ========================================================================= */}
        {currentSlide === 2 && (
          <div className="space-y-4 animate-in">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded border border-red-500/30">
                Primary Threat Vectors
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Top Priority Risks Requiring Immediate Board Intervention
              </h2>
              <p className="text-xs text-slate-400">
                Four critical vulnerabilities exposing customer accounts, regulatory standing, and business continuity.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {criticalRisks.map((risk) => (
                <div
                  key={risk.risk_id}
                  className="bg-navy-900/90 border border-red-500/40 rounded-2xl p-5 shadow-lg space-y-3 bg-gradient-to-br from-navy-900 to-red-950/15"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/30">
                          {risk.risk_id}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {risk.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 mt-1 leading-snug">
                        {risk.title}
                      </h3>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-extrabold font-mono text-red-400">
                        {risk.residual_risk_score}
                      </span>
                      <div className="text-[9px] uppercase tracking-wider text-slate-400">Residual</div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-300">
                    <p className="line-clamp-2">
                      <strong className="text-slate-400">Threat / Vulnerability:</strong> {risk.threat} — {risk.vulnerability}
                    </p>
                    <p className="line-clamp-2">
                      <strong className="text-slate-400">Business Impact:</strong> {risk.business_impact}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-800 text-slate-400">
                    <span>Asset: <strong className="text-slate-200">{risk.affected_asset}</strong></span>
                    <span className="text-amber-400 font-semibold">Owner: {risk.risk_owner}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 4: NIST CSF 2.0 Maturity Benchmark                                  */}
        {/* ========================================================================= */}
        {currentSlide === 3 && (
          <div className="space-y-4 animate-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded border border-cyan-500/30">
                  Framework Alignment
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  NIST CSF 2.0 Maturity Profile Benchmark
                </h2>
                <p className="text-xs text-slate-400">
                  Current maturity Tier 2.0 (Risk-Informed) vs Enterprise Target Tier 3.5 (Repeatable & Standardized).
                </p>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-slate-300">Overall Gap: </span>
                <span className="text-lg font-extrabold font-mono text-amber-400">-1.5 Tiers</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {nistFunctions.map((fn) => {
                const pct = (fn.current / 4.0) * 100;
                const targetPct = (fn.target / 4.0) * 100;
                return (
                  <div
                    key={fn.name}
                    className="bg-navy-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{fn.name}</span>
                      <div className="flex items-center gap-2 font-mono text-xs">
                        <span className="text-cyan-400 font-bold">{fn.current.toFixed(1)}</span>
                        <span className="text-slate-500">/</span>
                        <span className="text-slate-400 font-medium">Target {fn.target.toFixed(1)}</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-navy-950 rounded-full h-2.5 overflow-hidden border border-slate-800 relative">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-cyan-400 h-full rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                        <div
                          className="absolute top-0 bottom-0 border-r-2 border-dashed border-amber-400/80"
                          style={{ left: `${targetPct}%` }}
                          title={`Target: ${fn.target}`}
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">
                      {fn.highlight}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 5: Regulatory Compliance & Financial Penalty Exposure               */}
        {/* ========================================================================= */}
        {currentSlide === 4 && (
          <div className="space-y-4 animate-in">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/30">
                Legal & Statutory Exposure
              </span>
              <h2 className="text-2xl font-black text-white mt-1">
                Regulatory Exposure & Statutory Penalty Assessment
              </h2>
              <p className="text-xs text-slate-400">
                Non-compliance liabilities across India DPDP Act 2023, RBI Cyber Security Framework, and PCI DSS 4.0.1.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="bg-navy-900/90 border border-red-500/30 rounded-2xl p-5 shadow-lg space-y-3 bg-gradient-to-br from-navy-900 to-red-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-red-400 uppercase tracking-wider">
                    Digital Personal Data Protection Act (DPDP 2023)
                  </span>
                  <Scale className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-2xl font-black font-mono text-red-300">
                  Up to ₹250 Cr
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Section 33 statutory fine for failure to observe reasonable security safeguards to prevent customer personal data breach (RSK-008 unencrypted PII in database).
                </p>
                <div className="text-[11px] text-red-400/90 font-medium pt-2 border-t border-slate-800">
                  Status: High Exposure • Remediation in Progress
                </div>
              </div>

              <div className="bg-navy-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg space-y-3 bg-gradient-to-br from-navy-900 to-amber-950/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                    RBI Cyber Security Framework
                  </span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-black font-mono text-amber-300">
                  Operational Curbs
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Supervisory supervisory sanctions, restriction on onboarding new digital banking customers, and mandatory CERT-In 6-hour incident disclosure requirement.
                </p>
                <div className="text-[11px] text-amber-400/90 font-medium pt-2 border-t border-slate-800">
                  Status: Non-Compliant (MFA & Logging Gaps)
                </div>
              </div>

              <div className="bg-navy-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    PCI-DSS v4.0.1
                  </span>
                  <ShieldCheck className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-2xl font-black font-mono text-slate-200">
                  Payment Gateway Suspension
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Requirement 8.3 & 3.4 non-compliance regarding MFA and cardholder data encryption risks monthly bank fines ($5k–$100k/mo) and acquiring license revocation.
                </p>
                <div className="text-[11px] text-blue-400 font-medium pt-2 border-t border-slate-800">
                  Status: Conditional Acceptance Expiring
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SLIDE 6: Capital Allocation & Return on Security Investment (ROSI)        */}
        {/* ========================================================================= */}
        {currentSlide === 5 && (
          <div className="space-y-4 animate-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  Strategic Business Case
                </span>
                <h2 className="text-2xl font-black text-white mt-1">
                  Requested Security Budget & Projected ROSI
                </h2>
                <p className="text-xs text-slate-400">
                  High-leverage control remediation package delivering immediate risk reduction and compliance closure.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-slate-400 uppercase">Return on Investment</span>
                <div className="text-2xl font-black font-mono text-emerald-400">+700% ROSI</div>
              </div>
            </div>

            <div className="bg-navy-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-navy-950/80 text-slate-400 text-[11px] uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Strategic Initiative</th>
                    <th className="py-3 px-4">Scope & Mitigation</th>
                    <th className="py-3 px-4 text-right">Cost</th>
                    <th className="py-3 px-4 text-center">Risk Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  <tr className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Enterprise FIDO2 MFA Rollout
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Eliminates single-factor NetBanking and administrative bastions exposure (RSK-001)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      $35,000
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        -80% IAM Risk
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      AWS Cloud Governance & Guardrails
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Automated S3 encryption, SCPs, and cloud security posture remediation (RSK-008)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      $25,000
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        -75% Data Leak
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      Core Banking API Gateway WAF
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      Rate limiting, credential stuffing shield & automated DDoS protection (RSK-010)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      $20,000
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        -70% API Exploit
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-navy-800/40">
                    <td className="py-3 px-4 font-bold text-slate-200">
                      24/7 Managed Detection & Response (MDR)
                    </td>
                    <td className="py-3 px-4 text-slate-400">
                      CrowdStrike EDR + 24/7 SOC containment reducing MTTD to &lt; 30 mins (RSK-006)
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400">
                      $60,000
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                        -85% Ransomware
                      </span>
                    </td>
                  </tr>
                </tbody>
                <tfoot className="bg-navy-950 font-bold border-t border-slate-700">
                  <tr>
                    <td className="py-3.5 px-4 text-slate-200" colSpan={2}>
                      Total Security Budget Requested for FY25 Authorization:
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-cyan-300 text-sm">
                      $140,000
                    </td>
                    <td className="py-3.5 px-4 text-center text-emerald-400 font-mono">
                      $1.12M Loss Prevented
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Speaking Prompter Bar (CISO Notes) */}
      {showPrompter && (
        <div className="border-t border-slate-800 bg-navy-900/95 px-6 py-3 max-w-6xl w-full mx-auto animate-in">
          <div className="flex items-start gap-3">
            <div className="p-1.5 rounded-md bg-purple-500/20 text-purple-300 shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex-1 space-y-1 text-xs">
              <span className="font-bold text-purple-300 uppercase tracking-wider text-[10px]">
                CISO Executive Speaking Talking Points:
              </span>
              <p className="text-slate-300 leading-relaxed">
                {currentSlide === 0 &&
                  "\"Members of the Board, our Q4 cybersecurity assessment confirms that while foundational controls are established, Apex Financial Services currently operates at an elevated risk level. Seven key risks exceed our board-approved appetite, primarily driven by legacy authentication on NetBanking and unencrypted data repositories. Our requested $140,000 initiative package will resolve 100% of these critical vulnerabilities.\""}
                {currentSlide === 1 &&
                  "\"As shown on the 5x5 heatmap, our residual risks cluster heavily in the upper-right quadrant. By clicking cell L4×I5, you can see that our core banking systems face extreme credential compromise risks. The red demarcation line represents our board appetite threshold—everything above it constitutes unacceptable regulatory and business continuity exposure.\""}
                {currentSlide === 2 &&
                  "\"Looking specifically at our top critical vulnerabilities: RSK-001—missing MFA on customer-facing banking portals—is our highest single exposure. With phishing attacks up 300% across the financial sector, single-factor authentication leaves our customers vulnerable to automated account takeover. Addressing this alone reduces our overall inherent risk by over 40%.\""}
                {currentSlide === 3 &&
                  "\"Benchmarked against NIST CSF 2.0, our current overall maturity is Tier 2.0 (Risk-Informed). Our sharpest gaps lie in 'Protect' and 'Detect', where our logging retention is under 90 days and lack 24/7 automated alerting. Moving to Tier 3.5 (Repeatable) ensures that we satisfy both regulatory mandates and institutional cyber insurance prerequisites.\""}
                {currentSlide === 4 &&
                  "\"From a regulatory perspective, inaction carries severe financial consequences. Under Section 33 of India's DPDP Act, failure to safeguard customer PII exposes the bank to penalties up to ₹250 Crores. Furthermore, RBI non-compliance could trigger supervisory restrictions on our digital lending expansion. Proactive mitigation is vastly cheaper than statutory fines.\""}
                {currentSlide === 5 &&
                  "\"To conclude, we propose a targeted $140,000 security remediation budget across four high-leverage initiatives. This investment achieves an estimated 44.8% aggregate risk reduction, shielding over $1.12 million in potential single-loss asset exposure. We recommend the Risk Committee approve this capital expenditure for immediate execution.\""}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Navigation Bar */}
      <footer className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-navy-900/90 text-xs">
        <div className="flex items-center gap-2 text-slate-400">
          <span>Navigate with</span>
          <kbd className="px-1.5 py-0.5 rounded bg-navy-950 border border-slate-700 font-mono text-[10px] text-slate-300">
            &larr;
          </kbd>
          <kbd className="px-1.5 py-0.5 rounded bg-navy-950 border border-slate-700 font-mono text-[10px] text-slate-300">
            &rarr;
          </kbd>
          <span className="hidden sm:inline">or Spacebar</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentSlide((prev) => Math.max(prev - 1, 0))}
            disabled={currentSlide === 0}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-navy-800 hover:bg-navy-700 disabled:opacity-40 text-slate-200 font-medium transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          <span className="font-mono text-xs font-bold text-slate-300">
            {currentSlide + 1} / {totalSlides}
          </span>

          <button
            onClick={() => setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1))}
            disabled={currentSlide === totalSlides - 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white font-medium transition shadow-sm"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </div>,
    document.body
  );
};
