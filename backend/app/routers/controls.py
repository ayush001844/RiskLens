"""
Control Assurance API router for RiskLens.
Expanded for Phase 2: separate design/operating effectiveness, control testing, evidence.
"""
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime
from app import models, schemas
from app.database import get_db
from app.auth import get_current_user_optional, require_consultant_or_above, write_audit_log

router = APIRouter(prefix="/controls", tags=["Control Assessment"])

# Allowed evidence file types and max size
ALLOWED_FILE_TYPES = {
    "application/pdf", "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "text/csv", "image/png", "image/jpeg", "image/gif",
}
MAX_FILE_SIZE_MB = 25
EVIDENCE_STORAGE_DIR = os.getenv("EVIDENCE_STORAGE_DIR", "/tmp/risklens_evidence")


# ─── Controls CRUD ────────────────────────────────────────────────────────────

@router.get("/", response_model=list[schemas.ControlOut])
def list_controls(
    skip: int = 0,
    limit: int = 100,
    effectiveness: Optional[str] = None,
    design_effectiveness: Optional[str] = None,
    operating_effectiveness: Optional[str] = None,
    evidence_status: Optional[str] = None,
    implementation_status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    q = db.query(models.Control)
    if effectiveness:
        q = q.filter(models.Control.effectiveness == effectiveness)
    if design_effectiveness:
        q = q.filter(models.Control.design_effectiveness == design_effectiveness)
    if operating_effectiveness:
        q = q.filter(models.Control.operating_effectiveness == operating_effectiveness)
    if evidence_status:
        q = q.filter(models.Control.evidence_status == evidence_status)
    if implementation_status:
        q = q.filter(models.Control.implementation_status == implementation_status)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.Control.control_objective.ilike(term)
            | models.Control.control_owner.ilike(term)
            | models.Control.framework_reference.ilike(term)
            | models.Control.control_id.ilike(term)
        )
    return q.offset(skip).limit(limit).all()


@router.get("/{control_id}", response_model=schemas.ControlOut)
def get_control(control_id: str, db: Session = Depends(get_db)):
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    return ctrl


@router.post("/", response_model=schemas.ControlOut, status_code=201)
def create_control(
    payload: schemas.ControlCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    last = db.query(models.Control).order_by(models.Control.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    ctrl = models.Control(
        control_id=f"CTL-{next_num:03d}",
        **payload.model_dump(),
    )
    db.add(ctrl)
    db.commit()
    db.refresh(ctrl)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.CREATE,
        entity_type="Control", entity_id=ctrl.control_id,
        change_summary=f"Control '{ctrl.control_id}' created",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return ctrl


@router.patch("/{control_id}", response_model=schemas.ControlOut)
def update_control(
    control_id: str,
    payload: schemas.ControlUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")

    before = {k: getattr(ctrl, k) for k in payload.model_dump(exclude_unset=True).keys()}
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ctrl, k, v)
    db.commit()
    db.refresh(ctrl)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPDATE,
        entity_type="Control", entity_id=control_id,
        before_values=before, after_values=payload.model_dump(exclude_unset=True),
        change_summary=f"Control '{control_id}' updated",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return ctrl


@router.delete("/{control_id}", status_code=204)
def delete_control(
    control_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.DELETE,
        entity_type="Control", entity_id=control_id,
        change_summary=f"Control '{control_id}' deleted",
        user=current_user, ip_address=ip,
    )
    db.delete(ctrl)
    db.commit()


# ─── Control Testing ──────────────────────────────────────────────────────────

@router.post("/{control_id}/tests", response_model=schemas.ControlTestOut, status_code=201)
def create_control_test(
    control_id: str,
    payload: schemas.ControlTestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Record a new control test result."""
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")

    last = db.query(models.ControlTest).order_by(models.ControlTest.id.desc()).first()
    next_num = (last.id + 1) if last else 1

    test = models.ControlTest(
        test_id=f"TST-{next_num:03d}",
        control_id=ctrl.id,
        control_ref=ctrl.control_id,
        **payload.model_dump(),
    )
    db.add(test)

    # Update the control's last testing date and operating effectiveness
    if payload.testing_period_end:
        ctrl.last_testing_date = payload.testing_period_end
    ctrl.operating_effectiveness = payload.conclusion
    # Update overall effectiveness based on design + operating
    if ctrl.design_effectiveness == "Adequate" and payload.conclusion == "Effective":
        ctrl.effectiveness = "Effective"
    elif payload.conclusion == "Ineffective":
        ctrl.effectiveness = "Ineffective"
    else:
        ctrl.effectiveness = "Partially Effective"

    db.commit()
    db.refresh(test)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.CREATE,
        entity_type="ControlTest", entity_id=test.test_id,
        change_summary=f"Control test '{test.test_id}' created for '{control_id}'",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return test


@router.get("/{control_id}/tests", response_model=list[schemas.ControlTestOut])
def list_control_tests(control_id: str, db: Session = Depends(get_db)):
    """List all test records for a control."""
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    return db.query(models.ControlTest).filter(models.ControlTest.control_id == ctrl.id).all()


# ─── Evidence Management ──────────────────────────────────────────────────────

@router.post("/{control_id}/evidence", response_model=schemas.EvidenceOut, status_code=201)
def upload_evidence(
    control_id: str,
    file: UploadFile = File(...),
    title: str = "",
    description: str = "",
    evidence_owner: str = "",
    request: Request = None,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """
    Upload an evidence file for a control.
    Files are stored securely on the server filesystem (not in the database).
    Download URLs are never public — they require authentication.
    """
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")

    # Validate file type
    if file.content_type not in ALLOWED_FILE_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Allowed: PDF, Excel, CSV, PNG, JPEG"
        )

    # Read file and check size
    content = file.file.read()
    size_bytes = len(content)
    if size_bytes > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Maximum {MAX_FILE_SIZE_MB}MB allowed."
        )

    # Store file securely
    os.makedirs(EVIDENCE_STORAGE_DIR, exist_ok=True)
    last = db.query(models.Evidence).order_by(models.Evidence.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    evidence_id = f"EVD-{next_num:03d}"
    ext = os.path.splitext(file.filename or "")[1]
    stored_filename = f"{evidence_id}_{uuid.uuid4().hex[:8]}{ext}"
    storage_path = os.path.join(EVIDENCE_STORAGE_DIR, stored_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    evidence = models.Evidence(
        evidence_id=evidence_id,
        title=title or file.filename,
        description=description,
        control_id=ctrl.id,
        control_ref=ctrl.control_id,
        evidence_owner=evidence_owner or (current_user.username if current_user else ""),
        uploaded_by=current_user.username if current_user else "",
        file_name=file.filename,
        file_type=file.content_type,
        file_size_bytes=size_bytes,
        storage_path=storage_path,  # Never exposed in API response
    )
    db.add(evidence)

    # Update control evidence status
    ctrl.evidence_status = "Provided"
    db.commit()
    db.refresh(evidence)

    ip = request.client.host if request and request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPLOAD,
        entity_type="Evidence", entity_id=evidence.evidence_id,
        change_summary=f"Evidence '{evidence.evidence_id}' uploaded for control '{control_id}'",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return evidence


@router.get("/{control_id}/evidence", response_model=list[schemas.EvidenceOut])
def list_evidence(
    control_id: str,
    db: Session = Depends(get_db),
):
    """List evidence items for a control."""
    ctrl = db.query(models.Control).filter(models.Control.control_id == control_id).first()
    if not ctrl:
        raise HTTPException(status_code=404, detail="Control not found")
    return db.query(models.Evidence).filter(models.Evidence.control_id == ctrl.id).all()


@router.patch("/evidence/{evidence_id}/verify", response_model=schemas.EvidenceOut)
def verify_evidence(
    evidence_id: str,
    payload: schemas.EvidenceUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    """Verify or reject an evidence item."""
    ev = db.query(models.Evidence).filter(models.Evidence.evidence_id == evidence_id).first()
    if not ev:
        raise HTTPException(status_code=404, detail="Evidence not found")

    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(ev, k, v)

    if payload.verification_status == "Verified":
        ev.verified_by = current_user.username
        ev.verified_at = datetime.utcnow()

    db.commit()
    db.refresh(ev)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPDATE,
        entity_type="Evidence", entity_id=evidence_id,
        change_summary=f"Evidence '{evidence_id}' verification updated to '{payload.verification_status}'",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return ev
