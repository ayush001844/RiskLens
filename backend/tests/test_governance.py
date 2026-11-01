"""
Integration tests for RiskLens v2.0 Governance, Maturity, Compliance, Threats & Reports.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_PATH = "/tmp/test_risklens_gov.db"
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"
os.environ["DATABASE_URL"] = TEST_DB_URL

import app.database as db_mod
from app.database import get_db, Base
from app.main import app
from app.seed import (
    _seed_users, _seed_risk_appetite, _seed_risks, _seed_controls,
    _seed_remediation, _seed_vendors, _seed_maturity_assessment,
    _seed_compliance_frameworks, _seed_threat_scenarios,
)
from app.auth import create_access_token

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
db_mod.engine = test_engine
db_mod.SessionLocal = TestSession


@pytest.fixture(scope="module")
def client():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    db = TestSession()
    try:
        _seed_users(db)
        _seed_risk_appetite(db)
        _seed_risks(db)
        _seed_controls(db)
        _seed_remediation(db)
        _seed_vendors(db)
        _seed_maturity_assessment(db)
        _seed_compliance_frameworks(db)
        _seed_threat_scenarios(db)
        db.commit()
    finally:
        db.close()

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_get_risk_appetite(client):
    res = client.get("/api/risks/appetite")
    assert res.status_code == 200
    data = res.json()
    assert data["organisation_name"] == "Apex Financial Services"
    assert data["max_acceptable_residual_risk"] == 9


def test_get_maturity_assessment(client):
    res = client.get("/api/maturity/latest")
    assert res.status_code == 200
    data = res.json()
    assert "govern_current" in data
    assert "protect_current" in data


def test_get_maturity_gap_analysis(client):
    res = client.get("/api/maturity/MAT-001/gap-analysis")
    assert res.status_code == 200
    gaps = res.json()["gap_analysis"]
    assert len(gaps) == 6
    for g in gaps:
        assert "function" in g
        assert "current_value" in g
        assert "target_value" in g
        assert "gap" in g


def test_get_compliance_summary(client):
    res = client.get("/api/compliance/summary")
    assert res.status_code == 200
    data = res.json()
    assert "disclaimer" in data
    assert "frameworks" in data
    assert len(data["frameworks"]) >= 3


def test_get_threats(client):
    res = client.get("/api/threats")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 3
    assert data[0]["scenario_id"].startswith("THR-")


def test_get_audit_logs(client):
    res = client.get("/api/audit")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


def test_excel_report_export(client):
    res = client.get("/api/reports/excel")
    assert res.status_code == 200
    assert "application/vnd.openxmlformats" in res.headers["content-type"]
    assert len(res.content) > 1000


def test_csv_risks_export(client):
    res = client.get("/api/reports/csv/risks")
    assert res.status_code == 200
    assert "text/csv" in res.headers["content-type"]
    assert "RSK-" in res.text


def test_pdf_report_export(client):
    res = client.get("/api/reports/pdf")
    assert res.status_code == 200
    assert "application/pdf" in res.headers["content-type"]
    assert len(res.content) > 1000  # Valid binary PDF stream


def test_ai_advisor_analysis(client):
    res = client.get("/api/advisor/analyze")
    assert res.status_code == 200
    data = res.json()
    assert "posture_summary" in data
    assert "prioritized_actions" in data
    assert "regulatory_exposure" in data
    assert len(data["prioritized_actions"]) >= 3


def test_simulation_initiatives(client):
    res = client.get("/api/simulation/initiatives")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    assert data[0]["id"] == "INIT-FIDO2"


def test_simulation_model_run(client):
    res = client.post(
        "/api/simulation/model",
        json={
            "threat_multiplier": 1.0,
            "enabled_initiatives": ["INIT-FIDO2", "INIT-CLOUD-GUARD"],
        },
    )
    assert res.status_code == 200
    data = res.json()
    assert data["active_initiative_count"] == 2
    assert data["total_investment_cost_usd"] == 60000.0
    assert "simulated_summary" in data
    assert "simulated_risks" in data
    assert len(data["simulated_risks"]) > 0
    assert data["simulated_summary"]["risk_reduction_pct"] > 0
    assert data["simulated_summary"]["estimated_monetary_risk_reduction_usd"] > 0


def test_threat_intel_feed(client):
    res = client.get("/api/threat-intel/feed")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 8
    assert data[0]["cve_id"].startswith("CVE-")
    assert "exposure_level" in data[0]
    assert "correlation_status" in data[0]


def test_threat_intel_summary(client):
    res = client.get("/api/threat-intel/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["total_monitored_cves"] >= 8
    assert data["cisa_kev_listed_cves"] >= 7
    assert data["known_ransomware_vectors"] >= 5
    assert data["correlated_active_risk_matches"] > 0


def test_threat_intel_sync(client):
    res = client.post("/api/threat-intel/sync")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["ingested_cves"] >= 8


def test_harmonization_crosswalk(client):
    res = client.get("/api/harmonization/crosswalk")
    assert res.status_code == 200
    data = res.json()
    assert len(data) == 8
    first = data[0]
    assert "ccf_id" in first
    assert "primary_control_id" in first
    assert "mappings" in first
    assert "nist_csf_2" in first["mappings"]
    assert "iso_27001_2022" in first["mappings"]
    assert "rbi_csf" in first["mappings"]
    assert "dpdp_act_2023" in first["mappings"]
    assert "pci_dss_v4" in first["mappings"]


def test_harmonization_posture(client):
    res = client.get("/api/harmonization/posture")
    assert res.status_code == 200
    data = res.json()
    assert data["total_unified_controls"] == 8
    assert data["audit_efficiency_multiplier"] == 5.0
    assert data["total_regulatory_obligations_satisfied"] == 40
    assert "framework_scores" in data
    assert "rbi_csf" in data["framework_scores"]
    assert "dpdp_act_2023" in data["framework_scores"]


def test_harmonization_audit_readiness(client):
    res = client.get("/api/harmonization/audit-readiness")
    assert res.status_code == 200
    data = res.json()
    assert data["organization"] == "Apex Financial Services Ltd."
    assert "methodology" in data
    assert len(data["framework_scorecards"]) >= 5
    authorities = [sc["regulatory_authority"] for sc in data["framework_scorecards"]]
    assert any("Reserve Bank of India" in a for a in authorities)


def test_harmonization_evaluate(client):
    res = client.post("/api/harmonization/evaluate", json={"control_id": "CTL-002", "proposed_effectiveness": "Effective"})
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["control_id"] == "CTL-002"
    assert data["proposed_effectiveness"] == "Effective"
    assert len(data["harmonized_propagation"]) >= 5
    framework_keys = [p["framework_key"] for p in data["harmonized_propagation"]]
    assert "rbi_csf" in framework_keys
    assert "dpdp_act_2023" in framework_keys


def test_dossier_summary(client):
    res = client.get("/api/reports/dossier/summary")
    assert res.status_code == 200
    data = res.json()
    assert data["organization"] == "Apex Financial Services Ltd."
    assert "available_bundles" in data
    assert len(data["available_bundles"]) == 4
    bundle_ids = [b["bundle_id"] for b in data["available_bundles"]]
    assert "ALL" in bundle_ids
    assert "RBI" in bundle_ids
    assert "DPBI" in bundle_ids
    assert "PCI_SSC" in bundle_ids
    assert len(data["dossier_contents"]) == 7


def test_dossier_download_all(client):
    import zipfile
    import io
    res = client.get("/api/reports/dossier/download?bundle=ALL")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    zf = zipfile.ZipFile(io.BytesIO(res.content))
    namelist = zf.namelist()
    assert len(namelist) == 7
    assert "01_Executive_Transmittal_Memorandum.pdf" in namelist
    assert "02_Unified_Controls_Evidence_Register.csv" in namelist
    assert "03_Common_Control_Framework_Crosswalk.csv" in namelist
    assert "04_Critical_Deficiencies_and_Remediation_Schedule.csv" in namelist
    assert "05_Evidence_Verification_Chain_of_Custody.csv" in namelist
    assert "Audit_Package_Manifest.json" in namelist
    assert "SHA256SUMS.txt" in namelist


def test_dossier_download_rbi(client):
    import zipfile
    import io
    import json
    res = client.get("/api/reports/dossier/download?bundle=RBI")
    assert res.status_code == 200
    assert res.headers["content-type"] == "application/zip"
    zf = zipfile.ZipFile(io.BytesIO(res.content))
    assert len(zf.namelist()) == 7
    manifest = json.loads(zf.read("Audit_Package_Manifest.json"))
    assert manifest["bundle_id"] == "RBI"
    assert "Apex Financial Services" in manifest["organization"]


# ─── Phase 16: Telemetry & CCM Tests ──────────────────────────────────────────

def test_telemetry_connectors(client):
    res = client.get("/api/telemetry/connectors")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    connector_ids = [c["connector_id"] for c in data]
    assert "aws_iam" in connector_ids
    assert "crowdstrike_falcon" in connector_ids
    assert "splunk_siem" in connector_ids


def test_telemetry_events(client):
    res = client.get("/api/telemetry/events")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 5
    first = data[0]
    assert "event_id" in first
    assert "severity" in first
    assert "affected_control_id" in first


def test_telemetry_stats(client):
    res = client.get("/api/telemetry/stats")
    assert res.status_code == 200
    data = res.json()
    assert data["total_active_connectors"] >= 5
    assert "telemetry_health_index_pct" in data
    assert "active_drift_incidents" in data


def test_telemetry_sync(client):
    res = client.post("/api/telemetry/sync/splunk_siem")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "success"
    assert data["connector_id"] == "splunk_siem"


def test_telemetry_webhook(client):
    payload = {
        "source": "aws_iam",
        "event_type": "IAM Key Exposure Test",
        "affected_control_id": "CTL-001",
        "severity": "WARNING",
        "details": "Simulated test finding from AWS Security Hub.",
        "automated_action": "Disabled test key",
    }
    res = client.post("/api/telemetry/webhook/aws_iam", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ingested"
    assert data["affected_control_id"] == "CTL-001"


# ─── Phase 17: CISO Copilot Tests ─────────────────────────────────────────────

def test_copilot_quick_prompts(client):
    res = client.get("/api/copilot/quick-prompts")
    assert res.status_code == 200
    data = res.json()
    assert len(data) >= 4
    assert any("Board" in qp["title"] for qp in data)


def test_copilot_chat_briefing(client):
    res = client.post("/api/copilot/chat", json={"message": "Give me a briefing for the board meeting"})
    assert res.status_code == 200
    data = res.json()
    assert "response" in data
    assert len(data["response"]) > 50
    assert "Apex Financial Services" in data["response"]
    assert len(data["sources"]) > 0
    assert len(data["suggested_followups"]) > 0


def test_copilot_chat_dpdp(client):
    res = client.post("/api/copilot/chat", json={"message": "What is our DPDP Act penalty exposure?"})
    assert res.status_code == 200
    data = res.json()
    assert "₹250 Crores" in data["response"] or "DPDP" in data["response"]
    assert len(data["sources"]) > 0




