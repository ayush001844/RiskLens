import React, { useState, useEffect } from 'react'
import { Banner } from './components/Banner'
import { Navbar, TabType } from './components/Navbar'
import { DashboardView } from './components/DashboardView'
import { RiskRegisterView } from './components/RiskRegisterView'
import { ControlAssessmentView } from './components/ControlAssessmentView'
import { RemediationTrackerView } from './components/RemediationTrackerView'
import { VendorRiskView } from './components/VendorRiskView'
import { ReportsView } from './components/ReportsView'

import {
  getDashboard,
  getRisks,
  createRisk,
  updateRisk,
  deleteRisk,
  getControls,
  updateControl,
  getRemediation,
  updateRemediationItem,
  getVendors,
  updateVendor,
  reseedDatabase,
} from './api/client'
import type { Risk, Control, RemediationItem, Vendor, DashboardStats } from './types'

export function App() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard')
  const [loading, setLoading] = useState(true)
  const [reseeding, setReseeding] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [risks, setRisks] = useState<Risk[]>([])
  const [controls, setControls] = useState<Control[]>([])
  const [remediation, setRemediation] = useState<RemediationItem[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])

  const loadAllData = async () => {
    try {
      setLoading(true)
      const [statsData, risksData, controlsData, remData, vendorsData] = await Promise.all([
        getDashboard(),
        getRisks(),
        getControls(),
        getRemediation(),
        getVendors(),
      ])
      setStats(statsData)
      setRisks(risksData)
      setControls(controlsData)
      setRemediation(remData)
      setVendors(vendorsData)
    } catch (err: any) {
      console.error('Failed to load GRC data:', err)
      setNotification('Backend connection error. Ensure FastAPI backend is running.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAllData()
  }, [])

  const handleReseed = async () => {
    if (
      !confirm(
        'Reset synthetic database? This will restore 25+ realistic risks, 30+ controls, 15+ remediation items, and 10+ third-party vendors for Apex Financial Services.'
      )
    ) {
      return
    }

    try {
      setReseeding(true)
      await reseedDatabase()
      setNotification('✅ Synthetic demo database reset successfully!')
      await loadAllData()
      setTimeout(() => setNotification(null), 4000)
    } catch (err: any) {
      console.error('Failed to reseed:', err)
      setNotification('Failed to reseed database.')
    } finally {
      setReseeding(false)
    }
  }

  const handleSaveRisk = async (riskData: Partial<Risk>) => {
    if (riskData.risk_id && risks.some((r) => r.risk_id === riskData.risk_id)) {
      await updateRisk(riskData.risk_id, riskData)
    } else {
      await createRisk(riskData)
    }
    await loadAllData()
  }

  const handleDeleteRisk = async (riskId: string) => {
    await deleteRisk(riskId)
    await loadAllData()
  }

  const handleUpdateControl = async (controlId: string, data: Partial<Control>) => {
    await updateControl(controlId, data)
    await loadAllData()
  }

  const handleUpdateRemediation = async (id: string, data: Partial<RemediationItem>) => {
    await updateRemediationItem(id, data)
    await loadAllData()
  }

  const handleUpdateVendor = async (id: string, data: Partial<Vendor>) => {
    await updateVendor(id, data)
    await loadAllData()
  }

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col font-sans">
      {/* Synthetic Demo Notification Banner */}
      <Banner onReseed={handleReseed} reseeding={reseeding} />

      {/* Main Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        riskCount={risks.length}
        gapCount={stats?.open_control_gaps}
        overdueCount={stats?.overdue_remediation}
      />

      {/* Floating Status / Feedback Notification */}
      {notification && (
        <div className="fixed bottom-4 right-4 z-50 p-4 rounded-xl bg-blue-600 text-white shadow-xl shadow-black/40 text-xs font-semibold flex items-center gap-2 border border-blue-400/40 animate-in">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="ml-2 hover:opacity-75">
            ×
          </button>
        </div>
      )}

      {/* Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        {activeTab === 'dashboard' && (
          <DashboardView
            stats={stats}
            risks={risks}
            controls={controls}
            remediation={remediation}
            loading={loading}
            onNavigate={setActiveTab}
          />
        )}

        {activeTab === 'risks' && (
          <RiskRegisterView
            risks={risks}
            onRefresh={loadAllData}
            onSaveRisk={handleSaveRisk}
            onDeleteRisk={handleDeleteRisk}
          />
        )}

        {activeTab === 'controls' && (
          <ControlAssessmentView
            controls={controls}
            onRefresh={loadAllData}
            onUpdateControl={handleUpdateControl}
          />
        )}

        {activeTab === 'remediation' && (
          <RemediationTrackerView
            items={remediation}
            onRefresh={loadAllData}
            onUpdateItem={handleUpdateRemediation}
          />
        )}

        {activeTab === 'vendors' && (
          <VendorRiskView
            vendors={vendors}
            onRefresh={loadAllData}
            onUpdateVendor={handleUpdateVendor}
          />
        )}

        {activeTab === 'reports' && <ReportsView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-navy-900/90 py-6 text-xs text-slate-400 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <span className="font-semibold text-slate-300">RiskLens GRC Platform</span> • Enterprise Cybersecurity Risk & Controls Assessment
            <p className="text-[11px] text-slate-400 mt-0.5">
              Simulated engagement for <strong>Apex Financial Services</strong> (Synthetic Data Only). Framework mappings to NIST CSF 2.0 & ISO/IEC 27001:2022.
            </p>
          </div>
          <div className="text-[11px] text-slate-400">
            Portfolio Project • React + TypeScript + FastAPI + SQLite
          </div>
        </div>
      </footer>
    </div>
  )
}
