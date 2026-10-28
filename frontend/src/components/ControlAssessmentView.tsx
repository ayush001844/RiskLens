import React, { useState, useMemo } from 'react'
import {
  CheckSquare,
  Search,
  Download,
  AlertTriangle,
  Info,
  Shield,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Control } from '../types'
import { ControlModal } from './ControlModal'
import { getEffectivenessClass, formatDate } from '../utils'
import { downloadCsv } from '../api/client'

interface ControlAssessmentViewProps {
  controls: Control[]
  onRefresh: () => void
  onUpdateControl: (controlId: string, data: Partial<Control>) => Promise<void>
}

export const ControlAssessmentView: React.FC<ControlAssessmentViewProps> = ({
  controls,
  onRefresh,
  onUpdateControl,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [effectivenessFilter, setEffectivenessFilter] = useState('ALL')
  const [evidenceFilter, setEvidenceFilter] = useState('ALL')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingControl, setEditingControl] = useState<Control | null>(null)

  // Categories
  const categories = useMemo(() => {
    const set = new Set(controls.map((c) => c.nist_csf_category).filter(Boolean))
    return Array.from(set).sort()
  }, [controls])

  // Stats
  const effectiveCount = controls.filter((c) => c.effectiveness === 'Effective').length
  const partialCount = controls.filter((c) => c.effectiveness === 'Partially Effective').length
  const ineffectiveCount = controls.filter((c) => c.effectiveness === 'Ineffective').length
  const gapsCount = controls.filter((c) => Boolean(c.identified_gap)).length

  // Filtered
  const filteredControls = useMemo(() => {
    return controls.filter((c) => {
      const matchesSearch =
        !searchTerm ||
        c.control_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.framework_reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.control_objective.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.control_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.identified_gap && c.identified_gap.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCat = categoryFilter === 'ALL' || c.nist_csf_category === categoryFilter
      const matchesEff = effectivenessFilter === 'ALL' || c.effectiveness === effectivenessFilter
      const matchesEv = evidenceFilter === 'ALL' || c.evidence_status === evidenceFilter

      return matchesSearch && matchesCat && matchesEff && matchesEv
    })
  }, [controls, searchTerm, categoryFilter, effectivenessFilter, evidenceFilter])

  const handleSave = async (data: Partial<Control>) => {
    if (editingControl) {
      await onUpdateControl(editingControl.control_id, data)
      onRefresh()
    }
  }

  const getEvidenceBadge = (status: string) => {
    switch (status) {
      case 'Provided':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'Pending':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'Missing':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'Expired':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
      default:
        return 'bg-slate-700 text-slate-300'
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* Disclaimer Alert */}
      <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-white block font-semibold">
            Framework Alignment Simulation (NIST CSF 2.0 & ISO/IEC 27001:2022)
          </strong>
          <p className="text-slate-300 leading-relaxed">
            All controls are mapped conceptually to NIST Cybersecurity Framework 2.0 functions (Govern, Identify, Protect, Detect, Respond, Recover) and ISO/IEC 27001:2022 Annex A controls. This mapping is simulated for consulting demonstration only; <strong>Apex Financial Services is not formally certified or attested</strong>.
          </p>
        </div>
      </div>

      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Control Assessment</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              {filteredControls.length} of {controls.length} Controls
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Verification of technical and organizational security controls against audit evidence and operational benchmarks.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv('controls')}
            className="btn btn-secondary text-xs"
            title="Download CSV export of all evaluated controls"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Effective Controls</span>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            {effectiveCount}{' '}
            <span className="text-xs font-normal text-slate-400">
              ({Math.round((effectiveCount / (controls.length || 1)) * 100)}%)
            </span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Partially Effective</span>
          <div className="text-xl font-black text-amber-400 mt-0.5">{partialCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Ineffective</span>
          <div className="text-xl font-black text-red-400 mt-0.5">{ineffectiveCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Identified Gaps</span>
          <div className="text-xl font-black text-white mt-0.5">{gapsCount} Deficiencies</div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search controls, refs, objectives, owners..."
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
              <option value="ALL">All Framework Categories</option>
              {categories.map((c: any) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Effectiveness Filter */}
          <div>
            <select
              value={effectivenessFilter}
              onChange={(e) => setEffectivenessFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Effectiveness Ratings</option>
              <option value="Effective">Effective</option>
              <option value="Partially Effective">Partially Effective</option>
              <option value="Ineffective">Ineffective</option>
              <option value="Not Tested">Not Tested</option>
            </select>
          </div>

          {/* Evidence Filter */}
          <div>
            <select
              value={evidenceFilter}
              onChange={(e) => setEvidenceFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Evidence Statuses</option>
              <option value="Provided">Provided</option>
              <option value="Pending">Pending</option>
              <option value="Missing">Missing</option>
              <option value="Expired">Expired</option>
            </select>
          </div>
        </div>
      </div>

      {/* Controls Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Control ID</th>
                <th>Framework References</th>
                <th>Objective & Owner</th>
                <th>Evidence Status</th>
                <th>Effectiveness</th>
                <th>Identified Gap</th>
                <th>Review Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredControls.map((ctl) => {
                const isExpanded = expandedId === ctl.control_id

                return (
                  <React.Fragment key={ctl.control_id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : ctl.control_id)}
                      className={`group ${isExpanded ? 'bg-navy-700/60' : ''}`}
                    >
                      <td className="text-center text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-blue-400 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 group-hover:text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="font-mono font-bold text-emerald-400 text-xs">
                        {ctl.control_id}
                      </td>

                      <td className="text-xs max-w-xs">
                        <div className="font-semibold text-slate-200">
                          {ctl.framework_reference}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">
                          {ctl.nist_csf_category}
                        </div>
                      </td>

                      <td className="text-xs max-w-xs">
                        <div className="text-slate-300 line-clamp-1">{ctl.control_objective}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Owner: <span className="text-slate-300">{ctl.control_owner}</span>
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getEvidenceBadge(
                            ctl.evidence_status
                          )}`}
                        >
                          {ctl.evidence_status}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getEffectivenessClass(
                            ctl.effectiveness
                          )}`}
                        >
                          {ctl.effectiveness}
                        </span>
                      </td>

                      <td className="text-xs max-w-[200px]">
                        {ctl.identified_gap ? (
                          <span className="text-amber-300 line-clamp-1">
                            {ctl.identified_gap}
                          </span>
                        ) : (
                          <span className="text-emerald-400 text-[11px]">No open deficiency</span>
                        )}
                      </td>

                      <td className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(ctl.review_date)}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingControl(ctl)
                          }}
                          className="btn btn-secondary text-xs px-2.5 py-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Assess</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded details */}
                    {isExpanded && (
                      <tr className="bg-navy-900/90 border-b border-slate-700">
                        <td colSpan={9} className="p-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Inspected Audit Evidence
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {ctl.evidence_description || 'No evidence documentation recorded.'}
                              </p>
                            </div>

                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Assessment Finding
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {ctl.assessment_result || 'Pending consultant assessment.'}
                              </p>
                            </div>

                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Corrective Recommendation
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {ctl.recommendation || 'Maintain current control operation.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                            <span>ISO 27001 Annex A: {ctl.iso_27001_annex || 'Not mapped'}</span>
                            <span>Assigned Control Custodian: {ctl.control_owner}</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assess Modal */}
      <ControlModal
        isOpen={Boolean(editingControl)}
        onClose={() => setEditingControl(null)}
        onSave={handleSave}
        initialData={editingControl}
      />
    </div>
  )
}
