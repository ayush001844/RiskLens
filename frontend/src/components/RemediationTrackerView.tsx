import React, { useState, useMemo } from 'react'
import {
  Wrench,
  Search,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  Edit2,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import type { RemediationItem } from '../types'
import { RemediationModal } from './RemediationModal'
import { getStatusClass, formatDate, isOverdue } from '../utils'
import { downloadCsv } from '../api/client'

interface RemediationTrackerViewProps {
  items: RemediationItem[]
  onRefresh: () => void
  onUpdateItem: (id: string, data: Partial<RemediationItem>) => Promise<void>
}

export const RemediationTrackerView: React.FC<RemediationTrackerViewProps> = ({
  items,
  onRefresh,
  onUpdateItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [ownerFilter, setOwnerFilter] = useState('ALL')

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<RemediationItem | null>(null)

  // Owners list
  const owners = useMemo(() => {
    const set = new Set(items.map((i) => i.accountable_owner).filter(Boolean))
    return Array.from(set).sort()
  }, [items])

  // Counts
  const openCount = items.filter((i) => i.status === 'Open').length
  const inProgressCount = items.filter((i) => i.status === 'In Progress').length
  const completedCount = items.filter((i) => i.status === 'Completed').length
  const overdueCount = items.filter(
    (i) => i.status === 'Overdue' || (i.status !== 'Completed' && isOverdue(i.target_date))
  ).length

  // Filtered
  const filteredItems = useMemo(() => {
    return items.filter((i) => {
      const matchesSearch =
        !searchTerm ||
        i.finding_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.finding_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.recommendation.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.accountable_owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (i.linked_risk_id && i.linked_risk_id.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesSev = severityFilter === 'ALL' || i.severity === severityFilter
      const matchesStat = statusFilter === 'ALL' || i.status === statusFilter
      const matchesOwner = ownerFilter === 'ALL' || i.accountable_owner === ownerFilter

      return matchesSearch && matchesSev && matchesStat && matchesOwner
    })
  }, [items, searchTerm, severityFilter, statusFilter, ownerFilter])

  const handleSave = async (data: Partial<RemediationItem>) => {
    if (editingItem) {
      await onUpdateItem(editingItem.finding_id, data)
      onRefresh()
    }
  }

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'High':
        return 'bg-orange-500/20 text-orange-400 border-orange-500/30'
      case 'Medium':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'Low':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  }

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-tight">Remediation Tracker</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {filteredItems.length} of {items.length} Action Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Prioritised corrective action plans linked directly to identified risk scenarios and control deficiencies.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv('remediation')}
            className="btn btn-secondary text-xs"
            title="Download CSV export of all remediation action items"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Open Items</span>
          <div className="text-xl font-black text-blue-400 mt-0.5">{openCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">In Progress</span>
          <div className="text-xl font-black text-amber-400 mt-0.5">{inProgressCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-slate-700/60">
          <span className="text-[11px] font-semibold text-slate-400 uppercase">Completed</span>
          <div className="text-xl font-black text-emerald-400 mt-0.5">{completedCount}</div>
        </div>
        <div className="p-3 rounded-xl bg-navy-800/90 border border-red-500/30">
          <span className="text-[11px] font-semibold text-red-300 uppercase">Overdue Items</span>
          <div className="text-xl font-black text-red-400 mt-0.5">{overdueCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search findings, owners, IDs..."
              className="form-input pl-9 text-xs"
            />
          </div>

          {/* Severity */}
          <div>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Overdue">Overdue</option>
              <option value="Deferred">Deferred</option>
            </select>
          </div>

          {/* Owner */}
          <div>
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="form-select text-xs"
            >
              <option value="ALL">All Accountable Owners</option>
              {owners.map((o: any) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
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
                <th>Finding ID</th>
                <th>Title & Recommendation</th>
                <th>Severity</th>
                <th>Accountable Owner</th>
                <th>Target Date</th>
                <th>Status</th>
                <th>Linked Traces</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredItems.map((item) => {
                const isExpanded = expandedId === item.finding_id
                const overdue = item.status !== 'Completed' && isOverdue(item.target_date)

                return (
                  <React.Fragment key={item.finding_id}>
                    <tr
                      onClick={() => setExpandedId(isExpanded ? null : item.finding_id)}
                      className={`group ${isExpanded ? 'bg-navy-700/60' : ''}`}
                    >
                      <td className="text-center text-slate-500">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-blue-400 mx-auto" />
                        ) : (
                          <ChevronDown className="w-4 h-4 group-hover:text-slate-300 mx-auto" />
                        )}
                      </td>

                      <td className="font-mono font-bold text-amber-400 text-xs">
                        {item.finding_id}
                      </td>

                      <td className="text-xs max-w-sm">
                        <div className="font-semibold text-slate-200">{item.finding_title}</div>
                        <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {item.recommendation}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getSeverityBadge(
                            item.severity
                          )}`}
                        >
                          {item.severity}
                        </span>
                      </td>

                      <td className="text-xs text-slate-300 whitespace-nowrap">
                        {item.accountable_owner}
                      </td>

                      <td className="text-xs whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={overdue ? 'text-red-400 font-bold' : 'text-slate-300'}>
                            {formatDate(item.target_date)}
                          </span>
                          {overdue && (
                            <span className="px-1.5 py-0.2 rounded bg-red-500/20 text-red-300 text-[10px] font-bold border border-red-500/30">
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>

                      <td>
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getStatusClass(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="text-xs font-mono text-slate-400 whitespace-nowrap">
                        {item.linked_risk_id || item.linked_control_id ? (
                          <div className="flex items-center gap-1">
                            {item.linked_risk_id && (
                              <span className="text-blue-400 bg-blue-500/10 px-1 rounded">
                                {item.linked_risk_id}
                              </span>
                            )}
                            {item.linked_control_id && (
                              <span className="text-emerald-400 bg-emerald-500/10 px-1 rounded">
                                {item.linked_control_id}
                              </span>
                            )}
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>

                      <td className="text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingItem(item)
                          }}
                          className="btn btn-secondary text-xs px-2.5 py-1"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Update</span>
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row */}
                    {isExpanded && (
                      <tr className="bg-navy-900/90 border-b border-slate-700">
                        <td colSpan={9} className="p-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Detailed Recommendation
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {item.recommendation}
                              </p>
                            </div>

                            <div className="p-3 rounded-lg bg-navy-800/80 border border-slate-700/60">
                              <span className="font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                Closure Verification Evidence
                              </span>
                              <p className="text-slate-200 leading-relaxed">
                                {item.closure_evidence || (
                                  <span className="text-slate-500 italic">
                                    No closure evidence uploaded yet. Action is pending owner completion.
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-800">
                            <span>Created: {formatDate(item.created_date)}</span>
                            <span>Assigned Owner: {item.accountable_owner}</span>
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
      <RemediationModal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onSave={handleSave}
        initialData={editingItem}
      />
    </div>
  )
}
