/**
 * TypeScript interfaces for RiskLens v2.0
 * All entities mirror backend Pydantic schemas exactly.
 *
 * ⚠️ ALL DATA IS SYNTHETIC / DEMO DATA representing the fictional
 *    company "Apex Financial Services". No real persons or organisations
 *    are represented.
 */

// ─── Risk Appetite ──────────────────────────────────────────────────────────

export interface RiskAppetiteConfig {
  id: number;
  organisation_name: string;
  max_acceptable_inherent_risk: number;
  max_acceptable_residual_risk: number;
  risk_tolerance_upper: number;
  escalation_threshold: number;
  risk_review_frequency_days: number;
  acceptance_max_duration_days: number;
  acceptance_authority_low: string;
  acceptance_authority_medium: string;
  acceptance_authority_high: string;
  acceptance_authority_critical: string;
  appetite_statement: string | null;
  last_reviewed: string | null;
  reviewed_by: string | null;
  effective_date: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── Risk Register ───────────────────────────────────────────────────────────

export interface Risk {
  id: number;
  risk_id: string;
  title: string;
  business_unit: string | null;
  category: string;
  affected_asset: string;
  asset_criticality: string | null;
  threat: string;
  threat_actor: string | null;
  vulnerability: string;
  threat_scenario: string | null;
  business_impact: string;
  financial_impact: string | null;
  operational_impact: string | null;
  reputational_impact: string | null;
  regulatory_impact: string | null;
  likelihood: number;
  impact: number;
  inherent_risk_score: number;
  inherent_band: string | null;
  existing_controls: string | null;
  control_effectiveness_pct: number;
  residual_risk_score: number;
  residual_band: string | null;
  target_likelihood: number | null;
  target_impact: number | null;
  target_risk_score: number | null;
  target_band: string | null;
  risk_trend: string | null;
  exceeds_appetite: boolean;
  risk_owner: string;
  treatment_strategy: string;
  status: string;
  acceptance_status: string | null;
  last_assessment_date: string | null;
  review_date: string | null;
  next_review_date: string | null;
  notes: string | null;
}

// ─── Risk Acceptance ──────────────────────────────────────────────────────────

export interface RiskAcceptance {
  id: number;
  acceptance_id: string;
  risk_ref: string | null;
  business_justification: string;
  compensating_controls: string | null;
  residual_risk_at_acceptance: number;
  residual_band_at_acceptance: string | null;
  risk_owner: string;
  approver_name: string | null;
  approval_status: string;
  rejection_reason: string | null;
  approved_at: string | null;
  expiry_date: string;
  review_date: string | null;
  created_at: string | null;
}

// ─── Control Assessment ───────────────────────────────────────────────────────

export interface Control {
  id: number;
  control_id: string;
  control_name: string | null;
  framework_reference: string;
  nist_csf_category: string | null;
  iso_27001_annex: string | null;
  control_objective: string;
  control_domain: string | null;
  control_owner: string;
  implementation_status: string | null;
  evidence_description: string | null;
  evidence_status: string;
  effectiveness: string;
  design_effectiveness: string | null;
  operating_effectiveness: string | null;
  assessment_result: string | null;
  identified_gap: string | null;
  deficiency_description: string | null;
  recommendation: string | null;
  last_testing_date: string | null;
  next_testing_date: string | null;
  review_date: string | null;
}

// ─── Control Test ─────────────────────────────────────────────────────────────

export interface ControlTest {
  id: number;
  test_id: string;
  control_ref: string | null;
  test_objective: string;
  methodology: string | null;
  population_size: number | null;
  sample_size: number | null;
  sampling_method: string | null;
  sample_results: string | null;
  exceptions_identified: number;
  exception_description: string | null;
  tester: string;
  reviewer: string | null;
  testing_period_start: string | null;
  testing_period_end: string | null;
  conclusion: string;
  conclusion_narrative: string | null;
  created_at: string | null;
}

// ─── Evidence ─────────────────────────────────────────────────────────────────

export interface Evidence {
  id: number;
  evidence_id: string;
  title: string;
  description: string | null;
  control_ref: string | null;
  risk_ref: string | null;
  evidence_owner: string;
  collection_date: string | null;
  review_date: string | null;
  expiry_date: string | null;
  version: string;
  file_name: string | null;
  file_type: string | null;
  file_size_bytes: number | null;
  upload_timestamp: string | null;
  verification_status: string;
  verified_by: string | null;
  verified_at: string | null;
  reviewer_comments: string | null;
}

// ─── Remediation Tracker ──────────────────────────────────────────────────────

export interface RemediationItem {
  id: number;
  finding_id: string;
  finding_title: string;
  severity: string;
  description: string | null;
  observation: string | null;
  criteria: string | null;
  root_cause: string | null;
  risk_consequence: string | null;
  business_impact: string | null;
  recommendation: string;
  management_response: string | null;
  accountable_owner: string;
  reviewer: string | null;
  closure_approver: string | null;
  target_date: string | null;
  status: string;
  closure_evidence: string | null;
  closure_approval_date: string | null;
  linked_risk_id: string | null;
  linked_control_id: string | null;
  created_date: string | null;
  assigned_date: string | null;
  actual_closure_date: string | null;
}

export interface RemediationMetrics {
  total_open: number;
  critical_open: number;
  overdue: number;
  closed: number;
  total: number;
  remediation_rate_pct: number;
  avg_closure_days: number | null;
  open_by_severity: Record<string, number>;
}

// ─── Vendor Risk ──────────────────────────────────────────────────────────────

export interface Vendor {
  id: number;
  vendor_id: string;
  name: string;
  service_category: string;
  data_sensitivity: string;
  access_privileges: string | null;
  criticality: string;
  lifecycle_stage: string | null;
  inherent_risk_score: number;
  control_weaknesses: string | null;
  residual_risk_score: number;
  cloud_dependency: boolean;
  data_location: string | null;
  subcontractor_dependency: string | null;
  security_certifications: string | null;
  soc2_type2_status: string | null;
  soc2_report_date: string | null;
  incident_history: string | null;
  notification_commitments: string | null;
  contractual_security_clauses: boolean;
  business_continuity_reviewed: boolean;
  disaster_recovery_reviewed: boolean;
  business_justification: string | null;
  recommended_actions: string | null;
  contract_review_date: string | null;
  assessment_date: string | null;
  next_assessment_date: string | null;
  contact_name: string | null;
  contact_email: string | null;
}

// ─── NIST CSF Maturity ───────────────────────────────────────────────────────

export type MaturityTier =
  | 'Tier 1 - Partial'
  | 'Tier 2 - Risk Informed'
  | 'Tier 3 - Repeatable'
  | 'Tier 4 - Adaptive'
  | null;

export interface MaturityAssessment {
  id: number;
  assessment_id: string;
  organisation_name: string;
  assessment_date: string;
  assessor: string | null;
  scope_description: string | null;
  govern_current: MaturityTier;
  identify_current: MaturityTier;
  protect_current: MaturityTier;
  detect_current: MaturityTier;
  respond_current: MaturityTier;
  recover_current: MaturityTier;
  govern_target: MaturityTier;
  identify_target: MaturityTier;
  protect_target: MaturityTier;
  detect_target: MaturityTier;
  respond_target: MaturityTier;
  recover_target: MaturityTier;
  govern_justification: string | null;
  identify_justification: string | null;
  protect_justification: string | null;
  detect_justification: string | null;
  respond_justification: string | null;
  recover_justification: string | null;
  overall_assessment: string | null;
  improvement_roadmap: string | null;
  disclaimer: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface GapAnalysisItem {
  function: string;
  current_tier: MaturityTier;
  target_tier: MaturityTier;
  current_value: number;
  target_value: number;
  gap: number;
  gap_label: string;
  justification: string | null;
}

// ─── Compliance ───────────────────────────────────────────────────────────────

export interface ComplianceFramework {
  id: number;
  framework_id: string;
  name: string;
  version: string | null;
  issuing_body: string | null;
  is_regulatory: boolean;
  applicability_note: string | null;
}

export interface ComplianceRequirement {
  id: number;
  requirement_id: string;
  framework_ref: string | null;
  title: string;
  description: string | null;
  is_applicable: boolean;
  applicability_justification: string | null;
  assessment_status: string;
  identified_gap: string | null;
  remediation_recommendation: string | null;
  responsible_owner: string | null;
  mapped_control_ids: string[] | null;
  last_assessed_date: string | null;
}

export interface ComplianceSummaryItem {
  framework_id: string;
  framework_name: string;
  is_regulatory: boolean;
  total_applicable: number;
  compliant: number;
  partially_compliant: number;
  non_compliant: number;
  not_assessed: number;
  compliance_pct: number;
}

// ─── Threat Scenarios ─────────────────────────────────────────────────────────

export interface AttackTechnique {
  id: string;
  name: string;
  tactic: string;
}

export interface ThreatScenario {
  id: number;
  scenario_id: string;
  risk_ref: string | null;
  title: string;
  threat_actor_category: string | null;
  threat_actor_motivation: string | null;
  attack_techniques: AttackTechnique[] | null;
  target_asset: string | null;
  attack_preconditions: string | null;
  preventive_controls: string | null;
  detective_controls: string | null;
  detection_gaps: string | null;
  business_consequences: string | null;
  recommended_mitigations: string | null;
  disclaimer: string | null;
  created_at: string | null;
}

// ─── Authentication ───────────────────────────────────────────────────────────

export interface User {
  id: number;
  username: string;
  email: string;
  full_name: string | null;
  role: string;
  business_unit: string | null;
  is_active: boolean;
  created_at: string | null;
  last_login: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

// ─── Audit Trail ──────────────────────────────────────────────────────────────

export interface AuditLog {
  id: number;
  username: string | null;
  user_role: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_values: Record<string, unknown> | null;
  after_values: Record<string, unknown> | null;
  change_summary: string | null;
  ip_address: string | null;
  change_justification: string | null;
  timestamp: string;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  total_risks: number;
  critical_risks: number;
  high_risks: number;
  medium_risks: number;
  low_risks: number;
  risks_exceeding_appetite: number;
  open_control_gaps: number;
  overdue_remediation: number;
  open_remediation: number;
  total_vendors: number;
  critical_vendors: number;
  risk_by_category: { category: string; count: number }[];
  risk_distribution: { band: string; count: number }[];
  remediation_by_status: { status: string; count: number }[];
  control_effectiveness_summary: { effectiveness: string; count: number }[];
  residual_risk_distribution: { band: string; count: number }[];
  risk_by_business_unit: { business_unit: string; count: number }[];
  control_design_vs_operating: Record<string, string | number>[];
}

// ─── Auth State ───────────────────────────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
}

// ─── Simulation & Modeling ───────────────────────────────────────────────────

export interface StrategicInitiative {
  id: string;
  name: string;
  category: string;
  estimated_cost_usd: number;
  affected_controls: { control_id: string; proposed_effectiveness_pct: number }[];
  affected_risk_ids?: string[];
  proposed_risk_effectiveness_pct?: number;
  rationale: string;
}

export interface SimulationRequest {
  threat_multiplier: number;
  custom_adjustments?: { control_id: string; proposed_effectiveness_pct: number }[];
  enabled_initiatives?: string[];
}

export interface SimulatedRisk {
  risk_id: string;
  title: string;
  category: string;
  baseline_inherent: number;
  baseline_residual: number;
  baseline_band: string;
  simulated_residual: number;
  simulated_band: string;
  delta: number;
  appetite_compliant: boolean;
}

export interface SimulationResponse {
  threat_multiplier: number;
  active_initiative_count: number;
  total_investment_cost_usd: number;
  baseline_summary: {
    avg_residual_score: number;
    critical_risks: number;
    high_risks: number;
    risks_exceeding_appetite: number;
  };
  simulated_summary: {
    avg_residual_score: number;
    critical_risks: number;
    high_risks: number;
    risks_exceeding_appetite: number;
    risk_reduction_pct: number;
    appetite_violations_resolved: number;
    estimated_monetary_risk_reduction_usd: number;
    return_on_security_investment_rosi_pct: number;
  };
  simulated_risks: SimulatedRisk[];
}

// ─── Threat Intelligence & CISA KEV ──────────────────────────────────────────

export interface ThreatIntelItem {
  cve_id: string;
  title: string;
  vendor_project: string;
  product: string;
  cvss_score: number;
  cvss_vector: string;
  cisa_kev_listed: boolean;
  date_added_to_kev: string;
  due_date: string;
  known_ransomware_campaign_use: string;
  epss_score: number;
  threat_actor: string;
  target_asset_category: string;
  target_asset_pattern: string;
  correlated_risk_id: string;
  mitigation_guidance: string;
  exposure_level: 'Critical' | 'High' | 'Medium' | 'Low';
  correlation_status: string;
  linked_risk: {
    risk_id: string;
    title: string;
    residual_score: number;
    affected_asset: string;
    owner: string;
    status: string;
  } | null;
}

export interface ThreatIntelSummary {
  total_monitored_cves: number;
  cisa_kev_listed_cves: number;
  known_ransomware_vectors: number;
  correlated_active_risk_matches: number;
  critical_asset_exposures: number;
  impacted_asset_count: number;
  primary_threat_vectors: string[];
  compliance_sla_note: string;
}

// ─── Cross-Framework Harmonization & Unified Compliance (Phase 14) ────────────

export interface RegulatoryFrameworkRef {
  ref: string;
  name: string;
}

export interface HarmonizationCrosswalkItem {
  ccf_id: string;
  domain: string;
  control_title: string;
  primary_control_id: string;
  control_effectiveness: 'Effective' | 'Partially Effective' | 'Ineffective' | 'Not Tested';
  auto_satisfaction_status: string;
  satisfaction_badge: 'compliant' | 'partial' | 'non-compliant';
  linked_risk: {
    risk_id: string;
    title: string;
    residual_score: number;
    residual_band: string;
  } | null;
  mappings: {
    nist_csf_2: RegulatoryFrameworkRef;
    iso_27001_2022: RegulatoryFrameworkRef;
    rbi_csf: RegulatoryFrameworkRef;
    dpdp_act_2023: RegulatoryFrameworkRef;
    pci_dss_v4: RegulatoryFrameworkRef;
  };
  framework_mappings?: Record<string, RegulatoryFrameworkRef>;
}

export interface HarmonizedPosture {
  total_unified_controls: number;
  effective_controls: number;
  partially_effective_controls: number;
  ineffective_controls: number;
  harmonized_compliance_index_pct: number;
  audit_efficiency_multiplier: number;
  total_regulatory_requirements_satisfied: number;
  total_regulatory_obligations_satisfied: number;
  total_applicable_regulations_monitored: number;
  framework_scores: {
    nist_csf_2: number;
    iso_27001_2022: number;
    rbi_csf: number;
    rbi_cyber_security?: number;
    dpdp_act_2023: number;
    pci_dss_v4: number;
  };
}

export interface AuditScorecard {
  regulator: string;
  regulatory_authority?: string;
  audit_type: string;
  readiness_verdict: string;
  pass_probability_pct: number;
  critical_audit_redlines: string[];
  statutory_risk: string;
}

export interface AuditReadinessResponse {
  organization: string;
  methodology: string;
  audit_scorecards: AuditScorecard[];
  framework_scorecards: AuditScorecard[];
  executive_recommendation: string;
}

export interface HarmonizedEvaluateResponse {
  control_id: string;
  previous_effectiveness: string;
  new_effectiveness: string;
  proposed_effectiveness?: string;
  status: string;
  harmonized_propagation: Array<{
    framework_key: string;
    framework_name: string;
    status: string;
  }>;
  audit_efficiency_message: string;
}

// ─── Phase 15: Regulatory Audit Dossier & Evidence Packages ──────────────────

export interface DossierBundle {
  bundle_id: 'ALL' | 'RBI' | 'DPBI' | 'PCI_SSC';
  name: string;
  description: string;
  statutory_mandate: string;
  file_count: number;
  estimated_size_kb: number;
}

export interface DossierFileItem {
  filename: string;
  type: string;
  description: string;
}

export interface DossierSummaryResponse {
  organization: string;
  dossier_reference: string;
  generation_date: string;
  classification: string;
  signatories: Array<{ name: string; title: string; entity?: string }>;
  available_bundles: DossierBundle[];
  dossier_contents: DossierFileItem[];
}

// ─── Phase 16: Continuous Control Monitoring (CCM) & Telemetry ───────────────

export interface TelemetryConnector {
  connector_id: string;
  name: string;
  provider: string;
  status: 'CONNECTED' | 'DEGRADED' | 'DISCONNECTED';
  health_score: number;
  monitored_controls: string[];
  ccf_domain: string;
  last_sync_timestamp: string;
  metrics: Record<string, any>;
  drift_summary: string;
}

export interface TelemetryEvent {
  event_id: string;
  timestamp: string;
  source: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  affected_control_id: string;
  title: string;
  message: string;
  automated_action: string;
  status: string;
}

export interface TelemetryStats {
  organization: string;
  continuous_monitoring_status: string;
  total_active_connectors: number;
  healthy_connectors: number;
  telemetry_health_index_pct: number;
  active_drift_incidents: {
    critical: number;
    warning: number;
    total_open: number;
  };
  monitored_controls_count: number;
  monitored_infrastructure_scope: string;
  compliance_synchronization: string;
}

// ─── Phase 17: Interactive Executive Q&A & CISO Copilot ──────────────────────

export interface CopilotMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface CopilotChatResponse {
  response: string;
  sources: Array<{ type: string; id: string; title: string }>;
  suggested_followups: string[];
  timestamp: string;
}

export interface CopilotQuickPrompt {
  id: string;
  category: string;
  title: string;
  prompt: string;
}



