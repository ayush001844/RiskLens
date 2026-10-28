from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.database import get_db
from app.scoring import score_risk, get_score_band

router = APIRouter(prefix="/risks", tags=["Risk Register"])


def _enrich(risk: models.Risk) -> schemas.RiskOut:
    out = schemas.RiskOut.model_validate(risk)
    out.inherent_band = get_score_band(risk.inherent_risk_score)
    out.residual_band = get_score_band(risk.residual_risk_score)
    return out


@router.get("/", response_model=list[schemas.RiskOut])
def list_risks(
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Risk)
    if category:
        q = q.filter(models.Risk.category == category)
    if status:
        q = q.filter(models.Risk.status == status)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Risk.title.ilike(term)
            | models.Risk.affected_asset.ilike(term)
            | models.Risk.risk_owner.ilike(term)
        )
    risks = q.offset(skip).limit(limit).all()
    return [_enrich(r) for r in risks]


@router.get("/{risk_id}", response_model=schemas.RiskOut)
def get_risk(risk_id: str, db: Session = Depends(get_db)):
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    return _enrich(risk)


@router.post("/", response_model=schemas.RiskOut, status_code=201)
def create_risk(payload: schemas.RiskCreate, db: Session = Depends(get_db)):
    scored = score_risk(payload.likelihood, payload.impact, payload.control_effectiveness_pct)
    # Auto-generate risk_id
    last = db.query(models.Risk).order_by(models.Risk.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    risk = models.Risk(
        risk_id=f"RSK-{next_num:03d}",
        inherent_risk_score=scored.inherent_score,
        residual_risk_score=scored.residual_score,
        **payload.model_dump(),
    )
    db.add(risk)
    db.commit()
    db.refresh(risk)
    return _enrich(risk)


@router.patch("/{risk_id}", response_model=schemas.RiskOut)
def update_risk(risk_id: str, payload: schemas.RiskUpdate, db: Session = Depends(get_db)):
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    update_data = payload.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(risk, k, v)
    # Recalculate scores if scoring inputs changed
    scored = score_risk(risk.likelihood, risk.impact, risk.control_effectiveness_pct)
    risk.inherent_risk_score = scored.inherent_score
    risk.residual_risk_score = scored.residual_score
    db.commit()
    db.refresh(risk)
    return _enrich(risk)


@router.delete("/{risk_id}", status_code=204)
def delete_risk(risk_id: str, db: Session = Depends(get_db)):
    risk = db.query(models.Risk).filter(models.Risk.risk_id == risk_id).first()
    if not risk:
        raise HTTPException(status_code=404, detail="Risk not found")
    db.delete(risk)
    db.commit()
