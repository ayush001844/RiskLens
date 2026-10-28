"""
Dashboard and Reports router for RiskLens.
Provides aggregated statistics and CSV / printable-report generation.
"""
import csv
import io
from datetime import date
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse, JSONResponse
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.scoring import get_score_band
from collections import Counter

router = APIRouter(tags=["Dashboard & Reports"])


# ─── Dashboard ───────────────────────────────────────────────────────────────

@router.get("/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(get_db)):
    risks = db.query(models.Risk).all()
    controls = db.query(models.Control).all()
    remediation = db.query(models.RemediationItem).all()
    vendors = db.query(models.Vendor).all()
    today = date.today()

    # Risk band counts (residual)
    band_counts: dict[str, int] = {"Low": 0, "Medium": 0, "High": 0, "Critical": 0}
    for r in risks:
        band = get_score_band(r.residual_risk_score)
        band_counts[band] += 1

    # Risk by category
    cat_counter: Counter = Counter(r.category for r in risks)
    risk_by_category = [{"category": k, "count": v} for k, v in cat_counter.most_common()]

    # Risk distribution (inherent bands)
    inh_counter: Counter = Counter(get_score_band(r.inherent_risk_score) for r in risks)
    risk_distribution = [
        {"band": b, "count": inh_counter.get(b, 0)}
        for b in ["Critical", "High", "Medium", "Low"]
    ]

    # Residual risk distribution
    res_counter: Counter = Counter(get_score_band(r.residual_risk_score) for r in risks)
    residual_risk_distribution = [
        {"band": b, "count": res_counter.get(b, 0)}
        for b in ["Critical", "High", "Medium", "Low"]
    ]

    # Open control gaps = Ineffective or Not Tested
    open_gaps = sum(
        1 for c in controls
        if c.effectiveness in ("Ineffective", "Not Tested")
    )

    # Overdue remediation
    overdue = sum(
        1 for r in remediation
        if r.status in ("Open", "In Progress")
        and r.target_date
        and r.target_date < today
    )
    open_rem = sum(1 for r in remediation if r.status in ("Open", "In Progress", "Overdue"))

    # Remediation by status
    rem_counter: Counter = Counter(r.status for r in remediation)
    remediation_by_status = [{"status": k, "count": v} for k, v in rem_counter.items()]

    # Control effectiveness summary
    eff_counter: Counter = Counter(c.effectiveness for c in controls)
    control_effectiveness_summary = [
        {"effectiveness": k, "count": v} for k, v in eff_counter.items()
    ]

    # Vendor criticality
    crit_vendors = sum(1 for v in vendors if v.criticality == "Critical")

    return schemas.DashboardStats(
        total_risks=len(risks),
        critical_risks=band_counts["Critical"],
        high_risks=band_counts["High"],
        medium_risks=band_counts["Medium"],
        low_risks=band_counts["Low"],
        open_control_gaps=open_gaps,
        overdue_remediation=overdue,
        open_remediation=open_rem,
        total_vendors=len(vendors),
        critical_vendors=crit_vendors,
        risk_by_category=risk_by_category,
        risk_distribution=risk_distribution,
        remediation_by_status=remediation_by_status,
        control_effectiveness_summary=control_effectiveness_summary,
        residual_risk_distribution=residual_risk_distribution,
    )


# ─── CSV Exports ─────────────────────────────────────────────────────────────

def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    if not rows:
        return StreamingResponse(io.StringIO("No data"), media_type="text/csv")
    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)
    buf.seek(0)
    return StreamingResponse(
        buf,
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


@router.get("/reports/csv/risks")
def export_risks_csv(db: Session = Depends(get_db)):
    risks = db.query(models.Risk).all()
    rows = [
        {
            "Risk ID": r.risk_id,
            "Title": r.title,
            "Category": r.category,
            "Affected Asset": r.affected_asset,
            "Threat": r.threat,
            "Vulnerability": r.vulnerability,
            "Business Impact": r.business_impact,
            "Likelihood (1-5)": r.likelihood,
            "Impact (1-5)": r.impact,
            "Inherent Risk Score": r.inherent_risk_score,
            "Inherent Band": get_score_band(r.inherent_risk_score),
            "Control Effectiveness %": r.control_effectiveness_pct,
            "Residual Risk Score": r.residual_risk_score,
            "Residual Band": get_score_band(r.residual_risk_score),
            "Risk Owner": r.risk_owner,
            "Treatment Strategy": r.treatment_strategy,
            "Status": r.status,
            "Review Date": r.review_date,
        }
        for r in risks
    ]
    return _csv_response(rows, "apex_risk_register.csv")


@router.get("/reports/csv/controls")
def export_controls_csv(db: Session = Depends(get_db)):
    controls = db.query(models.Control).all()
    rows = [
        {
            "Control ID": c.control_id,
            "Framework Reference": c.framework_reference,
            "NIST CSF 2.0 Category": c.nist_csf_category,
            "ISO 27001:2022 Annex A": c.iso_27001_annex,
            "Control Objective": c.control_objective,
            "Control Owner": c.control_owner,
            "Evidence Description": c.evidence_description,
            "Evidence Status": c.evidence_status,
            "Effectiveness": c.effectiveness,
            "Assessment Result": c.assessment_result,
            "Identified Gap": c.identified_gap,
            "Recommendation": c.recommendation,
            "Review Date": c.review_date,
        }
        for c in controls
    ]
    return _csv_response(rows, "apex_control_assessment.csv")


@router.get("/reports/csv/remediation")
def export_remediation_csv(db: Session = Depends(get_db)):
    items = db.query(models.RemediationItem).all()
    rows = [
        {
            "Finding ID": i.finding_id,
            "Finding Title": i.finding_title,
            "Severity": i.severity,
            "Description": i.description,
            "Recommendation": i.recommendation,
            "Accountable Owner": i.accountable_owner,
            "Target Date": i.target_date,
            "Status": i.status,
            "Closure Evidence": i.closure_evidence,
            "Linked Risk ID": i.linked_risk_id,
            "Linked Control ID": i.linked_control_id,
        }
        for i in items
    ]
    return _csv_response(rows, "apex_remediation_tracker.csv")


@router.get("/reports/csv/vendors")
def export_vendors_csv(db: Session = Depends(get_db)):
    vendors = db.query(models.Vendor).all()
    rows = [
        {
            "Vendor ID": v.vendor_id,
            "Name": v.name,
            "Service Category": v.service_category,
            "Data Sensitivity": v.data_sensitivity,
            "Access Privileges": v.access_privileges,
            "Criticality": v.criticality,
            "Inherent Risk Score": v.inherent_risk_score,
            "Control Weaknesses": v.control_weaknesses,
            "Residual Risk Score": v.residual_risk_score,
            "Recommended Actions": v.recommended_actions,
            "Contract Review Date": v.contract_review_date,
            "Assessment Date": v.assessment_date,
            "Contact Name": v.contact_name,
        }
        for v in vendors
    ]
    return _csv_response(rows, "apex_vendor_risk.csv")


# ─── Full Assessment Report (JSON for frontend rendering / print) ─────────────

@router.get("/reports/full")
def full_assessment_report(db: Session = Depends(get_db)):
    """
    Returns structured JSON used by the frontend to render and print
    a client-style consulting report.
    """
    risks = db.query(models.Risk).all()
    controls = db.query(models.Control).all()
    remediation = db.query(models.RemediationItem).all()
    vendors = db.query(models.Vendor).all()
    today = date.today()

    # Top risks by residual score
    top_risks = sorted(risks, key=lambda r: r.residual_risk_score, reverse=True)[:10]

    # Critical/High gaps
    gaps = [c for c in controls if c.effectiveness == "Ineffective"]

    # Roadmap buckets
    def roadmap_bucket(item):
        if not item.target_date:
            return "61-90 Days"
        delta = (item.target_date - today).days
        if delta <= 30:
            return "0-30 Days"
        elif delta <= 60:
            return "31-60 Days"
        else:
            return "61-90 Days"

    open_rem = [r for r in remediation if r.status not in ("Completed",)]
    roadmap = {"0-30 Days": [], "31-60 Days": [], "61-90 Days": []}
    for item in open_rem:
        bucket = roadmap_bucket(item)
        roadmap[bucket].append({
            "finding_id": item.finding_id,
            "title": item.finding_title,
            "severity": item.severity,
            "owner": item.accountable_owner,
            "recommendation": item.recommendation,
        })

    return {
        "report_metadata": {
            "title": "Cybersecurity Risk & Controls Assessment Report",
            "client": "Apex Financial Services (SYNTHETIC / DEMO DATA)",
            "prepared_by": "RiskLens Consulting Platform",
            "date": str(today),
            "disclaimer": (
                "ALL DATA IN THIS REPORT IS SYNTHETIC AND FOR DEMONSTRATION PURPOSES ONLY. "
                "Apex Financial Services is a fictional company. No real organisation, "
                "individual, or security finding is represented. Framework mappings to "
                "NIST CSF 2.0 and ISO/IEC 27001:2022 are for educational purposes and do "
                "not constitute an official compliance determination or certification."
            ),
        },
        "executive_summary": {
            "total_risks": len(risks),
            "critical_risks": sum(1 for r in risks if get_score_band(r.residual_risk_score) == "Critical"),
            "high_risks": sum(1 for r in risks if get_score_band(r.residual_risk_score) == "High"),
            "open_control_gaps": len(gaps),
            "overdue_items": sum(
                1 for r in remediation
                if r.target_date and r.target_date < today and r.status not in ("Completed",)
            ),
            "total_vendors": len(vendors),
            "critical_vendors": sum(1 for v in vendors if v.criticality == "Critical"),
        },
        "scope_and_assumptions": [
            "Assessment scope covers IT infrastructure, application security, data protection, IAM, vendor risk, and security operations for Apex Financial Services.",
            "Assessment period: Q4 2024 (synthetic demo data; dates are illustrative).",
            "Evidence collected via document review, interviews, and configuration analysis (simulated for demo).",
            "Assessment does not constitute a formal audit under any regulatory framework.",
            "Residual risk scores reflect consultant-assessed control effectiveness and are subject to validation.",
        ],
        "methodology": {
            "scoring_model": "Likelihood × Impact (1–5 scale each), producing Inherent Risk Score (1–25)",
            "bands": {"1-4": "Low", "5-9": "Medium", "10-14": "High", "15-25": "Critical"},
            "residual_formula": "Residual Risk = Inherent Risk × (1 − Control Effectiveness %)",
            "frameworks": ["NIST Cybersecurity Framework 2.0", "ISO/IEC 27001:2022 Annex A"],
        },
        "top_risks": [
            {
                "risk_id": r.risk_id,
                "title": r.title,
                "category": r.category,
                "inherent_score": r.inherent_risk_score,
                "inherent_band": get_score_band(r.inherent_risk_score),
                "residual_score": r.residual_risk_score,
                "residual_band": get_score_band(r.residual_risk_score),
                "owner": r.risk_owner,
                "treatment": r.treatment_strategy,
            }
            for r in top_risks
        ],
        "critical_control_gaps": [
            {
                "control_id": c.control_id,
                "objective": c.control_objective,
                "gap": c.identified_gap,
                "recommendation": c.recommendation,
                "owner": c.control_owner,
            }
            for c in gaps
        ],
        "remediation_roadmap": roadmap,
        "limitations": [
            "This assessment is based on documentation and interview evidence provided during the engagement.",
            "Technical testing (penetration testing, VAPT) was not performed as part of this engagement.",
            "Risk scores are point-in-time estimates and will change as the control environment evolves.",
            "Vendor assessments are based on documentation review; on-site audits were not conducted.",
        ],
        "next_steps": [
            "Obtain executive sign-off on risk register and treatment decisions.",
            "Assign remediation owners and confirm target dates within 2 weeks.",
            "Commission penetration test within 60 days to validate technical findings.",
            "Schedule 90-day progress review to reassess residual risk scores.",
            "Initiate SIEM procurement and deployment as a priority programme.",
        ],
    }
