from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/vendors", tags=["Vendor Risk"])


@router.get("/", response_model=list[schemas.VendorOut])
def list_vendors(
    skip: int = 0,
    limit: int = 100,
    criticality: Optional[str] = None,
    data_sensitivity: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Vendor)
    if criticality:
        q = q.filter(models.Vendor.criticality == criticality)
    if data_sensitivity:
        q = q.filter(models.Vendor.data_sensitivity == data_sensitivity)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Vendor.name.ilike(term)
            | models.Vendor.service_category.ilike(term)
        )
    return q.offset(skip).limit(limit).all()


@router.get("/{vendor_id}", response_model=schemas.VendorOut)
def get_vendor(vendor_id: str, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    return vendor


@router.post("/", response_model=schemas.VendorOut, status_code=201)
def create_vendor(payload: schemas.VendorCreate, db: Session = Depends(get_db)):
    last = db.query(models.Vendor).order_by(models.Vendor.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    vendor = models.Vendor(
        vendor_id=f"VND-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(vendor)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.patch("/{vendor_id}", response_model=schemas.VendorOut)
def update_vendor(vendor_id: str, payload: schemas.VendorUpdate, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(vendor, k, v)
    db.commit()
    db.refresh(vendor)
    return vendor


@router.delete("/{vendor_id}", status_code=204)
def delete_vendor(vendor_id: str, db: Session = Depends(get_db)):
    vendor = db.query(models.Vendor).filter(models.Vendor.vendor_id == vendor_id).first()
    if not vendor:
        raise HTTPException(status_code=404, detail="Vendor not found")
    db.delete(vendor)
    db.commit()
