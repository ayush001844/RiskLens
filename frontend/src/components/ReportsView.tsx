import React, { useState, useEffect } from 'react'
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
} from 'lucide-react'
import { getFullReport, downloadCsv } from '../api/client'
import { getBadgeClass } from '../utils'

export const ReportsView: React.FC = () => {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getFullReport()
      .then((data) => setReport(data))
      .catch((err) => console.error('Error fetching full report:', err))
      .finally(() => setLoading(false))
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
            onClick={() => window.print()}
            className="btn btn-primary text-xs shadow-lg shadow-blue-500/20"
          >
            <Printer className="w-4 h-4" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

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
