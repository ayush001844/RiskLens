"""
Pydantic schemas for RiskLens API request/response validation.
"""
from __future__ import annotations
from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


# ─── Risk ────────────────────────────────────────────────────────────────────

class RiskBase(BaseModel):
    title: str
    category: str
    affected_asset: str
    threat: str
    vulnerability: str
    business_impact: str
    likelihood: int = Field(..., ge=1, le=5)
    impact: int = Field(..., ge=1, le=5)
    existing_controls: Optional[str] = None
    control_effectiveness_pct: int = Field(0, ge=0, le=100)
    risk_owner: str
    treatment_strategy: str
    status: str = "Open"
    review_date: Optional[date] = None
    notes: Optional[str] = None


class RiskCreate(RiskBase):
    pass


class RiskUpdate(BaseModel):
    title: Optional[str] = None
    category: Optional[str] = None
    affected_asset: Optional[str] = None
    threat: Optional[str] = None
    vulnerability: Optional[str] = None
    business_impact: Optional[str] = None
    likelihood: Optional[int] = Field(None, ge=1, le=5)
    impact: Optional[int] = Field(None, ge=1, le=5)
    existing_controls: Optional[str] = None
    control_effectiveness_pct: Optional[int] = Field(None, ge=0, le=100)
    risk_owner: Optional[str] = None
    treatment_strategy: Optional[str] = None
    status: Optional[str] = None
    review_date: Optional[date] = None
    notes: Optional[str] = None


class RiskOut(RiskBase):
    id: int
    risk_id: str
    inherent_risk_score: int
    residual_risk_score: float
    inherent_band: Optional[str] = None
    residual_band: Optional[str] = None

    model_config = {"from_attributes": True}


# ─── Control ─────────────────────────────────────────────────────────────────

class ControlBase(BaseModel):
    framework_reference: str
    nist_csf_category: Optional[str] = None
    iso_27001_annex: Optional[str] = None
    control_objective: str
    control_owner: str
    evidence_description: Optional[str] = None
    evidence_status: str = "Pending"
    effectiveness: str = "Not Tested"
    assessment_result: Optional[str] = None
    identified_gap: Optional[str] = None
    recommendation: Optional[str] = None
    review_date: Optional[date] = None


class ControlCreate(ControlBase):
    pass


class ControlUpdate(BaseModel):
    framework_reference: Optional[str] = None
    nist_csf_category: Optional[str] = None
    iso_27001_annex: Optional[str] = None
    control_objective: Optional[str] = None
    control_owner: Optional[str] = None
    evidence_description: Optional[str] = None
    evidence_status: Optional[str] = None
    effectiveness: Optional[str] = None
    assessment_result: Optional[str] = None
    identified_gap: Optional[str] = None
    recommendation: Optional[str] = None
    review_date: Optional[date] = None


class ControlOut(ControlBase):
    id: int
    control_id: str

    model_config = {"from_attributes": True}


# ─── Remediation ─────────────────────────────────────────────────────────────

class RemediationBase(BaseModel):
    finding_title: str
    severity: str
    description: Optional[str] = None
    recommendation: str
    accountable_owner: str
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
    recommendation: Optional[str] = None
    accountable_owner: Optional[str] = None
    target_date: Optional[date] = None
    status: Optional[str] = None
    closure_evidence: Optional[str] = None
    linked_risk_id: Optional[str] = None
    linked_control_id: Optional[str] = None


class RemediationOut(RemediationBase):
    id: int
    finding_id: str

    model_config = {"from_attributes": True}


# ─── Vendor ──────────────────────────────────────────────────────────────────

class VendorBase(BaseModel):
    name: str
    service_category: str
    data_sensitivity: str
    access_privileges: Optional[str] = None
    criticality: str
    inherent_risk_score: int = Field(..., ge=1, le=25)
    control_weaknesses: Optional[str] = None
    residual_risk_score: int = Field(..., ge=0, le=25)
    recommended_actions: Optional[str] = None
    contract_review_date: Optional[date] = None
    assessment_date: Optional[date] = None
    contact_name: Optional[str] = None


class VendorCreate(VendorBase):
    pass


class VendorUpdate(BaseModel):
    name: Optional[str] = None
    service_category: Optional[str] = None
    data_sensitivity: Optional[str] = None
    access_privileges: Optional[str] = None
    criticality: Optional[str] = None
    inherent_risk_score: Optional[int] = Field(None, ge=1, le=25)
    control_weaknesses: Optional[str] = None
    residual_risk_score: Optional[int] = Field(None, ge=0, le=25)
    recommended_actions: Optional[str] = None
    contract_review_date: Optional[date] = None
    assessment_date: Optional[date] = None
    contact_name: Optional[str] = None


class VendorOut(VendorBase):
    id: int
    vendor_id: str

    model_config = {"from_attributes": True}


# ─── Dashboard ───────────────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_risks: int
    critical_risks: int
    high_risks: int
    medium_risks: int
    low_risks: int
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
