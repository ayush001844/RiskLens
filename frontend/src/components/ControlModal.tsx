import React, { useState, useEffect } from 'react'
import { X, CheckSquare, ShieldCheck } from 'lucide-react'
import type { Control } from '../types'

interface ControlModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (controlData: Partial<Control>) => Promise<void>
  initialData?: Control | null
}

const EFFECTIVENESS_OPTIONS = [
  'Effective',
  'Partially Effective',
  'Ineffective',
  'Not Tested',
]

const EVIDENCE_STATUS_OPTIONS = ['Provided', 'Pending', 'Missing', 'Expired']

export const ControlModal: React.FC<ControlModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Control>>({
    control_id: '',
    framework_reference: '',
    nist_csf_category: '',
    iso_27001_annex: '',
    control_objective: '',
    control_owner: '',
    evidence_description: '',
    evidence_status: 'Pending',
    effectiveness: 'Not Tested',
    assessment_result: '',
    identified_gap: '',
    recommendation: '',
    review_date: new Date().toISOString().split('T')[0],
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
      setError(err?.response?.data?.detail || err.message || 'Failed to update control evaluation')
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
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Assess Control: {initialData.control_id}
              </h2>
              <p className="text-xs text-slate-400">
                {initialData.framework_reference}
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

          {/* Objective readonly info */}
          <div className="p-3 rounded-lg bg-navy-900/60 border border-slate-700/80 text-xs space-y-1">
            <span className="font-semibold text-slate-400 uppercase tracking-wider block">
              Control Objective
            </span>
            <p className="text-slate-200">{formData.control_objective}</p>
            <div className="flex items-center gap-4 text-slate-400 pt-1 text-[11px]">
              <span>Owner: <strong className="text-slate-300">{formData.control_owner}</strong></span>
              <span>Category: <strong className="text-slate-300">{formData.nist_csf_category}</strong></span>
            </div>
          </div>

          {/* Effectiveness & Evidence Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Audit Effectiveness Determination</label>
              <select
                value={formData.effectiveness}
                onChange={(e) => setFormData({ ...formData, effectiveness: e.target.value })}
                className="form-select"
              >
                {EFFECTIVENESS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Audit Evidence Status</label>
              <select
                value={formData.evidence_status}
                onChange={(e) => setFormData({ ...formData, evidence_status: e.target.value })}
                className="form-select"
              >
                {EVIDENCE_STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Evidence description */}
          <div>
            <label className="form-label">Inspected Evidence / Artifacts</label>
            <textarea
              value={formData.evidence_description || ''}
              onChange={(e) => setFormData({ ...formData, evidence_description: e.target.value })}
              rows={2}
              className="form-input"
              placeholder="e.g. AWS IAM policy screenshots, SSO logs, quarterly audit sign-offs"
            />
          </div>

          {/* Assessment Result */}
          <div>
            <label className="form-label">Consultant Assessment Finding / Result</label>
            <textarea
              value={formData.assessment_result || ''}
              onChange={(e) => setFormData({ ...formData, assessment_result: e.target.value })}
              rows={2}
              className="form-input"
              placeholder="Observed testing results and implementation maturity"
            />
          </div>

          {/* Identified Gap */}
          <div>
            <label className="form-label">Identified Control Gap (if any)</label>
            <textarea
              value={formData.identified_gap || ''}
              onChange={(e) => setFormData({ ...formData, identified_gap: e.target.value })}
              rows={2}
              className="form-input text-amber-200"
              placeholder="Deficiencies, missing controls, or compliance exceptions"
            />
          </div>

          {/* Recommendation */}
          <div>
            <label className="form-label">Remediation Recommendation</label>
            <textarea
              value={formData.recommendation || ''}
              onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
              rows={2}
              className="form-input text-blue-200"
              placeholder="Actionable steps to achieve control effectiveness"
            />
          </div>

          {/* Next review date */}
          <div>
            <label className="form-label">Next Scheduled Audit Review</label>
            <input
              type="date"
              value={formData.review_date || ''}
              onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
              className="form-input"
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Updating...' : 'Save Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
