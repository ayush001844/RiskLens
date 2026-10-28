from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/remediation", tags=["Remediation Tracker"])


@router.get("/", response_model=list[schemas.RemediationOut])
def list_findings(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.RemediationItem)
    if severity:
        q = q.filter(models.RemediationItem.severity == severity)
    if status:
        q = q.filter(models.RemediationItem.status == status)
    if owner:
        q = q.filter(models.RemediationItem.accountable_owner.ilike(f"%{owner}%"))
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.RemediationItem.finding_title.ilike(term)
            | models.RemediationItem.description.ilike(term)
        )
    return q.offset(skip).limit(limit).all()


@router.get("/{finding_id}", response_model=schemas.RemediationOut)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    item = db.query(models.RemediationItem).filter(
        models.RemediationItem.finding_id == finding_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Finding not found")
    return item


@router.post("/", response_model=schemas.RemediationOut, status_code=201)
def create_finding(payload: schemas.RemediationCreate, db: Session = Depends(get_db)):
    last = db.query(models.RemediationItem).order_by(models.RemediationItem.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    item = models.RemediationItem(
        finding_id=f"FND-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.patch("/{finding_id}", response_model=schemas.RemediationOut)
def update_finding(finding_id: str, payload: schemas.RemediationUpdate, db: Session = Depends(get_db)):
    item = db.query(models.RemediationItem).filter(
        models.RemediationItem.finding_id == finding_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Finding not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/{finding_id}", status_code=204)
def delete_finding(finding_id: str, db: Session = Depends(get_db)):
    item = db.query(models.RemediationItem).filter(
        models.RemediationItem.finding_id == finding_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Finding not found")
    db.delete(item)
    db.commit()
