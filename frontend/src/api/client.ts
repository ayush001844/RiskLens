import axios from 'axios'
import type { Risk, Control, RemediationItem, Vendor, DashboardStats } from '../types'

const api = axios.create({ baseURL: '/api' })

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const getDashboard = () =>
  api.get<DashboardStats>('/dashboard').then(r => r.data)

// ─── Risks ────────────────────────────────────────────────────────────────────
export const getRisks = (params?: Record<string, string>) =>
  api.get<Risk[]>('/risks/', { params }).then(r => r.data)

export const getRisk = (id: string) =>
  api.get<Risk>(`/risks/${id}`).then(r => r.data)

export const createRisk = (data: Partial<Risk>) =>
  api.post<Risk>('/risks/', data).then(r => r.data)

export const updateRisk = (id: string, data: Partial<Risk>) =>
  api.patch<Risk>(`/risks/${id}`, data).then(r => r.data)

export const deleteRisk = (id: string) =>
  api.delete(`/risks/${id}`)

// ─── Controls ─────────────────────────────────────────────────────────────────
export const getControls = (params?: Record<string, string>) =>
  api.get<Control[]>('/controls/', { params }).then(r => r.data)

export const getControl = (id: string) =>
  api.get<Control>(`/controls/${id}`).then(r => r.data)

export const createControl = (data: Partial<Control>) =>
  api.post<Control>('/controls/', data).then(r => r.data)

export const updateControl = (id: string, data: Partial<Control>) =>
  api.patch<Control>(`/controls/${id}`, data).then(r => r.data)

export const deleteControl = (id: string) =>
  api.delete(`/controls/${id}`)

// ─── Remediation ──────────────────────────────────────────────────────────────
export const getRemediation = (params?: Record<string, string>) =>
  api.get<RemediationItem[]>('/remediation/', { params }).then(r => r.data)

export const getRemediationItem = (id: string) =>
  api.get<RemediationItem>(`/remediation/${id}`).then(r => r.data)

export const updateRemediationItem = (id: string, data: Partial<RemediationItem>) =>
  api.patch<RemediationItem>(`/remediation/${id}`, data).then(r => r.data)

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const getVendors = (params?: Record<string, string>) =>
  api.get<Vendor[]>('/vendors/', { params }).then(r => r.data)

export const getVendor = (id: string) =>
  api.get<Vendor>(`/vendors/${id}`).then(r => r.data)

export const updateVendor = (id: string, data: Partial<Vendor>) =>
  api.patch<Vendor>(`/vendors/${id}`, data).then(r => r.data)

// ─── Reports ──────────────────────────────────────────────────────────────────
export const getFullReport = () =>
  api.get('/reports/full').then(r => r.data)

export const downloadCsv = (entity: 'risks' | 'controls' | 'remediation' | 'vendors') => {
  window.open(`/api/reports/csv/${entity}`, '_blank')
}

// ─── Admin ────────────────────────────────────────────────────────────────────
export const reseedDatabase = () =>
  api.post('/admin/reseed').then(r => r.data)
