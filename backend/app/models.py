"""
SQLAlchemy ORM models for RiskLens.

All data in this application is SYNTHETIC / DEMO DATA created to simulate
a cybersecurity consulting engagement for the fictional company
"Apex Financial Services". No real organisation, person, or system is
represented. Do not use these records for actual compliance determinations.
"""
from datetime import date
from sqlalchemy import Column, Integer, String, Float, Date, Text, Enum
import enum
from app.database import Base


# ──────────────────────────────────────────────
# Enumerations
# ──────────────────────────────────────────────

class RiskStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    ACCEPTED = "Accepted"
    CLOSED = "Closed"
    TRANSFERRED = "Transferred"


class TreatmentStrategy(str, enum.Enum):
    MITIGATE = "Mitigate"
    ACCEPT = "Accept"
    TRANSFER = "Transfer"
    AVOID = "Avoid"


class ControlEffectiveness(str, enum.Enum):
    EFFECTIVE = "Effective"
    PARTIALLY_EFFECTIVE = "Partially Effective"
    INEFFECTIVE = "Ineffective"
    NOT_TESTED = "Not Tested"


class EvidenceStatus(str, enum.Enum):
    PROVIDED = "Provided"
    PENDING = "Pending"
    MISSING = "Missing"
    EXPIRED = "Expired"


class RemediationStatus(str, enum.Enum):
    OPEN = "Open"
    IN_PROGRESS = "In Progress"
    COMPLETED = "Completed"
    OVERDUE = "Overdue"
    DEFERRED = "Deferred"


class Severity(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"
    INFORMATIONAL = "Informational"


class VendorCriticality(str, enum.Enum):
    CRITICAL = "Critical"
    HIGH = "High"
    MEDIUM = "Medium"
    LOW = "Low"


class DataSensitivity(str, enum.Enum):
    RESTRICTED = "Restricted"
    CONFIDENTIAL = "Confidential"
    INTERNAL = "Internal"
    PUBLIC = "Public"


# ──────────────────────────────────────────────
# Risk Register
# ──────────────────────────────────────────────

class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. RSK-001
    title = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False)
    affected_asset = Column(String(200), nullable=False)
    threat = Column(Text, nullable=False)
    vulnerability = Column(Text, nullable=False)
    business_impact = Column(Text, nullable=False)

    # Scoring: inherent_risk_score = likelihood × impact (1–25 scale)
    # Bands: 1–4 Low | 5–9 Medium | 10–14 High | 15–25 Critical
    likelihood = Column(Integer, nullable=False)       # 1–5
    impact = Column(Integer, nullable=False)           # 1–5
    inherent_risk_score = Column(Integer, nullable=False)  # likelihood × impact

    existing_controls = Column(Text)
    control_effectiveness_pct = Column(Integer, default=0)  # 0–100 reduction %
    residual_risk_score = Column(Float, nullable=False)

    risk_owner = Column(String(100), nullable=False)
    treatment_strategy = Column(Enum(TreatmentStrategy), nullable=False)
    status = Column(Enum(RiskStatus), default=RiskStatus.OPEN)
    review_date = Column(Date)
    notes = Column(Text)


# ──────────────────────────────────────────────
# Control Assessment
# ──────────────────────────────────────────────

class Control(Base):
    __tablename__ = "controls"

    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. CTL-001
    framework_reference = Column(String(200), nullable=False)   # NIST CSF / ISO 27001 refs
    nist_csf_category = Column(String(100))
    iso_27001_annex = Column(String(100))
    control_objective = Column(Text, nullable=False)
    control_owner = Column(String(100), nullable=False)

    evidence_description = Column(Text)
    evidence_status = Column(Enum(EvidenceStatus), default=EvidenceStatus.PENDING)
    effectiveness = Column(Enum(ControlEffectiveness), default=ControlEffectiveness.NOT_TESTED)
    assessment_result = Column(Text)
    identified_gap = Column(Text)
    recommendation = Column(Text)
    review_date = Column(Date)


# ──────────────────────────────────────────────
# Remediation Tracker
# ──────────────────────────────────────────────

class RemediationItem(Base):
    __tablename__ = "remediation_items"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. FND-001
    finding_title = Column(String(200), nullable=False)
    severity = Column(Enum(Severity), nullable=False)
    description = Column(Text)
    recommendation = Column(Text, nullable=False)
    accountable_owner = Column(String(100), nullable=False)
    target_date = Column(Date)
    status = Column(Enum(RemediationStatus), default=RemediationStatus.OPEN)
    closure_evidence = Column(Text)
    linked_risk_id = Column(String(20))     # FK-like reference (soft link for simplicity)
    linked_control_id = Column(String(20))
    created_date = Column(Date)


# ──────────────────────────────────────────────
# Vendor Risk Assessment
# ──────────────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. VND-001
    name = Column(String(200), nullable=False)
    service_category = Column(String(100), nullable=False)
    data_sensitivity = Column(Enum(DataSensitivity), nullable=False)
    access_privileges = Column(Text)
    criticality = Column(Enum(VendorCriticality), nullable=False)
    inherent_risk_score = Column(Integer, nullable=False)   # 1–25
    control_weaknesses = Column(Text)
    residual_risk_score = Column(Integer, nullable=False)
    recommended_actions = Column(Text)
    contract_review_date = Column(Date)
    assessment_date = Column(Date)
    contact_name = Column(String(100))
