"""
NIST CSF 2.0 Maturity Assessment and Regulatory Compliance router for RiskLens.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user_optional, require_consultant_or_above, write_audit_log

router = APIRouter(tags=["Maturity & Compliance"])


# ─── NIST CSF 2.0 Maturity Assessment ────────────────────────────────────────

@router.get("/maturity", response_model=list[schemas.MaturityAssessmentOut])
def list_maturity_assessments(
    skip: int = 0, limit: int = 20,
    db: Session = Depends(get_db),
):
    """List all NIST CSF maturity assessments (most recent first)."""
    return db.query(models.MaturityAssessment).order_by(
        models.MaturityAssessment.assessment_date.desc()
    ).offset(skip).limit(limit).all()


@router.get("/maturity/latest", response_model=Optional[schemas.MaturityAssessmentOut])
def get_latest_maturity(db: Session = Depends(get_db)):
    """Return the most recent maturity assessment."""
    return db.query(models.MaturityAssessment).order_by(
        models.MaturityAssessment.assessment_date.desc()
    ).first()


@router.get("/maturity/{assessment_id}", response_model=schemas.MaturityAssessmentOut)
def get_maturity_assessment(assessment_id: str, db: Session = Depends(get_db)):
    ma = db.query(models.MaturityAssessment).filter(
        models.MaturityAssessment.assessment_id == assessment_id
    ).first()
    if not ma:
        raise HTTPException(status_code=404, detail="Maturity assessment not found")
    return ma


@router.post("/maturity", response_model=schemas.MaturityAssessmentOut, status_code=201)
def create_maturity_assessment(
    payload: schemas.MaturityAssessmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Create a new NIST CSF maturity assessment."""
    last = db.query(models.MaturityAssessment).order_by(models.MaturityAssessment.id.desc()).first()
    next_num = (last.id + 1) if last else 1

    ma = models.MaturityAssessment(
        assessment_id=f"MAT-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(ma)
    db.commit()
    db.refresh(ma)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.CREATE,
        entity_type="MaturityAssessment", entity_id=ma.assessment_id,
        change_summary=f"Maturity assessment '{ma.assessment_id}' created",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return ma


@router.patch("/maturity/{assessment_id}", response_model=schemas.MaturityAssessmentOut)
def update_maturity_assessment(
    assessment_id: str,
    payload: schemas.MaturityAssessmentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    ma = db.query(models.MaturityAssessment).filter(
        models.MaturityAssessment.assessment_id == assessment_id
    ).first()
    if not ma:
        raise HTTPException(status_code=404, detail="Maturity assessment not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ma, k, v)
    db.commit()
    db.refresh(ma)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPDATE,
        entity_type="MaturityAssessment", entity_id=assessment_id,
        change_summary=f"Maturity assessment '{assessment_id}' updated",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return ma


@router.get("/maturity/{assessment_id}/gap-analysis")
def get_gap_analysis(assessment_id: str, db: Session = Depends(get_db)):
    """
    Return gap analysis between current and target maturity tiers per function.
    """
    ma = db.query(models.MaturityAssessment).filter(
        models.MaturityAssessment.assessment_id == assessment_id
    ).first()
    if not ma:
        raise HTTPException(status_code=404, detail="Maturity assessment not found")

    tier_values = {
        "Tier 1 - Partial": 1,
        "Tier 2 - Risk Informed": 2,
        "Tier 3 - Repeatable": 3,
        "Tier 4 - Adaptive": 4,
        None: 0,
    }

    functions = ["GOVERN", "IDENTIFY", "PROTECT", "DETECT", "RESPOND", "RECOVER"]
    gaps = []
    for fn in functions:
        fn_lower = fn.lower()
        current = getattr(ma, f"{fn_lower}_current")
        target = getattr(ma, f"{fn_lower}_target")
        current_val = tier_values.get(current, 0)
        target_val = tier_values.get(target, 0)
        gap = target_val - current_val
        gaps.append({
            "function": fn,
            "current_tier": current,
            "target_tier": target,
            "current_value": current_val,
            "target_value": target_val,
            "gap": gap,
            "gap_label": "On Target" if gap <= 0 else f"{gap} tier{'s' if gap > 1 else ''} gap",
            "justification": getattr(ma, f"{fn_lower}_justification"),
        })

    return {
        "assessment_id": assessment_id,
        "assessment_date": str(ma.assessment_date),
        "gap_analysis": gaps,
        "disclaimer": ma.disclaimer,
    }


# ─── Regulatory Compliance Frameworks ────────────────────────────────────────

@router.get("/compliance/frameworks", response_model=list[schemas.ComplianceFrameworkOut])
def list_frameworks(db: Session = Depends(get_db)):
    """List all available compliance frameworks."""
    return db.query(models.ComplianceFramework).all()


@router.get("/compliance/frameworks/{framework_id}/requirements",
            response_model=list[schemas.ComplianceRequirementOut])
def list_framework_requirements(
    framework_id: str,
    assessment_status: Optional[str] = None,
    is_applicable: Optional[bool] = None,
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
):
    """List compliance requirements for a specific framework."""
    fw = db.query(models.ComplianceFramework).filter(
        models.ComplianceFramework.framework_id == framework_id
    ).first()
    if not fw:
        raise HTTPException(status_code=404, detail="Framework not found")

    q = db.query(models.ComplianceRequirement).filter(
        models.ComplianceRequirement.framework_id == fw.id
    )
    if assessment_status:
        q = q.filter(models.ComplianceRequirement.assessment_status == assessment_status)
    if is_applicable is not None:
        q = q.filter(models.ComplianceRequirement.is_applicable == is_applicable)
    return q.offset(skip).limit(limit).all()


@router.patch("/compliance/requirements/{requirement_id}",
              response_model=schemas.ComplianceRequirementOut)
def update_requirement(
    requirement_id: str,
    payload: schemas.ComplianceRequirementUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Update compliance status and mapping for a requirement."""
    req = db.query(models.ComplianceRequirement).filter(
        models.ComplianceRequirement.requirement_id == requirement_id
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requirement not found")

    before = {"assessment_status": req.assessment_status}
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(req, k, v)
    db.commit()
    db.refresh(req)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPDATE,
        entity_type="ComplianceRequirement", entity_id=requirement_id,
        before_values=before,
        after_values={"assessment_status": req.assessment_status},
        change_summary=f"Compliance requirement '{requirement_id}' updated",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return req


@router.get("/compliance/summary")
def get_compliance_summary(db: Session = Depends(get_db)):
    """Return a summary of compliance status across all frameworks."""
    frameworks = db.query(models.ComplianceFramework).all()
    summary = []
    for fw in frameworks:
        reqs = db.query(models.ComplianceRequirement).filter(
            models.ComplianceRequirement.framework_id == fw.id,
            models.ComplianceRequirement.is_applicable == True,
        ).all()
        total = len(reqs)
        compliant = sum(1 for r in reqs if r.assessment_status == "Compliant")
        partial = sum(1 for r in reqs if r.assessment_status == "Partially Compliant")
        non_compliant = sum(1 for r in reqs if r.assessment_status == "Non-Compliant")
        not_assessed = sum(1 for r in reqs if r.assessment_status == "Not Assessed")

        summary.append({
            "framework_id": fw.framework_id,
            "framework_name": fw.name,
            "is_regulatory": fw.is_regulatory,
            "total_applicable": total,
            "compliant": compliant,
            "partially_compliant": partial,
            "non_compliant": non_compliant,
            "not_assessed": not_assessed,
            "compliance_pct": round(compliant / total * 100, 1) if total > 0 else 0,
        })

    return {
        "disclaimer": (
            "This is a self-assessment for demonstration purposes only. "
            "Framework mapping does not establish regulatory compliance or certification. "
            "Applicability decisions must be reviewed by qualified legal and compliance counsel."
        ),
        "frameworks": summary,
    }


# ─── Audit Trail ──────────────────────────────────────────────────────────────

@router.get("/audit", response_model=list[schemas.AuditLogOut])
def list_audit_logs(
    skip: int = 0,
    limit: int = 100,
    entity_type: Optional[str] = None,
    action: Optional[str] = None,
    username: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve audit trail entries (read-only).
    Note: In the demo, this endpoint is publicly accessible.
    In production, require Administrator role.
    """
    q = db.query(models.AuditLog).order_by(models.AuditLog.timestamp.desc())
    if entity_type:
        q = q.filter(models.AuditLog.entity_type == entity_type)
    if action:
        q = q.filter(models.AuditLog.action == action)
    if username:
        q = q.filter(models.AuditLog.username.ilike(f"%{username}%"))
    return q.offset(skip).limit(limit).all()


# ─── Threat Scenarios ─────────────────────────────────────────────────────────

@router.get("/threats", response_model=list[schemas.ThreatScenarioOut])
def list_threat_scenarios(
    risk_ref: Optional[str] = None,
    skip: int = 0, limit: int = 50,
    db: Session = Depends(get_db),
):
    q = db.query(models.ThreatScenario)
    if risk_ref:
        q = q.filter(models.ThreatScenario.risk_ref == risk_ref)
    return q.offset(skip).limit(limit).all()


@router.post("/threats", response_model=schemas.ThreatScenarioOut, status_code=201)
def create_threat_scenario(
    payload: schemas.ThreatScenarioCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    last = db.query(models.ThreatScenario).order_by(models.ThreatScenario.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    scenario = models.ThreatScenario(
        scenario_id=f"THR-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(scenario)
    db.commit()
    db.refresh(scenario)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.CREATE,
        entity_type="ThreatScenario", entity_id=scenario.scenario_id,
        change_summary=f"Threat scenario '{scenario.scenario_id}' created",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return scenario
