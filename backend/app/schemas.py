"""
Pydantic schemas for RiskLens API request/response validation.
Schema version: 2.0  (Phase 1 — Risk Governance Engine)
"""
from __future__ import annotations
from datetime import date, datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, EmailStr


# ─── Risk Appetite Configuration ─────────────────────────────────────────────

class RiskAppetiteConfigBase(BaseModel):
    organisation_name: Optional[str] = "Apex Financial Services"
    max_acceptable_inherent_risk: int = Field(15, ge=1, le=25)
    max_acceptable_residual_risk: int = Field(9, ge=1, le=25)
    risk_tolerance_upper: int = Field(12, ge=1, le=25)
    escalation_threshold: int = Field(20, ge=1, le=25)
    risk_review_frequency_days: int = Field(90, ge=1)
    acceptance_max_duration_days: int = Field(365, ge=1)
    acceptance_authority_low: Optional[str] = "Risk Owner"
    acceptance_authority_medium: Optional[str] = "CISO"
    acceptance_authority_high: Optional[str] = "CRO"
    acceptance_authority_critical: Optional[str] = "Board / Risk Committee"
    appetite_statement: Optional[str] = None
    last_reviewed: Optional[date] = None
    reviewed_by: Optional[str] = None
    effective_date: Optional[date] = None


class RiskAppetiteConfigUpdate(BaseModel):
    max_acceptable_inherent_risk: Optional[int] = Field(None, ge=1, le=25)
    max_acceptable_residual_risk: Optional[int] = Field(None, ge=1, le=25)
    risk_tolerance_upper: Optional[int] = Field(None, ge=1, le=25)
    escalation_threshold: Optional[int] = Field(None, ge=1, le=25)
    risk_review_frequency_days: Optional[int] = None
    acceptance_max_duration_days: Optional[int] = None
    acceptance_authority_low: Optional[str] = None
    acceptance_authority_medium: Optional[str] = None
    acceptance_authority_high: Optional[str] = None
    acceptance_authority_critical: Optional[str] = None
    appetite_statement: Optional[str] = None
    last_reviewed: Optional[date] = None
    reviewed_by: Optional[str] = None
    effective_date: Optional[date] = None


class RiskAppetiteConfigOut(RiskAppetiteConfigBase):
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Risk Register ────────────────────────────────────────────────────────────

class RiskBase(BaseModel):
    title: str
    business_unit: Optional[str] = None
    category: str
    affected_asset: str
    asset_criticality: Optional[str] = None
    threat: str
    threat_actor: Optional[str] = None
    vulnerability: str
    threat_scenario: Optional[str] = None
    business_impact: str
    financial_impact: Optional[str] = None
    operational_impact: Optional[str] = None
    reputational_impact: Optional[str] = None
    regulatory_impact: Optional[str] = None
    likelihood: int = Field(..., ge=1, le=5)
    impact: int = Field(..., ge=1, le=5)
    existing_controls: Optional[str] = None
    control_effectiveness_pct: int = Field(0, ge=0, le=100)
    target_likelihood: Optional[int] = Field(None, ge=1, le=5)
    target_impact: Optional[int] = Field(None, ge=1, le=5)
    risk_trend: Optional[str] = "Not Assessed"
    risk_owner: str
    treatment_strategy: str
    status: str = "Open"
    acceptance_status: Optional[str] = "Not Applicable"
    last_assessment_date: Optional[date] = None
    review_date: Optional[date] = None
    next_review_date: Optional[date] = None
    notes: Optional[str] = None


class RiskCreate(RiskBase):
    pass


class RiskUpdate(BaseModel):
    title: Optional[str] = None
    business_unit: Optional[str] = None
    category: Optional[str] = None
    affected_asset: Optional[str] = None
    asset_criticality: Optional[str] = None
    threat: Optional[str] = None
    threat_actor: Optional[str] = None
    vulnerability: Optional[str] = None
    threat_scenario: Optional[str] = None
    business_impact: Optional[str] = None
    financial_impact: Optional[str] = None
    operational_impact: Optional[str] = None
    reputational_impact: Optional[str] = None
    regulatory_impact: Optional[str] = None
    likelihood: Optional[int] = Field(None, ge=1, le=5)
    impact: Optional[int] = Field(None, ge=1, le=5)
    existing_controls: Optional[str] = None
    control_effectiveness_pct: Optional[int] = Field(None, ge=0, le=100)
    target_likelihood: Optional[int] = Field(None, ge=1, le=5)
    target_impact: Optional[int] = Field(None, ge=1, le=5)
    risk_trend: Optional[str] = None
    risk_owner: Optional[str] = None
    treatment_strategy: Optional[str] = None
    status: Optional[str] = None
    acceptance_status: Optional[str] = None
    last_assessment_date: Optional[date] = None
    review_date: Optional[date] = None
    next_review_date: Optional[date] = None
    notes: Optional[str] = None


class RiskOut(RiskBase):
    id: int
    risk_id: str
    inherent_risk_score: int
    residual_risk_score: float
    target_risk_score: Optional[float] = None
    inherent_band: Optional[str] = None
    residual_band: Optional[str] = None
    target_band: Optional[str] = None
    exceeds_appetite: Optional[bool] = False

    model_config = {"from_attributes": True}


# ─── Risk Acceptance ──────────────────────────────────────────────────────────

class RiskAcceptanceCreate(BaseModel):
    business_justification: str
    compensating_controls: Optional[str] = None
    risk_owner: str
    approver_name: Optional[str] = None
    expiry_date: date
    review_date: Optional[date] = None


class RiskAcceptanceUpdate(BaseModel):
    approval_status: Optional[str] = None
    rejection_reason: Optional[str] = None
    approver_name: Optional[str] = None


class RiskAcceptanceOut(BaseModel):
    id: int
    acceptance_id: str
    risk_ref: Optional[str] = None
    business_justification: str
    compensating_controls: Optional[str] = None
    residual_risk_at_acceptance: float
    residual_band_at_acceptance: Optional[str] = None
    risk_owner: str
    approver_name: Optional[str] = None
    approval_status: str
    rejection_reason: Optional[str] = None
    approved_at: Optional[datetime] = None
    expiry_date: date
    review_date: Optional[date] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Control Assessment ───────────────────────────────────────────────────────

class ControlBase(BaseModel):
    control_name: Optional[str] = None
    framework_reference: str
    nist_csf_category: Optional[str] = None
    iso_27001_annex: Optional[str] = None
    control_objective: str
    control_domain: Optional[str] = None
    control_owner: str
    implementation_status: Optional[str] = "Not Implemented"
    evidence_description: Optional[str] = None
    evidence_status: str = "Pending"
    effectiveness: str = "Not Tested"
    design_effectiveness: Optional[str] = "Not Assessed"
    operating_effectiveness: Optional[str] = "Not Tested"
    assessment_result: Optional[str] = None
    identified_gap: Optional[str] = None
    deficiency_description: Optional[str] = None
    recommendation: Optional[str] = None
    last_testing_date: Optional[date] = None
    next_testing_date: Optional[date] = None
    review_date: Optional[date] = None


class ControlCreate(ControlBase):
    pass


class ControlUpdate(BaseModel):
    control_name: Optional[str] = None
    framework_reference: Optional[str] = None
    nist_csf_category: Optional[str] = None
    iso_27001_annex: Optional[str] = None
    control_objective: Optional[str] = None
    control_domain: Optional[str] = None
    control_owner: Optional[str] = None
    implementation_status: Optional[str] = None
    evidence_description: Optional[str] = None
    evidence_status: Optional[str] = None
    effectiveness: Optional[str] = None
    design_effectiveness: Optional[str] = None
    operating_effectiveness: Optional[str] = None
    assessment_result: Optional[str] = None
    identified_gap: Optional[str] = None
    deficiency_description: Optional[str] = None
    recommendation: Optional[str] = None
    last_testing_date: Optional[date] = None
    next_testing_date: Optional[date] = None
    review_date: Optional[date] = None


class ControlOut(ControlBase):
    id: int
    control_id: str

    model_config = {"from_attributes": True}


# ─── Control Testing ──────────────────────────────────────────────────────────

class ControlTestCreate(BaseModel):
    test_objective: str
    methodology: Optional[str] = None
    population_size: Optional[int] = None
    sample_size: Optional[int] = None
    sampling_method: Optional[str] = None
    sample_results: Optional[str] = None
    exceptions_identified: int = 0
    exception_description: Optional[str] = None
    tester: str
    reviewer: Optional[str] = None
    testing_period_start: Optional[date] = None
    testing_period_end: Optional[date] = None
    conclusion: str
    conclusion_narrative: Optional[str] = None


class ControlTestOut(ControlTestCreate):
    id: int
    test_id: str
    control_ref: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Evidence ─────────────────────────────────────────────────────────────────

class EvidenceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    control_ref: Optional[str] = None
    risk_ref: Optional[str] = None
    evidence_owner: str
    collection_date: Optional[date] = None
    review_date: Optional[date] = None
    expiry_date: Optional[date] = None
    version: str = "1.0"


class EvidenceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    verification_status: Optional[str] = None
    verified_by: Optional[str] = None
    reviewer_comments: Optional[str] = None
    review_date: Optional[date] = None
    expiry_date: Optional[date] = None


class EvidenceOut(EvidenceCreate):
    id: int
    evidence_id: str
    file_name: Optional[str] = None
    file_type: Optional[str] = None
    file_size_bytes: Optional[int] = None
    upload_timestamp: Optional[datetime] = None
    verification_status: str = "Unverified"
    verified_by: Optional[str] = None
    verified_at: Optional[datetime] = None
    reviewer_comments: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Remediation Tracker ──────────────────────────────────────────────────────

class RemediationBase(BaseModel):
    finding_title: str
    severity: str
    description: Optional[str] = None
    observation: Optional[str] = None
    criteria: Optional[str] = None
    root_cause: Optional[str] = None
    risk_consequence: Optional[str] = None
    business_impact: Optional[str] = None
    recommendation: str
    management_response: Optional[str] = None
    accountable_owner: str
    reviewer: Optional[str] = None
    closure_approver: Optional[str] = None
    target_date: Optional[date] = None
    status: str = "Open"
    closure_evidence: Optional[str] = None
    linked_risk_id: Optional[str] = None
    linked_control_id: Optional[str] = None
    created_date: Optional[date] = None


class RemediationCreate(RemediationBase):
    pass


class RemediationUpdate(BaseModel):
    finding_title: Optional[str] = None
    severity: Optional[str] = None
    description: Optional[str] = None
    observation: Optional[str] = None
    criteria: Optional[str] = None
    root_cause: Optional[str] = None
    risk_consequence: Optional[str] = None
    business_impact: Optional[str] = None
    recommendation: Optional[str] = None
    management_response: Optional[str] = None
    accountable_owner: Optional[str] = None
    reviewer: Optional[str] = None
    closure_approver: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    closure_evidence: Optional[str] = None
    linked_risk_id: Optional[str] = None
    linked_control_id: Optional[str] = None
    closure_approval_date: Optional[date] = None
    actual_closure_date: Optional[date] = None


class RemediationOut(RemediationBase):
    id: int
    finding_id: str
    closure_approval_date: Optional[date] = None
    assigned_date: Optional[date] = None
    actual_closure_date: Optional[date] = None

    model_config = {"from_attributes": True}


# ─── Vendor Risk ──────────────────────────────────────────────────────────────

class VendorBase(BaseModel):
    name: str
    service_category: str
    data_sensitivity: str
    access_privileges: Optional[str] = None
    criticality: str
    lifecycle_stage: Optional[str] = "Active"
    inherent_risk_score: int = Field(..., ge=1, le=25)
    control_weaknesses: Optional[str] = None
    residual_risk_score: int = Field(..., ge=1, le=25)
    cloud_dependency: Optional[bool] = False
    data_location: Optional[str] = None
    subcontractor_dependency: Optional[str] = None
    security_certifications: Optional[str] = None
    soc2_type2_status: Optional[str] = None
    soc2_report_date: Optional[date] = None
    incident_history: Optional[str] = None
    notification_commitments: Optional[str] = None
    contractual_security_clauses: Optional[bool] = False
    business_continuity_reviewed: Optional[bool] = False
    disaster_recovery_reviewed: Optional[bool] = False
    business_justification: Optional[str] = None
    recommended_actions: Optional[str] = None
    contract_review_date: Optional[date] = None
    assessment_date: Optional[date] = None
    next_assessment_date: Optional[date] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    service_category: Optional[str] = None
    data_sensitivity: Optional[str] = None
    access_privileges: Optional[str] = None
    criticality: Optional[str] = None
    lifecycle_stage: Optional[str] = None
    inherent_risk_score: Optional[int] = Field(None, ge=1, le=25)
    control_weaknesses: Optional[str] = None
    residual_risk_score: Optional[int] = Field(None, ge=1, le=25)
    cloud_dependency: Optional[bool] = None
    data_location: Optional[str] = None
    subcontractor_dependency: Optional[str] = None
    security_certifications: Optional[str] = None
    soc2_type2_status: Optional[str] = None
    soc2_report_date: Optional[date] = None
    incident_history: Optional[str] = None
    notification_commitments: Optional[str] = None
    contractual_security_clauses: Optional[bool] = None
    business_continuity_reviewed: Optional[bool] = None
    disaster_recovery_reviewed: Optional[bool] = None
    business_justification: Optional[str] = None
    recommended_actions: Optional[str] = None
    contract_review_date: Optional[date] = None
    assessment_date: Optional[date] = None
    next_assessment_date: Optional[date] = None
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None


class VendorOut(VendorBase):
    id: int
    vendor_id: str

    model_config = {"from_attributes": True}


# ─── NIST CSF Maturity Assessment ─────────────────────────────────────────────

class MaturityAssessmentCreate(BaseModel):
    organisation_name: Optional[str] = "Apex Financial Services"
    assessment_date: date
    assessor: Optional[str] = None
    scope_description: Optional[str] = None
    govern_current: Optional[str] = None
    identify_current: Optional[str] = None
    protect_current: Optional[str] = None
    detect_current: Optional[str] = None
    respond_current: Optional[str] = None
    recover_current: Optional[str] = None
    govern_target: Optional[str] = None
    identify_target: Optional[str] = None
    protect_target: Optional[str] = None
    detect_target: Optional[str] = None
    respond_target: Optional[str] = None
    recover_target: Optional[str] = None
    govern_justification: Optional[str] = None
    identify_justification: Optional[str] = None
    protect_justification: Optional[str] = None
    detect_justification: Optional[str] = None
    respond_justification: Optional[str] = None
    recover_justification: Optional[str] = None
    govern_evidence: Optional[str] = None
    identify_evidence: Optional[str] = None
    protect_evidence: Optional[str] = None
    detect_evidence: Optional[str] = None
    respond_evidence: Optional[str] = None
    recover_evidence: Optional[str] = None
    overall_assessment: Optional[str] = None
    improvement_roadmap: Optional[str] = None


class MaturityAssessmentUpdate(MaturityAssessmentCreate):
    assessment_date: Optional[date] = None


class MaturityAssessmentOut(MaturityAssessmentCreate):
    id: int
    assessment_id: str
    disclaimer: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Compliance Framework ─────────────────────────────────────────────────────

class ComplianceFrameworkOut(BaseModel):
    id: int
    framework_id: str
    name: str
    version: Optional[str] = None
    issuing_body: Optional[str] = None
    is_regulatory: bool = False
    applicability_note: Optional[str] = None

    model_config = {"from_attributes": True}


class ComplianceRequirementCreate(BaseModel):
    framework_ref: str
    title: str
    description: Optional[str] = None
    requirement_text: Optional[str] = None
    is_applicable: bool = True
    applicability_justification: Optional[str] = None
    assessment_status: str = "Not Assessed"
    identified_gap: Optional[str] = None
    remediation_recommendation: Optional[str] = None
    responsible_owner: Optional[str] = None
    mapped_control_ids: Optional[List[str]] = None
    evidence_refs: Optional[List[str]] = None
    last_assessed_date: Optional[date] = None
    next_assessment_date: Optional[date] = None


class ComplianceRequirementUpdate(BaseModel):
    is_applicable: Optional[bool] = None
    applicability_justification: Optional[str] = None
    assessment_status: Optional[str] = None
    identified_gap: Optional[str] = None
    remediation_recommendation: Optional[str] = None
    responsible_owner: Optional[str] = None
    mapped_control_ids: Optional[List[str]] = None
    evidence_refs: Optional[List[str]] = None
    last_assessed_date: Optional[date] = None
    next_assessment_date: Optional[date] = None


class ComplianceRequirementOut(ComplianceRequirementCreate):
    id: int
    requirement_id: str
    framework_id: Optional[int] = None

    model_config = {"from_attributes": True}


# ─── Threat Scenarios ─────────────────────────────────────────────────────────

class ThreatScenarioCreate(BaseModel):
    risk_ref: Optional[str] = None
    title: str
    threat_actor_category: Optional[str] = None
    threat_actor_motivation: Optional[str] = None
    attack_techniques: Optional[List[dict]] = None  # [{id, name, tactic}]
    target_asset: Optional[str] = None
    attack_preconditions: Optional[str] = None
    preventive_controls: Optional[str] = None
    detective_controls: Optional[str] = None
    detection_gaps: Optional[str] = None
    business_consequences: Optional[str] = None
    recommended_mitigations: Optional[str] = None


class ThreatScenarioOut(ThreatScenarioCreate):
    id: int
    scenario_id: str
    disclaimer: Optional[str] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


# ─── Authentication ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    username: str
    email: str
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = None
    role: str = "Auditor"
    business_unit: Optional[str] = None


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    business_unit: Optional[str] = None
    role: Optional[str] = None
    is_active: Optional[bool] = None


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str] = None
    role: str
    business_unit: Optional[str] = None
    is_active: bool
    created_at: Optional[datetime] = None
    last_login: Optional[datetime] = None

    model_config = {"from_attributes": True}


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int   # seconds
    user: UserOut


class RefreshRequest(BaseModel):
    refresh_token: str


# ─── Audit Trail ──────────────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    username: Optional[str] = None
    user_role: Optional[str] = None
    action: str
    entity_type: str
    entity_id: Optional[str] = None
    before_values: Optional[Any] = None
    after_values: Optional[Any] = None
    change_summary: Optional[str] = None
    ip_address: Optional[str] = None
    change_justification: Optional[str] = None
    timestamp: datetime

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_risks: int
    critical_risks: int
    high_risks: int
    medium_risks: int
    low_risks: int
    risks_exceeding_appetite: int
    open_control_gaps: int
    overdue_remediation: int
    open_remediation: int
    total_vendors: int
    critical_vendors: int
    risk_by_category: list[dict]
    risk_distribution: list[dict]
    remediation_by_status: list[dict]
    control_effectiveness_summary: list[dict]
    residual_risk_distribution: list[dict]
    risk_by_business_unit: list[dict]
    control_design_vs_operating: list[dict]
