import React, { useState, useEffect } from 'react'
import { X, Building2 } from 'lucide-react'
import type { Vendor } from '../types'
import { getBand, BAND_BG } from '../utils'

interface VendorModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Vendor>) => Promise<void>
  initialData?: Vendor | null
}

const CRITICALITY_OPTIONS = ['Critical', 'High', 'Medium', 'Low']
const SENSITIVITY_OPTIONS = ['Restricted', 'Confidential', 'Internal', 'Public']

export const VendorModal: React.FC<VendorModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Vendor>>({
    vendor_id: '',
    name: '',
    service_category: '',
    data_sensitivity: 'Confidential',
    access_privileges: '',
    criticality: 'High',
    inherent_risk_score: 15,
    control_weaknesses: '',
    residual_risk_score: 9,
    recommended_actions: '',
    contract_review_date: '',
    contact_name: '',
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

  const inherentBand = getBand(formData.inherent_risk_score || 1)
  const residualBand = getBand(formData.residual_risk_score || 1)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      setSaving(true)
      await onSave(formData)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to update vendor assessment')
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
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Assess Vendor: {initialData.name} ({initialData.vendor_id})
              </h2>
              <p className="text-xs text-slate-400">{initialData.service_category}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Vendor Criticality</label>
              <select
                value={formData.criticality}
                onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
                className="form-select"
              >
                {CRITICALITY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="form-label">Data Sensitivity Classification</label>
              <select
                value={formData.data_sensitivity}
                onChange={(e) => setFormData({ ...formData, data_sensitivity: e.target.value })}
                className="form-select"
              >
                {SENSITIVITY_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="form-label">Access Privileges & Integration Scope</label>
            <textarea
              value={formData.access_privileges || ''}
              onChange={(e) => setFormData({ ...formData, access_privileges: e.target.value })}
              rows={2}
              className="form-input"
              placeholder="e.g. Read/Write access to Customer Card Data S3 buckets via IAM role"
            />
          </div>

          {/* Scoring Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-navy-900/60 border border-slate-700">
            <div>
              <label className="form-label">Inherent Risk Score (1–25)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={formData.inherent_risk_score || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, inherent_risk_score: Number(e.target.value) })
                  }
                  className="w-full accent-blue-500"
                />
                <span className={`text-xs px-2 py-0.5 rounded font-bold border ${BAND_BG[inherentBand]}`}>
                  {formData.inherent_risk_score} ({inherentBand})
                </span>
              </div>
            </div>

            <div>
              <label className="form-label">Residual Risk Score (1–25)</label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="25"
                  value={formData.residual_risk_score || 1}
                  onChange={(e) =>
                    setFormData({ ...formData, residual_risk_score: Number(e.target.value) })
                  }
                  className="w-full accent-emerald-500"
                />
                <span className={`text-xs px-2 py-0.5 rounded font-bold border ${BAND_BG[residualBand]}`}>
                  {formData.residual_risk_score} ({residualBand})
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="form-label">Identified Control Weaknesses</label>
            <textarea
              value={formData.control_weaknesses || ''}
              onChange={(e) => setFormData({ ...formData, control_weaknesses: e.target.value })}
              rows={2}
              className="form-input text-amber-200"
              placeholder="e.g. Incomplete SOC 2 Type II report; no continuous subprocessor monitoring"
            />
          </div>

          <div>
            <label className="form-label">Recommended Third-Party Risk Actions</label>
            <textarea
              value={formData.recommended_actions || ''}
              onChange={(e) => setFormData({ ...formData, recommended_actions: e.target.value })}
              rows={2}
              className="form-input text-blue-200"
              placeholder="e.g. Request ISO 27001 certificate; insert right-to-audit clause in next contract renewal"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Next Contract / SLA Review Date</label>
              <input
                type="date"
                value={formData.contract_review_date || ''}
                onChange={(e) => setFormData({ ...formData, contract_review_date: e.target.value })}
                className="form-input"
              />
            </div>
            <div>
              <label className="form-label">Vendor Relationship Manager</label>
              <input
                type="text"
                value={formData.contact_name || ''}
                onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                placeholder="e.g. Chief Procurement Officer"
                className="form-input"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Updating...' : 'Save Vendor Assessment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
