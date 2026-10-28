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
