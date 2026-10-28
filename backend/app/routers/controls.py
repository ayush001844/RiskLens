from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/controls", tags=["Control Assessment"])


@router.get("/", response_model=list[schemas.ControlOut])
def list_controls(
    skip: int = 0,
    limit: int = 100,
    effectiveness: Optional[str] = None,
    evidence_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Control)
    if effectiveness:
        q = q.filter(models.Control.effectiveness == effectiveness)
    if evidence_status:
        q = q.filter(models.Control.evidence_status == evidence_status)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Control.control_objective.ilike(term)
            | models.Control.control_owner.ilike(term)
            | models.Control.framework_reference.ilike(term)
        )
    return q.offset(skip).limit(limit).all()


@router.get("/{control_id}", response_model=schemas.ControlOut)
def get_control(control_id: str, db: Session = Depends(get_db)):
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    return ctrl


@router.post("/", response_model=schemas.ControlOut, status_code=201)
def create_control(payload: schemas.ControlCreate, db: Session = Depends(get_db)):
    last = db.query(models.Control).order_by(models.Control.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    ctrl = models.Control(
        control_id=f"CTL-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(ctrl)
    db.commit()
    db.refresh(ctrl)
    return ctrl


@router.patch("/{control_id}", response_model=schemas.ControlOut)
def update_control(control_id: str, payload: schemas.ControlUpdate, db: Session = Depends(get_db)):
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ctrl, k, v)
    db.commit()
    db.refresh(ctrl)
    return ctrl


@router.delete("/{control_id}", status_code=204)
def delete_control(control_id: str, db: Session = Depends(get_db)):
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    db.delete(ctrl)
    db.commit()
