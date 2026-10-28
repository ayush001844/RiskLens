"""
Database configuration for RiskLens.
Uses SQLite for portability; swap DATABASE_URL to PostgreSQL/MySQL for production.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# On serverless environments (e.g. Vercel / Lambda), filesystem outside /tmp is read-only
if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME") or not os.access(BASE_DIR, os.W_OK):
    import shutil
    tmp_db_path = "/tmp/risklens.db"
    orig_db_path = os.path.join(BASE_DIR, "risklens.db")
    if not os.path.exists(tmp_db_path) and os.path.exists(orig_db_path):
        try:
            shutil.copy2(orig_db_path, tmp_db_path)
        except Exception:
            pass
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{tmp_db_path}")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{BASE_DIR}/risklens.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
