"""
RiskLens FastAPI application entry point.

⚠️  DEMO APPLICATION — All data is synthetic.
    Represents a fictional cybersecurity consulting engagement for
    "Apex Financial Services". Not for production use.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import risks, controls, remediation, vendors, reports

# Create tables on startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="RiskLens — Enterprise Cybersecurity Risk & Controls Assessment Platform",
    description=(
        "**SYNTHETIC DEMO DATA** — Simulates a cybersecurity consulting engagement "
        "for the fictional company Apex Financial Services. "
        "Framework mappings are for educational purposes only."
    ),
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(risks.router, prefix="/api")
app.include_router(controls.router, prefix="/api")
app.include_router(remediation.router, prefix="/api")
app.include_router(vendors.router, prefix="/api")
app.include_router(reports.router, prefix="/api")


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "RiskLens", "data": "SYNTHETIC/DEMO"}


@app.post("/api/admin/reseed", status_code=200)
def reseed_database():
    """Drop and recreate all tables with synthetic seed data. Use for demo reset."""
    from app.seed import reseed
    reseed()
    return {"message": "Database reseeded with synthetic demo data for Apex Financial Services."}


# Auto-seed database if empty (e.g., initial serverless / cold-start execution)
def _ensure_seeded():
    import os
    from app.models import Risk
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        if db.query(Risk).count() == 0:
            from app.seed import reseed
            reseed()
    except Exception as exc:
        print("Note on auto-seed:", exc)
    finally:
        db.close()

_ensure_seeded()


# ─── Static SPA Serving for Production (Vercel / Cloud Deployments) ──────────
import os
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
        if full_path.startswith("api"):
            from fastapi import HTTPException
            raise HTTPException(status_code=404, detail="Not Found")
        target_file = os.path.join(dist_dir, full_path)
        if os.path.isfile(target_file):
            return FileResponse(target_file)
        return FileResponse(os.path.join(dist_dir, "index.html"))

