import React, { useState, useEffect } from 'react'
import { X, Calculator, ShieldAlert } from 'lucide-react'
import type { Risk } from '../types'
import { getBand, LIKELIHOOD_LABELS, IMPACT_LABELS, BAND_BG } from '../utils'

interface RiskModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (riskData: Partial<Risk>) => Promise<void>
  initialData?: Risk | null
}

const CATEGORIES = [
  'Identity & Access Management',
  'Data Protection & Privacy',
  'Cloud & Infrastructure',
  'Application Security',
  'Business Continuity & DR',
  'Third-Party & Supply Chain',
  'Threat & Vulnerability Management',
  'Security Operations & Logging',
  'Governance & Compliance',
]

const STRATEGIES = ['Mitigate', 'Accept', 'Transfer', 'Avoid']
const STATUSES = ['Open', 'In Progress', 'Accepted', 'Closed', 'Transferred']

export const RiskModal: React.FC<RiskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [formData, setFormData] = useState<Partial<Risk>>({
    risk_id: '',
    title: '',
    category: CATEGORIES[0],
    affected_asset: '',
    threat: '',
    vulnerability: '',
    business_impact: '',
    likelihood: 3,
    impact: 3,
    existing_controls: '',
    control_effectiveness_pct: 0,
    risk_owner: '',
    treatment_strategy: 'Mitigate',
    status: 'Open',
    review_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (initialData) {
      setFormData({ ...initialData })
    } else {
      setFormData({
        risk_id: `RSK-${Math.floor(100 + Math.random() * 900)}`,
        title: '',
        category: CATEGORIES[0],
        affected_asset: '',
        threat: '',
        vulnerability: '',
        business_impact: '',
        likelihood: 3,
        impact: 3,
        existing_controls: '',
        control_effectiveness_pct: 25,
        risk_owner: 'CISO / Security Lead',
        treatment_strategy: 'Mitigate',
        status: 'Open',
        review_date: new Date().toISOString().split('T')[0],
        notes: '',
      })
    }
    setError(null)
  }, [initialData, isOpen])

  if (!isOpen) return null

  const likelihood = Number(formData.likelihood) || 1
  const impact = Number(formData.impact) || 1
  const inherentScore = likelihood * impact
  const inherentBand = getBand(inherentScore)

  const effectiveness = Number(formData.control_effectiveness_pct) || 0
  const residualScore = Math.max(
    1,
    Math.round(inherentScore * (1 - effectiveness / 100) * 10) / 10
  )
  const residualBand = getBand(residualScore)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.title?.trim()) {
      setError('Risk title is required')
      return
    }
    if (!formData.affected_asset?.trim()) {
      setError('Affected asset is required')
      return
    }
    if (!formData.risk_owner?.trim()) {
      setError('Risk owner is required')
      return
    }

    try {
      setSaving(true)
      await onSave({
        ...formData,
        likelihood,
        impact,
        inherent_risk_score: inherentScore,
        control_effectiveness_pct: effectiveness,
        residual_risk_score: residualScore,
      })
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || err.message || 'Failed to save risk record')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-navy-800 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                {initialData ? `Edit Risk Scenario (${initialData.risk_id})` : 'New Synthetic Risk Scenario'}
              </h2>
              <p className="text-xs text-slate-400">
                Apex Financial Services • Quantitative Likelihood × Impact Assessment
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5 scrollbar-thin">
          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-xs">
              {error}
            </div>
          )}

          {/* Top row: ID, Category, Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Risk ID</label>
              <input
                type="text"
                value={formData.risk_id || ''}
                onChange={(e) => setFormData({ ...formData, risk_id: e.target.value })}
                className="form-input font-mono"
                required
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="form-select"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Risk Owner</label>
              <input
                type="text"
                value={formData.risk_owner || ''}
                onChange={(e) => setFormData({ ...formData, risk_owner: e.target.value })}
                placeholder="e.g. VP Infrastructure"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Title & Asset */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="form-label">Risk Scenario Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Unpatched Vulnerability in Payment API"
                className="form-input"
                required
              />
            </div>
            <div>
              <label className="form-label">Affected Business Asset</label>
              <input
                type="text"
                value={formData.affected_asset || ''}
                onChange={(e) => setFormData({ ...formData, affected_asset: e.target.value })}
                placeholder="e.g. Customer NetBanking Portal"
                className="form-input"
                required
              />
            </div>
          </div>

          {/* Threat, Vulnerability, Business Impact */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Threat Description</label>
              <textarea
                value={formData.threat || ''}
                onChange={(e) => setFormData({ ...formData, threat: e.target.value })}
                rows={2}
                className="form-input"
                placeholder="Adversary actions or threat agent"
              />
            </div>
            <div>
              <label className="form-label">Vulnerability / Weakness</label>
              <textarea
                value={formData.vulnerability || ''}
                onChange={(e) => setFormData({ ...formData, vulnerability: e.target.value })}
                rows={2}
                className="form-input"
                placeholder="Underlying flaw or misconfiguration"
              />
            </div>
            <div>
              <label className="form-label">Business Impact</label>
              <textarea
                value={formData.business_impact || ''}
                onChange={(e) => setFormData({ ...formData, business_impact: e.target.value })}
                rows={2}
                className="form-input"
                placeholder="Financial, reputational, or regulatory impact"
              />
            </div>
          </div>

          {/* Scoring Engine Interactive Card */}
          <div className="p-4 rounded-xl bg-navy-900/80 border border-blue-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-2">
                <Calculator className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Risk Scoring Engine (Likelihood × Impact)
                </span>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">1–25 Scale</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="form-label">Likelihood (1–5)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.likelihood || 1}
                    onChange={(e) => setFormData({ ...formData, likelihood: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                  <span className="w-8 text-center font-bold text-white text-sm bg-navy-800 p-1 rounded border border-slate-700">
                    {formData.likelihood}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {LIKELIHOOD_LABELS[formData.likelihood || 1]}
                </span>
              </div>

              <div>
                <label className="form-label">Impact (1–5)</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={formData.impact || 1}
                    onChange={(e) => setFormData({ ...formData, impact: Number(e.target.value) })}
                    className="w-full accent-blue-500"
                  />
                  <span className="w-8 text-center font-bold text-white text-sm bg-navy-800 p-1 rounded border border-slate-700">
                    {formData.impact}
                  </span>
                </div>
                <span className="text-[10px] text-slate-400">
                  {IMPACT_LABELS[formData.impact || 1]}
                </span>
              </div>

              {/* Calculated Inherent Risk Result */}
              <div className="p-3 rounded-lg bg-navy-800/90 border border-slate-700 text-center">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                  Inherent Score
                </span>
                <div className="flex items-center justify-center gap-2 mt-0.5">
                  <span className="text-xl font-black text-white">{inherentScore}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold border ${BAND_BG[inherentBand]}`}>
                    {inherentBand}
                  </span>
                </div>
              </div>
            </div>

            {/* Residual Controls Section */}
            <div className="pt-2 border-t border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div className="sm:col-span-2">
                <label className="form-label">Existing Controls & Mitigations</label>
                <input
                  type="text"
                  value={formData.existing_controls || ''}
                  onChange={(e) => setFormData({ ...formData, existing_controls: e.target.value })}
                  placeholder="e.g. WAF configured; annual penetration test; IAM roles"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Control Effectiveness %</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={formData.control_effectiveness_pct || 0}
                    onChange={(e) =>
                      setFormData({ ...formData, control_effectiveness_pct: Number(e.target.value) })
                    }
                    className="w-full accent-emerald-500"
                  />
                  <span className="w-12 text-center font-bold text-emerald-400 text-sm bg-navy-800 p-1 rounded border border-slate-700">
                    {formData.control_effectiveness_pct}%
                  </span>
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1">
                  <span>Residual:</span>
                  <span className="font-bold text-white">
                    {residualScore} ({residualBand})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Strategy, Status, Review Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="form-label">Treatment Strategy</label>
              <select
                value={formData.treatment_strategy}
                onChange={(e) => setFormData({ ...formData, treatment_strategy: e.target.value })}
                className="form-select"
              >
                {STRATEGIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Risk Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select"
              >
                {STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Next Review Date</label>
              <input
                type="date"
                value={formData.review_date || ''}
                onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Consultant Notes & Findings</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
              className="form-input"
              placeholder="Internal consulting rationale, evidence references, or compliance observations"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/80">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? 'Saving...' : initialData ? 'Update Risk' : 'Create Risk Scenario'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
