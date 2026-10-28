import React, { useState, useEffect } from 'react'
import { X, Wrench, Calendar, CheckCircle } from 'lucide-react'
import type { RemediationItem } from '../types'

interface RemediationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<RemediationItem>) => Promise<void>
  initialData?: RemediationItem | null
}

const STATUS_OPTIONS = ['Open', 'In Progress', 'Completed', 'Overdue', 'Deferred']
const SEVERITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low', 'Informational']

export const RemediationModal: React.FC<RemediationModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<RemediationItem>>({
    finding_id: '',
    finding_title: '',
    severity: 'High',
    description: '',
    recommendation: '',
    accountable_owner: '',
    target_date: '',
    status: 'Open',
    closure_evidence: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData })
    }
    setError(null)
  }, [initialData, isOpen])

  if (!isOpen || !initialData) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to update remediation item')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Update Remediation: {initialData.finding_id}
              </h2>
              <p className="text-xs text-slate-400">
                {initialData.finding_title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-4 scrollbar-thin">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Finding summary card */}
          <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-700/80 text-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Linked Assets / Traces:</span>
              <span className="text-blue-300 font-mono">
                {initialData.linked_risk_id} • {initialData.linked_control_id}
              </span>
            </div>
            <p className="text-slate-200 mt-1">{initialData.recommendation}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Remediation Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                {STATUS_OPTIONS.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Finding Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                className="form-select"
              >
                {SEVERITY_OPTIONS.map((sev) => (
                  <option key={sev} value={sev}>
                    {sev}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Accountable Owner</label>
              <input
                type="text"
                value={formData.accountable_owner || ''}
                onChange={(e) => setFormData({ ...formData, accountable_owner: e.target.value })}
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Target Completion Date</label>
            <input
              type="date"
              value={formData.target_date || ''}
              onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Closure Verification / Artifact Evidence</label>
            <textarea
              value={formData.closure_evidence || ''}
              onChange={(e) => setFormData({ ...formData, closure_evidence: e.target.value })}
              rows={3}
              className="form-input"
              placeholder="e.g. Jira TICKET-492 deployed to production; configuration screenshot validated by Security Lead"
            />
            <span className="text-[11px] text-slate-400 mt-1 block">
              Required by audit standards to mark finding as Completed.
            </span>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Updating...' : 'Save Remediation Progress'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
