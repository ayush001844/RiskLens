"""
Authentication API router for RiskLens.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db
from app.auth import (
    hash_password, verify_password,
    create_access_token, create_refresh_token, decode_token,
    get_current_user, require_admin, write_audit_log,
    ACCESS_TOKEN_EXPIRE_MINUTES,
)
from jose import JWTError

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=schemas.TokenResponse)
def login(payload: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    """Authenticate a user and return JWT tokens."""
    user = db.query(models.User).filter(
        models.User.username == payload.username,
        models.User.is_active == True,
    ).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )

    access_token = create_access_token(data={"sub": user.username})
    refresh_token = create_refresh_token(data={"sub": user.username})

    # Update last login
    user.last_login = datetime.utcnow()
    db.commit()
    db.refresh(user)

    # Audit
    ip = request.client.host if request.client else None
    write_audit_log(
        db=db,
        action=models.AuditAction.LOGIN,
        entity_type="User",
        entity_id=user.username,
        change_summary=f"User '{user.username}' logged in",
        user=user,
        ip_address=ip,
    )
    db.commit()

    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserOut.model_validate(user),
    )


@router.post("/refresh", response_model=schemas.TokenResponse)
def refresh_token(payload: schemas.RefreshRequest, db: Session = Depends(get_db)):
    """Exchange a refresh token for a new access token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired refresh token",
    )
    try:
        data = decode_token(payload.refresh_token)
        if data.get("type") != "refresh":
            raise credentials_exception
        username = data.get("sub")
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.is_active == True,
    ).first()
    if not user:
        raise credentials_exception

    access_token = create_access_token(data={"sub": user.username})
    return schemas.TokenResponse(
        access_token=access_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=schemas.UserOut.model_validate(user),
    )


@router.get("/me", response_model=schemas.UserOut)
def get_me(current_user: models.User = Depends(get_current_user)):
    """Return the current authenticated user's profile."""
    return current_user


@router.get("/users", response_model=list[schemas.UserOut])
def list_users(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """List all users (Administrator only)."""
    return db.query(models.User).all()


@router.post("/users", response_model=schemas.UserOut, status_code=201)
def create_user(
    payload: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """Create a new user (Administrator only)."""
    if db.query(models.User).filter(models.User.username == payload.username).first():
        raise HTTPException(status_code=409, detail="Username already exists")
    if db.query(models.User).filter(models.User.email == payload.email).first():
        raise HTTPException(status_code=409, detail="Email already registered")

    user = models.User(
        username=payload.username,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        full_name=payload.full_name,
        role=payload.role,
        business_unit=payload.business_unit,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    write_audit_log(
        db=db,
        action=models.AuditAction.CREATE,
        entity_type="User",
        entity_id=user.username,
        change_summary=f"User '{user.username}' created with role '{user.role}'",
        user=current_user,
    )
    db.commit()
    return user


@router.patch("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: int,
    payload: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_admin),
):
    """Update a user (Administrator only)."""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    before = {"role": user.role, "is_active": user.is_active}
    for k, v in payload.model_dump(exclude_unset=True).items():
        setattr(user, k, v)
    db.commit()
    db.refresh(user)

    write_audit_log(
        db=db,
        action=models.AuditAction.UPDATE,
        entity_type="User",
        entity_id=user.username,
        before_values=before,
        after_values={"role": user.role, "is_active": user.is_active},
        change_summary=f"User '{user.username}' updated",
        user=current_user,
    )
    db.commit()
    return user
