"""
Remediation Tracker API router for RiskLens.
Expanded for Phase 4: full finding lifecycle, overdue detection, closure workflow.
"""
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from typing import Optional
from datetime import date, datetime
from app import models, schemas
from app.database import get_db
from app.auth import require_consultant_or_above, write_audit_log

router = APIRouter(prefix="/remediation", tags=["Remediation Tracker"])


def _check_overdue(item: models.RemediationItem) -> bool:
    """Return True if the finding is overdue (past target date and not closed)."""
    if item.status in ("Completed", "Closed", "Risk Accepted"):
        return False
    if item.target_date and item.target_date < date.today():
        return True
    return False


@router.get("/", response_model=list[schemas.RemediationOut])
def list_findings(
    skip: int = 0,
    limit: int = 100,
    severity: Optional[str] = None,
    status: Optional[str] = None,
    owner: Optional[str] = None,
    overdue_only: Optional[bool] = None,
    linked_risk_id: Optional[str] = None,
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
    if linked_risk_id:
        q = q.filter(models.RemediationItem.linked_risk_id == linked_risk_id)
    if search:
        term = f"%{search}%"
        q = q.filter(
            models.RemediationItem.finding_title.ilike(term)
            | models.RemediationItem.description.ilike(term)
            | models.RemediationItem.finding_id.ilike(term)
        )
    items = q.offset(skip).limit(limit).all()

    # Auto-update overdue status
    today = date.today()
    updated = False
    for item in items:
        if _check_overdue(item) and item.status not in ("Overdue",):
            item.status = models.RemediationStatus.OVERDUE
            updated = True
    if updated:
        db.commit()

    # Filter overdue after status update
    if overdue_only:
        items = [i for i in items if i.status == "Overdue" or _check_overdue(i)]

    return items


@router.get("/metrics")
def get_remediation_metrics(db: Session = Depends(get_db)):
    """Return remediation effectiveness metrics."""
    items = db.query(models.RemediationItem).all()
    today = date.today()

    open_items = [i for i in items if i.status in ("Open", "Assigned", "In Progress", "Overdue")]
    critical_items = [i for i in items if i.severity == "Critical" and i.status not in ("Completed", "Closed")]
    overdue_items = [i for i in items if _check_overdue(i)]
    closed_items = [i for i in items if i.status in ("Completed", "Closed")]

    # Average closure time
    closure_times = []
    for item in closed_items:
        if item.created_date and item.actual_closure_date:
            days = (item.actual_closure_date - item.created_date).days
            closure_times.append(days)
    avg_closure_days = round(sum(closure_times) / len(closure_times), 1) if closure_times else None

    # By severity
    by_severity = {}
    for item in items:
        if item.status not in ("Completed", "Closed"):
            by_severity[item.severity] = by_severity.get(item.severity, 0) + 1

    return {
        "total_open": len(open_items),
        "critical_open": len(critical_items),
        "overdue": len(overdue_items),
        "closed": len(closed_items),
        "total": len(items),
        "remediation_rate_pct": round(len(closed_items) / len(items) * 100, 1) if items else 0,
        "avg_closure_days": avg_closure_days,
        "open_by_severity": by_severity,
    }


@router.get("/{finding_id}", response_model=schemas.RemediationOut)
def get_finding(finding_id: str, db: Session = Depends(get_db)):
    item = db.query(models.RemediationItem).filter(
        models.RemediationItem.finding_id == finding_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Finding not found")
    return item


@router.post("/", response_model=schemas.RemediationOut, status_code=201)
def create_finding(
    payload: schemas.RemediationCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    last = db.query(models.RemediationItem).order_by(models.RemediationItem.id.desc()).first()
    next_num = (last.id + 1) if last else 1
    item = models.RemediationItem(
        finding_id=f"FND-{next_num:03d}",
        created_date=date.today(),
        **payload.model_dump(),
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.CREATE,
        entity_type="RemediationItem", entity_id=item.finding_id,
        change_summary=f"Finding '{item.finding_id}' created",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return item


@router.patch("/{finding_id}", response_model=schemas.RemediationOut)
def update_finding(
    finding_id: str,
    payload: schemas.RemediationUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    item = db.query(models.RemediationItem).filter(
        models.RemediationItem.finding_id == finding_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Finding not found")

    before = {"status": str(item.status)}
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(item, k, v)

    # Auto-set closure date when closing
    if payload.status in ("Completed", "Closed") and not item.actual_closure_date:
        item.actual_closure_date = date.today()

    # Set assigned date when moving to Assigned
    if payload.status == "Assigned" and not item.assigned_date:
        item.assigned_date = date.today()

    db.commit()
    db.refresh(item)

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.UPDATE,
        entity_type="RemediationItem", entity_id=finding_id,
        before_values=before,
        after_values={"status": str(item.status)},
        change_summary=f"Finding '{finding_id}' updated to status '{item.status}'",
        user=current_user, ip_address=ip,
    )
    db.commit()
    return item


@router.delete("/{finding_id}", status_code=204)
def delete_finding(
    finding_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_consultant_or_above),
):
    item = db.query(models.RemediationItem).filter(
        models.RemediationItem.finding_id == finding_id
    ).first()
    if not item:
        raise HTTPException(status_code=404, detail="Finding not found")

    ip = request.client.host if request.client else None
    write_audit_log(
        db=db, action=models.AuditAction.DELETE,
        entity_type="RemediationItem", entity_id=finding_id,
        change_summary=f"Finding '{finding_id}' deleted",
        user=current_user, ip_address=ip,
    )
    db.delete(item)
    db.commit()
