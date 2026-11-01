/**
 * RiskLens API Client v2.0
 * Axios-based client for all backend endpoints.
 * Token is stored in memory (not localStorage) to avoid XSS risk.
 */
import axios from 'axios';
import type {
  Risk, RiskAppetiteConfig, RiskAcceptance,
  Control, ControlTest, Evidence,
  RemediationItem, RemediationMetrics,
  Vendor,
  MaturityAssessment, GapAnalysisItem,
  ComplianceFramework, ComplianceRequirement, ComplianceSummaryItem,
  ThreatScenario,
  User, TokenResponse, AuditLog,
  DashboardStats,
  StrategicInitiative, SimulationRequest, SimulationResponse,
  ThreatIntelItem, ThreatIntelSummary,
  HarmonizationCrosswalkItem, HarmonizedPosture, AuditReadinessResponse, HarmonizedEvaluateResponse,
  DossierSummaryResponse, DossierBundle, DossierFileItem,
  TelemetryConnector, TelemetryEvent, TelemetryStats, CopilotChatResponse, CopilotQuickPrompt,
} from '../types';




// ─── Axios instance ─────────────────────────────────────────────────────────

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ─── In-memory token store ───────────────────────────────────────────────────

let _accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  _accessToken = token;
}

export function getAccessToken(): string | null {
  return _accessToken;
}

// Inject auth header on every request
api.interceptors.request.use((config) => {
  if (_accessToken) {
    config.headers.Authorization = `Bearer ${_accessToken}`;
  }
  return config;
});

// ─── Authentication ───────────────────────────────────────────────────────────

export const authApi = {
  login: (username: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { username, password }).then(r => r.data),

  refresh: (refreshToken: string) =>
    api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken }).then(r => r.data),

  me: () => api.get<User>('/auth/me').then(r => r.data),

  listUsers: () => api.get<User[]>('/auth/users').then(r => r.data),

  createUser: (data: { username: string; email: string; password: string; role: string; full_name?: string }) =>
    api.post<User>('/auth/users', data).then(r => r.data),

  updateUser: (userId: number, data: Partial<User>) =>
    api.patch<User>(`/auth/users/${userId}`, data).then(r => r.data),
};

// ─── Risk Appetite ─────────────────────────────────────────────────────────

export const appetiteApi = {
  get: () => api.get<RiskAppetiteConfig>('/risks/appetite').then(r => r.data),
  update: (data: Partial<RiskAppetiteConfig>) =>
    api.put<RiskAppetiteConfig>('/risks/appetite', data).then(r => r.data),
};

// ─── Risks ────────────────────────────────────────────────────────────────────

export interface RiskFilters {
  skip?: number;
  limit?: number;
  category?: string;
  status?: string;
  business_unit?: string;
  treatment_strategy?: string;
  exceeds_appetite?: boolean;
  search?: string;
}

export const risksApi = {
  list: (filters: RiskFilters = {}) =>
    api.get<Risk[]>('/risks/', { params: filters }).then(r => r.data),

  get: (riskId: string) =>
    api.get<Risk>(`/risks/${riskId}`).then(r => r.data),

  create: (data: Partial<Risk>) =>
    api.post<Risk>('/risks/', data).then(r => r.data),

  update: (riskId: string, data: Partial<Risk>) =>
    api.patch<Risk>(`/risks/${riskId}`, data).then(r => r.data),

  delete: (riskId: string) =>
    api.delete(`/risks/${riskId}`),

  submitAcceptance: (riskId: string, data: {
    business_justification: string;
    compensating_controls?: string;
    risk_owner: string;
    approver_name?: string;
    expiry_date: string;
  }) => api.post<RiskAcceptance>(`/risks/${riskId}/accept`, data).then(r => r.data),

  getAcceptances: (riskId: string) =>
    api.get<RiskAcceptance[]>(`/risks/${riskId}/acceptances`).then(r => r.data),

  updateAcceptance: (acceptanceId: string, data: { approval_status?: string; rejection_reason?: string }) =>
    api.patch<RiskAcceptance>(`/risks/acceptances/${acceptanceId}`, data).then(r => r.data),
};

// ─── Controls ────────────────────────────────────────────────────────────────

export interface ControlFilters {
  skip?: number;
  limit?: number;
  effectiveness?: string;
  design_effectiveness?: string;
  operating_effectiveness?: string;
  evidence_status?: string;
  implementation_status?: string;
  search?: string;
}

export const controlsApi = {
  list: (filters: ControlFilters = {}) =>
    api.get<Control[]>('/controls/', { params: filters }).then(r => r.data),

  get: (controlId: string) =>
    api.get<Control>(`/controls/${controlId}`).then(r => r.data),

  create: (data: Partial<Control>) =>
    api.post<Control>('/controls/', data).then(r => r.data),

  update: (controlId: string, data: Partial<Control>) =>
    api.patch<Control>(`/controls/${controlId}`, data).then(r => r.data),

  delete: (controlId: string) =>
    api.delete(`/controls/${controlId}`),

  // Control testing
  createTest: (controlId: string, data: Partial<ControlTest>) =>
    api.post<ControlTest>(`/controls/${controlId}/tests`, data).then(r => r.data),

  listTests: (controlId: string) =>
    api.get<ControlTest[]>(`/controls/${controlId}/tests`).then(r => r.data),

  // Evidence
  listEvidence: (controlId: string) =>
    api.get<Evidence[]>(`/controls/${controlId}/evidence`).then(r => r.data),

  uploadEvidence: (controlId: string, file: File, meta: { title?: string; description?: string; evidence_owner?: string }) => {
    const form = new FormData();
    form.append('file', file);
    if (meta.title) form.append('title', meta.title);
    if (meta.description) form.append('description', meta.description);
    if (meta.evidence_owner) form.append('evidence_owner', meta.evidence_owner);
    return api.post<Evidence>(`/controls/${controlId}/evidence`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then(r => r.data);
  },

  verifyEvidence: (evidenceId: string, data: { verification_status?: string; reviewer_comments?: string }) =>
    api.patch<Evidence>(`/controls/evidence/${evidenceId}/verify`, data).then(r => r.data),
};

// ─── Remediation ─────────────────────────────────────────────────────────────

export interface RemediationFilters {
  skip?: number;
  limit?: number;
  severity?: string;
  status?: string;
  owner?: string;
  overdue_only?: boolean;
  linked_risk_id?: string;
  search?: string;
}

export const remediationApi = {
  list: (filters: RemediationFilters = {}) =>
    api.get<RemediationItem[]>('/remediation/', { params: filters }).then(r => r.data),

  metrics: () =>
    api.get<RemediationMetrics>('/remediation/metrics').then(r => r.data),

  get: (findingId: string) =>
    api.get<RemediationItem>(`/remediation/${findingId}`).then(r => r.data),

  create: (data: Partial<RemediationItem>) =>
    api.post<RemediationItem>('/remediation/', data).then(r => r.data),

  update: (findingId: string, data: Partial<RemediationItem>) =>
    api.patch<RemediationItem>(`/remediation/${findingId}`, data).then(r => r.data),

  delete: (findingId: string) =>
    api.delete(`/remediation/${findingId}`),
};

// ─── Vendors ─────────────────────────────────────────────────────────────────

export interface VendorFilters {
  skip?: number;
  limit?: number;
  criticality?: string;
  data_sensitivity?: string;
  lifecycle_stage?: string;
  search?: string;
}

export const vendorsApi = {
  list: (filters: VendorFilters = {}) =>
    api.get<Vendor[]>('/vendors/', { params: filters }).then(r => r.data),

  summary: () =>
    api.get<Record<string, unknown>>('/vendors/risk-summary').then(r => r.data),

  get: (vendorId: string) =>
    api.get<Vendor>(`/vendors/${vendorId}`).then(r => r.data),

  create: (data: Partial<Vendor>) =>
    api.post<Vendor>('/vendors/', data).then(r => r.data),

  update: (vendorId: string, data: Partial<Vendor>) =>
    api.patch<Vendor>(`/vendors/${vendorId}`, data).then(r => r.data),

  delete: (vendorId: string) =>
    api.delete(`/vendors/${vendorId}`),
};

// ─── Maturity Assessment ──────────────────────────────────────────────────────

export const maturityApi = {
  list: () => api.get<MaturityAssessment[]>('/maturity').then(r => r.data),
  latest: () => api.get<MaturityAssessment | null>('/maturity/latest').then(r => r.data),
  get: (id: string) => api.get<MaturityAssessment>(`/maturity/${id}`).then(r => r.data),
  create: (data: Partial<MaturityAssessment>) =>
    api.post<MaturityAssessment>('/maturity', data).then(r => r.data),
  update: (id: string, data: Partial<MaturityAssessment>) =>
    api.patch<MaturityAssessment>(`/maturity/${id}`, data).then(r => r.data),
  gapAnalysis: (id: string) =>
    api.get<{ assessment_id: string; gap_analysis: GapAnalysisItem[]; disclaimer: string }>
    (`/maturity/${id}/gap-analysis`).then(r => r.data),
};

// ─── Compliance ───────────────────────────────────────────────────────────────

export const complianceApi = {
  frameworks: () => api.get<ComplianceFramework[]>('/compliance/frameworks').then(r => r.data),
  requirements: (frameworkId: string, params?: { assessment_status?: string; is_applicable?: boolean }) =>
    api.get<ComplianceRequirement[]>(`/compliance/frameworks/${frameworkId}/requirements`, { params })
      .then(r => r.data),
  updateRequirement: (requirementId: string, data: Partial<ComplianceRequirement>) =>
    api.patch<ComplianceRequirement>(`/compliance/requirements/${requirementId}`, data).then(r => r.data),
  summary: () =>
    api.get<{ disclaimer: string; frameworks: ComplianceSummaryItem[] }>('/compliance/summary').then(r => r.data),
};

// ─── Threats ─────────────────────────────────────────────────────────────────

export const threatsApi = {
  list: (riskRef?: string) =>
    api.get<ThreatScenario[]>('/threats', { params: riskRef ? { risk_ref: riskRef } : {} }).then(r => r.data),
  create: (data: Partial<ThreatScenario>) =>
    api.post<ThreatScenario>('/threats', data).then(r => r.data),
};

// ─── Audit Trail ──────────────────────────────────────────────────────────────

export const auditApi = {
  list: (params?: { entity_type?: string; action?: string; username?: string; skip?: number; limit?: number }) =>
    api.get<AuditLog[]>('/audit', { params }).then(r => r.data),
};

// ─── Dashboard & Reports ──────────────────────────────────────────────────────

export const reportsApi = {
  dashboard: () => api.get<DashboardStats>('/dashboard').then(r => r.data),
  full: () => api.get<Record<string, unknown>>('/reports/full').then(r => r.data),
  excel: () => `${api.defaults.baseURL}/reports/excel`,
  pdf: () => `${api.defaults.baseURL}/reports/pdf`,
  csvRisks: () => `${api.defaults.baseURL}/reports/csv/risks`,
  csvControls: () => `${api.defaults.baseURL}/reports/csv/controls`,
  csvRemediation: () => `${api.defaults.baseURL}/reports/csv/remediation`,
  csvVendors: () => `${api.defaults.baseURL}/reports/csv/vendors`,
  dossierSummary: () => api.get<DossierSummaryResponse>('/reports/dossier/summary').then(r => r.data),
  dossierDownloadUrl: (bundle: string = 'ALL') => `${api.defaults.baseURL}/reports/dossier/download?bundle=${bundle}`,
};

export const dossierApi = {
  getSummary: () => api.get<DossierSummaryResponse>('/reports/dossier/summary').then(r => r.data),
  getDownloadUrl: (bundle: string = 'ALL') => `${api.defaults.baseURL}/reports/dossier/download?bundle=${bundle}`,
};


// ─── AI Risk Advisor ──────────────────────────────────────────────────────────

export const advisorApi = {
  analyze: () => api.get<any>('/advisor/analyze').then(r => r.data),
};

// ─── Risk Simulation & Modeling ──────────────────────────────────────────────

export const simulationApi = {
  getInitiatives: () => api.get<StrategicInitiative[]>('/simulation/initiatives').then(r => r.data),
  runModel: (payload: SimulationRequest) =>
    api.post<SimulationResponse>('/simulation/model', payload).then(r => r.data),
};

// ─── Threat Intelligence & CISA KEV ──────────────────────────────────────────

export const threatIntelApi = {
  getFeed: (params?: { kev_only?: boolean; ransomware_only?: boolean }) =>
    api.get<ThreatIntelItem[]>('/threat-intel/feed', { params }).then(r => r.data),
  getSummary: () =>
    api.get<ThreatIntelSummary>('/threat-intel/summary').then(r => r.data),
  syncFeed: () =>
    api.post<{ status: string; sync_timestamp: string; ingested_cves: number; message: string }>('/threat-intel/sync')
      .then(r => r.data),
};

// ─── Cross-Framework Harmonization & Unified Compliance (Phase 14) ────────────

export const harmonizationApi = {
  getCrosswalk: () =>
    api.get<HarmonizationCrosswalkItem[]>('/harmonization/crosswalk').then(r => r.data),
  getPosture: () =>
    api.get<HarmonizedPosture>('/harmonization/posture').then(r => r.data),
  getAuditReadiness: () =>
    api.get<AuditReadinessResponse>('/harmonization/audit-readiness').then(r => r.data),
  evaluateControl: (payload: { control_id: string; proposed_effectiveness: string; justification?: string }) =>
    api.post<HarmonizedEvaluateResponse>('/harmonization/evaluate', payload).then(r => r.data),
};

// ─── Continuous Control Monitoring (CCM) & Telemetry (Phase 16) ──────────────

export const telemetryApi = {
  getConnectors: () => api.get<TelemetryConnector[]>('/telemetry/connectors').then(r => r.data),
  getEvents: (params?: { source?: string; severity?: string; limit?: number }) =>
    api.get<TelemetryEvent[]>('/telemetry/events', { params }).then(r => r.data),
  getStats: () => api.get<TelemetryStats>('/telemetry/stats').then(r => r.data),
  syncConnector: (connectorId: string) =>
    api.post<{ status: string; connector_id: string; sync_timestamp: string; current_health_score: number; message: string }>(
      `/telemetry/sync/${connectorId}`
    ).then(r => r.data),
  sendWebhook: (source: string, payload: { event_type: string; affected_control_id: string; severity?: string; details: string; automated_action?: string }) =>
    api.post<{ status: string; event_id: string; source: string; message: string }>(
      `/telemetry/webhook/${source}`,
      { source, ...payload }
    ).then(r => r.data),
};

// ─── Executive CISO Copilot (Phase 17) ───────────────────────────────────────

export const copilotApi = {
  getQuickPrompts: () => api.get<CopilotQuickPrompt[]>('/copilot/quick-prompts').then(r => r.data),
  chat: (message: string, history: Array<{ role: 'user' | 'assistant'; content: string }> = []) =>
    api.post<CopilotChatResponse>('/copilot/chat', { message, history }).then(r => r.data),
};

// ─── Backward compatibility exports ──────────────────────────────────────────


export const getDashboard = reportsApi.dashboard;
export const getRisks = (status?: string) => risksApi.list(status ? { status } : undefined);
export const createRisk = risksApi.create;
export const updateRisk = risksApi.update;
export const deleteRisk = risksApi.delete;
export const getControls = (params?: { category?: string; effectiveness?: string }) => controlsApi.list(params);
export const updateControl = controlsApi.update;
export const getRemediation = (status?: string) => remediationApi.list(status ? { status } : undefined);
export const updateRemediationItem = remediationApi.update;
export const getVendors = () => vendorsApi.list();
export const updateVendor = vendorsApi.update;
export const reseedDatabase = () => api.post('/admin/reseed').then(r => r.data);
export const downloadCsv = (resource: string) => {
  window.open(`/api/reports/csv/${resource}`, '_blank');
};
export const getFullReport = reportsApi.full;

export default api;

