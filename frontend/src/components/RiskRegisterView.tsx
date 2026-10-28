import React, { useState, useMemo } from 'react'
import {
  ShieldAlert,
  Search,
  Plus,
  Download,
  Filter,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  HelpCircle,
} from 'lucide-react'
import type { Risk } from '../types'
import { RiskModal } from './RiskModal'
import {
  getBand,
  getBadgeClass,
  getStatusClass,
  formatDate,
  LIKELIHOOD_LABELS,
  IMPACT_LABELS,
} from '../utils'
import { downloadCsv } from '../api/client'

interface RiskRegisterViewProps {
  risks: Risk[]
  onRefresh: () => void
  onSaveRisk: (data: Partial<Risk>) => Promise<void>
  onDeleteRisk: (riskId: string) => Promise<void>
}

export const RiskRegisterView: React.FC<RiskRegisterViewProps> = ({
  risks,
  onRefresh,
  onSaveRisk,
  onDeleteRisk,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [bandFilter, setBandFilter] = useState('ALL')
  const [sortBy, setSortBy] = useState<'score_desc' | 'score_asc' | 'id' | 'title'>('score_desc')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRisk, setEditingRisk] = useState<Risk | null>(null)
  const [showScoringGuide, setShowScoringGuide] = useState(false)

  // Extract unique categories
  const categories = useMemo(() => {
    const set = new Set(risks.map((r) => r.category))
    return Array.from(set).sort()
  }, [risks])

  // Filter & sort
  const filteredRisks = useMemo(() => {
    return risks
      .filter((r) => {
        const matchesSearch =
          !searchTerm ||
          r.risk_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.affected_asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
          r.risk_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (r.threat && r.threat.toLowerCase().includes(searchTerm.toLowerCase()))

        const matchesCat = categoryFilter === 'ALL' || r.category === categoryFilter
        const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter

        const band = r.inherent_band || getBand(r.inherent_risk_score)
        const matchesBand = bandFilter === 'ALL' || band === bandFilter

        return matchesSearch && matchesCat && matchesStatus && matchesBand
      })
      .sort((a, b) => {
        if (sortBy === 'score_desc') return b.inherent_risk_score - a.inherent_risk_score
        if (sortBy === 'score_asc') return a.inherent_risk_score - b.inherent_risk_score
        if (sortBy === 'id') return a.risk_id.localeCompare(b.risk_id)
        if (sortBy === 'title') return a.title.localeCompare(b.title)
        return 0
      })
  }, [risks, searchTerm, categoryFilter, statusFilter, bandFilter, sortBy])

  const handleOpenAdd = () => {
    setEditingRisk(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (e: React.MouseEvent, risk: Risk) => {
    e.stopPropagation()
    setEditingRisk(risk)
    setIsModalOpen(true)
  }

  const handleDelete = async (e: React.MouseEvent, riskId: string) => {
    e.stopPropagation()
    if (confirm(`Are you sure you want to delete synthetic risk ${riskId}?`)) {
      await onDeleteRisk(riskId)
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Enterprise Risk Register</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredRisks.length} of {risks.length} Scenarios
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Quantitative threat & vulnerability assessments with 5×5 scoring, mitigation tracking, and residual impact calculations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowScoringGuide(!showScoringGuide)}
            className="btn btn-secondary text-xs"
            title="Toggle Scoring Methodology Guide"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Scoring Methodology</span>
          </button>
          <button
            onClick={() => downloadCsv('risks')}
            className="btn btn-secondary text-xs"
            title="Download CSV export of all risk scenarios"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
          <button onClick={handleOpenAdd} className="btn btn-primary text-xs">
            <Plus className="w-4 h-4" />
            <span>Add Risk Scenario</span>
          </button>
        </div>
      </div>

      {/* Scoring Methodology Banner (Collapsible) */}
      {showScoringGuide && (
        <div className="p-4 rounded-xl bg-navy-800/90 border border-blue-500/30 text-xs space-y-3 animate-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-300 uppercase tracking-wider">
              Documented Scoring Methodology (Apex Financial Services Simulation)
            </span>
            <button
              onClick={() => setShowScoringGuide(false)}
              className="text-slate-400 hover:text-white"
            >
              ×
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-300">
            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-700">
              <strong className="text-white block mb-1">1. Inherent Risk Score</strong>
              <p className="text-slate-400">
                Formula: <code className="text-blue-300">Score = Likelihood (1–5) × Impact (1–5)</code>
              </p>
              <p className="text-slate-400 mt-1">
                Reflects unmitigated risk severity prior to control effectiveness.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-700">
              <strong className="text-white block mb-1">2. Severity Bands</strong>
              <div className="grid grid-cols-2 gap-1 text-[11px] mt-1">
                <span className="text-emerald-400 font-semibold">Low: 1–4</span>
                <span className="text-amber-400 font-semibold">Medium: 5–9</span>
                <span className="text-orange-400 font-semibold">High: 10–14</span>
                <span className="text-red-400 font-semibold">Critical: 15–25</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-700">
              <strong className="text-white block mb-1">3. Residual Risk Formula</strong>
              <p className="text-slate-400">
                Formula: <code className="text-emerald-300">Residual = Inherent × (1 − Control_Eff%)</code>
              </p>
              <p className="text-slate-400 mt-1">
                Minimum score is bounded at 1.0. Lower bands indicate effective mitigation.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by ID, title, asset, threat, owner..."
              className="form-input pl-9 text-xs"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Band Filter */}
          <div>
            <select
              value={bandFilter}
              onChange={(e) => setBandFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Severity Bands</option>
              <option value="Critical">Critical (15–25)</option>
              <option value="High">High (10–14)</option>
              <option value="Medium">Medium (5–9)</option>
              <option value="Low">Low (1–4)</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="form-select text-xs"
            >
              <option value="score_desc">Score: High → Low</option>
              <option value="score_asc">Score: Low → High</option>
              <option value="id">Risk ID</option>
              <option value="title">Risk Title</option>
            </select>
          </div>
        </div>

        {/* Active Filter Tags */}
        {(searchTerm || categoryFilter !== 'ALL' || statusFilter !== 'ALL' || bandFilter !== 'ALL') && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-700/60 text-xs">
            <span className="text-slate-400">Active Filters:</span>
            {searchTerm && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                "{searchTerm}"
              </span>
            )}
            {categoryFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                {categoryFilter}
              </span>
            )}
            {bandFilter !== 'ALL' && (
              <span className="px-2 py-0.5 rounded bg-slate-700 text-slate-300">
                Band: {bandFilter}
              </span>
            )}
            <button
              onClick={() => {
                setSearchTerm('')
                setCategoryFilter('ALL')
                setStatusFilter('ALL')
                setBandFilter('ALL')
              }}
              className="text-blue-400 hover:text-blue-300 underline ml-auto text-xs"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* Risks Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>ID</th>
                <th>Title & Asset</th>
                <th>Category</th>
                <th className="text-center">L × I</th>
                <th className="text-center">Inherent Risk</th>
                <th>Controls & Eff.%</th>
                <th className="text-center">Residual Risk</th>
                <th>Strategy & Owner</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredRisks.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="w-8 h-8 text-slate-500" />
                      <p className="text-sm font-semibold">No risk scenarios matched your criteria</p>
                      <p className="text-xs text-slate-500">
                        Try modifying your search or filter settings.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredRisks.map((risk) => {
                  const isExpanded = expandedId === risk.risk_id
                  const band = risk.inherent_band || getBand(risk.inherent_risk_score)
                  const resBand = risk.residual_band || getBand(risk.residual_risk_score)

                  return (
                    <React.Fragment key={risk.risk_id}>
                      <tr
                        onClick={() => setExpandedId(isExpanded ? null : risk.risk_id)}
                        className={`group ${isExpanded ? 'bg-navy-700/60' : ''}`}
                      >
                        {/* Expand toggle */}
                        <td className="text-center text-slate-500">
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-blue-400 mx-auto" />
                          ) : (
                            <ChevronDown className="w-4 h-4 group-hover:text-slate-300 mx-auto" />
                          )}
                        </td>

                        {/* ID */}
                        <td className="font-mono font-bold text-blue-400 text-xs">
                          {risk.risk_id}
                        </td>

                        {/* Title & Asset */}
                        <td className="max-w-xs">
                          <div className="font-semibold text-slate-100 text-xs group-hover:text-blue-300 transition-colors">
                            {risk.title}
                          </div>
                          <div className="text-[11px] text-slate-400 truncate">
                            Asset: <span className="text-slate-300">{risk.affected_asset}</span>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="text-xs text-slate-300 whitespace-nowrap">
                          {risk.category}
                        </td>

                        {/* L x I */}
                        <td className="text-center font-mono text-xs text-slate-400 whitespace-nowrap">
                          {risk.likelihood} × {risk.impact}
                        </td>

                        {/* Inherent Score & Band */}
                        <td className="text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getBadgeClass(
                              band
                            )}`}
                          >
                            <span>{risk.inherent_risk_score}</span>
                            <span className="text-[10px] uppercase font-normal">{band}</span>
                          </span>
                        </td>

                        {/* Existing Controls & Effectiveness */}
                        <td className="text-xs max-w-[180px]">
                          <div className="truncate text-slate-300" title={risk.existing_controls}>
                            {risk.existing_controls || 'No formal controls'}
                          </div>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <div className="w-16 bg-navy-900 rounded-full h-1.5 overflow-hidden">
                              <div
                                className="bg-emerald-500 h-full rounded-full"
                                style={{ width: `${risk.control_effectiveness_pct}%` }}
                              ></div>
                            </div>
                            <span className="text-[10px] text-emerald-400 font-mono">
                              {risk.control_effectiveness_pct}%
                            </span>
                          </div>
                        </td>

                        {/* Residual Score & Band */}
                        <td className="text-center whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getBadgeClass(
                              resBand
                            )}`}
                          >
                            <span>{risk.residual_risk_score}</span>
                            <span className="text-[10px] uppercase font-normal">{resBand}</span>
                          </span>
                        </td>

                        {/* Treatment & Owner */}
                        <td className="text-xs whitespace-nowrap">
                          <div className="font-medium text-slate-200">{risk.treatment_strategy}</div>
                          <div className="text-[11px] text-slate-400">{risk.risk_owner}</div>
                        </td>

                        {/* Status */}
                        <td className="whitespace-nowrap">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusClass(
                              risk.status
                            )}`}
                          >
                            {risk.status}
                          </span>
                        </td>

                        {/* Action buttons */}
                        <td className="text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={(e) => handleOpenEdit(e, risk)}
                              className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                              title="Edit risk scenario"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => handleDelete(e, risk.risk_id)}
                              className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400"
                              title="Delete risk"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr className="bg-navy-900/90 border-b border-slate-700">
                          <td colSpan={11} className="p-4 text-xs">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Threat Scenario
                                </span>
                                <p className="text-slate-200 leading-relaxed">
                                  {risk.threat || 'No threat description specified.'}
                                </p>
                              </div>

                              <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Underlying Vulnerability
                                </span>
                                <p className="text-slate-200 leading-relaxed">
                                  {risk.vulnerability || 'No vulnerability recorded.'}
                                </p>
                              </div>

                              <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                                <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                  Business & Regulatory Impact
                                </span>
                                <p className="text-slate-200 leading-relaxed">
                                  {risk.business_impact || 'No impact statement defined.'}
                                </p>
                              </div>
                            </div>

                            {risk.notes && (
                              <div className="mt-3 p-2.5 rounded-lg bg-navy-800/50 border border-slate-700/50 text-slate-400">
                                <strong className="text-slate-300">Consultant Notes:</strong> {risk.notes}
                              </div>
                            )}

                            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                              <span>Next Scheduled Review: {formatDate(risk.review_date)}</span>
                              <span>Quantitative Score: L{risk.likelihood} × I{risk.impact} = {risk.inherent_risk_score} (Mitigated to {risk.residual_risk_score})</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <RiskModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRisk}
        initialData={editingRisk}
      />
    </div>
  )
}
