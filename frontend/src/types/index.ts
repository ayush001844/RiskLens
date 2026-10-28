// TypeScript types mirroring backend Pydantic schemas

export type ScoreBand = 'Low' | 'Medium' | 'High' | 'Critical'

export interface Risk {
  id: number
  risk_id: string
  title: string
  category: string
  affected_asset: string
  threat: string
  vulnerability: string
  business_impact: string
  likelihood: number
  impact: number
  inherent_risk_score: number
  inherent_band?: ScoreBand
  control_effectiveness_pct: number
  residual_risk_score: number
  residual_band?: ScoreBand
  existing_controls?: string
  risk_owner: string
  treatment_strategy: string
  status: string
  review_date?: string
  notes?: string
}

export interface Control {
  id: number
  control_id: string
  framework_reference: string
  nist_csf_category?: string
  iso_27001_annex?: string
  control_objective: string
  control_owner: string
  evidence_description?: string
  evidence_status: string
  effectiveness: string
  assessment_result?: string
  identified_gap?: string
  recommendation?: string
  review_date?: string
}

export interface RemediationItem {
  id: number
  finding_id: string
  finding_title: string
  severity: string
  description?: string
  recommendation: string
  accountable_owner: string
  target_date?: string
  status: string
  closure_evidence?: string
  linked_risk_id?: string
  linked_control_id?: string
  created_date?: string
}

export interface Vendor {
  id: number
  vendor_id: string
  name: string
  service_category: string
  data_sensitivity: string
  access_privileges?: string
  criticality: string
  inherent_risk_score: number
  control_weaknesses?: string
  residual_risk_score: number
  recommended_actions?: string
  contract_review_date?: string
  assessment_date?: string
  contact_name?: string
}

export interface DashboardStats {
  total_risks: number
  critical_risks: number
  high_risks: number
  medium_risks: number
  low_risks: number
  open_control_gaps: number
  overdue_remediation: number
  open_remediation: number
  total_vendors: number
  critical_vendors: number
  risk_by_category: Array<{ category: string; count: number }>
  risk_distribution: Array<{ band: string; count: number }>
  remediation_by_status: Array<{ status: string; count: number }>
  control_effectiveness_summary: Array<{ effectiveness: string; count: number }>
  residual_risk_distribution: Array<{ band: string; count: number }>
}
