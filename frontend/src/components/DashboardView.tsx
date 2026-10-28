import React from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building,
  TrendingDown,
  Layers,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  CartesianGrid,
} from 'recharts'
import type { DashboardStats, Risk, Control, RemediationItem } from '../types'
import { HeatMap } from './HeatMap'
import { BAND_COLORS } from '../utils'

interface DashboardViewProps {
  stats: DashboardStats | null
  risks: Risk[]
  controls: Control[]
  remediation: RemediationItem[]
  loading: boolean
  onNavigate: (tab: any) => void
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  stats,
  risks,
  controls,
  remediation,
  loading,
  onNavigate,
}) => {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm text-slate-400">Loading RiskLens Executive Telemetry...</p>
        </div>
      </div>
    )
  }

  // Calculate Inherent vs Residual comparison for Chart
  const inherentDist = stats.risk_distribution || []
  const residualDist = stats.residual_risk_distribution || []

  const bands = ['Critical', 'High', 'Medium', 'Low']
  const comparisonData = bands.map((b) => {
    const inh = inherentDist.find((d) => d.band === b)?.count || 0
    const res = residualDist.find((d) => d.band === b)?.count || 0
    return {
      band: b,
      Inherent: inh,
      Residual: res,
    }
  })

  // Format Control Effectiveness for Pie Chart
  const controlChartData = (stats.control_effectiveness_summary || []).map((c) => ({
    name: c.effectiveness,
    value: c.count,
  }))

  const EFFECTIVENESS_COLORS: Record<string, string> = {
    Effective: '#10b981',
    'Partially Effective': '#f59e0b',
    Ineffective: '#ef4444',
    'Not Tested': '#64748b',
  }

  return (
    <div className="space-y-6 pb-12 animate-in">
      {/* Executive Welcome & Overview Header */}
      <div className="card bg-gradient-to-r from-navy-800 via-navy-700/60 to-navy-800 border-blue-500/20 p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold tracking-wider uppercase text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded border border-blue-500/20">
                Engagement Executive Brief
              </span>
              <span className="text-xs text-slate-400">Target: Apex Financial Services</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Enterprise Cybersecurity Risk & Controls Assessment
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-3xl">
              Comprehensive security posture evaluation benchmarking core banking APIs, customer PII
              stores, and cloud workloads against <strong className="text-blue-300">NIST CSF 2.0</strong> and{' '}
              <strong className="text-blue-300">ISO/IEC 27001:2022</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => onNavigate('reports')}
              className="btn btn-primary shadow-lg shadow-blue-500/20"
            >
              <span>View Consulting Report</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('risks')}
              className="btn btn-secondary"
            >
              <span>Inspect Risk Register</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Risks */}
        <div
          onClick={() => onNavigate('risks')}
          className="stat-card cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Identified Risks
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 group-hover:bg-blue-500/20 transition-colors">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">{stats.total_risks}</span>
            <span className="text-xs text-slate-400">Scenarios</span>
          </div>
          <div className="flex items-center gap-2 mt-3 text-xs text-slate-400 border-t border-slate-700/60 pt-2">
            <span className="text-red-400 font-bold">{stats.critical_risks} Critical</span>
            <span>•</span>
            <span className="text-orange-400 font-bold">{stats.high_risks} High</span>
          </div>
        </div>

        {/* High & Critical Risks */}
        <div
          onClick={() => onNavigate('risks')}
          className="stat-card cursor-pointer group border-red-500/20 hover:border-red-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-red-300 uppercase tracking-wider">
              High & Critical Risks
            </span>
            <div className="p-2 rounded-lg bg-red-500/10 text-red-400 group-hover:bg-red-500/20 transition-colors">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-red-400">
              {stats.critical_risks + stats.high_risks}
            </span>
            <span className="text-xs text-red-300">
              ({Math.round(((stats.critical_risks + stats.high_risks) / (stats.total_risks || 1)) * 100)}% of total)
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
            <span>Score ≥ 10 on 25 scale</span>
            <span className="text-red-400 text-[10px] font-bold uppercase">Immediate Attention</span>
          </div>
        </div>

        {/* Open Control Gaps */}
        <div
          onClick={() => onNavigate('controls')}
          className="stat-card cursor-pointer group border-amber-500/20 hover:border-amber-500/40"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Control Deficiencies
            </span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20 transition-colors">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-amber-400">
              {stats.open_control_gaps}
            </span>
            <span className="text-xs text-slate-400">Gaps in {controls.length} controls</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
            <span>NIST CSF / ISO 27001</span>
            <span className="text-amber-400 text-[10px] font-bold">Requires Action</span>
          </div>
        </div>

        {/* Overdue Remediation */}
        <div
          onClick={() => onNavigate('remediation')}
          className="stat-card cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Overdue Remediation
            </span>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 group-hover:bg-rose-500/20 transition-colors">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-black text-white">{stats.overdue_remediation}</span>
            <span className="text-xs text-slate-400">
              of {stats.open_remediation} active items
            </span>
          </div>
          <div className="mt-3 text-xs text-slate-400 border-t border-slate-700/60 pt-2 flex items-center justify-between">
            <span>Target date lapsed</span>
            <span className="text-rose-400 text-[10px] font-bold">Escalate to Owners</span>
          </div>
        </div>
      </div>

      {/* Heat Map Section */}
      <HeatMap
        risks={risks}
        onSelectCell={() => onNavigate('risks')}
      />

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inherent vs Residual Risk Reduction */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span>Inherent vs. Residual Risk Distribution</span>
              </h3>
              <p className="text-xs text-slate-400">
                Measures risk score reduction achieved through implemented security controls.
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={comparisonData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="band" stroke="#94a3b8" tick={{ fontSize: 12 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
                <Bar dataKey="Inherent" fill="#ef4444" radius={[4, 4, 0, 0]} name="Inherent (Pre-control)" />
                <Bar dataKey="Residual" fill="#10b981" radius={[4, 4, 0, 0]} name="Residual (Post-control)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-2.5 rounded-lg bg-navy-900/60 border border-slate-700/60 text-xs text-slate-300 flex items-center justify-between">
            <span>Residual Risk Formula:</span>
            <code className="text-blue-300 font-mono">Residual = Inherent × (1 − Effectiveness%)</code>
          </div>
        </div>

        {/* Risk Scenarios by Business Category */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Risk Distribution by Category</span>
              </h3>
              <p className="text-xs text-slate-400">
                Number of synthetic risk scenarios identified per operational domain.
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.risk_by_category}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                <YAxis
                  dataKey="category"
                  type="category"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  width={110}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Risks" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Control Effectiveness Breakdown */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Control Assessment Effectiveness</span>
              </h3>
              <p className="text-xs text-slate-400">
                Audit determination across 30+ cybersecurity controls.
              </p>
            </div>
          </div>

          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={controlChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {controlChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={EFFECTIVENESS_COLORS[entry.name] || '#64748b'}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Remediation Lifecycle Status */}
        <div className="card p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Remediation Action Status</span>
              </h3>
              <p className="text-xs text-slate-400">
                Progress tracking across 15+ assigned consultant findings.
              </p>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={stats.remediation_by_status}
                margin={{ top: 15, right: 20, left: 0, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="status" stroke="#94a3b8" tick={{ fontSize: 11 }} />
                <YAxis stroke="#94a3b8" tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#f8fafc',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Actions" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}
