"""
SQLAlchemy ORM models for RiskLens.

All data in this application is SYNTHETIC / DEMO DATA created to simulate
a cybersecurity consulting engagement for the fictional company
"Apex Financial Services". No real organisation, person, or system is
represented. Do not use these records for actual compliance determinations.

Schema version: 2.0  (Phase 1 — Risk Governance Engine)
"""
from datetime import date, datetime
from sqlalchemy import (
    Column, Integer, String, Float, Date, Text, Enum,
    DateTime, Boolean, ForeignKey, JSON
)
from sqlalchemy.orm import relationship
import enum
from app.database import Base


# ──────────────────────────────────────────────────────────────────────────────
# Core Enumerations (all preserved from v1.0)
# ──────────────────────────────────────────────────────────────────────────────

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
    ASSIGNED = "Assigned"
    IN_PROGRESS = "In Progress"
    PENDING_VERIFICATION = "Pending Verification"
    CLOSED = "Closed"
    OVERDUE = "Overdue"
    DEFERRED = "Deferred"
    RISK_ACCEPTED = "Risk Accepted"
    COMPLETED = "Completed"  # legacy alias for Closed


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


# ──────────────────────────────────────────────────────────────────────────────
# New Enumerations (Phase 1+)
# ──────────────────────────────────────────────────────────────────────────────

class RiskTrend(str, enum.Enum):
    IMPROVING = "Improving"
    STABLE = "Stable"
    DETERIORATING = "Deteriorating"
    NOT_ASSESSED = "Not Assessed"


class AcceptanceStatus(str, enum.Enum):
    NOT_APPLICABLE = "Not Applicable"
    PENDING_APPROVAL = "Pending Approval"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    EXPIRED = "Expired"


class ImplementationStatus(str, enum.Enum):
    NOT_IMPLEMENTED = "Not Implemented"
    PARTIALLY_IMPLEMENTED = "Partially Implemented"
    IMPLEMENTED = "Implemented"
    NOT_APPLICABLE = "Not Applicable"


class DesignEffectiveness(str, enum.Enum):
    ADEQUATE = "Adequate"
    PARTIALLY_ADEQUATE = "Partially Adequate"
    INADEQUATE = "Inadequate"
    NOT_ASSESSED = "Not Assessed"


class OperatingEffectiveness(str, enum.Enum):
    EFFECTIVE = "Effective"
    PARTIALLY_EFFECTIVE = "Partially Effective"
    INEFFECTIVE = "Ineffective"
    NOT_TESTED = "Not Tested"


class EvidenceVerificationStatus(str, enum.Enum):
    UNVERIFIED = "Unverified"
    VERIFIED = "Verified"
    REJECTED = "Rejected"
    EXPIRED = "Expired"


class ComplianceStatus(str, enum.Enum):
    COMPLIANT = "Compliant"
    PARTIALLY_COMPLIANT = "Partially Compliant"
    NON_COMPLIANT = "Non-Compliant"
    NOT_ASSESSED = "Not Assessed"
    NOT_APPLICABLE = "Not Applicable"


class MaturityTier(str, enum.Enum):
    TIER_1_PARTIAL = "Tier 1 - Partial"
    TIER_2_RISK_INFORMED = "Tier 2 - Risk Informed"
    TIER_3_REPEATABLE = "Tier 3 - Repeatable"
    TIER_4_ADAPTIVE = "Tier 4 - Adaptive"


class NISTFunction(str, enum.Enum):
    GOVERN = "GOVERN"
    IDENTIFY = "IDENTIFY"
    PROTECT = "PROTECT"
    DETECT = "DETECT"
    RESPOND = "RESPOND"
    RECOVER = "RECOVER"


class UserRole(str, enum.Enum):
    ADMINISTRATOR = "Administrator"
    CONSULTANT = "Consultant"
    RISK_OWNER = "Risk Owner"
    CONTROL_OWNER = "Control Owner"
    AUDITOR = "Auditor"
    EXECUTIVE = "Executive"


class VendorLifecycleStage(str, enum.Enum):
    ONBOARDING = "Onboarding"
    ACTIVE = "Active"
    UNDER_REVIEW = "Under Review"
    OFFBOARDING = "Offboarding"
    OFFBOARDED = "Offboarded"


class AuditAction(str, enum.Enum):
    CREATE = "Create"
    UPDATE = "Update"
    DELETE = "Delete"
    APPROVE = "Approve"
    REJECT = "Reject"
    UPLOAD = "Upload"
    DOWNLOAD = "Download"
    LOGIN = "Login"
    LOGOUT = "Logout"
    RESEED = "Reseed"
    HARMONIZE_CONTROL_ASSESSMENT = "HARMONIZE_CONTROL_ASSESSMENT"
    TELEMETRY_CONNECTOR_SYNC = "TELEMETRY_CONNECTOR_SYNC"
    INGEST_TELEMETRY_WEBHOOK = "INGEST_TELEMETRY_WEBHOOK"


# ──────────────────────────────────────────────────────────────────────────────
# Authentication
# ──────────────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), unique=True, index=True, nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    hashed_password = Column(String(200), nullable=False)
    full_name = Column(String(200))
    role = Column(Enum(UserRole), nullable=False, default=UserRole.AUDITOR)
    business_unit = Column(String(100))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)

    # Relationships
    audit_logs = relationship("AuditLog", back_populates="user", foreign_keys="AuditLog.user_id")
    risk_acceptances = relationship("RiskAcceptance", back_populates="approver", foreign_keys="RiskAcceptance.approver_id")


# ──────────────────────────────────────────────────────────────────────────────
# Risk Appetite Configuration (org-level, admin-managed)
# ──────────────────────────────────────────────────────────────────────────────

class RiskAppetiteConfig(Base):
    __tablename__ = "risk_appetite_config"

    id = Column(Integer, primary_key=True, index=True)
    organisation_name = Column(String(200), default="Apex Financial Services")

    # Appetite thresholds (on the 1-25 scale)
    max_acceptable_inherent_risk = Column(Integer, default=15)  # above = escalate
    max_acceptable_residual_risk = Column(Integer, default=9)   # above = needs treatment
    risk_tolerance_upper = Column(Integer, default=12)          # tolerance band upper
    escalation_threshold = Column(Integer, default=20)          # requires board review

    # Review settings
    risk_review_frequency_days = Column(Integer, default=90)    # days between reviews
    acceptance_max_duration_days = Column(Integer, default=365) # max acceptance period

    # Risk acceptance authority
    acceptance_authority_low = Column(String(100), default="Risk Owner")
    acceptance_authority_medium = Column(String(100), default="CISO")
    acceptance_authority_high = Column(String(100), default="CRO")
    acceptance_authority_critical = Column(String(100), default="Board / Risk Committee")

    # Notes
    appetite_statement = Column(Text)
    last_reviewed = Column(Date)
    reviewed_by = Column(String(100))
    effective_date = Column(Date)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Risk Register (expanded — fully backward compatible)
# ──────────────────────────────────────────────────────────────────────────────

class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, index=True)
    risk_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. RSK-001
    title = Column(String(200), nullable=False)

    # Organisational context
    business_unit = Column(String(100))
    category = Column(String(100), nullable=False)
    affected_asset = Column(String(200), nullable=False)
    asset_criticality = Column(String(20))  # Critical / High / Medium / Low

    # Threat and vulnerability
    threat = Column(Text, nullable=False)
    threat_actor = Column(String(200))  # e.g. "External - Cybercriminal", "Insider - Malicious"
    vulnerability = Column(Text, nullable=False)
    threat_scenario = Column(Text)  # narrative description

    # Business impact
    business_impact = Column(Text, nullable=False)
    financial_impact = Column(Text)      # narrative financial consequence
    operational_impact = Column(Text)    # narrative operational consequence
    reputational_impact = Column(Text)   # narrative reputational consequence
    regulatory_impact = Column(Text)     # narrative regulatory/legal consequence

    # Scoring: Inherent Risk = Likelihood × Impact
    # Bands: 1-4 Low | 5-9 Medium | 10-14 High | 15-25 Critical
    likelihood = Column(Integer, nullable=False)       # 1–5
    impact = Column(Integer, nullable=False)           # 1–5
    inherent_risk_score = Column(Integer, nullable=False)  # likelihood × impact

    # Existing controls and residual
    existing_controls = Column(Text)
    control_effectiveness_pct = Column(Integer, default=0)  # 0–100, consultant-assessed
    residual_risk_score = Column(Float, nullable=False)      # min 1.0

    # Target risk (after planned treatment)
    target_likelihood = Column(Integer)   # 1–5
    target_impact = Column(Integer)       # 1–5
    target_risk_score = Column(Float)     # target likelihood × target impact

    # Trend and appetite
    risk_trend = Column(Enum(RiskTrend), default=RiskTrend.NOT_ASSESSED)
    exceeds_appetite = Column(Boolean, default=False)  # computed flag

    # Ownership and governance
    risk_owner = Column(String(100), nullable=False)
    treatment_strategy = Column(Enum(TreatmentStrategy), nullable=False)
    status = Column(Enum(RiskStatus), default=RiskStatus.OPEN)
    acceptance_status = Column(Enum(AcceptanceStatus), default=AcceptanceStatus.NOT_APPLICABLE)

    # Dates
    last_assessment_date = Column(Date)
    review_date = Column(Date)
    next_review_date = Column(Date)

    notes = Column(Text)

    # Relationships
    acceptances = relationship("RiskAcceptance", back_populates="risk", cascade="all, delete-orphan")


# ──────────────────────────────────────────────────────────────────────────────
# Risk Acceptance Workflow
# ──────────────────────────────────────────────────────────────────────────────

class RiskAcceptance(Base):
    __tablename__ = "risk_acceptances"

    id = Column(Integer, primary_key=True, index=True)
    acceptance_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. ACC-001

    risk_id = Column(Integer, ForeignKey("risks.id"), nullable=False)
    risk_ref = Column(String(20))  # denormalised risk_id string for easy reference

    business_justification = Column(Text, nullable=False)
    compensating_controls = Column(Text)
    residual_risk_at_acceptance = Column(Float, nullable=False)
    residual_band_at_acceptance = Column(String(20))

    risk_owner = Column(String(100), nullable=False)
    approver_id = Column(Integer, ForeignKey("users.id"))
    approver_name = Column(String(100))   # denormalised for records even if user deleted
    approval_status = Column(Enum(AcceptanceStatus), default=AcceptanceStatus.PENDING_APPROVAL)
    rejection_reason = Column(Text)

    approved_at = Column(DateTime)
    expiry_date = Column(Date, nullable=False)
    review_date = Column(Date)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    risk = relationship("Risk", back_populates="acceptances")
    approver = relationship("User", back_populates="risk_acceptances", foreign_keys=[approver_id])


# ──────────────────────────────────────────────────────────────────────────────
# Control Assessment (expanded — fully backward compatible)
# ──────────────────────────────────────────────────────────────────────────────

class Control(Base):
    __tablename__ = "controls"

    id = Column(Integer, primary_key=True, index=True)
    control_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. CTL-001
    control_name = Column(String(200))  # short display name
    framework_reference = Column(String(200), nullable=False)   # NIST CSF / ISO 27001 refs
    nist_csf_category = Column(String(100))
    iso_27001_annex = Column(String(100))
    control_objective = Column(Text, nullable=False)
    control_domain = Column(String(100))  # e.g. "Access Control", "Cryptography"
    control_owner = Column(String(100), nullable=False)

    # Implementation
    implementation_status = Column(Enum(ImplementationStatus), default=ImplementationStatus.NOT_IMPLEMENTED)

    # Evidence
    evidence_description = Column(Text)
    evidence_status = Column(Enum(EvidenceStatus), default=EvidenceStatus.PENDING)

    # Assessment — separated design and operating effectiveness
    # (backward compat: 'effectiveness' = legacy combined field)
    effectiveness = Column(Enum(ControlEffectiveness), default=ControlEffectiveness.NOT_TESTED)
    design_effectiveness = Column(Enum(DesignEffectiveness), default=DesignEffectiveness.NOT_ASSESSED)
    operating_effectiveness = Column(Enum(OperatingEffectiveness), default=OperatingEffectiveness.NOT_TESTED)

    # Overall assessment narrative
    assessment_result = Column(Text)
    identified_gap = Column(Text)
    deficiency_description = Column(Text)  # detailed deficiency narrative
    recommendation = Column(Text)

    # Dates
    last_testing_date = Column(Date)
    next_testing_date = Column(Date)
    review_date = Column(Date)

    # Relationships
    tests = relationship("ControlTest", back_populates="control", cascade="all, delete-orphan")
    evidences = relationship("Evidence", back_populates="control")


# ──────────────────────────────────────────────────────────────────────────────
# Control Testing Records
# ──────────────────────────────────────────────────────────────────────────────

class ControlTest(Base):
    __tablename__ = "control_tests"

    id = Column(Integer, primary_key=True, index=True)
    test_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. TST-001

    control_id = Column(Integer, ForeignKey("controls.id"), nullable=False)
    control_ref = Column(String(20))  # denormalised control_id string

    test_objective = Column(Text, nullable=False)
    methodology = Column(Text)  # how the test was conducted
    population_size = Column(Integer)  # total population tested against
    sample_size = Column(Integer)      # number of items sampled
    sampling_method = Column(String(100))  # e.g. "Random", "Judgmental", "Full population"

    sample_results = Column(Text)
    exceptions_identified = Column(Integer, default=0)
    exception_description = Column(Text)

    tester = Column(String(100), nullable=False)
    reviewer = Column(String(100))
    testing_period_start = Column(Date)
    testing_period_end = Column(Date)

    conclusion = Column(Enum(OperatingEffectiveness), nullable=False)
    conclusion_narrative = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    control = relationship("Control", back_populates="tests")


# ──────────────────────────────────────────────────────────────────────────────
# Evidence Management
# ──────────────────────────────────────────────────────────────────────────────

class Evidence(Base):
    __tablename__ = "evidence"

    id = Column(Integer, primary_key=True, index=True)
    evidence_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. EVD-001

    title = Column(String(200), nullable=False)
    description = Column(Text)

    # Associations (soft references — FKs optional)
    control_id = Column(Integer, ForeignKey("controls.id"))
    control_ref = Column(String(20))   # denormalised
    risk_ref = Column(String(20))      # soft reference to risk_id

    # Ownership
    evidence_owner = Column(String(100), nullable=False)
    uploaded_by = Column(String(100))

    # File metadata (no file stored in DB — path only)
    file_name = Column(String(255))
    file_type = Column(String(50))   # pdf, xlsx, csv, png, jpg, etc.
    file_size_bytes = Column(Integer)
    storage_path = Column(String(500))  # internal path — never exposed publicly

    # Dates
    upload_timestamp = Column(DateTime, default=datetime.utcnow)
    collection_date = Column(Date)
    review_date = Column(Date)
    expiry_date = Column(Date)
    version = Column(String(20), default="1.0")

    # Verification
    verification_status = Column(Enum(EvidenceVerificationStatus), default=EvidenceVerificationStatus.UNVERIFIED)
    verified_by = Column(String(100))
    verified_at = Column(DateTime)
    reviewer_comments = Column(Text)

    # Relationship
    control = relationship("Control", back_populates="evidences")


# ──────────────────────────────────────────────────────────────────────────────
# Remediation / Finding Tracker (expanded — backward compatible)
# ──────────────────────────────────────────────────────────────────────────────

class RemediationItem(Base):
    __tablename__ = "remediation_items"

    id = Column(Integer, primary_key=True, index=True)
    finding_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. FND-001
    finding_title = Column(String(200), nullable=False)
    severity = Column(Enum(Severity), nullable=False)

    # Finding detail
    description = Column(Text)
    observation = Column(Text)   # what was observed
    criteria = Column(Text)      # the standard/requirement that was not met
    root_cause = Column(Text)
    risk_consequence = Column(Text)
    business_impact = Column(Text)

    recommendation = Column(Text, nullable=False)
    management_response = Column(Text)

    # Ownership and accountability
    accountable_owner = Column(String(100), nullable=False)
    reviewer = Column(String(100))
    closure_approver = Column(String(100))

    # Status and dates
    target_date = Column(Date)
    status = Column(Enum(RemediationStatus), default=RemediationStatus.OPEN)
    closure_evidence = Column(Text)
    closure_approval_date = Column(Date)

    # Links
    linked_risk_id = Column(String(20))     # soft link to risk_id
    linked_control_id = Column(String(20))  # soft link to control_id

    # Dates
    created_date = Column(Date)
    assigned_date = Column(Date)
    actual_closure_date = Column(Date)


# ──────────────────────────────────────────────────────────────────────────────
# Vendor Risk (expanded — backward compatible)
# ──────────────────────────────────────────────────────────────────────────────

class Vendor(Base):
    __tablename__ = "vendors"

    id = Column(Integer, primary_key=True, index=True)
    vendor_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. VND-001
    name = Column(String(200), nullable=False)
    service_category = Column(String(100), nullable=False)

    # Risk dimensions
    data_sensitivity = Column(Enum(DataSensitivity), nullable=False)
    access_privileges = Column(Text)
    criticality = Column(Enum(VendorCriticality), nullable=False)

    # Lifecycle
    lifecycle_stage = Column(Enum(VendorLifecycleStage), default=VendorLifecycleStage.ACTIVE)

    # Risk scores
    inherent_risk_score = Column(Integer, nullable=False)   # 1–25
    control_weaknesses = Column(Text)
    residual_risk_score = Column(Integer, nullable=False)

    # Extended assessment fields
    cloud_dependency = Column(Boolean, default=False)
    data_location = Column(String(200))   # e.g. "India", "EU", "US"
    subcontractor_dependency = Column(Text)
    security_certifications = Column(Text)  # e.g. "ISO 27001, SOC 2 Type II"
    soc2_type2_status = Column(String(50))  # "Current", "Expired", "Not Held", "In Progress"
    soc2_report_date = Column(Date)

    # Governance
    incident_history = Column(Text)
    notification_commitments = Column(Text)   # incident notification SLA
    contractual_security_clauses = Column(Boolean, default=False)
    business_continuity_reviewed = Column(Boolean, default=False)
    disaster_recovery_reviewed = Column(Boolean, default=False)

    # Business context
    business_justification = Column(Text)
    recommended_actions = Column(Text)

    # Dates
    contract_review_date = Column(Date)
    assessment_date = Column(Date)
    next_assessment_date = Column(Date)

    contact_name = Column(String(100))
    contact_email = Column(String(200))


# ──────────────────────────────────────────────────────────────────────────────
# NIST CSF 2.0 Maturity Assessment
# ──────────────────────────────────────────────────────────────────────────────

class MaturityAssessment(Base):
    """
    NIST CSF 2.0 Implementation Tier assessment per function.
    Implementation Tiers characterise the rigour of cybersecurity risk
    governance practices. They are NOT simple certification levels.
    Source: NIST CSF 2.0, February 2024.
    """
    __tablename__ = "maturity_assessments"

    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(String(20), unique=True, index=True, nullable=False)  # e.g. MAT-001

    # Organisational profile
    organisation_name = Column(String(200), default="Apex Financial Services")
    assessment_date = Column(Date, nullable=False)
    assessor = Column(String(100))
    scope_description = Column(Text)

    # Current profile — tier per function
    govern_current = Column(Enum(MaturityTier))
    identify_current = Column(Enum(MaturityTier))
    protect_current = Column(Enum(MaturityTier))
    detect_current = Column(Enum(MaturityTier))
    respond_current = Column(Enum(MaturityTier))
    recover_current = Column(Enum(MaturityTier))

    # Target profile — desired tier per function
    govern_target = Column(Enum(MaturityTier))
    identify_target = Column(Enum(MaturityTier))
    protect_target = Column(Enum(MaturityTier))
    detect_target = Column(Enum(MaturityTier))
    respond_target = Column(Enum(MaturityTier))
    recover_target = Column(Enum(MaturityTier))

    # Justifications (one per function)
    govern_justification = Column(Text)
    identify_justification = Column(Text)
    protect_justification = Column(Text)
    detect_justification = Column(Text)
    respond_justification = Column(Text)
    recover_justification = Column(Text)

    # Supporting evidence references
    govern_evidence = Column(Text)
    identify_evidence = Column(Text)
    protect_evidence = Column(Text)
    detect_evidence = Column(Text)
    respond_evidence = Column(Text)
    recover_evidence = Column(Text)

    # Gap and improvement
    overall_assessment = Column(Text)
    improvement_roadmap = Column(Text)

    # Disclaimer field (always populated, never removed)
    disclaimer = Column(Text, default=(
        "This assessment is a self-assessment for demonstration purposes. "
        "NIST CSF Implementation Tiers describe the rigour of risk governance practices. "
        "They are not a universal maturity score and do not constitute certification. "
        "Source: NIST Cybersecurity Framework 2.0 (February 2024)."
    ))

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Regulatory Compliance Framework
# ──────────────────────────────────────────────────────────────────────────────

class ComplianceFramework(Base):
    """Supported regulatory/standards frameworks."""
    __tablename__ = "compliance_frameworks"

    id = Column(Integer, primary_key=True, index=True)
    framework_id = Column(String(20), unique=True, index=True)  # e.g. NIST-CSF-2, ISO-27001-2022
    name = Column(String(200), nullable=False)
    version = Column(String(50))
    issuing_body = Column(String(200))
    effective_date = Column(Date)
    description = Column(Text)
    source_url = Column(String(500))
    is_regulatory = Column(Boolean, default=False)  # True = regulatory requirement, False = standard/guidance
    applicability_note = Column(Text)

    requirements = relationship("ComplianceRequirement", back_populates="framework")


class ComplianceRequirement(Base):
    """Individual requirements within a compliance framework."""
    __tablename__ = "compliance_requirements"

    id = Column(Integer, primary_key=True, index=True)
    requirement_id = Column(String(50), unique=True, index=True)  # e.g. "NIST-CSF-GV.OC-01"
    framework_id = Column(Integer, ForeignKey("compliance_frameworks.id"), nullable=False)
    framework_ref = Column(String(20))  # denormalised

    title = Column(String(300), nullable=False)
    description = Column(Text)
    requirement_text = Column(Text)

    # Applicability
    is_applicable = Column(Boolean, default=True)
    applicability_justification = Column(Text)

    # Assessment
    assessment_status = Column(Enum(ComplianceStatus), default=ComplianceStatus.NOT_ASSESSED)
    identified_gap = Column(Text)
    remediation_recommendation = Column(Text)
    responsible_owner = Column(String(100))

    # Evidence and controls (JSON arrays of IDs)
    mapped_control_ids = Column(JSON, default=list)   # list of control_id strings
    evidence_refs = Column(JSON, default=list)         # list of evidence_id strings

    last_assessed_date = Column(Date)
    next_assessment_date = Column(Date)

    # Relationship
    framework = relationship("ComplianceFramework", back_populates="requirements")


# ──────────────────────────────────────────────────────────────────────────────
# Threat Scenario and MITRE ATT&CK Mapping
# ──────────────────────────────────────────────────────────────────────────────

class ThreatScenario(Base):
    """
    Connects GRC risks to technical threat intelligence.
    MITRE ATT&CK identifiers are used as published at attack.mitre.org.
    Mapping is for analysis purposes only and does not indicate an attack occurred.
    """
    __tablename__ = "threat_scenarios"

    id = Column(Integer, primary_key=True, index=True)
    scenario_id = Column(String(20), unique=True, index=True)  # e.g. THR-001

    risk_ref = Column(String(20))   # soft link to risk_id
    title = Column(String(200), nullable=False)

    threat_actor_category = Column(String(100))  # e.g. "External - Cybercriminal"
    threat_actor_motivation = Column(String(200))  # e.g. "Financial gain"

    # MITRE ATT&CK references (JSON array)
    attack_techniques = Column(JSON, default=list)  # e.g. [{"id": "T1078", "name": "Valid Accounts"}]
    target_asset = Column(String(200))
    attack_preconditions = Column(Text)

    # Controls
    preventive_controls = Column(Text)
    detective_controls = Column(Text)
    detection_gaps = Column(Text)

    business_consequences = Column(Text)
    recommended_mitigations = Column(Text)

    disclaimer = Column(Text, default=(
        "MITRE ATT&CK technique mapping is for analytical purposes only. "
        "It does not indicate or imply that any of these techniques were used in an actual attack. "
        "Source: MITRE ATT&CK® (attack.mitre.org). ATT&CK® is a registered trademark of MITRE Corporation."
    ))

    created_at = Column(DateTime, default=datetime.utcnow)


# ──────────────────────────────────────────────────────────────────────────────
# Immutable Audit Trail
# ──────────────────────────────────────────────────────────────────────────────

class AuditLog(Base):
    """
    Append-only audit trail for significant platform operations.
    Rows must not be updated or deleted by application code.
    Access via GET /api/audit (Administrator role only).
    """
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)

    # Actor
    user_id = Column(Integer, ForeignKey("users.id"))
    username = Column(String(100))  # denormalised — preserved even if user deleted
    user_role = Column(String(50))

    # Action
    action = Column(Enum(AuditAction), nullable=False)
    entity_type = Column(String(100), nullable=False)   # e.g. "Risk", "Control", "User"
    entity_id = Column(String(50))                       # e.g. "RSK-001"

    # Change data
    before_values = Column(JSON)   # dict of changed fields before
    after_values = Column(JSON)    # dict of changed fields after
    change_summary = Column(Text)  # human-readable summary

    # Context
    ip_address = Column(String(45))   # supports IPv6
    user_agent = Column(String(500))
    change_justification = Column(Text)

    # Timestamp (immutable)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationship
    user = relationship("User", back_populates="audit_logs", foreign_keys=[user_id])
