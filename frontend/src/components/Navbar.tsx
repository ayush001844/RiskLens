import {
  ShieldAlert,
  LayoutDashboard,
  CheckSquare,
  Wrench,
  Building2,
  FileText,
  Target,
  Scale,
  Crosshair,
  History,
  UserCheck,
  Sliders,
  Radio,
} from 'lucide-react';
import { USER_ROLES, getRoleClass } from '../utils';

export type TabType =
  | 'dashboard'
  | 'risks'
  | 'controls'
  | 'maturity'
  | 'compliance'
  | 'telemetry'
  | 'threats'
  | 'remediation'
  | 'vendors'
  | 'simulation'
  | 'audit'
  | 'reports';

interface NavbarProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
  riskCount?: number;
  gapCount?: number;
  overdueCount?: number;
  currentRole?: string;
  onRoleChange?: (role: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  riskCount,
  gapCount,
  overdueCount,
  currentRole = 'Consultant',
  onRoleChange,
}) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'risks' as TabType,
      label: 'Risks',
      icon: ShieldAlert,
      badge: riskCount ? `${riskCount}` : undefined,
    },
    {
      id: 'controls' as TabType,
      label: 'Controls',
      icon: CheckSquare,
      badge: gapCount ? `${gapCount} Gaps` : undefined,
      badgeClass: 'bg-red-500/20 text-red-400 border border-red-500/30',
    },
    {
      id: 'maturity' as TabType,
      label: 'NIST CSF',
      icon: Target,
    },
    {
      id: 'compliance' as TabType,
      label: 'Compliance',
      icon: Scale,
    },
    {
      id: 'telemetry' as TabType,
      label: 'Live Telemetry',
      icon: Radio,
      badge: 'CCM',
      badgeClass: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30',
    },
    {
      id: 'threats' as TabType,
      label: 'Threats',
      icon: Crosshair,
    },
    {
      id: 'remediation' as TabType,
      label: 'Remediation',
      icon: Wrench,
      badge: overdueCount ? `${overdueCount}` : undefined,
      badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    },
    {
      id: 'vendors' as TabType,
      label: 'Vendors',
      icon: Building2,
    },
    {
      id: 'simulation' as TabType,
      label: 'Simulator',
      icon: Sliders,
      badge: 'What-If',
      badgeClass: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
    },
    {
      id: 'audit' as TabType,
      label: 'Audit Trail',
      icon: History,
    },
    {
      id: 'reports' as TabType,
      label: 'Reports',
      icon: FileText,
    },
  ];

  return (
    <header className="bg-navy-800/95 border-b border-slate-700/60 sticky top-0 z-30 backdrop-blur-md">
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
                  v2.0 Enterprise GRC
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-none hidden sm:block">
                Cybersecurity Risk & Controls • Apex Financial Services
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-150 relative ${
                    isActive
                      ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-inner'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                        item.badgeClass || 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Role Switcher for Interactive Demo */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-navy-900/80 border border-slate-700/60 px-2.5 py-1.5 rounded-lg text-xs">
              <UserCheck className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-slate-400 hidden sm:inline">Role:</span>
              <select
                value={currentRole}
                onChange={(e) => onRoleChange && onRoleChange(e.target.value)}
                className="bg-transparent text-slate-200 font-semibold focus:outline-none cursor-pointer text-xs"
                title="Switch active user RBAC role"
              >
                {USER_ROLES.map((role) => (
                  <option key={role} value={role} className="bg-navy-900 text-slate-200">
                    {role}
                  </option>
                ))}
              </select>
              <span className={`text-[10px] px-1.5 py-0.2 rounded hidden md:inline ${getRoleClass(currentRole)}`}>
                RBAC
              </span>
            </div>
          </div>
        </div>

        {/* Medium/Mobile Navigation bar */}
        <div className="flex xl:hidden overflow-x-auto py-2 gap-1.5 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                    : 'text-slate-400 hover:text-slate-200 bg-navy-900/40'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[9px] px-1 bg-slate-700 rounded-full">{item.badge}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
