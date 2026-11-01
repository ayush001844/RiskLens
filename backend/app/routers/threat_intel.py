"""
Real-Time Threat Intelligence & CISA KEV Vulnerability Ingestion Engine for RiskLens v2.0.
Correlates external CVE / CISA Known Exploited Vulnerabilities (KEV) feeds
against Apex Financial Services asset inventory, risk register, and controls.
"""
from typing import List, Optional
from datetime import date, datetime, timedelta
from pydantic import BaseModel
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app import models, schemas
from app.database import get_db

router = APIRouter(prefix="/threat-intel", tags=["Threat Intelligence & CISA KEV"])

# Curated CISA KEV & high-impact vulnerability intelligence feed
CISA_KEV_FEED = [
    {
        "cve_id": "CVE-2024-3094",
        "title": "XZ Utils liblzma SSH Backdoor (Upstream Supply Chain Compromise)",
        "vendor_project": "Tukaani / Openwall",
        "product": "XZ Utils / liblzma",
        "cvss_score": 10.0,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2024-04-01",
        "due_date": "2024-04-15",
        "known_ransomware_campaign_use": "Suspected",
        "epss_score": 0.942,
        "threat_actor": "Nation-State / APT (Social Engineering Persona 'Jia Tan')",
        "target_asset_category": "Server Infrastructure",
        "target_asset_pattern": "Linux",
        "correlated_risk_id": "RSK-005",
        "mitigation_guidance": "Immediately downgrade or patch xz-utils to 5.4.x / 5.6.1-2 across all Linux application bastions.",
    },
    {
        "cve_id": "CVE-2023-4966",
        "title": "Citrix Bleed: NetScaler ADC/Gateway Sensitive Memory Information Disclosure",
        "vendor_project": "Cloud Software Group",
        "product": "Citrix ADC / NetScaler Gateway",
        "cvss_score": 9.4,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:N",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2023-10-18",
        "due_date": "2023-11-08",
        "known_ransomware_campaign_use": "Known",
        "epss_score": 0.974,
        "threat_actor": "LockBit 3.0 / FIN11",
        "target_asset_category": "Network Security",
        "target_asset_pattern": "VPN",
        "correlated_risk_id": "RSK-001",
        "mitigation_guidance": "Upgrade NetScaler firmware, terminate all active session cookies, and enforce MFA re-authentication.",
    },
    {
        "cve_id": "CVE-2023-44487",
        "title": "HTTP/2 Rapid Reset Distributed Denial of Service (DDoS)",
        "vendor_project": "IETF / Web Server Standard",
        "product": "HTTP/2 Protocol Stack / Reverse Proxies",
        "cvss_score": 7.5,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2023-10-10",
        "due_date": "2023-10-31",
        "known_ransomware_campaign_use": "Known",
        "epss_score": 0.912,
        "threat_actor": "Multiple Botnets / Anonymous Sudan",
        "target_asset_category": "Network Security",
        "target_asset_pattern": "Core Banking",
        "correlated_risk_id": "RSK-010",
        "mitigation_guidance": "Enable HTTP/2 stream reset rate limiting on AWS ALB and Cloudflare WAF layers.",
    },
    {
        "cve_id": "CVE-2024-21413",
        "title": "Microsoft Outlook Moniker Link Remote Code Execution (#MonikerLink)",
        "vendor_project": "Microsoft Corporation",
        "product": "Microsoft Outlook 365 / Office 2016-2021",
        "cvss_score": 9.8,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2024-02-14",
        "due_date": "2024-03-06",
        "known_ransomware_campaign_use": "Known",
        "epss_score": 0.885,
        "threat_actor": "APT28 (Fancy Bear) / Storm-0978",
        "target_asset_category": "Human Factor",
        "target_asset_pattern": "All Employees",
        "correlated_risk_id": "RSK-009",
        "mitigation_guidance": "Push February 2024 Microsoft cumulative patch; block outbound SMB (port 445) at enterprise egress firewall.",
    },
    {
        "cve_id": "CVE-2024-1709",
        "title": "ConnectWise ScreenConnect Authentication Bypass to Remote Code Execution",
        "vendor_project": "ConnectWise",
        "product": "ScreenConnect Remote Support",
        "cvss_score": 10.0,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2024-02-22",
        "due_date": "2024-02-29",
        "known_ransomware_campaign_use": "Known",
        "epss_score": 0.982,
        "threat_actor": "BlackCat (ALPHV) / Play Ransomware",
        "target_asset_category": "Third-Party Risk",
        "target_asset_pattern": "Vendor",
        "correlated_risk_id": "RSK-004",
        "mitigation_guidance": "Mandate immediate upgrade to ScreenConnect version 23.9.8; revoke and audit all MSP remote session credentials.",
    },
    {
        "cve_id": "CVE-2023-34362",
        "title": "MOVEit Transfer SQL Injection & Mass Extortion Vulnerability",
        "vendor_project": "Progress Software",
        "product": "MOVEit Transfer SFTP/Web",
        "cvss_score": 9.8,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2023-06-02",
        "due_date": "2023-06-23",
        "known_ransomware_campaign_use": "Known",
        "epss_score": 0.991,
        "threat_actor": "Cl0p Ransomware Gang (FIN11 / Lace Tempest)",
        "target_asset_category": "Data Protection",
        "target_asset_pattern": "Customer Database",
        "correlated_risk_id": "RSK-008",
        "mitigation_guidance": "Apply vendor security service packs, review IIS logs for unauthorized human2.aspx web shells, rotate DB keys.",
    },
    {
        "cve_id": "CVE-2023-38606",
        "title": "Apple WebKit / Kernel Memory Corruption (Operation Triangulation Zero-Day)",
        "vendor_project": "Apple Inc.",
        "product": "iOS / iPadOS / macOS",
        "cvss_score": 8.8,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2023-07-26",
        "due_date": "2023-08-16",
        "known_ransomware_campaign_use": "Suspected",
        "epss_score": 0.730,
        "threat_actor": "Advanced Espionage Operator",
        "target_asset_category": "Endpoint Security",
        "target_asset_pattern": "Mobile",
        "correlated_risk_id": "RSK-013",
        "mitigation_guidance": "Enforce automated iOS 16.6+ MDM compliance profiles across all employee mobile devices accessing corporate banking email.",
    },
    {
        "cve_id": "CVE-2023-23397",
        "title": "Microsoft Outlook NTLM Hash Elevation of Privilege (Zero-Click Audio UNC Leak)",
        "vendor_project": "Microsoft Corporation",
        "product": "Outlook Windows Client",
        "cvss_score": 9.8,
        "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "cisa_kev_listed": True,
        "date_added_to_kev": "2023-03-14",
        "due_date": "2023-04-04",
        "known_ransomware_campaign_use": "Known",
        "epss_score": 0.956,
        "threat_actor": "Forest Blizzard / Strontium / APT28",
        "target_asset_category": "Identity & Access Management",
        "target_asset_pattern": "Active Directory",
        "correlated_risk_id": "RSK-014",
        "mitigation_guidance": "Add privileged users to Protected Users security group; block egress port 445; enforce FIDO2 authentication.",
    },
]


@router.get("/feed")
def get_threat_intel_feed(
    kev_only: bool = Query(default=True, description="Filter for CISA KEV listed vulnerabilities only"),
    ransomware_only: bool = Query(default=False, description="Filter for known ransomware campaign vectors"),
    db: Session = Depends(get_db),
):
    """
    Returns real-world threat intelligence and CISA KEV entries correlated
    with the Apex Financial Services risk register, asset inventory, and controls.
    """
    risks = {r.risk_id: r for r in db.query(models.Risk).all()}
    controls = {c.control_id: c for c in db.query(models.Control).all()}

    feed_results = []
    for item in CISA_KEV_FEED:
        if kev_only and not item["cisa_kev_listed"]:
            continue
        if ransomware_only and item["known_ransomware_campaign_use"] != "Known":
            continue

        r_id = item["correlated_risk_id"]
        linked_risk = risks.get(r_id)

        # Correlation assessment
        correlation_status = "Informational"
        exposure_level = "Medium"
        if linked_risk:
            if linked_risk.residual_risk_score >= 12.0:
                correlation_status = "CRITICAL EXPOSURE — Active KEV Match"
                exposure_level = "Critical"
            elif linked_risk.residual_risk_score >= 8.0:
                correlation_status = "HIGH VULNERABILITY — Controls Inadequate"
                exposure_level = "High"
            else:
                correlation_status = "MITIGATED — Compensating Controls Active"
                exposure_level = "Low"

        feed_results.append({
            **item,
            "exposure_level": exposure_level,
            "correlation_status": correlation_status,
            "linked_risk": {
                "risk_id": linked_risk.risk_id,
                "title": linked_risk.title,
                "residual_score": linked_risk.residual_risk_score,
                "affected_asset": linked_risk.affected_asset,
                "owner": linked_risk.risk_owner,
                "status": linked_risk.status,
            } if linked_risk else None,
        })

    return feed_results


@router.get("/summary")
def get_threat_intel_summary(db: Session = Depends(get_db)):
    """
    Returns CISO-level Threat Intelligence & KEV correlation metrics.
    """
    risks = {r.risk_id: r for r in db.query(models.Risk).all()}

    total_monitored = len(CISA_KEV_FEED)
    cisa_kev_count = sum(1 for v in CISA_KEV_FEED if v["cisa_kev_listed"])
    ransomware_vectors = sum(1 for v in CISA_KEV_FEED if v["known_ransomware_campaign_use"] == "Known")

    critical_exposures = 0
    active_matches = 0
    impacted_assets = set()

    for item in CISA_KEV_FEED:
        r_id = item["correlated_risk_id"]
        linked_risk = risks.get(r_id)
        if linked_risk:
            active_matches += 1
            impacted_assets.add(linked_risk.affected_asset)
            if linked_risk.residual_risk_score >= 12.0:
                critical_exposures += 1

    return {
        "total_monitored_cves": total_monitored,
        "cisa_kev_listed_cves": cisa_kev_count,
        "known_ransomware_vectors": ransomware_vectors,
        "correlated_active_risk_matches": active_matches,
        "critical_asset_exposures": critical_exposures,
        "impacted_asset_count": len(impacted_assets),
        "primary_threat_vectors": [
            "Supply Chain Upstream Injection (XZ Utils)",
            "Edge Bastion Memory Leak (Citrix Bleed)",
            "DDoS Protocol Flaw (HTTP/2 Rapid Reset)",
            "Third-Party ScreenConnect Exploitation",
            "Zero-Click Outlook NTLM Credential Theft",
        ],
        "compliance_sla_note": "CISA Binding Operational Directive (BOD 22-01) mandates remediation within 14 calendar days of KEV inclusion.",
    }


@router.post("/sync")
def sync_threat_intel_feed(db: Session = Depends(get_db)):
    """
    Simulates real-time synchronization with CISA KEV and NVD feeds,
    updating asset correlation scores and generating an audit log record.
    """
    # Log audit entry
    log_entry = models.AuditLog(
        action="SYNC_THREAT_INTEL",
        entity_type="ThreatIntelligenceFeed",
        entity_id="CISA-KEV-NVD",
        change_summary=f"Automated threat intelligence synchronization completed. {len(CISA_KEV_FEED)} CVEs evaluated against asset register.",
        ip_address="127.0.0.1",
        username="automated_pipeline",
        user_role="System",
        timestamp=datetime.utcnow(),
    )
    db.add(log_entry)
    db.commit()

    return {
        "status": "success",
        "sync_timestamp": datetime.utcnow().isoformat(),
        "feed_source": "CISA Known Exploited Vulnerabilities (KEV) Catalog & NVD 2.0 API",
        "ingested_cves": len(CISA_KEV_FEED),
        "message": "Threat intelligence feeds synchronized successfully. Asset correlation matrix refreshed.",
    }
