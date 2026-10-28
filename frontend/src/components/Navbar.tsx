import React from 'react'
import {
  ShieldAlert,
  LayoutDashboard,
  FileSpreadsheet,
  CheckSquare,
  Wrench,
  Building2,
  FileText,
} from 'lucide-react'

export type TabType = 'dashboard' | 'risks' | 'controls' | 'remediation' | 'vendors' | 'reports'

interface NavbarProps {
  activeTab: TabType
  onSelectTab: (tab: TabType) => void
  riskCount?: number
  gapCount?: number
  overdueCount?: number
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  riskCount,
  gapCount,
  overdueCount,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Executive Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'risks' as TabType,
      label: 'Risk Register',
      icon: ShieldAlert,
      badge: riskCount ? `${riskCount}` : undefined,
    },
    {
      id: 'controls' as TabType,
      label: 'Control Assessment',
      icon: CheckSquare,
      badge: gapCount ? `${gapCount} Gaps` : undefined,
      badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'remediation' as TabType,
      label: 'Remediation Tracker',
      icon: Wrench,
      badge: overdueCount ? `${overdueCount} Overdue` : undefined,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'vendors' as TabType,
      label: 'Vendor Risk',
      icon: Building2,
    },
    {
      id: 'reports' as TabType,
      label: 'Consulting Reports',
      icon: FileText,
    },
  ]

  return (
    <header className="bg-navy-800/90 border-b border-slate-700/60 sticky top-0 z-30 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-blue-300 bg-clip-text text-transparent">
                  RiskLens
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  v1.2 Enterprise GRC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none">
                Cybersecurity Risk & Controls Assessment • Apex Financial Services
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 relative ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                        item.badgeClass || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* Engagement Badge */}
          <div className="hidden sm:flex items-center gap-2 bg-navy-900/60 border border-slate-700/60 px-3 py-1.5 rounded-lg text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-slate-300 font-medium">Engagement: Active</span>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-navy-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </header>
  )
}
