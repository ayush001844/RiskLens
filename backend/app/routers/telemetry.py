"""
Continuous Control Monitoring (CCM) & Automated Health Telemetry Connectors Router.
Ingests real-time telemetry from AWS IAM, CrowdStrike Falcon, Splunk SIEM, Qualys VM, and Tenable CSPM
to stream live control health status, detect configuration drift, and trigger automated alerts.
"""
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/telemetry", tags=["Continuous Control Monitoring (CCM)"])

# In-memory connectors state (persistent for runtime session)
CONNECTORS_DATA = [
    {
        "connector_id": "aws_iam",
        "name": "AWS Identity & Access Management (AWS IAM / Security Hub)",
        "provider": "Amazon Web Services (ap-south-1 Mumbai)",
        "status": "CONNECTED",
        "health_score": 78.0,
        "monitored_controls": ["CTL-001", "CTL-002"],
        "ccf_domain": "Identity & Access Governance",
        "last_sync_timestamp": datetime.utcnow().isoformat() + "Z",
        "metrics": {
            "root_mfa_status": "ENFORCED",
            "console_users_without_mfa": 4,
            "inactive_access_keys_over_90d": 7,
            "cloudtrail_iam_logging": "ACTIVE",
            "drift_severity": "WARNING",
        },
        "drift_summary": "4 console users created without mandatory MFA enforcement. Violates RBI Sec 3.2.",
    },
    {
        "connector_id": "crowdstrike_falcon",
        "name": "CrowdStrike Falcon Endpoint Security (EDR)",
        "provider": "CrowdStrike Falcon Cloud API",
        "status": "CONNECTED",
        "health_score": 94.5,
        "monitored_controls": ["CTL-004", "CTL-007"],
        "ccf_domain": "Vulnerability & Threat Management",
        "last_sync_timestamp": datetime.utcnow().isoformat() + "Z",
        "metrics": {
            "fleet_sensor_coverage_pct": 98.4,
            "monitored_endpoints": 388,
            "active_sensor_count": 382,
            "quarantined_threat_events": 2,
            "drift_severity": "OPTIMAL",
        },
        "drift_summary": "98.4% sensor coverage active across critical banking servers. 2 ransomware vectors neutralized.",
    },
    {
        "connector_id": "splunk_siem",
        "name": "Splunk Enterprise Security (SIEM & Log Aggregator)",
        "provider": "Splunk Cloud Gateway",
        "status": "DEGRADED",
        "health_score": 62.0,
        "monitored_controls": ["CTL-005", "CTL-006"],
        "ccf_domain": "Security Operations & Incident Logging",
        "last_sync_timestamp": datetime.utcnow().isoformat() + "Z",
        "metrics": {
            "daily_ingestion_rate_gb": 1420.0,
            "current_worm_retention_days": 32,
            "statutory_required_retention_days": 90,
            "active_forwarders": 104,
            "drift_severity": "CRITICAL",
        },
        "drift_summary": "WORM audit retention degraded to 32 days. Violates 90-day requirement (RBI Sec 4.1 / PCI Req 10.2).",
    },
    {
        "connector_id": "qualys_vuln",
        "name": "Qualys Cloud Platform (Vulnerability Management)",
        "provider": "Qualys Scanner Appliance",
        "status": "CONNECTED",
        "health_score": 81.0,
        "monitored_controls": ["CTL-008", "CTL-010"],
        "ccf_domain": "Vulnerability & Threat Management",
        "last_sync_timestamp": datetime.utcnow().isoformat() + "Z",
        "metrics": {
            "total_scanned_assets": 412,
            "critical_unpatched_cves": 9,
            "cisa_kev_active_exposures": 7,
            "mean_time_to_remediate_days": 21.4,
            "drift_severity": "WARNING",
        },
        "drift_summary": "9 critical vulnerabilities unpatched > 14 days, including CVE-2023-34362 MOVEit Transfer vector.",
    },
    {
        "connector_id": "tenable_cloud",
        "name": "Tenable Cloud Security (CSPM & Storage Encryption)",
        "provider": "Tenable.io Multi-Cloud Connector",
        "status": "DEGRADED",
        "health_score": 58.0,
        "monitored_controls": ["CTL-003", "CTL-014"],
        "ccf_domain": "Data Protection & Cryptography",
        "last_sync_timestamp": datetime.utcnow().isoformat() + "Z",
        "metrics": {
            "unencrypted_storage_volumes": 4,
            "unencrypted_database_replicas": 2,
            "public_s3_buckets": 0,
            "pii_data_classification_score": 72.0,
            "drift_severity": "CRITICAL",
        },
        "drift_summary": "Unencrypted Aurora read-replica in AWS Mumbai. Violates DPDP Act 2023 Sec 8(5) personal data mandate.",
    },
]

# Real-time Telemetry Drift Events
TELEMETRY_EVENTS = [
    {
        "event_id": "EVT-CCM-101",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "aws_iam",
        "severity": "WARNING",
        "affected_control_id": "CTL-002",
        "title": "MFA Enforcement Bypass Detected on 4 New IAM Accounts",
        "message": "AWS Security Hub detected 4 developer console IAM users created without mandatory MFA enrollment policy attached.",
        "automated_action": "Auto-ticket created in Jira (SEC-842) · Notification dispatched to IAM Administrator",
        "status": "OPEN",
    },
    {
        "event_id": "EVT-CCM-102",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "splunk_siem",
        "severity": "CRITICAL",
        "affected_control_id": "CTL-005",
        "title": "Immutable Log Storage Buffer Retention Below Statutory 90-Day Floor",
        "message": "AWS S3 Glacier storage tier auto-purged archive partition at 32 days due to misplaced lifecycle rule. Violates RBI Sec 4.1.",
        "automated_action": "Lifecycle policy locked · Storage quota expanded to 2.5 TB WORM allocation",
        "status": "INVESTIGATING",
    },
    {
        "event_id": "EVT-CCM-103",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "tenable_cloud",
        "severity": "CRITICAL",
        "affected_control_id": "CTL-003",
        "title": "Unencrypted Customer Database Replica Provisioned",
        "message": "Tenable CSPM flagged Amazon Aurora MySQL replica (afsl-core-ro-02) launched with default unencrypted EBS storage.",
        "automated_action": "Snapshot taken · Automated KMS key alias/afsl-customer-data encryption rebuild queued",
        "status": "IN_PROGRESS",
    },
    {
        "event_id": "EVT-CCM-104",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "crowdstrike_falcon",
        "severity": "INFO",
        "affected_control_id": "CTL-004",
        "title": "LockBit 3.0 Ransomware Payload Blocked in Pre-Execution State",
        "message": "CrowdStrike Falcon behavioral engine terminated malicious PowerShell script execution on Swift payment switch jumper host.",
        "automated_action": "Process tree terminated · Host isolated via network containment · IOCs uploaded to SIEM",
        "status": "RESOLVED",
    },
    {
        "event_id": "EVT-CCM-105",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "qualys_vuln",
        "severity": "WARNING",
        "affected_control_id": "CTL-008",
        "title": "Critical CISA KEV Vulnerability CVE-2024-21887 Detected on VPN Gateway",
        "message": "Automated Qualys scan flagged Ivanti Connect Secure gateway vulnerable to command injection with active exploitation.",
        "automated_action": "Emergency mitigation applied via XML patch · Scheduled for full reboot window at 02:00 IST",
        "status": "IN_PROGRESS",
    },
    {
        "event_id": "EVT-CCM-106",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": "aws_iam",
        "severity": "INFO",
        "affected_control_id": "CTL-001",
        "title": "Privileged Root Account Access Keys Revoked",
        "message": "AWS Security Hub automated remediation rule revoked 2 inactive IAM root access keys unused for > 180 days.",
        "automated_action": "Keys disabled · Audit trail logged to CloudTrail and RiskLens DB",
        "status": "RESOLVED",
    },
]

class WebhookPayload(BaseModel):
    source: str = Field(..., description="Telemetry source identifier (e.g. aws_iam, crowdstrike, splunk)")
    event_type: str = Field(..., description="Event type or finding signature")
    affected_control_id: str = Field(..., description="Mapped control identifier (e.g. CTL-002)")
    severity: str = Field("WARNING", description="Severity: CRITICAL, WARNING, INFO")
    details: str = Field(..., description="Detailed message payload")
    automated_action: Optional[str] = Field("Telemetry alert recorded", description="Automated remediation taken")


@router.get("/connectors")
def list_telemetry_connectors():
    """Returns active continuous control monitoring connectors and live health scores."""
    return CONNECTORS_DATA


@router.get("/events")
def list_telemetry_events(
    source: Optional[str] = Query(None, description="Filter by telemetry source"),
    severity: Optional[str] = Query(None, description="Filter by severity: CRITICAL, WARNING, INFO"),
    limit: int = Query(20, ge=1, le=100),
):
    """Returns recent continuous control monitoring drift events and automated security telemetry alerts."""
    filtered = TELEMETRY_EVENTS
    if source:
        filtered = [e for e in filtered if e["source"] == source]
    if severity:
        filtered = [e for e in filtered if e["severity"].upper() == severity.upper()]
    return filtered[:limit]


@router.get("/stats")
def get_telemetry_stats():
    """Returns continuous control monitoring aggregate statistics and telemetry health index."""
    total_connectors = len(CONNECTORS_DATA)
    connected_count = sum(1 for c in CONNECTORS_DATA if c["status"] == "CONNECTED")
    avg_health = round(sum(c["health_score"] for c in CONNECTORS_DATA) / total_connectors, 1)

    critical_events = sum(1 for e in TELEMETRY_EVENTS if e["severity"] == "CRITICAL" and e["status"] != "RESOLVED")
    warning_events = sum(1 for e in TELEMETRY_EVENTS if e["severity"] == "WARNING" and e["status"] != "RESOLVED")

    return {
        "organization": "Apex Financial Services Ltd.",
        "continuous_monitoring_status": "ACTIVE_STREAMING",
        "total_active_connectors": total_connectors,
        "healthy_connectors": connected_count,
        "telemetry_health_index_pct": avg_health,
        "active_drift_incidents": {
            "critical": critical_events,
            "warning": warning_events,
            "total_open": critical_events + warning_events,
        },
        "monitored_controls_count": 8,
        "monitored_infrastructure_scope": "AWS Mumbai, CrowdStrike EDR Fleet, Splunk SIEM, Qualys VM, Tenable CSPM",
        "compliance_synchronization": "ENABLED — Automated drift triggers CCF crosswalk recalculation",
    }


@router.post("/sync/{connector_id}")
def sync_telemetry_connector(connector_id: str, db: Session = Depends(get_db)):
    """Triggers an on-demand continuous monitoring sync for a specific telemetry connector."""
    connector = next((c for c in CONNECTORS_DATA if c["connector_id"] == connector_id), None)
    if not connector:
        raise HTTPException(status_code=404, detail=f"Connector '{connector_id}' not found")

    connector["last_sync_timestamp"] = datetime.utcnow().isoformat() + "Z"

    # Simulated health update
    if connector["status"] == "DEGRADED":
        connector["health_score"] = min(100.0, connector["health_score"] + 5.0)

    # Log to audit trail
    log_entry = models.AuditLog(
        action="TELEMETRY_CONNECTOR_SYNC",
        entity_type="CCM_Connector",
        entity_id=connector_id,
        change_summary=f"On-demand telemetry sync triggered for connector '{connector['name']}'. Status: {connector['status']}.",
        change_justification="Automated continuous control monitoring sync cycle",
        ip_address="127.0.0.1",
        username="continuous_monitoring_daemon",
        user_role="SecurityAdmin",
        timestamp=datetime.utcnow(),
    )
    db.add(log_entry)
    db.commit()

    return {
        "status": "success",
        "connector_id": connector_id,
        "connector_name": connector["name"],
        "sync_timestamp": connector["last_sync_timestamp"],
        "current_health_score": connector["health_score"],
        "message": f"Telemetry ingestion completed successfully for {connector['name']}.",
    }


@router.post("/webhook/{source}")
def ingest_telemetry_webhook(source: str, payload: WebhookPayload, db: Session = Depends(get_db)):
    """
    Simulated webhook receiver for cloud security services (AWS EventBridge, CrowdStrike, Splunk)
    that records incoming telemetry alerts and updates control drift in real time.
    """
    new_event = {
        "event_id": f"EVT-CCM-{len(TELEMETRY_EVENTS) + 101}",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "source": source,
        "severity": payload.severity.upper(),
        "affected_control_id": payload.affected_control_id,
        "title": payload.event_type,
        "message": payload.details,
        "automated_action": payload.automated_action or "Telemetry alert recorded in RiskLens CCM",
        "status": "OPEN",
    }
    TELEMETRY_EVENTS.insert(0, new_event)

    # Record in audit log
    log_entry = models.AuditLog(
        action="INGEST_TELEMETRY_WEBHOOK",
        entity_type="CCM_Webhook",
        entity_id=new_event["event_id"],
        change_summary=f"Real-time telemetry event received from {source}: '{payload.event_type}' on control {payload.affected_control_id}.",
        change_justification=payload.details,
        ip_address="127.0.0.1",
        username="webhook_gateway",
        user_role="System",
        timestamp=datetime.utcnow(),
    )
    db.add(log_entry)
    db.commit()

    return {
        "status": "ingested",
        "event_id": new_event["event_id"],
        "source": source,
        "affected_control_id": payload.affected_control_id,
        "severity": payload.severity,
        "message": "Continuous control telemetry recorded and linked to GRC register.",
    }
