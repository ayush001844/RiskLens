import os
import bcrypt
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app import models

# ─── Configuration (from environment variables) ───────────────────────────────

SECRET_KEY = os.getenv(
    "JWT_SECRET_KEY",
    "risklens-demo-secret-key-change-in-production-abc123xyz789"  # demo default
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# ─── Password hashing ─────────────────────────────────────────────────────────

def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


# ─── JWT Token utilities ──────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def create_refresh_token(data: dict) -> str:
    """Create a JWT refresh token (longer-lived)."""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str) -> dict:
    """Decode and validate a JWT token. Raises JWTError if invalid."""
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


# ─── FastAPI dependency: current authenticated user ───────────────────────────

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> models.User:
    """
    FastAPI dependency: extract and validate the JWT Bearer token.
    Returns the authenticated User object.
    Raises HTTP 401 if not authenticated.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated. Provide a valid Bearer token.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not credentials:
        raise credentials_exception

    try:
        payload = decode_token(credentials.credentials)
        username: str = payload.get("sub")
        token_type: str = payload.get("type", "")
        if username is None or token_type != "access":
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = db.query(models.User).filter(
        models.User.username == username,
        models.User.is_active == True,
    ).first()

    if user is None:
        raise credentials_exception

    return user


def get_current_user_optional(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Optional[models.User]:
    """
    Like get_current_user but returns None instead of raising 401.
    Used for endpoints that work both authenticated and unauthenticated
    (e.g. dashboard in demo mode).
    """
    if not credentials:
        return None
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None


def require_role(*allowed_roles: models.UserRole):
    """
    FastAPI dependency factory: require the current user to have one of the specified roles.
    Usage: Depends(require_role(UserRole.ADMINISTRATOR, UserRole.CONSULTANT))
    """
    def _check(current_user: models.User = Depends(get_current_user)) -> models.User:
        if current_user.role not in [r.value if hasattr(r, 'value') else r for r in allowed_roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role(s): {[str(r) for r in allowed_roles]}",
            )
        return current_user
    return _check


# Convenience role dependencies
require_admin = require_role(models.UserRole.ADMINISTRATOR)
require_consultant_or_above = require_role(
    models.UserRole.ADMINISTRATOR,
    models.UserRole.CONSULTANT,
)
require_read_access = require_role(
    models.UserRole.ADMINISTRATOR,
    models.UserRole.CONSULTANT,
    models.UserRole.RISK_OWNER,
    models.UserRole.CONTROL_OWNER,
    models.UserRole.AUDITOR,
    models.UserRole.EXECUTIVE,
)


# ─── Audit trail helper ───────────────────────────────────────────────────────

def write_audit_log(
    db: Session,
    action: models.AuditAction,
    entity_type: str,
    entity_id: Optional[str] = None,
    before_values: Optional[dict] = None,
    after_values: Optional[dict] = None,
    change_summary: Optional[str] = None,
    user: Optional[models.User] = None,
    ip_address: Optional[str] = None,
    change_justification: Optional[str] = None,
) -> None:
    """
    Write an immutable audit log entry.
    This function should be called before the response is returned.
    It commits independently — failure to audit does not rollback the main transaction.
    """
    try:
        log = models.AuditLog(
            user_id=user.id if user else None,
            username=user.username if user else "system",
            user_role=user.role if user else None,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            before_values=before_values,
            after_values=after_values,
            change_summary=change_summary,
            ip_address=ip_address,
            change_justification=change_justification,
        )
        db.add(log)
        db.flush()  # write without committing main transaction
    except Exception as e:
        # Audit failure should not break the main operation — log but don't raise
        print(f"[AUDIT WARNING] Failed to write audit log: {e}")
