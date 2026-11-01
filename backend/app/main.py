"""
RiskLens FastAPI application entry point — v2.0

⚠️  DEMO APPLICATION — All data is synthetic.
    Represents a fictional cybersecurity consulting engagement for
    "Apex Financial Services". Not for production use without further hardening.

Security notes:
- JWT_SECRET_KEY must be set via environment variable in production
- CORS origins must be configured via ALLOWED_ORIGINS env var
- DATABASE_URL must point to PostgreSQL in production
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import risks, controls, remediation, vendors, reports, advisor, simulation, threat_intel, harmonization, telemetry, copilot
from app.routers import auth as auth_router
from app.routers import maturity as maturity_router


# Create all tables on startup (safe for SQLite/dev; use Alembic for prod)
Base.metadata.create_all(bind=engine)

# ─── Application ──────────────────────────────────────────────────────────────

app = FastAPI(
    title="RiskLens — Enterprise GRC Platform",
    description=(
        "**SYNTHETIC DEMO DATA** — Simulates a cybersecurity consulting engagement "
        "for the fictional company Apex Financial Services. "
        "Framework mappings are for educational purposes only."
    ),
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

# ─── CORS ─────────────────────────────────────────────────────────────────────

# Configure allowed origins from environment variable (comma-separated)
_default_origins = "http://localhost:5173,http://localhost:3000,http://localhost:4173,https://risklens-grc.vercel.app"
_origins_env = os.getenv("ALLOWED_ORIGINS", _default_origins)
allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────

API_PREFIX = "/api"

app.include_router(auth_router.router, prefix=API_PREFIX)
app.include_router(risks.router, prefix=API_PREFIX)
app.include_router(controls.router, prefix=API_PREFIX)
app.include_router(remediation.router, prefix=API_PREFIX)
app.include_router(vendors.router, prefix=API_PREFIX)
app.include_router(maturity_router.router, prefix=API_PREFIX)
app.include_router(reports.router, prefix=API_PREFIX)
app.include_router(advisor.router, prefix=API_PREFIX)
app.include_router(simulation.router, prefix=API_PREFIX)
app.include_router(threat_intel.router, prefix=API_PREFIX)
app.include_router(harmonization.router, prefix=API_PREFIX)
app.include_router(telemetry.router, prefix=API_PREFIX)
app.include_router(copilot.router, prefix=API_PREFIX)

# Vercel serverless workaround: also register without /api prefix
# (The API gateway may strip the /api prefix on some routes)
app.include_router(auth_router.router)
app.include_router(risks.router)
app.include_router(controls.router)
app.include_router(remediation.router)
app.include_router(vendors.router)
app.include_router(maturity_router.router)
app.include_router(reports.router)
app.include_router(advisor.router)
app.include_router(simulation.router)
app.include_router(threat_intel.router)
app.include_router(harmonization.router)
app.include_router(telemetry.router)
app.include_router(copilot.router)



# ─── Health Check ─────────────────────────────────────────────────────────────

@app.get("/api/health")
@app.get("/health")
def health():
    return {
        "status": "ok",
        "app": "RiskLens GRC Platform",
        "version": "2.0.0",
        "data": "SYNTHETIC/DEMO",
    }


# ─── Admin Endpoints ──────────────────────────────────────────────────────────

@app.post("/api/admin/reseed", status_code=200)
def reseed_database():
    """
    Drop and recreate all tables with synthetic seed data.
    Use for demo reset only. In production, this endpoint should require
    Administrator authentication.
    """
    from app.seed import reseed
    reseed()
    return {"message": "Database reseeded with synthetic demo data for Apex Financial Services."}


@app.post("/admin/reseed", status_code=200)
def reseed_database_no_prefix():
    """Vercel serverless fallback — same as /api/admin/reseed."""
    from app.seed import reseed
    reseed()
    return {"message": "Database reseeded with synthetic demo data for Apex Financial Services."}


# ─── Auto-seed on cold start ──────────────────────────────────────────────────

def _ensure_seeded():
    """Seed database if empty (handles serverless cold-start scenario)."""
    from app.models import Risk
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Risk).count() == 0:
            from app.seed import reseed
            reseed()
    except Exception as exc:
        print(f"[INFO] Auto-seed skipped or failed: {exc}")
    finally:
        db.close()


_ensure_seeded()


# ─── Static SPA serving (production / Vercel) ─────────────────────────────────

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

current_dir = os.path.dirname(os.path.abspath(__file__))
possible_dist_dirs = [
    os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "dist")),
    os.path.abspath(os.path.join(current_dir, "..", "frontend", "dist")),
    os.path.abspath(os.path.join(current_dir, "dist")),
]

dist_dir = None
for d in possible_dist_dirs:
    if os.path.isdir(d) and os.path.isfile(os.path.join(d, "index.html")):
        dist_dir = d
        break

if dist_dir:
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path.startswith("auth"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(dist_dir, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_dir, "index.html"))
