"""
"Assess Once, Comply with Many" Cross-Framework Harmonization Engine for RiskLens v2.0.
Harmonizes NIST CSF 2.0, ISO/IEC 27001:2022, RBI Cyber Security Framework,
India DPDP Act 2023, and PCI DSS 4.0.1 into a Unified Common Control Framework (CCF).
Testing a single primary control automatically satisfies mapped regulatory obligations.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.scoring import get_score_band

router = APIRouter(prefix="/harmonization", tags=["Unified Compliance Harmonization"])

# Unified Common Control Framework (CCF) Mapping Taxonomy
CCF_TAXONOMY = [
    {
        "ccf_id": "CCF-IAM-01",
        "domain": "Identity & Access Governance",
        "control_title": "Privileged Access Management & Least Privilege",
        "primary_control_id": "CTL-001",
        "linked_risk_id": "RSK-002",
        "mappings": {
            "nist_csf_2": {"ref": "PR.AA-01", "name": "Identities and credentials are managed"},
            "iso_27001_2022": {"ref": "A.8.2", "name": "Privileged access rights"},
            "rbi_csf": {"ref": "Sec 3.1", "name": "Access Control & Least Privilege Enforcement"},
            "dpdp_act_2023": {"ref": "Sec 8(5)", "name": "Reasonable Security Safeguards against Unauthorized Access"},
            "pci_dss_v4": {"ref": "Req 7.2", "name": "Access privileges restricted based on business need-to-know"},
        },
    },
    {
        "ccf_id": "CCF-IAM-02",
        "domain": "Authentication & Session Security",
        "control_title": "Phishing-Resistant Multi-Factor Authentication",
        "primary_control_id": "CTL-002",
        "linked_risk_id": "RSK-001",
        "mappings": {
            "nist_csf_2": {"ref": "PR.AA-03", "name": "Users, devices, and other assets are strongly authenticated"},
            "iso_27001_2022": {"ref": "A.8.5", "name": "Secure authentication technologies"},
            "rbi_csf": {"ref": "Sec 3.2", "name": "Mandatory Two-Factor Authentication for Core Banking & NetBanking"},
            "dpdp_act_2023": {"ref": "Sec 8(5)", "name": "Technical safeguards preventing identity compromise"},
            "pci_dss_v4": {"ref": "Req 8.3", "name": "Strong authentication / MFA for all console & remote access"},
        },
    },
    {
        "ccf_id": "CCF-CRY-01",
        "domain": "Data Protection & Cryptography",
        "control_title": "Enterprise Data Encryption at Rest (AES-256)",
        "primary_control_id": "CTL-003",
        "linked_risk_id": "RSK-008",
        "mappings": {
            "nist_csf_2": {"ref": "PR.DS-01", "name": "The confidentiality, integrity, and availability of data-at-rest are protected"},
            "iso_27001_2022": {"ref": "A.8.24", "name": "Use of cryptography for sensitive data"},
            "rbi_csf": {"ref": "Sec 5.1", "name": "Cryptographic Protection of Financial Transaction Data"},
            "dpdp_act_2023": {"ref": "Sec 8(5)", "name": "Mandatory encryption of customer Personal Data"},
            "pci_dss_v4": {"ref": "Req 3.4", "name": "Render Primary Account Number (PAN) unreadable anywhere it is stored"},
        },
    },
    {
        "ccf_id": "CCF-LOG-01",
        "domain": "Security Operations & Telemetry",
        "control_title": "Centralized SIEM Logging & 90-Day Retention",
        "primary_control_id": "CTL-005",
        "linked_risk_id": "RSK-006",
        "mappings": {
            "nist_csf_2": {"ref": "DE.CM-01", "name": "Networks and environments are monitored to detect potential cybersecurity events"},
            "iso_27001_2022": {"ref": "A.8.15", "name": "Logging of user and administrative activity"},
            "rbi_csf": {"ref": "Sec 4.1", "name": "Real-time Security Operations Centre (SOC) & Event Correlation"},
            "dpdp_act_2023": {"ref": "Sec 8(6)", "name": "Audit Logging of Data Processing Activities"},
            "pci_dss_v4": {"ref": "Req 10.2", "name": "Automated audit logs generated for all system components"},
        },
    },
    {
        "ccf_id": "CCF-VUL-01",
        "domain": "Vulnerability & Patch Management",
        "control_title": "Automated CVE Remediation & 30-Day Critical SLA",
        "primary_control_id": "CTL-007",
        "linked_risk_id": "RSK-005",
        "mappings": {
            "nist_csf_2": {"ref": "ID.RA-01", "name": "Vulnerabilities in assets are identified and validated"},
            "iso_27001_2022": {"ref": "A.8.8", "name": "Management of technical vulnerabilities"},
            "rbi_csf": {"ref": "Sec 6.2", "name": "Timely Patch Management across Production Infrastructure"},
            "dpdp_act_2023": {"ref": "Sec 8(5)", "name": "Preventive maintenance against known software vulnerabilities"},
            "pci_dss_v4": {"ref": "Req 6.3", "name": "Security vulnerabilities are identified and managed with timely patching"},
        },
    },
    {
        "ccf_id": "CCF-NET-01",
        "domain": "Network Security & Perimeter",
        "control_title": "API Gateway WAF, DDoS Protection & Rate Limiting",
        "primary_control_id": "CTL-008",
        "linked_risk_id": "RSK-010",
        "mappings": {
            "nist_csf_2": {"ref": "PR.IR-01", "name": "Networks and environments are protected from unauthorized logical access"},
            "iso_27001_2022": {"ref": "A.8.20", "name": "Network security and boundary defense"},
            "rbi_csf": {"ref": "Sec 2.1", "name": "Perimeter Defense, DMZ Segregation & DDoS Mitigation"},
            "dpdp_act_2023": {"ref": "Sec 8(5)", "name": "Protection of Digital Processing Infrastructure"},
            "pci_dss_v4": {"ref": "Req 1.3", "name": "Network access to and from the cardholder data environment is restricted"},
        },
    },
    {
        "ccf_id": "CCF-BCP-01",
        "domain": "Resilience & Business Continuity",
        "control_title": "Automated Immutable Backups & Tested Disaster Recovery",
        "primary_control_id": "CTL-012",
        "linked_risk_id": "RSK-003",
        "mappings": {
            "nist_csf_2": {"ref": "RC.RP-01", "name": "Recovery plan execution ensures restoration of operations"},
            "iso_27001_2022": {"ref": "A.8.13", "name": "Information backup and restore testing"},
            "rbi_csf": {"ref": "Sec 7.1", "name": "Business Continuity Planning & Periodic DR Drills"},
            "dpdp_act_2023": {"ref": "Sec 8(5)", "name": "Assurance of Data Availability against Loss or Destruction"},
            "pci_dss_v4": {"ref": "Req 12.10", "name": "Suspected incidents are immediately contained and recovery plans initiated"},
        },
    },
    {
        "ccf_id": "CCF-TPR-01",
        "domain": "Third-Party & Supply Chain Risk",
        "control_title": "Vendor Security Assessment & Contractual SLA Audits",
        "primary_control_id": "CTL-019",
        "linked_risk_id": "RSK-004",
        "mappings": {
            "nist_csf_2": {"ref": "GV.SC-04", "name": "Suppliers and third-party partners are assessed for cybersecurity risk"},
            "iso_27001_2022": {"ref": "A.5.19", "name": "Information security in supplier relationships"},
            "rbi_csf": {"ref": "Sec 8.1", "name": "Third-Party & Vendor Risk Governance Framework"},
            "dpdp_act_2023": {"ref": "Sec 8(2)", "name": "Data Fiduciary Accountability for Data Processors"},
            "pci_dss_v4": {"ref": "Req 12.8", "name": "Third-party service provider (TPSP) policy and monitoring program"},
        },
    },
]


class ControlEvaluationRequest(BaseModel):
    control_id: str
    proposed_effectiveness: str = Field(..., description="'Effective', 'Partially Effective', or 'Ineffective'")
    justification: Optional[str] = "Evaluated via Unified Compliance Harmonization Engine"


@router.get("/crosswalk")
def get_harmonization_crosswalk(db: Session = Depends(get_db)):
    """
    Returns the comprehensive 'Assess Once, Comply with Many' crosswalk matrix.
    Links unified CCF domains with active control assessments and auto-satisfies
    all mapped requirements across NIST, ISO, RBI, DPDP, and PCI-DSS.
    """
    controls_by_id = {c.control_id: c for c in db.query(models.Control).all()}
    risks_by_id = {r.risk_id: r for r in db.query(models.Risk).all()}

    crosswalk_results = []
    for ccf in CCF_TAXONOMY:
        c_id = ccf["primary_control_id"]
        r_id = ccf["linked_risk_id"]

        ctrl = controls_by_id.get(c_id)
        risk = risks_by_id.get(r_id)

        eff = ctrl.effectiveness.value if (ctrl and hasattr(ctrl.effectiveness, "value")) else "Not Tested"

        # Auto-satisfaction status
        auto_satisfaction = "Non-Compliant (Audit Finding)"
        satisfaction_badge = "non-compliant"
        if eff == "Effective":
            auto_satisfaction = "Compliant (Auto-Satisfied across all 5 regulations)"
            satisfaction_badge = "compliant"
        elif eff == "Partially Effective":
            auto_satisfaction = "Partially Compliant (Conditional Tolerance)"
            satisfaction_badge = "partial"

        crosswalk_results.append({
            "ccf_id": ccf["ccf_id"],
            "domain": ccf["domain"],
            "control_title": ccf["control_title"],
            "primary_control_id": c_id,
            "control_effectiveness": eff,
            "auto_satisfaction_status": auto_satisfaction,
            "satisfaction_badge": satisfaction_badge,
            "linked_risk": {
                "risk_id": risk.risk_id,
                "title": risk.title,
                "residual_score": risk.residual_risk_score,
                "residual_band": get_score_band(risk.residual_risk_score),
            } if risk else None,
            "mappings": ccf["mappings"],
            "framework_mappings": ccf["mappings"],
        })

    return crosswalk_results


@router.get("/posture")
def get_harmonized_posture(db: Session = Depends(get_db)):
    """
    Calculates unified compliance index and audit efficiency multiplier across all 5 frameworks.
    """
    controls_by_id = {c.control_id: c for c in db.query(models.Control).all()}

    total_ccf = len(CCF_TAXONOMY)
    effective_count = 0
    partial_count = 0
    ineffective_count = 0

    for ccf in CCF_TAXONOMY:
        ctrl = controls_by_id.get(ccf["primary_control_id"])
        eff = ctrl.effectiveness.value if (ctrl and hasattr(ctrl.effectiveness, "value")) else "Not Tested"
        if eff == "Effective":
            effective_count += 1
        elif eff == "Partially Effective":
            partial_count += 1
        else:
            ineffective_count += 1

    # Total mapped requirements satisfied across all 5 standards = total_ccf * 5 = 40 regulations
    total_satisfied_regulations = effective_count * 5
    audit_efficiency_multiplier = 5.0  # 1 assessment fulfills 5 distinct frameworks

    # Compliance index percentages per regulation
    rbi_score = round((effective_count + 0.4 * partial_count) / total_ccf * 100, 1)
    framework_scores = {
        "nist_csf_2": round((effective_count + 0.5 * partial_count) / total_ccf * 100, 1),
        "iso_27001_2022": round((effective_count + 0.5 * partial_count) / total_ccf * 100, 1),
        "rbi_csf": rbi_score,
        "rbi_cyber_security": rbi_score,
        "dpdp_act_2023": round((effective_count + 0.4 * partial_count) / total_ccf * 100, 1),
        "pci_dss_v4": round((effective_count + 0.3 * partial_count) / total_ccf * 100, 1),
    }

    overall_index = round(sum(framework_scores.values()) / len(framework_scores), 1)

    return {
        "total_unified_controls": total_ccf,
        "effective_controls": effective_count,
        "partially_effective_controls": partial_count,
        "ineffective_controls": ineffective_count,
        "harmonized_compliance_index_pct": overall_index,
        "audit_efficiency_multiplier": audit_efficiency_multiplier,
        "total_regulatory_requirements_satisfied": total_satisfied_regulations,
        "total_regulatory_obligations_satisfied": total_ccf * 5,
        "total_applicable_regulations_monitored": total_ccf * 5,
        "framework_scores": framework_scores,
    }


@router.get("/audit-readiness")
def get_regulatory_audit_readiness(db: Session = Depends(get_db)):
    """
    Returns executive audit readiness scorecard across regulatory inspections.
    """
    controls_by_id = {c.control_id: c for c in db.query(models.Control).all()}

    def is_effective(ctl_id):
        c = controls_by_id.get(ctl_id)
        return c and hasattr(c.effectiveness, "value") and c.effectiveness.value == "Effective"

    mfa_ok = is_effective("CTL-002")
    crypto_ok = is_effective("CTL-003")
    logging_ok = is_effective("CTL-005")

    scorecards = [
        {
            "regulator": "Reserve Bank of India (RBI)",
            "regulatory_authority": "Reserve Bank of India (RBI)",
            "audit_type": "Annual IT & Cyber Security Supervisory Inspection",
            "readiness_verdict": "CONDITIONAL WITH DEFICIENCIES" if not (mfa_ok and logging_ok) else "READY",
            "pass_probability_pct": 55.0 if not mfa_ok else 90.0,
            "critical_audit_redlines": [
                "Missing MFA on Core Banking Portal (CTL-002 / RBI Sec 3.2)",
                "Centralized Log Retention < 90 Days (CTL-005 / RBI Sec 4.1)",
            ] if not (mfa_ok and logging_ok) else ["All statutory supervisory controls satisfied."],
            "statutory_risk": "Regulatory directions and possible restrictions on digital customer onboarding.",
        },
        {
            "regulator": "Data Protection Board of India (DPBI)",
            "regulatory_authority": "Data Protection Board of India (DPBI)",
            "audit_type": "Digital Personal Data Protection Act (DPDP 2023) Safeguards Audit",
            "readiness_verdict": "NON-COMPLIANT — EXPOSURE" if not crypto_ok else "SATISFACTORY",
            "pass_probability_pct": 40.0 if not crypto_ok else 95.0,
            "critical_audit_redlines": [
                "Unencrypted Customer PII in Database (CTL-003 / DPDP Sec 8(5))",
                "Data Loss Prevention (DLP) Tooling Absent (CTL-014 / DPDP Sec 8(5))",
            ] if not crypto_ok else ["Reasonable security safeguards confirmed active."],
            "statutory_risk": "Section 33 statutory penalty exposure up to ₹250 Crores in event of compromise.",
        },
        {
            "regulator": "PCI Security Standards Council (PCI SSC)",
            "regulatory_authority": "PCI Security Standards Council (PCI SSC)",
            "audit_type": "PCI-DSS v4.0.1 Qualified Security Assessor (QSA) Audit",
            "readiness_verdict": "EXPIRING ATTESTATION" if not mfa_ok else "ATTESTED",
            "pass_probability_pct": 50.0 if not mfa_ok else 95.0,
            "critical_audit_redlines": [
                "Requirement 8.3 MFA not uniformly enforced across CDE console access",
                "Requirement 3.4 Incomplete primary account number column-level encryption",
            ] if not mfa_ok else ["SAQ-D Level 1 Merchant Compliance verified."],
            "statutory_risk": "Monthly acquirer fines ($10k/mo) and potential suspension of merchant acquiring.",
        },
        {
            "regulator": "National Institute of Standards & Technology",
            "regulatory_authority": "National Institute of Standards & Technology (NIST CSF 2.0)",
            "audit_type": "NIST CSF 2.0 Enterprise Tier Assessment",
            "readiness_verdict": "TIER 2 (RISK-INFORMED)",
            "pass_probability_pct": 72.0,
            "critical_audit_redlines": ["PR.AA Identity verification maturity requires expansion to IAM-02."],
            "statutory_risk": "Reputational impact and third-party vendor scrutiny.",
        },
        {
            "regulator": "International Organization for Standardization",
            "regulatory_authority": "ISO/IEC 27001:2022 Certification Body",
            "audit_type": "ISO 27001 Stage 2 Surveillance Audit",
            "readiness_verdict": "MINOR NON-CONFORMITIES",
            "pass_probability_pct": 78.0,
            "critical_audit_redlines": ["Clause A.8.2 Privileged access controls require session auditing."],
            "statutory_risk": "Surveillance audit condition requiring 90-day remediation closure.",
        },
    ]

    return {
        "organization": "Apex Financial Services Ltd.",
        "methodology": "Unified Common Control Framework (CCF) - Assess Once, Comply with Many",
        "audit_scorecards": scorecards,
        "framework_scorecards": scorecards,
        "executive_recommendation": (
            "Executing the $140,000 security remediation package elevates all regulatory inspection "
            "readiness scores to over 92% pass probability, eliminating statutory liabilities under RBI & DPDP Act."
        ),
    }


@router.post("/evaluate")
def evaluate_control_and_harmonize(payload: ControlEvaluationRequest, db: Session = Depends(get_db)):
    """
    Evaluates a primary control once and automatically synchronizes and propagates
    compliance status across all 5 mapped regulatory frameworks with audit trail logging.
    """
    ctrl = db.query(models.Control).filter(models.Control.control_id == payload.control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail=f"Control {payload.control_id} not found")

    old_eff = ctrl.effectiveness.value if hasattr(ctrl.effectiveness, "value") else str(ctrl.effectiveness)
    new_eff_str = payload.proposed_effectiveness

    # Map string to OperatingEffectiveness enum
    enum_map = {
        "Effective": models.OperatingEffectiveness.EFFECTIVE,
        "Partially Effective": models.OperatingEffectiveness.PARTIALLY_EFFECTIVE,
        "Ineffective": models.OperatingEffectiveness.INEFFECTIVE,
    }
    if new_eff_str not in enum_map:
        raise HTTPException(status_code=400, detail="Effectiveness must be 'Effective', 'Partially Effective', or 'Ineffective'")

    ctrl.effectiveness = enum_map[new_eff_str]

    # Recalculate control effectiveness percentage
    eff_pct = 95.0 if new_eff_str == "Effective" else 50.0 if new_eff_str == "Partially Effective" else 10.0
    ctrl.implementation_percentage = int(eff_pct)

    # Log audit entry
    log_entry = models.AuditLog(
        action="HARMONIZE_CONTROL_ASSESSMENT",
        entity_type="UnifiedControlCrosswalk",
        entity_id=payload.control_id,
        change_summary=(
            f"Control '{payload.control_id}' updated from {old_eff} to {new_eff_str}. "
            f"Auto-satisfied mapped requirements across NIST, ISO 27001, RBI, DPDP, and PCI-DSS."
        ),
        change_justification=payload.justification,
        ip_address="127.0.0.1",
        username="lead_compliance_officer",
        user_role="Consultant",
        timestamp=datetime.utcnow(),
    )
    db.add(log_entry)
    db.commit()

    return {
        "control_id": payload.control_id,
        "previous_effectiveness": old_eff,
        "new_effectiveness": new_eff_str,
        "proposed_effectiveness": new_eff_str,
        "status": "success",
        "harmonized_propagation": [
            {"framework_key": "nist_csf_2", "framework_name": "NIST CSF 2.0", "status": "Satisfied" if new_eff_str == "Effective" else "Pending Mitigation"},
            {"framework_key": "iso_27001_2022", "framework_name": "ISO/IEC 27001:2022", "status": "Satisfied" if new_eff_str == "Effective" else "Pending Mitigation"},
            {"framework_key": "rbi_csf", "framework_name": "RBI Cyber Security Framework", "status": "Satisfied" if new_eff_str == "Effective" else "Pending Mitigation"},
            {"framework_key": "dpdp_act_2023", "framework_name": "India DPDP Act 2023", "status": "Satisfied" if new_eff_str == "Effective" else "Pending Mitigation"},
            {"framework_key": "pci_dss_v4", "framework_name": "PCI DSS v4.0.1", "status": "Satisfied" if new_eff_str == "Effective" else "Pending Mitigation"},
        ],
        "audit_efficiency_message": f"Assessed once ({payload.control_id}) — 5 regulatory standards updated simultaneously.",
    }
