import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  Printer,
  Download,
  ShieldAlert,
  CheckCircle,
  Clock,
  Layers,
  ArrowRight,
  AlertTriangle,
  FileSpreadsheet,
  Archive,
  FolderArchive,
  Scale,
  FileCheck,
  Hash,
  Eye,
  Sparkles,
  CheckCircle2,
  Lock,
} from 'lucide-react'
import { getFullReport, downloadCsv, dossierApi, reportsApi } from '../api/client'
import type { DossierSummaryResponse } from '../types'
import { getBadgeClass } from '../utils'

export const ReportsView: React.FC = () => {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [dossierSummary, setDossierSummary] = useState<DossierSummaryResponse | null>(null)
  const [manifestModalOpen, setManifestModalOpen] = useState(false)

  useEffect(() => {
    getFullReport()
      .then((data) => setReport(data))
      .catch((err) => console.error('Error fetching full report:', err))
      .finally(() => setLoading(false))

    dossierApi.getSummary()
      .then((data) => setDossierSummary(data))
      .catch((err) => console.error('Error fetching dossier summary:', err))
  }, [])


  if (loading || !report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Compiling Executive Consulting Report...</p>
        </div>
      </div>
    )
  }

  const {
    report_metadata,
    executive_summary,
    scope_and_assumptions,
    methodology,
    top_risks,
    critical_control_gaps,
    remediation_roadmap,
    limitations,
    next_steps,
  } = report

  return (
    <div className="space-y-6 pb-16 animate-in">
      {/* Action Bar (Hidden in Print) */}
      <div className="print:hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 card p-4 bg-navy-800/90 border-slate-700">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <span>Consulting Assessment Report & Deliverables</span>
          </h2>
          <p className="text-xs text-slate-400">
            Formal client deliverable format with complete scope, methodology, roadmap, and CSV exports.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CSV Downloads Dropdown / Buttons */}
          <div className="flex items-center gap-1.5 bg-navy-900/80 p-1 rounded-lg border border-slate-700">
            <span className="text-[11px] text-slate-400 px-2 font-medium">Export CSV:</span>
            <button
              onClick={() => downloadCsv('risks')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Risks
            </button>
            <button
              onClick={() => downloadCsv('controls')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Controls
            </button>
            <button
              onClick={() => downloadCsv('remediation')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Remediation
            </button>
            <button
              onClick={() => downloadCsv('vendors')}
              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium"
            >
              Vendors
            </button>
          </div>

          <button
            onClick={() => window.open('/api/reports/excel', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
            title="Download multi-sheet Excel workbook (.xlsx)"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.open('/api/reports/pdf', '_blank')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all"
            title="Download compiled executive PDF deliverable (.pdf)"
          >
            <Download className="w-4 h-4" />
            <span>Export PDF (.pdf)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="btn btn-primary text-xs shadow-lg shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Phase 15: Regulatory Audit Dossiers & Verified Evidence Binders (Hidden in Print) */}
      <div className="print:hidden card p-5 bg-slate-900/90 border-slate-700/80 space-y-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FolderArchive className="w-5 h-5 text-indigo-400" />
              <h3 className="text-base font-bold text-white">
                Regulatory Audit Dossiers & Verified Evidence Packages
              </h3>
              <span className="badge badge-info text-[10px] font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-cyan-400" />
                SHA-256 Non-Repudiation
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              One-click generation of digitally certified regulatory audit packages with official transmittal memo, controls worksheets, crosswalk matrix, and evidence chain of custody.
            </p>
          </div>

          <button
            onClick={() => setManifestModalOpen(true)}
            className="btn btn-secondary text-xs flex items-center gap-1.5 shrink-0"
          >
            <Eye className="w-3.5 h-3.5" />
            Inspect Package Manifest
          </button>
        </div>

        {/* 4 Quick Dossier Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Bundle 1: ALL */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-indigo-500/30 flex flex-col justify-between hover:border-indigo-500/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold">
                  ALL 5 REGULATORS
                </span>
                <span className="text-[10px] text-slate-400 font-mono">7 Files • ~120 KB</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">Full Comprehensive GRC Dossier</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Universal regulatory filing covering NIST CSF 2.0, ISO 27001, RBI, DPDP Act 2023 & PCI DSS 4.0.1.
              </p>
            </div>
            <button
              onClick={() => window.open(reportsApi.dossierDownloadUrl('ALL'), '_blank')}
              className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download Dossier (.zip)
            </button>
          </div>

          {/* Bundle 2: RBI */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-emerald-500/30 flex flex-col justify-between hover:border-emerald-500/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-semibold">
                  RBI CIRCULAR 418
                </span>
                <span className="text-[10px] text-slate-400 font-mono">7 Files • ~115 KB</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">RBI IT Supervisory Package</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Formal evidence binder for RBI Annual Supervisory Examination covering core banking MFA and SIEM logs.
              </p>
            </div>
            <button
              onClick={() => window.open(reportsApi.dossierDownloadUrl('RBI'), '_blank')}
              className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download RBI (.zip)
            </button>
          </div>

          {/* Bundle 3: DPBI */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-amber-500/30 flex flex-col justify-between hover:border-amber-500/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                  DPDP ACT SEC 8(5)
                </span>
                <span className="text-[10px] text-slate-400 font-mono">7 Files • ~110 KB</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">DPDP Act Safeguards Dossier</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Statutory evidence demonstrating personal data encryption and vendor processor safeguards (§33 protection).
              </p>
            </div>
            <button
              onClick={() => window.open(reportsApi.dossierDownloadUrl('DPBI'), '_blank')}
              className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download DPDP (.zip)
            </button>
          </div>

          {/* Bundle 4: PCI_SSC */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-purple-500/30 flex flex-col justify-between hover:border-purple-500/60 transition-all">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 font-semibold">
                  PCI DSS v4.0.1
                </span>
                <span className="text-[10px] text-slate-400 font-mono">7 Files • ~110 KB</span>
              </div>
              <h4 className="text-xs font-bold text-slate-100">PCI-DSS SAQ-D Attestation</h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Cardholder Data Environment (CDE) evidence binder for QSA on-site review & merchant acquiring defense.
              </p>
            </div>
            <button
              onClick={() => window.open(reportsApi.dossierDownloadUrl('PCI_SSC'), '_blank')}
              className="mt-3.5 w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              Download PCI (.zip)
            </button>
          </div>
        </div>
      </div>

      {/* Manifest & Hashes Inspection Modal */}
      {manifestModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in">
          <div className="card w-full max-w-2xl border-slate-700 bg-slate-900 shadow-2xl p-6 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FolderArchive className="w-5 h-5 text-indigo-400" />
                <div>
                  <h3 className="text-base font-semibold text-slate-100">Regulatory Dossier Manifest & SHA-256 Hashes</h3>
                  <p className="text-xs text-slate-400">Cryptographically sealed audit evidence package • DOS-2026-APEX-001</p>
                </div>
              </div>
              <button
                onClick={() => setManifestModalOpen(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {/* Signatories & Notice */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Entity Signatory:</span>
                  <p className="font-semibold text-slate-200">Vikram Malhotra</p>
                  <p className="text-slate-400 text-[11px]">Chief Information Security Officer, Apex Financial Services</p>
                </div>
                <div>
                  <span className="text-slate-500 font-mono text-[10px] uppercase">Independent Lead Auditor:</span>
                  <p className="font-semibold text-slate-200">Dr. Ananya Roy, Ph.D, CISA, CISSP</p>
                  <p className="text-slate-400 text-[11px]">Lead Cybersecurity Assessor, RiskLens Advisory</p>
                </div>
              </div>

              {/* File Table */}
              <div className="overflow-x-auto rounded-lg border border-slate-800">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-950/80">
                      <th className="table-header py-2 text-left">Artifact Name</th>
                      <th className="table-header py-2 text-left w-20">Format</th>
                      <th className="table-header py-2 text-left">Audit Contents & Integrity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dossierSummary?.dossier_contents.map(file => (
                      <tr key={file.filename} className="border-b border-slate-800/60 hover:bg-slate-800/40">
                        <td className="table-cell py-2.5 font-mono text-cyan-400 font-medium">
                          {file.filename}
                        </td>
                        <td className="table-cell py-2.5">
                          <span className="badge badge-neutral text-[10px] font-mono uppercase">{file.type}</span>
                        </td>
                        <td className="table-cell py-2.5 text-slate-300">
                          <div>{file.description}</div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">Verified SHA-256 Non-Repudiation Checksum</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Actions */}
              <div className="pt-2 flex items-center justify-between border-t border-slate-800">
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NIST FIPS 180-4 SHA-256 sealed ZIP archive</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setManifestModalOpen(false)}
                    className="btn btn-secondary text-xs"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      window.open(reportsApi.dossierDownloadUrl('ALL'), '_blank')
                      setManifestModalOpen(false)
                    }}
                    className="btn btn-primary text-xs flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download Full Dossier (.zip)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}


      {/* Printable Consulting Document Container */}
      <div className="card p-8 sm:p-12 bg-navy-900/90 border-slate-700/80 shadow-2xl max-w-5xl mx-auto space-y-10 print:bg-white print:text-black print:border-none print:shadow-none print:p-0">

        {/* Cover / Title Header */}
        <div className="border-b border-slate-700/80 pb-8 print:border-black">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black tracking-widest uppercase px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 print:border-black print:text-black">
                CONFIDENTIAL • CLIENT ENGAGEMENT DELIVERABLE
              </span>
            </div>
            <span className="text-xs text-slate-400 print:text-gray-600 font-mono">
              Date: {report_metadata.date}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight print:text-black">
            {report_metadata.title}
          </h1>
          <p className="text-lg text-slate-300 font-medium mt-1 print:text-gray-800">
            Prepared for: <strong className="text-white print:text-black">{report_metadata.client}</strong>
          </p>
          <p className="text-xs text-slate-400 mt-2 print:text-gray-600">
            Platform & Engine: {report_metadata.prepared_by}
          </p>

          {/* Mandatory synthetic notice */}
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs print:border-gray-400 print:text-gray-800">
            <strong>⚠️ Engagement Notice:</strong> {report_metadata.disclaimer}
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-gray-300">
            <span className="text-xs font-bold font-mono text-blue-400 print:text-black">01</span>
            <h2 className="text-xl font-bold text-white print:text-black">Executive Summary</h2>
          </div>
          <p className="text-sm text-slate-300 leading-relaxed print:text-gray-800">
            Apex Financial Services engaged our cybersecurity consulting practice to perform a
            comprehensive security risk and controls assessment across its core banking applications,
            payment processing conduits, AWS cloud infrastructure, and third-party vendor ecosystem.
            The primary objectives were to evaluate current technical controls against modern threat
            vectors, identify architectural gaps, map maturity against NIST CSF 2.0 and ISO/IEC 27001:2022,
            and deliver a risk-prioritised remediation roadmap.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-4 rounded-xl bg-navy-800 border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
              <span className="text-xs text-slate-400 uppercase font-semibold print:text-gray-600">
                Total Assessed Risks
              </span>
              <div className="text-2xl font-black text-white mt-1 print:text-black">
                {executive_summary.total_risks}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-navy-800 border border-red-500/30 print:border-gray-300 print:bg-gray-50">
              <span className="text-xs text-red-400 uppercase font-semibold print:text-gray-600">
                Critical / High Residual
              </span>
              <div className="text-2xl font-black text-red-400 mt-1 print:text-black">
                {executive_summary.critical_risks + executive_summary.high_risks}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-navy-800 border border-amber-500/30 print:border-gray-300 print:bg-gray-50">
              <span className="text-xs text-amber-400 uppercase font-semibold print:text-gray-600">
                Ineffective Controls
              </span>
              <div className="text-2xl font-black text-amber-400 mt-1 print:text-black">
                {executive_summary.open_control_gaps}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-navy-800 border border-slate-700/60 print:border-gray-300 print:bg-gray-50">
              <span className="text-xs text-slate-400 uppercase font-semibold print:text-gray-600">
                Overdue Remediation
              </span>
              <div className="text-2xl font-black text-white mt-1 print:text-black">
                {executive_summary.overdue_items}
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: Scope and Assumptions */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-gray-300">
            <span className="text-xs font-bold font-mono text-blue-400 print:text-black">02</span>
            <h2 className="text-xl font-bold text-white print:text-black">Scope & Assessment Assumptions</h2>
          </div>
          <ul className="space-y-2 text-sm text-slate-300 print:text-gray-800 list-disc list-inside">
            {scope_and_assumptions.map((item: string, idx: number) => (
              <li key={idx} className="leading-relaxed">
                {item}
              </li>
            ))}
          </ul>
        </section>

        {/* Section 3: Methodology & Scoring Criteria */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-gray-300">
            <span className="text-xs font-bold font-mono text-blue-400 print:text-black">03</span>
            <h2 className="text-xl font-bold text-white print:text-black">Methodology & Scoring Criteria</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300 print:text-gray-800">
            <div className="p-4 rounded-xl bg-navy-800/80 border border-slate-700/60 print:border-gray-300 print:bg-gray-50 space-y-2">
              <strong className="text-sm text-white print:text-black block">
                5 × 5 Quantitative Matrix
              </strong>
              <p>Model: {methodology.scoring_model}</p>
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <span className="text-emerald-400">Low: 1–4</span>
                <span className="text-amber-400">Medium: 5–9</span>
                <span className="text-orange-400">High: 10–14</span>
                <span className="text-red-400">Critical: 15–25</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-navy-800/80 border border-slate-700/60 print:border-gray-300 print:bg-gray-50 space-y-2">
              <strong className="text-sm text-white print:text-black block">
                Mitigation & Residual Formula
              </strong>
              <p>Formula: <code className="text-blue-300 font-mono">{methodology.residual_formula}</code></p>
              <p>
                Framework Alignments: NIST CSF 2.0 (Govern, Identify, Protect, Detect, Respond, Recover)
                and ISO/IEC 27001:2022 Annex A controls.
              </p>
            </div>
          </div>
        </section>

        {/* Section 4: Key Risks & Control Gaps */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-gray-300">
            <span className="text-xs font-bold font-mono text-blue-400 print:text-black">04</span>
            <h2 className="text-xl font-bold text-white print:text-black">Key Residual Risks (Top 10)</h2>
          </div>
          <div className="overflow-x-auto border border-slate-700/60 rounded-xl print:border-gray-300">
            <table className="w-full text-xs text-left">
              <thead className="bg-navy-800/80 border-b border-slate-700 text-slate-400 print:bg-gray-100 print:text-black">
                <tr>
                  <th className="p-2.5">Risk ID</th>
                  <th className="p-2.5">Title & Category</th>
                  <th className="p-2.5 text-center">Inherent</th>
                  <th className="p-2.5 text-center">Residual</th>
                  <th className="p-2.5">Treatment</th>
                  <th className="p-2.5">Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 print:divide-gray-200">
                {top_risks.map((r: any) => (
                  <tr key={r.risk_id} className="hover:bg-navy-800/40 print:text-black">
                    <td className="p-2.5 font-mono font-bold text-blue-400 print:text-black">
                      {r.risk_id}
                    </td>
                    <td className="p-2.5">
                      <div className="font-semibold text-slate-200 print:text-black">{r.title}</div>
                      <div className="text-[10px] text-slate-400 print:text-gray-600">{r.category}</div>
                    </td>
                    <td className="p-2.5 text-center font-bold">
                      {r.inherent_score} ({r.inherent_band})
                    </td>
                    <td className="p-2.5 text-center font-bold text-emerald-400 print:text-black">
                      {r.residual_score} ({r.residual_band})
                    </td>
                    <td className="p-2.5">{r.treatment}</td>
                    <td className="p-2.5 text-slate-400 print:text-gray-700">{r.owner}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Section 5: Critical Control Deficiencies */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-gray-300">
            <span className="text-xs font-bold font-mono text-blue-400 print:text-black">05</span>
            <h2 className="text-xl font-bold text-white print:text-black">Critical Control Deficiencies</h2>
          </div>
          <div className="space-y-3">
            {critical_control_gaps.map((gap: any) => (
              <div
                key={gap.control_id}
                className="p-3.5 rounded-xl bg-navy-800/70 border border-red-500/20 text-xs space-y-1.5 print:border-gray-300 print:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-red-400 print:text-black">
                    {gap.control_id}
                  </span>
                  <span className="text-slate-400 print:text-gray-600">Owner: {gap.owner}</span>
                </div>
                <div className="font-semibold text-slate-200 print:text-black">
                  {gap.objective}
                </div>
                <div className="text-amber-300 print:text-red-700">
                  <strong>Deficiency:</strong> {gap.gap}
                </div>
                <div className="text-blue-300 print:text-blue-800">
                  <strong>Remediation:</strong> {gap.recommendation}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 6: Remediation Roadmap (0-30, 31-60, 61-90 Days) */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-2 print:border-gray-300">
            <span className="text-xs font-bold font-mono text-blue-400 print:text-black">06</span>
            <h2 className="text-xl font-bold text-white print:text-black">
              Phased Remediation Roadmap
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 0-30 Days */}
            <div className="p-4 rounded-xl bg-navy-800/90 border border-red-500/30 print:border-gray-300 print:bg-gray-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-3">
                  <span className="font-bold text-red-400 uppercase text-xs">Days 0–30</span>
                  <span className="text-[10px] text-slate-400">Immediate Triage</span>
                </div>
                <div className="space-y-2.5">
                  {(remediation_roadmap['0-30 Days'] || []).map((item: any) => (
                    <div key={item.finding_id} className="text-xs">
                      <div className="font-mono font-bold text-blue-400">{item.finding_id}</div>
                      <div className="font-semibold text-slate-200 line-clamp-2 mt-0.5">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">Owner: {item.owner}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 31-60 Days */}
            <div className="p-4 rounded-xl bg-navy-800/90 border border-amber-500/30 print:border-gray-300 print:bg-gray-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-3">
                  <span className="font-bold text-amber-400 uppercase text-xs">Days 31–60</span>
                  <span className="text-[10px] text-slate-400">Systemic Controls</span>
                </div>
                <div className="space-y-2.5">
                  {(remediation_roadmap['31-60 Days'] || []).map((item: any) => (
                    <div key={item.finding_id} className="text-xs">
                      <div className="font-mono font-bold text-blue-400">{item.finding_id}</div>
                      <div className="font-semibold text-slate-200 line-clamp-2 mt-0.5">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">Owner: {item.owner}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 61-90 Days */}
            <div className="p-4 rounded-xl bg-navy-800/90 border border-blue-500/30 print:border-gray-300 print:bg-gray-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-3">
                  <span className="font-bold text-blue-400 uppercase text-xs">Days 61–90</span>
                  <span className="text-[10px] text-slate-400">Governance & Audit</span>
                </div>
                <div className="space-y-2.5">
                  {(remediation_roadmap['61-90 Days'] || []).map((item: any) => (
                    <div key={item.finding_id} className="text-xs">
                      <div className="font-mono font-bold text-blue-400">{item.finding_id}</div>
                      <div className="font-semibold text-slate-200 line-clamp-2 mt-0.5">
                        {item.title}
                      </div>
                      <div className="text-[10px] text-slate-400">Owner: {item.owner}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 7: Limitations & Next Steps */}
        <section className="space-y-4 pt-4 border-t border-slate-800 print:border-gray-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 print:text-gray-800">
            <div>
              <h3 className="text-sm font-bold text-white print:text-black mb-2">
                Assessment Limitations
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400 print:text-gray-700">
                {limitations.map((lim: string, idx: number) => (
                  <li key={idx}>{lim}</li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-white print:text-black mb-2">
                Immediate Next Steps
              </h3>
              <ul className="space-y-1.5 list-disc list-inside text-slate-400 print:text-gray-700">
                {next_steps.map((stp: string, idx: number) => (
                  <li key={idx}>{stp}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
