import React, { useState, useMemo } from 'react'
import {
  Building2,
  Search,
  Download,
  AlertTriangle,
  Lock,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { Vendor } from '../types'
import { VendorModal } from './VendorModal'
import { getBand, getBadgeClass, formatDate } from '../utils'
import { downloadCsv } from '../api/client'

interface VendorRiskViewProps {
  vendors: Vendor[]
  onRefresh: () => void
  onUpdateVendor: (id: string, data: Partial<Vendor>) => Promise<void>
}

export const VendorRiskView: React.FC<VendorRiskViewProps> = ({
  vendors,
  onRefresh,
  onUpdateVendor,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [criticalityFilter, setCriticalityFilter] = useState('ALL')
  const [sensitivityFilter, setSensitivityFilter] = useState('ALL')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null)

  // Stats
  const criticalCount = vendors.filter((v) => v.criticality === 'Critical').length
  const restrictedDataCount = vendors.filter(
    (v) => v.data_sensitivity === 'Restricted' || v.data_sensitivity === 'Confidential'
  ).length

  // Filtered
  const filteredVendors = useMemo(() => {
    return vendors.filter((v) => {
      const matchesSearch =
        !searchTerm ||
        v.vendor_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.service_category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (v.access_privileges && v.access_privileges.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesCrit = criticalityFilter === 'ALL' || v.criticality === criticalityFilter
      const matchesSens = sensitivityFilter === 'ALL' || v.data_sensitivity === sensitivityFilter

      return matchesSearch && matchesCrit && matchesSens
    })
  }, [vendors, searchTerm, criticalityFilter, sensitivityFilter])

  const handleSave = async (data: Partial<Vendor>) => {
    if (editingVendor) {
      await onUpdateVendor(editingVendor.vendor_id, data)
      onRefresh()
    }
  }

  const getSensitivityBadge = (s: string) => {
    switch (s) {
      case 'Restricted':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30'
      case 'Confidential':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30'
      case 'Internal':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30'
      case 'Public':
      default:
        return 'bg-slate-700 text-slate-300'
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Third-Party Vendor Risk</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {filteredVendors.length} of {vendors.length} Synthetic Vendors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Third-party cyber supply chain risk management (SCRM) simulating cloud hosting, payment gateways, and data subprocessors.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv('vendors')}
            className="btn btn-secondary text-xs"
            title="Download CSV export of all third-party vendors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Assessed Vendors</span>
          <div className="text-xl font-black text-white mt-0.5">{vendors.length} Entities</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-red-500/30">
          <span className="text-[11px] font-semibold text-red-300 uppercase">Critical Tier</span>
          <div className="text-xl font-black text-red-400 mt-0.5">
            {criticalCount}{' '}
            <span className="text-xs font-normal text-slate-400">Tier 1</span>
          </div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-purple-500/30">
          <span className="text-[11px] font-semibold text-purple-300 uppercase">Handles PII / Fin Data</span>
          <div className="text-xl font-black text-purple-400 mt-0.5">{restrictedDataCount} Vendors</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Average Residual Risk</span>
          <div className="text-xl font-black text-emerald-400 mt-0.5">
            {Math.round(
              (vendors.reduce((acc, v) => acc + v.residual_risk_score, 0) / (vendors.length || 1)) * 10
            ) / 10}
            <span className="text-xs font-normal text-slate-400"> / 25</span>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search vendors, categories, privileges..."
              className="form-input pl-9 text-xs"
            />
          </div>

          {/* Criticality */}
          <div>
            <select
              value={criticalityFilter}
              onChange={(e) => setCriticalityFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Vendor Criticalities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Data Sensitivity */}
          <div>
            <select
              value={sensitivityFilter}
              onChange={(e) => setSensitivityFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Data Sensitivity Levels</option>
              <option value="Restricted">Restricted (Card / Core Data)</option>
              <option value="Confidential">Confidential (Customer PII)</option>
              <option value="Internal">Internal Operational</option>
              <option value="Public">Public</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>ID</th>
                <th>Vendor Name & Category</th>
                <th>Criticality</th>
                <th>Data Sensitivity</th>
                <th>Access Privileges</th>
                <th className="text-center">Inherent Risk</th>
                <th className="text-center">Residual Risk</th>
                <th>Next Review</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredVendors.map((vnd) => {
                const isExpanded = expandedId === vnd.vendor_id
                const inhBand = getBand(vnd.inherent_risk_score)
                const resBand = getBand(vnd.residual_risk_score)

                return (
                  <React.Fragment key={vnd.vendor_id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : vnd.vendor_id)}
                      className={`group ${isExpanded ? 'bg-navy-700/60' : ''}`}
                    >
                      <td className="text-center text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-blue-400 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 group-hover:text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="font-mono font-bold text-indigo-400 text-xs">
                        {vnd.vendor_id}
                      </td>

                      <td className="text-xs max-w-xs">
                        <div className="font-semibold text-slate-200">{vnd.name}</div>
                        <div className="text-[11px] text-slate-400 truncate">
                          {vnd.service_category}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeClass(
                            vnd.criticality
                          )}`}
                        >
                          {vnd.criticality}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getSensitivityBadge(
                            vnd.data_sensitivity
                          )}`}
                        >
                          {vnd.data_sensitivity}
                        </span>
                      </td>

                      <td className="text-xs text-slate-300 max-w-[200px] truncate" title={vnd.access_privileges}>
                        {vnd.access_privileges}
                      </td>

                      <td className="text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getBadgeClass(
                            inhBand
                          )}`}
                        >
                          <span>{vnd.inherent_risk_score}</span>
                          <span className="text-[10px] uppercase font-normal">{inhBand}</span>
                        </span>
                      </td>

                      <td className="text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold border ${getBadgeClass(
                            resBand
                          )}`}
                        >
                          <span>{vnd.residual_risk_score}</span>
                          <span className="text-[10px] uppercase font-normal">{resBand}</span>
                        </span>
                      </td>

                      <td className="text-xs text-slate-400 whitespace-nowrap">
                        {formatDate(vnd.contract_review_date)}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingVendor(vnd)
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
                        <td colSpan={10} className="p-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-amber-400 uppercase tracking-wider block mb-1">
                                Identified Control Weaknesses
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {vnd.control_weaknesses || 'No specific control weaknesses noted.'}
                              </p>
                            </div>

                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-blue-400 uppercase tracking-wider block mb-1">
                                Recommended Third-Party Risk Actions
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {vnd.recommended_actions || 'Maintain standard vendor oversight schedule.'}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                            <span>Relationship Contact: {vnd.contact_name || 'Procurement Office'}</span>
                            <span>Last Assessed: {formatDate(vnd.assessment_date)}</span>
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

      {/* Modal */}
      <VendorModal
        isOpen={Boolean(editingVendor)}
        onClose={() => setEditingVendor(null)}
        onSave={handleSave}
        initialData={editingVendor}
      />
    </div>
  )
}
