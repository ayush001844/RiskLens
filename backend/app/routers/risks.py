"""
Risk Register API router for RiskLens.
Expanded for Phase 1: risk appetite, acceptance workflow, enhanced fields.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date
from app import models, schemas
from app.database import get_db
from app.scoring import score_risk, get_score_band, check_appetite_violation, calculate_target_risk
from app.auth import get_current_user, get_current_user_optional, require_consultant_or_above, write_audit_log

router = APIRouter(prefix="/risks", tags=["Risk Register"])


def _get_appetite(db: Session) -> models.RiskAppetiteConfig:
    """Get or create the default risk appetite configuration."""
    cfg = db.query(models.RiskAppetiteConfig).first()
    if not cfg:
        cfg = models.RiskAppetiteConfig()
        db.add(cfg)
        db.commit()
        db.refresh(cfg)
    return cfg


def _enrich(risk: models.Risk, appetite: models.RiskAppetiteConfig) -> schemas.RiskOut:
    out = schemas.RiskOut.model_validate(risk)
    out.inherent_band = get_score_band(risk.inherent_risk_score)
    out.residual_band = get_score_band(risk.residual_risk_score)
    out.exceeds_appetite = check_appetite_violation(
        risk.residual_risk_score,
        appetite.max_acceptable_residual_risk,
    )
    if risk.target_risk_score is not None:
        out.target_band = get_score_band(risk.target_risk_score)
    return out


# ─── Risk Appetite Configuration ─────────────────────────────────────────────

@router.get("/appetite", response_model=schemas.RiskAppetiteConfigOut, tags=["Risk Appetite"])
def get_risk_appetite(db: Session = Depends(get_db)):
    """Return the current organisational risk appetite configuration."""
    return _get_appetite(db)


@router.put("/appetite", response_model=schemas.RiskAppetiteConfigOut, tags=["Risk Appetite"])
def update_risk_appetite(
    payload: schemas.RiskAppetiteConfigUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Update the risk appetite configuration (Consultant or Administrator role required)."""
    cfg = _get_appetite(db)
    before = {k: getattr(cfg, k) for k in payload.model_dump(exclude_unset=True).keys()}
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(cfg, k, v)
    db.commit()
    db.refresh(cfg)

    write_audit_log(
        db=db,
        action=models.AuditAction.UPDATE,
        entity_type="RiskAppetiteConfig",
        entity_id="singleton",
        before_values=before,
        after_values=payload.model_dump(exclude_unset=True),
        change_summary="Risk appetite configuration updated",
        user=current_user,
    )
    db.commit()
    return cfg


# ─── Risk Register CRUD ───────────────────────────────────────────────────────

@router.get("/", response_model=list[schemas.RiskOut])
def list_risks(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    status: Optional[str] = None,
    business_unit: Optional[str] = None,
    treatment_strategy: Optional[str] = None,
    exceeds_appetite: Optional[bool] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Risk)
    if category:
        q = q.filter(models.Risk.category == category)
    if status:
        q = q.filter(models.Risk.status == status)
    if business_unit:
        q = q.filter(models.Risk.business_unit.ilike(f"%{business_unit}%"))
    if treatment_strategy:
        q = q.filter(models.Risk.treatment_strategy == treatment_strategy)
    if exceeds_appetite is not None:
        q = q.filter(models.Risk.exceeds_appetite == exceeds_appetite)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Risk.title.ilike(term)
            | models.Risk.affected_asset.ilike(term)
            | models.Risk.risk_owner.ilike(term)
            | models.Risk.risk_id.ilike(term)
        )
    risks = q.offset(skip).limit(limit).all()
    appetite = _get_appetite(db)
    return [_enrich(r, appetite) for r in risks]


@router.get("/{risk_id}", response_model=schemas.RiskOut)
def get_risk(risk_id: str, db: Session = Depends(get_db)):
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return _enrich(risk, _get_appetite(db))


@router.post("/", response_model=schemas.RiskOut, status_code=201)
def create_risk(
    payload: schemas.RiskCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    scored = score_risk(payload.likelihood, payload.impact, payload.control_effectiveness_pct)
    target_score = calculate_target_risk(payload.target_likelihood, payload.target_impact)
    appetite = _get_appetite(db)

    # Auto-generate risk_id
    last = db.query(models.Risk).order_by(models.Risk.id.desc()).first()
    next_num = (last.id + 1) if last else 1

    # Exclude fields we set explicitly to avoid duplicate keyword argument errors
    _explicit_fields = {"inherent_risk_score", "residual_risk_score", "target_risk_score", "last_assessment_date"}
    risk_data = {k: v for k, v in payload.model_dump().items() if k not in _explicit_fields}

    risk = models.Risk(
        risk_id=f"RSK-{next_num:03d}",
        inherent_risk_score=scored.inherent_score,
        residual_risk_score=scored.residual_score,
        target_risk_score=target_score,
        last_assessment_date=payload.last_assessment_date or date.today(),
        **risk_data,
    )
    risk.exceeds_appetite = check_appetite_violation(
        scored.residual_score,
        appetite.max_acceptable_residual_risk,
    )

    db.add(risk)
    db.commit()
    db.refresh(risk)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db,
        action=models.AuditAction.CREATE,
        entity_type="Risk",
        entity_id=risk.risk_id,
        after_values={"title": risk.title, "inherent_score": risk.inherent_risk_score},
        change_summary=f"Risk '{risk.risk_id}: {risk.title}' created",
        user=current_user,
        ip_address=ip,
    )
    db.commit()
    return _enrich(risk, appetite)


@router.patch("/{risk_id}", response_model=schemas.RiskOut)
def update_risk(
    risk_id: str,
    payload: schemas.RiskUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")

    before = {k: getattr(risk, k) for k in payload.model_dump(exclude_unset=True).keys()}
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(risk, k, v)

    scored = score_risk(risk.likelihood, risk.impact, risk.control_effectiveness_pct)
    risk.inherent_risk_score = scored.inherent_score
    risk.residual_risk_score = scored.residual_score

    if risk.target_likelihood and risk.target_impact:
        risk.target_risk_score = calculate_target_risk(risk.target_likelihood, risk.target_impact)

    appetite = _get_appetite(db)
    risk.exceeds_appetite = check_appetite_violation(
        risk.residual_risk_score,
        appetite.max_acceptable_residual_risk,
    )

    db.commit()
    db.refresh(risk)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db,
        action=models.AuditAction.UPDATE,
        entity_type="Risk",
        entity_id=risk.risk_id,
        before_values=before,
        after_values=update_data,
        change_summary=f"Risk '{risk.risk_id}' updated",
        user=current_user,
        ip_address=ip,
    )
    db.commit()
    return _enrich(risk, appetite)


@router.delete("/{risk_id}", status_code=204)
def delete_risk(
    risk_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db,
        action=models.AuditAction.DELETE,
        entity_type="Risk",
        entity_id=risk_id,
        before_values={"title": risk.title},
        change_summary=f"Risk '{risk_id}' deleted",
        user=current_user,
        ip_address=ip,
    )
    db.delete(risk)
    db.commit()


# ─── Risk Acceptance Workflow ─────────────────────────────────────────────────

@router.post("/{risk_id}/accept", response_model=schemas.RiskAcceptanceOut, status_code=201)
def submit_risk_acceptance(
    risk_id: str,
    payload: schemas.RiskAcceptanceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Submit a risk acceptance request for the specified risk."""
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")

    last = db.query(models.RiskAcceptance).order_by(models.RiskAcceptance.id.desc()).first()
    next_num = (last.id + 1) if last else 1

    acceptance = models.RiskAcceptance(
        acceptance_id=f"ACC-{next_num:03d}",
        risk_id=risk.id,
        risk_ref=risk.risk_id,
        business_justification=payload.business_justification,
        compensating_controls=payload.compensating_controls,
        residual_risk_at_acceptance=risk.residual_risk_score,
        residual_band_at_acceptance=get_score_band(risk.residual_risk_score),
        risk_owner=payload.risk_owner,
        approver_name=payload.approver_name,
        expiry_date=payload.expiry_date,
        review_date=payload.review_date,
        approval_status=models.AcceptanceStatus.PENDING_APPROVAL,
    )
    db.add(acceptance)

    # Update risk acceptance status
    risk.acceptance_status = models.AcceptanceStatus.PENDING_APPROVAL
    db.commit()
    db.refresh(acceptance)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db,
        action=models.AuditAction.CREATE,
        entity_type="RiskAcceptance",
        entity_id=acceptance.acceptance_id,
        change_summary=f"Risk acceptance '{acceptance.acceptance_id}' submitted for risk '{risk_id}'",
        user=current_user,
        ip_address=ip,
    )
    db.commit()
    return acceptance


@router.get("/{risk_id}/acceptances", response_model=list[schemas.RiskAcceptanceOut])
def list_risk_acceptances(risk_id: str, db: Session = Depends(get_db)):
    """List all acceptance records for a risk (history)."""
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return db.query(models.RiskAcceptance).filter(models.RiskAcceptance.risk_id == risk.id).all()


@router.patch("/acceptances/{acceptance_id}", response_model=schemas.RiskAcceptanceOut)
def update_acceptance_status(
    acceptance_id: str,
    payload: schemas.RiskAcceptanceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Approve or reject a risk acceptance request."""
    acceptance = db.query(models.RiskAcceptance).filter(
        models.RiskAcceptance.acceptance_id == acceptance_id
    ).first()
    if not acceptance:
        raise HTTPException(status_code=404, detail="Acceptance record not found")

    from datetime import datetime
    before_status = acceptance.approval_status
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(acceptance, k, v)

    if payload.approval_status == "Approved":
        acceptance.approved_at = datetime.utcnow()
        # Update the parent risk
        risk = acceptance.risk
        if risk:
            risk.acceptance_status = models.AcceptanceStatus.APPROVED
            risk.status = models.RiskStatus.ACCEPTED

    db.commit()
    db.refresh(acceptance)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db,
        action=models.AuditAction.APPROVE if payload.approval_status == "Approved" else models.AuditAction.REJECT,
        entity_type="RiskAcceptance",
        entity_id=acceptance_id,
        before_values={"approval_status": str(before_status)},
        after_values={"approval_status": payload.approval_status},
        change_summary=f"Risk acceptance '{acceptance_id}' {payload.approval_status}",
        user=current_user,
        ip_address=ip,
    )
    db.commit()
    return acceptance
