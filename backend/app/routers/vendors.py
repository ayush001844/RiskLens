"""
Vendor Risk API router for RiskLens.
Expanded for Phase 4: full lifecycle, extended assessment fields, questionnaire scoring.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.database import get_db
from app.auth import require_consultant_or_above, write_audit_log

router = APIRouter(prefix="/vendors", tags=["Vendor Risk"])


@router.get("/", response_model=list[schemas.VendorOut])
def list_vendors(
    skip: int = 0,
    limit: int = 100,
    criticality: Optional[str] = None,
    data_sensitivity: Optional[str] = None,
    lifecycle_stage: Optional[str] = None,
    soc2_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Vendor)
    if criticality:
        q = q.filter(models.Vendor.criticality == criticality)
    if data_sensitivity:
        q = q.filter(models.Vendor.data_sensitivity == data_sensitivity)
    if lifecycle_stage:
        q = q.filter(models.Vendor.lifecycle_stage == lifecycle_stage)
    if soc2_status:
        q = q.filter(models.Vendor.soc2_type2_status == soc2_status)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Vendor.name.ilike(term)
            | models.Vendor.service_category.ilike(term)
            | models.Vendor.vendor_id.ilike(term)
        )
    return q.offset(skip).limit(limit).all()


@router.get("/risk-summary")
def get_vendor_risk_summary(db: Session = Depends(get_db)):
    """Return aggregated vendor risk metrics."""
    vendors = db.query(models.Vendor).all()
    active = [v for v in vendors if v.lifecycle_stage not in ("Offboarded",)]

    by_criticality = {}
    for v in active:
        by_criticality[v.criticality] = by_criticality.get(v.criticality, 0) + 1

    high_risk = [v for v in active if v.residual_risk_score >= 15]
    restricted_data = [v for v in active if v.data_sensitivity in ("Restricted", "Confidential")]
    no_soc2 = [v for v in active if v.criticality in ("Critical", "High") and v.soc2_type2_status not in ("Current",)]

    return {
        "total_vendors": len(vendors),
        "active_vendors": len(active),
        "by_criticality": [{"criticality": k, "count": v} for k, v in by_criticality.items()],
        "high_risk_vendors": len(high_risk),
        "vendors_with_restricted_data": len(restricted_data),
        "critical_high_without_soc2": len(no_soc2),
    }


@router.get("/{vendor_id}", response_model=schemas.VendorOut)
def get_vendor(vendor_id: str, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("/", response_model=schemas.VendorOut, status_code=201)
def create_vendor(
    payload: schemas.VendorCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    last = db.query(models.Vendor).order_by(models.Vendor.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    vendor = models.Vendor(
        vendor_id=f"VND-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.CREATE,
        entity_type="Vendor", entity_id=vendor.vendor_id,
        change_summary=f"Vendor '{vendor.vendor_id}: {vendor.name}' created",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return vendor


@router.patch("/{vendor_id}", response_model=schemas.VendorOut)
def update_vendor(
    vendor_id: str,
    payload: schemas.VendorUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    before = {k: getattr(vendor, k) for k in payload.model_dump(exclude_unset=True).keys()}
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(vendor, k, v)
    db.commit()
    db.refresh(vendor)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPDATE,
        entity_type="Vendor", entity_id=vendor_id,
        before_values=before,
        after_values=payload.model_dump(exclude_unset=True),
        change_summary=f"Vendor '{vendor_id}' updated",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return vendor


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(
    vendor_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.DELETE,
        entity_type="Vendor", entity_id=vendor_id,
        change_summary=f"Vendor '{vendor_id}' deleted",
        user=current_user, ip_address=ip,
    )
    db.delete(vendor)
    db.commit()
