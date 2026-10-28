"""
Integration tests for RiskLens API endpoints.
Run with:  cd backend && python -m pytest tests/ -v
"""
import os
import pytest

# ── Point env var BEFORE any app import so database.py picks it up ──────────
TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_risklens.db")
TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"
os.environ["DATABASE_URL"] = TEST_DB_URL

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Now import app modules — they will use TEST_DB_URL from os.environ
import app.database as db_mod
from app.database import get_db, Base
import app.models  # Ensure all model tables are registered in Base.metadata

# Build test engine & session
test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

# Patch module-level references so routes also use the test DB
db_mod.engine = test_engine
db_mod.SessionLocal = TestSession


@pytest.fixture(scope="module")
def client():
    # Create all tables on the test engine
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    # Seed via the private seed functions
    from app.seed import _seed_risks, _seed_controls, _seed_remediation, _seed_vendors
    db = TestSession()
    try:
        _seed_risks(db)
        _seed_controls(db)
        _seed_remediation(db)
        _seed_vendors(db)
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

    def override_get_db():
        db = TestSession()
        try:
            yield db
        finally:
            db.close()

    from app.main import app
    app.dependency_overrides[get_db] = override_get_db

    from fastapi.testclient import TestClient
    with TestClient(app) as c:
        yield c

    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    try:
        os.remove(TEST_DB_PATH)
    except FileNotFoundError:
        pass


# ─── Health ──────────────────────────────────────────────────────────────────

def test_health(client):
    resp = client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json()["status"] == "ok"


# ─── Risks ───────────────────────────────────────────────────────────────────

def test_list_risks(client):
    resp = client.get("/api/risks/")
    assert resp.status_code == 200
    data = resp.json()
    assert len(data) == 25


def test_get_risk_by_id(client):
    resp = client.get("/api/risks/RSK-001")
    assert resp.status_code == 200
    r = resp.json()
    assert r["risk_id"] == "RSK-001"
    assert r["inherent_risk_score"] == 20
    assert r["inherent_band"] == "Critical"


def test_risk_scores_calculated_not_hardcoded(client):
    """All inherent scores must equal likelihood × impact."""
    resp = client.get("/api/risks/?limit=100")
    for r in resp.json():
        assert r["inherent_risk_score"] == r["likelihood"] * r["impact"]


def test_risk_not_found(client):
    resp = client.get("/api/risks/RSK-999")
    assert resp.status_code == 404


def test_create_risk(client):
    payload = {
        "title": "Test Risk",
        "category": "Test",
        "affected_asset": "Test Asset",
        "threat": "Test threat",
        "vulnerability": "Test vuln",
        "business_impact": "Test impact",
        "likelihood": 3,
        "impact": 4,
        "control_effectiveness_pct": 50,
        "risk_owner": "Test Owner",
        "treatment_strategy": "Mitigate",
        "status": "Open",
    }
    resp = client.post("/api/risks/", json=payload)
    assert resp.status_code == 201
    data = resp.json()
    assert data["inherent_risk_score"] == 12    # 3×4
    assert data["residual_risk_score"] == 6.0   # 12×0.5
    assert data["inherent_band"] == "High"
    assert data["residual_band"] == "Medium"


def test_create_risk_invalid_likelihood(client):
    payload = {
        "title": "Bad Risk", "category": "Test", "affected_asset": "X",
        "threat": "T", "vulnerability": "V", "business_impact": "B",
        "likelihood": 6,  # invalid
        "impact": 3,
        "risk_owner": "Owner", "treatment_strategy": "Mitigate",
    }
    resp = client.post("/api/risks/", json=payload)
    assert resp.status_code == 422


def test_update_risk(client):
    resp = client.patch(
        "/api/risks/RSK-005",
        json={"status": "Closed", "control_effectiveness_pct": 80},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "Closed"
    # RSK-005: likelihood=4, impact=4 → inherent=16; eff=80% → residual=3.2
    assert data["residual_risk_score"] == pytest.approx(3.2)


def test_filter_risks_by_status(client):
    resp = client.get("/api/risks/?status=Open")
    assert resp.status_code == 200
    for r in resp.json():
        assert r["status"] == "Open"


# ─── Controls ────────────────────────────────────────────────────────────────

def test_list_controls(client):
    resp = client.get("/api/controls/")
    assert resp.status_code == 200
    assert len(resp.json()) == 30


def test_filter_controls_ineffective(client):
    resp = client.get("/api/controls/?effectiveness=Ineffective")
    assert resp.status_code == 200
    for c in resp.json():
        assert c["effectiveness"] == "Ineffective"


def test_get_control_by_id(client):
    resp = client.get("/api/controls/CTL-001")
    assert resp.status_code == 200
    assert resp.json()["control_id"] == "CTL-001"


# ─── Remediation ─────────────────────────────────────────────────────────────

def test_list_remediation(client):
    resp = client.get("/api/remediation/")
    assert resp.status_code == 200
    assert len(resp.json()) == 15


def test_filter_remediation_by_severity(client):
    resp = client.get("/api/remediation/?severity=Critical")
    assert resp.status_code == 200
    for item in resp.json():
        assert item["severity"] == "Critical"


def test_remediation_update_status(client):
    resp = client.patch("/api/remediation/FND-004", json={"status": "In Progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "In Progress"


# ─── Vendors ─────────────────────────────────────────────────────────────────

def test_list_vendors(client):
    resp = client.get("/api/vendors/")
    assert resp.status_code == 200
    assert len(resp.json()) == 10


def test_filter_vendors_criticality(client):
    resp = client.get("/api/vendors/?criticality=Critical")
    assert resp.status_code == 200
    for v in resp.json():
        assert v["criticality"] == "Critical"


# ─── Dashboard ───────────────────────────────────────────────────────────────

def test_dashboard_totals(client):
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    d = resp.json()
    assert d["total_risks"] >= 25   # 25 seeded + maybe test-created
    assert d["total_vendors"] == 10
    # Bands sum must equal total
    band_sum = d["critical_risks"] + d["high_risks"] + d["medium_risks"] + d["low_risks"]
    assert band_sum == d["total_risks"]


def test_dashboard_risk_distribution_complete(client):
    resp = client.get("/api/dashboard")
    d = resp.json()
    total_from_dist = sum(x["count"] for x in d["risk_distribution"])
    assert total_from_dist == d["total_risks"]


# ─── Reports & CSV ───────────────────────────────────────────────────────────

def test_csv_risks_export(client):
    resp = client.get("/api/reports/csv/risks")
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]
    lines = resp.text.strip().split("\n")
    assert len(lines) > 1  # header + at least one data row


def test_full_report(client):
    resp = client.get("/api/reports/full")
    assert resp.status_code == 200
    data = resp.json()
    assert "executive_summary" in data
    assert "top_risks" in data
    assert "remediation_roadmap" in data
    assert data["report_metadata"]["client"].startswith("Apex Financial Services")
    assert "SYNTHETIC" in data["report_metadata"]["disclaimer"]
