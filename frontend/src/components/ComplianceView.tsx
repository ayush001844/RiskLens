import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  Shield, CheckCircle2, AlertTriangle, XCircle, ArrowRight,
  Layers, RefreshCw, Sparkles, Scale, BookOpen, Search, Filter,
  Building2, Lock, FileCheck, CheckCheck, HelpCircle, Download
} from 'lucide-react';

import { complianceApi, harmonizationApi } from '../api/client';
import type {
  ComplianceFramework,
  ComplianceRequirement,
  ComplianceSummaryItem,
  HarmonizationCrosswalkItem,
  HarmonizedPosture,
  AuditReadinessResponse,
  HarmonizedEvaluateResponse,
} from '../types';
import { getComplianceClass, getBandClass, fmtDate } from '../utils';

const STATUS_COLORS: Record<string, string> = {
  Compliant: '#22c55e',
  'Partially Compliant': '#eab308',
  'Non-Compliant': '#ef4444',
  'Not Assessed': '#64748b',
};

interface Props {
  onNotify?: (msg: string, type?: 'success' | 'error') => void;
}

export function ComplianceView({ onNotify }: Props) {
  const [activeTab, setActiveTab] = useState<'crosswalk' | 'registers'>('crosswalk');

  // Crosswalk State
  const [crosswalk, setCrosswalk] = useState<HarmonizationCrosswalkItem[]>([]);
  const [posture, setPosture] = useState<HarmonizedPosture | null>(null);
  const [readiness, setReadiness] = useState<AuditReadinessResponse | null>(null);
  const [loadingHarmonization, setLoadingHarmonization] = useState(true);
  const [domainFilter, setDomainFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Assessment Modal / Drawer State
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [selectedControlId, setSelectedControlId] = useState('CTL-002');
  const [proposedEffectiveness, setProposedEffectiveness] = useState<'Effective' | 'Partially Effective' | 'Ineffective'>('Effective');
  const [evalJustification, setEvalJustification] = useState('Supervisory audit verification of phishing-resistant FIDO2 hardware tokens implemented.');
  const [submittingEval, setSubmittingEval] = useState(false);
  const [evalResult, setEvalResult] = useState<HarmonizedEvaluateResponse | null>(null);

  // Framework Registers State (Legacy view)
  const [frameworks, setFrameworks] = useState<ComplianceFramework[]>([]);
  const [summary, setSummary] = useState<ComplianceSummaryItem[]>([]);
  const [selectedFramework, setSelectedFramework] = useState<ComplianceFramework | null>(null);
  const [requirements, setRequirements] = useState<ComplianceRequirement[]>([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [disclaimer, setDisclaimer] = useState('');
  const [loadingRegisters, setLoadingRegisters] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);

  useEffect(() => {
    loadHarmonizationData();
    loadRegistersSummary();
  }, []);

  useEffect(() => {
    if (selectedFramework) {
      loadRequirements(selectedFramework.framework_id);
    }
  }, [selectedFramework, statusFilter]);

  async function loadHarmonizationData() {
    try {
      setLoadingHarmonization(true);
      const [cwData, posData, readData] = await Promise.all([
        harmonizationApi.getCrosswalk(),
        harmonizationApi.getPosture(),
        harmonizationApi.getAuditReadiness(),
      ]);
      setCrosswalk(cwData);
      setPosture(posData);
      setReadiness(readData);
    } catch (err) {
      console.error('Failed to load harmonization data:', err);
      onNotify?.('Failed to load crosswalk data', 'error');
    } finally {
      setLoadingHarmonization(false);
    }
  }

  async function loadRegistersSummary() {
    try {
      setLoadingRegisters(true);
      const [fws, sum] = await Promise.all([
        complianceApi.frameworks(),
        complianceApi.summary(),
      ]);
      setFrameworks(fws);
      setSummary(sum.frameworks);
      setDisclaimer(sum.disclaimer);
      if (fws.length > 0 && !selectedFramework) {
        setSelectedFramework(fws[0]);
      }
    } catch {
      onNotify?.('Failed to load framework registers', 'error');
    } finally {
      setLoadingRegisters(false);
    }
  }

  async function loadRequirements(frameworkId: string) {
    try {
      setReqLoading(true);
      const reqs = await complianceApi.requirements(frameworkId, {
        assessment_status: statusFilter || undefined,
      });
      setRequirements(reqs);
    } catch {
      onNotify?.('Failed to load requirements', 'error');
    } finally {
      setReqLoading(false);
    }
  }

  async function handleEvaluateSubmit() {
    try {
      setSubmittingEval(true);
      const res = await harmonizationApi.evaluateControl({
        control_id: selectedControlId,
        proposed_effectiveness: proposedEffectiveness,
        justification: evalJustification,
      });
      setEvalResult(res);
      onNotify?.(`Control ${selectedControlId} evaluated. Synchronized across 5 frameworks!`, 'success');
      // Refresh crosswalk & posture
      await loadHarmonizationData();
      await loadRegistersSummary();
    } catch (err) {
      console.error('Failed to submit evaluation:', err);
      onNotify?.('Evaluation submission failed', 'error');
    } finally {
      setSubmittingEval(false);
    }
  }

  function openEvaluation(controlId: string, currentEff?: string) {
    setSelectedControlId(controlId);
    setProposedEffectiveness(currentEff === 'Effective' ? 'Partially Effective' : 'Effective');
    setEvalResult(null);
    setEvalModalOpen(true);
  }

  // Filter crosswalk items
  const filteredCrosswalk = crosswalk.filter(item => {
    const matchesDomain = domainFilter === 'ALL' || item.domain.toLowerCase().includes(domainFilter.toLowerCase());
    const matchesQuery = searchQuery === '' ||
      item.ccf_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.control_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.primary_control_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.domain.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesQuery;
  });

  const domains = ['ALL', 'Identity & Access', 'Data Protection', 'Security Logging', 'Vulnerability', 'Network', 'Business Continuity', 'Third-Party'];

  const summaryBarData = summary.map(fw => ({
    name: fw.framework_id,
    Compliant: fw.compliant,
    'Partially Compliant': fw.partially_compliant,
    'Non-Compliant': fw.non_compliant,
    'Not Assessed': fw.not_assessed,
    pct: fw.compliance_pct,
  }));

  return (
    <div className="space-y-6 animate-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="section-title">Regulatory Compliance & Harmonization</h1>
            <span className="badge badge-info text-xs flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" />
              Assess Once, Comply with Many
            </span>
          </div>
          <p className="section-subtitle">
            Unified Common Control Framework (CCF) harmonizing NIST CSF 2.0, ISO 27001, RBI CSF, India DPDP Act 2023 & PCI DSS 4.0.1
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-700 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setActiveTab('crosswalk')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'crosswalk'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              CCF Harmonization Crosswalk
              <span className="ml-1 px-1.5 py-0.2 bg-white/20 text-[10px] rounded-full">5.0× Leverage</span>
            </button>
            <button
              onClick={() => setActiveTab('registers')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                activeTab === 'registers'
                  ? 'bg-accent text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              Framework Regulatory Registers
            </button>
          </div>

          <button
            onClick={() => {
              loadHarmonizationData();
              loadRegistersSummary();
            }}
            className="btn btn-secondary text-xs flex items-center gap-1.5 py-1.5"
            title="Refresh Harmonization Data"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Mode 1: Unified CCF Crosswalk */}
      {activeTab === 'crosswalk' && (
        <div className="space-y-6">
          {/* Methodology Banner */}
          <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 p-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                    "Assess Once, Comply with Many" Architecture
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                      8 Controls → 40 Obligations
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    By testing each core primary control inside Apex Financial Services Ltd., RiskLens automatically calculates compliance satisfaction, evidence admissibility, and audit readiness simultaneously across 5 distinct standards.
                  </p>
                </div>
              </div>

              <button
                onClick={() => openEvaluation('CTL-002')}
                className="btn btn-primary text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-accent/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Evaluate Control & Propagate
              </button>
            </div>
          </div>

          {/* Metric Strip */}
          {posture && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card border-slate-700/80 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">Audit Efficiency Multiplier</p>
                  <span className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-400">
                    <CheckCheck className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-emerald-400">{posture.audit_efficiency_multiplier}×</span>
                  <span className="text-xs text-slate-400">Harmonization Leverage</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  8 assessments satisfy {posture.total_applicable_regulations_monitored} statutory requirements.
                </p>
              </div>

              <div className="card border-slate-700/80 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">Harmonized Compliance Index</p>
                  <span className="p-1.5 rounded-md bg-cyan-500/10 text-cyan-400">
                    <Shield className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-2xl font-bold text-cyan-400">{posture.harmonized_compliance_index_pct}%</span>
                  <span className="text-xs text-slate-400">Cross-Framework Avg</span>
                </div>
                <div className="mt-2 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                    style={{ width: `${posture.harmonized_compliance_index_pct}%` }}
                  />
                </div>
              </div>

              <div className="card border-slate-700/80 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">Unified Control Posture</p>
                  <span className="p-1.5 rounded-md bg-amber-500/10 text-amber-400">
                    <Layers className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-emerald-400">{posture.effective_controls} Effective</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-semibold text-amber-400">{posture.partially_effective_controls} Partial</span>
                  <span className="text-slate-600">·</span>
                  <span className="text-xs font-semibold text-red-400">{posture.ineffective_controls} Deficient</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  {posture.total_regulatory_requirements_satisfied} / {posture.total_applicable_regulations_monitored} obligations currently satisfied.
                </p>
              </div>

              <div className="card border-slate-700/80 bg-slate-900/60 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-slate-400">Statutory Exposure Shield</p>
                  <span className="p-1.5 rounded-md bg-rose-500/10 text-rose-400">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-xl font-bold text-rose-400">₹250 Cr</span>
                  <span className="text-xs text-slate-400">DPDP Act Ceiling</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Plus RBI digital onboarding restriction exposure.
                </p>
              </div>
            </div>
          )}

          {/* Framework Breakdown Strip */}
          {posture && (
            <div className="card bg-slate-900/40 p-3.5 border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300">Synchronized Posture Across 5 Regulatory Regimes:</span>
                <span className="text-[11px] text-slate-500">Auto-synchronized via CCF Engine</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">NIST CSF 2.0</span>
                    <span className="font-mono text-cyan-400 font-bold">{posture.framework_scores.nist_csf_2}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1.5">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${posture.framework_scores.nist_csf_2}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">ISO/IEC 27001:2022</span>
                    <span className="font-mono text-indigo-400 font-bold">{posture.framework_scores.iso_27001_2022}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1.5">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${posture.framework_scores.iso_27001_2022}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">RBI Cyber Security</span>
                    <span className="font-mono text-emerald-400 font-bold">{posture.framework_scores.rbi_csf}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1.5">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${posture.framework_scores.rbi_csf}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">India DPDP Act 2023</span>
                    <span className="font-mono text-amber-400 font-bold">{posture.framework_scores.dpdp_act_2023}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1.5">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${posture.framework_scores.dpdp_act_2023}%` }} />
                  </div>
                </div>

                <div className="bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-300 font-medium">PCI DSS v4.0.1</span>
                    <span className="font-mono text-purple-400 font-bold">{posture.framework_scores.pci_dss_v4}%</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full mt-1.5">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${posture.framework_scores.pci_dss_v4}%` }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Statutory Supervisory Audit Scorecards */}
          {readiness && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">Statutory Supervisory Inspection Readiness</h2>
                  <p className="text-xs text-slate-500">Live regulatory inspection pass probability and statutory sanction exposure</p>
                </div>
                <span className="text-xs text-slate-400 italic">Methodology: {readiness.methodology}</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {readiness.audit_scorecards.slice(0, 3).map((card, idx) => {
                  const isReady = card.readiness_verdict.includes('READY') || card.readiness_verdict.includes('SATISFACTORY');
                  const isExpiring = card.readiness_verdict.includes('EXPIRING') || card.readiness_verdict.includes('CONDITIONAL');
                  const badgeColor = isReady ? 'badge-low' : isExpiring ? 'badge-medium' : 'badge-critical';
                  const probColor = card.pass_probability_pct >= 75 ? 'text-emerald-400' : card.pass_probability_pct >= 50 ? 'text-amber-400' : 'text-red-400';

                  return (
                    <div key={idx} className="card border-slate-800 bg-slate-900/80 p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">{card.audit_type}</span>
                            <h3 className="text-xs font-semibold text-slate-200 mt-0.5">{card.regulator}</h3>
                          </div>
                          <span className={`badge ${badgeColor} text-[10px] font-mono shrink-0`}>
                            {card.readiness_verdict}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                          <span className="text-xs text-slate-400">Pass Probability</span>
                          <span className={`text-base font-bold font-mono ${probColor}`}>
                            {card.pass_probability_pct.toFixed(0)}%
                          </span>
                        </div>

                        <div className="mt-3">
                          <p className="text-[11px] font-medium text-slate-400 mb-1">Critical Redlines:</p>
                          <ul className="space-y-1">
                            {card.critical_audit_redlines.map((line, lIdx) => (
                              <li key={lIdx} className="text-xs text-slate-300 flex items-start gap-1.5 leading-snug">
                                <span className="text-red-400 mt-0.5">•</span>
                                <span>{line}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-800">
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-amber-300">Statutory Risk:</strong> {card.statutory_risk}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Recommendation Note & Quick Export Dossier Button */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3">
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{readiness.executive_recommendation}</span>
                </div>
                <button
                  onClick={() => window.open('/api/reports/dossier/download?bundle=ALL', '_blank')}
                  className="btn btn-primary text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/30 font-semibold"
                  title="Download complete verified regulatory evidence package"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export Regulatory Dossier (.zip)
                </button>
              </div>
            </div>
          )}


          {/* Unified Crosswalk Matrix Table */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-200">Unified Common Control Framework (CCF) Crosswalk</h2>
                <p className="text-xs text-slate-500">Mapping primary controls to statutory clauses across all 5 framework registers</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Search */}
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search controls, CCF, domain..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="input-field text-xs pl-8 py-1.5 w-52"
                  />
                </div>

                {/* Domain Filter */}
                <select
                  value={domainFilter}
                  onChange={e => setDomainFilter(e.target.value)}
                  className="input-field text-xs py-1.5 w-40"
                >
                  {domains.map(d => (
                    <option key={d} value={d}>{d === 'ALL' ? 'All Domains' : d}</option>
                  ))}
                </select>
              </div>
            </div>

            {loadingHarmonization ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-accent border-t-transparent" />
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-900/80">
                      <th className="table-header py-2.5 w-24">CCF ID</th>
                      <th className="table-header py-2.5 w-44">Domain & Title</th>
                      <th className="table-header py-2.5 w-40">Primary Control</th>
                      <th className="table-header py-2.5 w-28">Effectiveness</th>
                      <th className="table-header py-2.5">NIST CSF 2.0</th>
                      <th className="table-header py-2.5">ISO 27001:2022</th>
                      <th className="table-header py-2.5">RBI Cyber Sec</th>
                      <th className="table-header py-2.5">India DPDP</th>
                      <th className="table-header py-2.5">PCI DSS v4</th>
                      <th className="table-header py-2.5 w-20 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCrosswalk.map(row => {
                      const effBadge =
                        row.control_effectiveness === 'Effective'
                          ? 'badge-low'
                          : row.control_effectiveness === 'Partially Effective'
                          ? 'badge-medium'
                          : 'badge-critical';

                      return (
                        <tr key={row.ccf_id} className="table-row">
                          <td className="table-cell py-3 font-mono font-semibold text-cyan-400">
                            {row.ccf_id}
                          </td>
                          <td className="table-cell py-3">
                            <span className="font-semibold text-slate-200 block">{row.control_title}</span>
                            <span className="text-[11px] text-slate-500">{row.domain}</span>
                          </td>
                          <td className="table-cell py-3">
                            <span className="font-mono text-xs text-indigo-300 font-semibold">{row.primary_control_id}</span>
                            {row.linked_risk && (
                              <div className="mt-1 flex items-center gap-1">
                                <span className="text-[10px] text-slate-500 font-mono">{row.linked_risk.risk_id}</span>
                                <span className={`badge ${getBandClass(row.linked_risk.residual_band)} text-[9px] px-1 py-0`}>
                                  {row.linked_risk.residual_score} ({row.linked_risk.residual_band})
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="table-cell py-3">
                            <span className={`badge ${effBadge} text-[10px]`}>
                              {row.control_effectiveness}
                            </span>
                          </td>
                          {/* NIST CSF 2.0 */}
                          <td className="table-cell py-3">
                            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                              <span className="font-mono text-cyan-400 font-semibold block">{row.mappings.nist_csf_2.ref}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1" title={row.mappings.nist_csf_2.name}>
                                {row.mappings.nist_csf_2.name}
                              </span>
                            </div>
                          </td>
                          {/* ISO 27001 */}
                          <td className="table-cell py-3">
                            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                              <span className="font-mono text-indigo-400 font-semibold block">{row.mappings.iso_27001_2022.ref}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1" title={row.mappings.iso_27001_2022.name}>
                                {row.mappings.iso_27001_2022.name}
                              </span>
                            </div>
                          </td>
                          {/* RBI CSF */}
                          <td className="table-cell py-3">
                            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                              <span className="font-mono text-emerald-400 font-semibold block">{row.mappings.rbi_csf.ref}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1" title={row.mappings.rbi_csf.name}>
                                {row.mappings.rbi_csf.name}
                              </span>
                            </div>
                          </td>
                          {/* India DPDP */}
                          <td className="table-cell py-3">
                            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                              <span className="font-mono text-amber-400 font-semibold block">{row.mappings.dpdp_act_2023.ref}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1" title={row.mappings.dpdp_act_2023.name}>
                                {row.mappings.dpdp_act_2023.name}
                              </span>
                            </div>
                          </td>
                          {/* PCI DSS */}
                          <td className="table-cell py-3">
                            <div className="bg-slate-950/50 p-1.5 rounded border border-slate-800">
                              <span className="font-mono text-purple-400 font-semibold block">{row.mappings.pci_dss_v4.ref}</span>
                              <span className="text-[10px] text-slate-400 line-clamp-1" title={row.mappings.pci_dss_v4.name}>
                                {row.mappings.pci_dss_v4.name}
                              </span>
                            </div>
                          </td>
                          {/* Action */}
                          <td className="table-cell py-3 text-right">
                            <button
                              onClick={() => openEvaluation(row.primary_control_id, row.control_effectiveness)}
                              className="px-2 py-1 text-[11px] rounded bg-accent/20 text-accent hover:bg-accent hover:text-white transition-all font-medium"
                              title="Evaluate once & propagate across 5 standards"
                            >
                              Assess
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Framework Regulatory Registers (Legacy Detail View) */}
      {activeTab === 'registers' && (
        <div className="space-y-6">
          {/* Disclaimer */}
          {disclaimer && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-300 leading-relaxed">
              ⚠️ {disclaimer}
            </div>
          )}

          {/* Framework Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {summary.map(fw => (
              <button
                key={fw.framework_id}
                onClick={() => {
                  const f = frameworks.find(x => x.framework_id === fw.framework_id);
                  if (f) setSelectedFramework(f);
                }}
                className={`card text-left transition-all hover:border-accent/60 ${
                  selectedFramework?.framework_id === fw.framework_id
                    ? 'border-accent/70 bg-accent/5'
                    : ''
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">{fw.framework_name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{fw.framework_id}</p>
                  </div>
                  <span className={`badge ${fw.is_regulatory ? 'badge-high' : 'badge-info'} text-xs shrink-0 ml-2`}>
                    {fw.is_regulatory ? 'Regulatory' : 'Standards'}
                  </span>
                </div>

                <div className="h-1.5 bg-slate-700 rounded-full mb-2">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${fw.compliance_pct}%`,
                      backgroundColor: fw.compliance_pct >= 70 ? '#22c55e' : fw.compliance_pct >= 40 ? '#eab308' : '#ef4444',
                    }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{fw.compliance_pct.toFixed(0)}% compliant</span>
                  <span>{fw.total_applicable} requirements</span>
                </div>

                <div className="flex gap-1.5 mt-2 flex-wrap">
                  {fw.compliant > 0 && (
                    <span className="text-xs text-emerald-400">{fw.compliant} ✓</span>
                  )}
                  {fw.partially_compliant > 0 && (
                    <span className="text-xs text-amber-400">{fw.partially_compliant} ⚬</span>
                  )}
                  {fw.non_compliant > 0 && (
                    <span className="text-xs text-red-400">{fw.non_compliant} ✗</span>
                  )}
                  {fw.not_assessed > 0 && (
                    <span className="text-xs text-slate-500">{fw.not_assessed} ?</span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Stacked Bar Overview */}
          <div className="card">
            <h2 className="text-sm font-semibold text-slate-300 mb-4">Compliance Status by Framework</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={summaryBarData} layout="vertical" margin={{ left: 80, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#64748b', fontSize: 10 }} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} width={80} />
                <Tooltip
                  contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
                  labelStyle={{ color: '#f1f5f9' }}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: '#94a3b8' }} />
                {['Compliant', 'Partially Compliant', 'Non-Compliant', 'Not Assessed'].map(status => (
                  <Bar key={status} dataKey={status} stackId="a" fill={STATUS_COLORS[status]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Requirement Detail Table */}
          {selectedFramework && (
            <div className="card">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-200">{selectedFramework.name}</h2>
                  <p className="text-xs text-slate-500">{selectedFramework.applicability_note}</p>
                </div>
                <select
                  className="input-field text-xs py-1.5 w-44"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="">All statuses</option>
                  <option value="Compliant">Compliant</option>
                  <option value="Partially Compliant">Partially Compliant</option>
                  <option value="Non-Compliant">Non-Compliant</option>
                  <option value="Not Assessed">Not Assessed</option>
                </select>
              </div>

              {reqLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-accent border-t-transparent" />
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-slate-700">
                        <th className="table-header py-2 w-32">Req. ID</th>
                        <th className="table-header py-2">Title</th>
                        <th className="table-header py-2 w-32">Status</th>
                        <th className="table-header py-2 w-28 hidden md:table-cell">Last Assessed</th>
                        <th className="table-header py-2 hidden lg:table-cell">Gap / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requirements.map(req => (
                        <tr key={req.id} className="table-row">
                          <td className="table-cell py-2 font-mono text-slate-400">{req.requirement_id}</td>
                          <td className="table-cell py-2 font-medium text-slate-200">{req.title}</td>
                          <td className="table-cell py-2">
                            <span className={`badge ${getComplianceClass(req.assessment_status)} text-xs`}>
                              {req.assessment_status}
                            </span>
                          </td>
                          <td className="table-cell py-2 text-slate-400 hidden md:table-cell">
                            {fmtDate(req.last_assessed_date)}
                          </td>
                          <td className="table-cell py-2 text-slate-400 hidden lg:table-cell max-w-xs truncate">
                            {req.identified_gap || req.description || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {requirements.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-sm">
                      No requirements match the selected filter.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assess Once & Propagate Modal */}
      {evalModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in">
          <div className="card w-full max-w-lg border-slate-700 bg-slate-900 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-accent" />
                <h3 className="text-base font-semibold text-slate-100">Assess Once & Harmonize</h3>
              </div>
              <button
                onClick={() => setEvalModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Target Primary Control ID</label>
                <select
                  value={selectedControlId}
                  onChange={e => setSelectedControlId(e.target.value)}
                  className="input-field w-full text-xs"
                >
                  {crosswalk.map(cw => (
                    <option key={cw.primary_control_id} value={cw.primary_control_id}>
                      {cw.primary_control_id} — {cw.control_title} ({cw.control_effectiveness})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">New Tested Operating Effectiveness</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Effective', 'Partially Effective', 'Ineffective'] as const).map(eff => (
                    <button
                      key={eff}
                      type="button"
                      onClick={() => setProposedEffectiveness(eff)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all ${
                        proposedEffectiveness === eff
                          ? eff === 'Effective'
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                            : eff === 'Partially Effective'
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-red-500/20 border-red-500 text-red-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      {eff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Evaluation & Evidence Justification</label>
                <textarea
                  value={evalJustification}
                  onChange={e => setEvalJustification(e.target.value)}
                  rows={3}
                  className="input-field w-full text-xs resize-none"
                  placeholder="Provide audit evidence justification for this assessment..."
                />
              </div>

              {evalResult && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/40 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{evalResult.audit_efficiency_message}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-300 pt-1 border-t border-emerald-800/40">
                    {evalResult.harmonized_propagation.map(p => (
                      <div key={p.framework_key} className="flex items-center justify-between">
                        <span>{p.framework_name}:</span>
                        <span className="text-emerald-400 font-semibold">{p.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEvalModalOpen(false)}
                  className="btn btn-secondary text-xs"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleEvaluateSubmit}
                  disabled={submittingEval}
                  className="btn btn-primary text-xs flex items-center gap-1.5"
                >
                  {submittingEval ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Harmonizing Across 5 Standards...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Harmonize & Record Audit Trail
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ComplianceView;
