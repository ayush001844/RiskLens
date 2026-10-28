"""
Synthetic seed data for RiskLens — Apex Financial Services engagement.

⚠️  ALL DATA IS SYNTHETIC / DEMO DATA. ⚠️
    "Apex Financial Services" is a fictional company created solely to
    demonstrate the RiskLens platform. No real organisation, individual,
    control assessment result, compliance status, or security finding is
    represented. Do not use this data for actual compliance determinations.

    Framework references (NIST CSF 2.0, ISO/IEC 27001:2022) are used for
    educational mapping purposes only and do not constitute an official
    compliance determination.
"""

from datetime import date, timedelta
from app.database import SessionLocal, engine, Base
from app import models
from app.scoring import calculate_inherent_risk, calculate_residual_risk


def reseed():
    """Drop and recreate all tables, then insert synthetic data."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        _seed_risks(db)
        _seed_controls(db)
        _seed_remediation(db)
        _seed_vendors(db)
        db.commit()
        print("✅  Seed complete — synthetic demo data loaded for Apex Financial Services.")
    except Exception as exc:
        db.rollback()
        raise exc
    finally:
        db.close()


# ─────────────────────────────────────────────────────────────────────────────
# RISKS  (25 scenarios)
# ─────────────────────────────────────────────────────────────────────────────

def _seed_risks(db):
    risks_raw = [
        # (risk_id, title, category, asset, threat, vulnerability, business_impact,
        #  likelihood, impact, control_effectiveness_pct, owner, treatment, status, review_days)
        ("RSK-001", "Missing Multi-Factor Authentication on Core Banking Portal",
         "Identity & Access Management", "Core Banking System",
         "Credential stuffing / phishing attacks targeting employee accounts",
         "Single-factor authentication allows account takeover with stolen passwords",
         "Unauthorised access to customer accounts, regulatory penalties under RBI IT Framework",
         4, 5, 10, "IT Security Manager", "Mitigate", "Open", 30),

        ("RSK-002", "Excessive Privileged Access Rights",
         "Identity & Access Management", "ERP / HR System",
         "Insider threat — malicious or negligent privileged user",
         "No enforced least-privilege; many users hold admin rights unnecessarily",
         "Data exfiltration of sensitive payroll and customer records",
         3, 5, 20, "IT Operations Lead", "Mitigate", "In Progress", 45),

        ("RSK-003", "Untested Backup & Recovery Procedures",
         "Business Continuity", "Backup Infrastructure",
         "Ransomware encrypting production data; hardware failure",
         "Backups exist but restoration procedures have never been tested in production",
         "Extended downtime; permanent data loss; RTO/RPO breach",
         3, 5, 15, "Infrastructure Manager", "Mitigate", "Open", 60),

        ("RSK-004", "Weak Third-Party Vendor Oversight",
         "Third-Party Risk", "Vendor Ecosystem",
         "Supply-chain attack via compromised vendor software or API",
         "No formal vendor risk assessments; no contractual security requirements enforced",
         "Data breach through vendor access; reputational and financial damage",
         4, 4, 10, "Procurement Manager", "Mitigate", "Open", 30),

        ("RSK-005", "Delayed Security Patching",
         "Vulnerability Management", "Server Infrastructure",
         "Exploitation of known CVEs by external threat actors",
         "Average patch lag of 90+ days; no automated patch management",
         "Server compromise; lateral movement; data exfiltration",
         4, 4, 25, "IT Operations Lead", "Mitigate", "In Progress", 45),

        ("RSK-006", "Insufficient Security Logging & Monitoring",
         "Security Operations", "SIEM / Log Management",
         "Advanced persistent threat (APT) operating undetected",
         "Log retention < 90 days; no centralised SIEM; no alerting rules",
         "Inability to detect, investigate, or respond to incidents",
         3, 4, 20, "IT Security Manager", "Mitigate", "Open", 60),

        ("RSK-007", "Incomplete Incident Response Plan",
         "Security Operations", "Incident Response Process",
         "Ransomware, DDoS, or data breach requiring coordinated response",
         "IRP exists but is outdated (last revised 2021); never tabletop-tested",
         "Delayed containment; regulatory notification failures; reputational damage",
         3, 4, 10, "CISO", "Mitigate", "Open", 30),

        ("RSK-008", "Unencrypted Sensitive Data at Rest",
         "Data Protection", "Customer Database",
         "Database exfiltration by external attacker or malicious insider",
         "Customer PII and financial records stored without encryption",
         "DPDP Act violation; PCI-DSS non-compliance; customer trust erosion",
         3, 5, 30, "DBA Lead", "Mitigate", "In Progress", 45),

        ("RSK-009", "Phishing & Social Engineering Exposure",
         "Human Factor", "All Employees",
         "Targeted spear-phishing campaigns against finance and IT staff",
         "No mandatory annual security awareness training; click rates ~35 % on simulations",
         "BEC fraud; credential compromise; malware deployment",
         4, 4, 30, "HR Manager", "Mitigate", "Open", 60),

        ("RSK-010", "Exposed Admin Interfaces on Internet",
         "Network Security", "Firewall / Network Perimeter",
         "Brute-force or exploit of publicly accessible admin portals",
         "SSH, RDP, and admin panels accessible from public internet",
         "Full system compromise; lateral movement across network",
         3, 5, 20, "Network Engineer", "Mitigate", "Open", 30),

        ("RSK-011", "Inadequate Data Classification",
         "Data Governance", "Enterprise Data",
         "Accidental or deliberate disclosure of confidential data",
         "No formal data classification policy; sensitive data co-mingled with public",
         "Regulatory breach; contractual violations; data leakage",
         3, 3, 10, "Chief Data Officer", "Mitigate", "Open", 90),

        ("RSK-012", "Absence of DLP Controls",
         "Data Protection", "Email & Endpoint",
         "Insider exfiltration via email or removable media",
         "No Data Loss Prevention tooling deployed at email gateway or endpoints",
         "Customer data leak; DPDP Act penalties",
         3, 4, 15, "IT Security Manager", "Mitigate", "Open", 60),

        ("RSK-013", "Unsecured Mobile Devices (BYOD)",
         "Endpoint Security", "Employee Mobile Devices",
         "Lost / stolen device exposing corporate email and VPN",
         "No MDM solution; personal devices access corporate systems without controls",
         "Data breach from lost device; malware entry point",
         3, 3, 10, "IT Operations Lead", "Mitigate", "Open", 45),

        ("RSK-014", "Weak Password Policy Enforcement",
         "Identity & Access Management", "Active Directory",
         "Password spraying or dictionary attacks",
         "Minimum password length 8 characters; no complexity; 90-day rotation rarely enforced",
         "Mass account compromise; privilege escalation",
         3, 4, 20, "IT Security Manager", "Mitigate", "In Progress", 30),

        ("RSK-015", "Lack of Network Segmentation",
         "Network Security", "Internal Network",
         "Lateral movement post initial compromise",
         "Flat network; no micro-segmentation between DMZ, production, and user segments",
         "Single breach results in full network access",
         3, 5, 20, "Network Engineer", "Mitigate", "Open", 90),

        ("RSK-016", "Third-Party API Security Gaps",
         "Application Security", "Payment Gateway API",
         "Injection attacks or token replay on payment APIs",
         "API endpoints lack rate-limiting, input validation, and JWT expiry enforcement",
         "Financial fraud; PCI-DSS violation",
         3, 5, 25, "AppSec Engineer", "Mitigate", "Open", 45),

        ("RSK-017", "Outdated Antivirus / EDR Coverage",
         "Endpoint Security", "Workstations & Servers",
         "Malware / ransomware deployment on unprotected endpoints",
         "EDR not deployed on 30 % of servers; AV signatures updated weekly, not daily",
         "Malware execution; data destruction; operational downtime",
         3, 4, 30, "IT Operations Lead", "Mitigate", "In Progress", 45),

        ("RSK-018", "Uncontrolled Software Supply Chain",
         "Application Security", "Development Pipeline",
         "Malicious open-source package introducing backdoor",
         "No SBOM; no dependency scanning in CI/CD pipeline",
         "Compromised production software; data exfiltration",
         2, 5, 10, "DevOps Lead", "Mitigate", "Open", 60),

        ("RSK-019", "Regulatory Non-Compliance Risk (RBI IT Framework)",
         "Compliance", "Compliance Programme",
         "RBI audit identifying non-compliances leading to penalties",
         "Gaps in RBI IT Framework adherence; no dedicated compliance tracking",
         "Regulatory fines; business restrictions; reputational harm",
         3, 4, 20, "Compliance Officer", "Mitigate", "Open", 60),

        ("RSK-020", "Physical Security Weaknesses at Data Centre",
         "Physical Security", "Primary Data Centre",
         "Unauthorised physical access to server racks",
         "Tailgating possible; CCTV coverage gaps; visitor logs not reviewed",
         "Hardware theft; sabotage; data breach",
         2, 4, 40, "Facilities Manager", "Mitigate", "Open", 90),

        ("RSK-021", "Business Email Compromise (BEC)",
         "Human Factor", "Finance Department",
         "CEO / CFO impersonation to redirect wire transfers",
         "No email authentication (DMARC/DKIM/SPF fully enforced); low awareness",
         "Direct financial loss; fraud",
         3, 5, 25, "Finance Director", "Mitigate", "Open", 30),

        ("RSK-022", "Disaster Recovery Site Not Synchronised",
         "Business Continuity", "DR Site",
         "Primary data centre outage forcing failover",
         "DR site replication lag >4 hours; failover never tested end-to-end",
         "Data loss exceeding RPO; extended RTO beyond SLA",
         2, 5, 20, "Infrastructure Manager", "Mitigate", "Open", 90),

        ("RSK-023", "Cryptographic Algorithm Weaknesses",
         "Data Protection", "TLS/SSL Infrastructure",
         "Downgrade attack or decryption of intercepted traffic",
         "Some internal services still use TLS 1.0/1.1 and RC4 cipher suites",
         "Interception of sensitive financial transactions",
         2, 4, 30, "Network Engineer", "Mitigate", "Open", 60),

        ("RSK-024", "Inadequate Change Management Controls",
         "IT Operations", "Change Management Process",
         "Unauthorised or poorly tested change causing outage",
         "Changes approved informally; no mandatory rollback testing",
         "Production outage; data corruption",
         3, 3, 30, "IT Operations Lead", "Accept", "Open", 90),

        ("RSK-025", "Cloud Misconfiguration on AWS Environment",
         "Cloud Security", "AWS Cloud Infrastructure",
         "Public S3 bucket exposure or over-permissive IAM roles",
         "No CSPM tool; manual security review inconsistent",
         "Data breach; regulatory violation; financial loss",
         3, 5, 20, "Cloud Architect", "Mitigate", "Open", 45),
    ]

    for r in risks_raw:
        (rid, title, cat, asset, threat, vuln, impact_desc,
         lhood, imp, ctrl_eff, owner, treatment, status, review_days) = r

        inherent = calculate_inherent_risk(lhood, imp)
        residual = calculate_residual_risk(inherent, ctrl_eff)

        db.add(models.Risk(
            risk_id=rid,
            title=title,
            category=cat,
            affected_asset=asset,
            threat=threat,
            vulnerability=vuln,
            business_impact=impact_desc,
            likelihood=lhood,
            impact=imp,
            inherent_risk_score=inherent,
            existing_controls="See control assessment register",
            control_effectiveness_pct=ctrl_eff,
            residual_risk_score=residual,
            risk_owner=owner,
            treatment_strategy=treatment,
            status=status,
            review_date=date.today() + timedelta(days=review_days),
        ))


# ─────────────────────────────────────────────────────────────────────────────
# CONTROLS  (30 assessments)
# ─────────────────────────────────────────────────────────────────────────────

def _seed_controls(db):
    controls_raw = [
        # (ctl_id, framework_ref, nist_category, iso_annex, objective,
        #  owner, evidence_desc, evidence_status, effectiveness,
        #  assessment_result, gap, recommendation, review_days)
        ("CTL-001", "NIST CSF 2.0 PR.AA-01 | ISO 27001:2022 A.8.2",
         "PROTECT — Identity Management", "A.8.2 Privileged Access Rights",
         "Enforce least-privilege access; review privileged accounts quarterly",
         "IT Security Manager",
         "Access review report Q3 2024 provided; only 40 % of accounts reviewed",
         "Provided", "Partially Effective",
         "Quarterly access reviews are performed but incomplete; admin accounts not de-provisioned timely",
         "Stale admin accounts remain active; no automated joiner-mover-leaver process",
         "Implement IGA tooling; automate de-provisioning within 24 hours of role change",
         90),

        ("CTL-002", "NIST CSF 2.0 PR.AA-03 | ISO 27001:2022 A.8.5",
         "PROTECT — Identity Management", "A.8.5 Secure Authentication",
         "Implement MFA for all user accounts accessing critical systems",
         "IT Security Manager",
         "MFA policy document provided; MFA enabled only on 3 of 8 critical systems",
         "Provided", "Ineffective",
         "MFA policy exists but not consistently enforced; core banking portal lacks MFA",
         "Core banking, VPN, email, and HR system all lack MFA enforcement",
         "Deploy MFA (TOTP or FIDO2) on all critical systems within 30 days",
         30),

        ("CTL-003", "NIST CSF 2.0 PR.DS-01 | ISO 27001:2022 A.8.24",
         "PROTECT — Data Security", "A.8.24 Use of Cryptography",
         "Encrypt sensitive data at rest using AES-256 or equivalent",
         "DBA Lead",
         "Encryption configuration screenshots provided for production DB; partial coverage",
         "Provided", "Partially Effective",
         "Production customer DB partially encrypted; HR and archival databases not encrypted",
         "Archival and HR databases store PII without encryption",
         "Apply full-disk or column-level encryption to all databases containing PII within 60 days",
         60),

        ("CTL-004", "NIST CSF 2.0 PR.DS-02 | ISO 27001:2022 A.8.24",
         "PROTECT — Data Security", "A.8.24 Use of Cryptography",
         "Enforce TLS 1.2+ for all data in transit",
         "Network Engineer",
         "SSL Labs scan results provided; 4 internal services show TLS 1.0",
         "Provided", "Partially Effective",
         "External-facing services use TLS 1.3; internal services use TLS 1.0/1.1",
         "TLS 1.0 and 1.1 still active on internal systems; cipher suites include RC4",
         "Disable TLS 1.0/1.1 and weak cipher suites on all internal services",
         45),

        ("CTL-005", "NIST CSF 2.0 DE.CM-01 | ISO 27001:2022 A.8.15",
         "DETECT — Continuous Monitoring", "A.8.15 Logging",
         "Collect, centralise, and retain security logs for minimum 12 months",
         "IT Security Manager",
         "No SIEM solution in place; firewall logs retained 30 days; server logs 60 days",
         "Missing", "Ineffective",
         "No centralised SIEM; log retention far below 12-month best practice and RBI requirements",
         "No SIEM; inadequate retention; no alerting or correlation rules",
         "Procure and deploy SIEM (e.g. Splunk/IBM QRadar/Wazuh); set retention to 12+ months",
         30),

        ("CTL-006", "NIST CSF 2.0 RS.MA-01 | ISO 27001:2022 A.5.26",
         "RESPOND — Incident Management", "A.5.26 Response to Information Security Incidents",
         "Maintain and test an Incident Response Plan annually",
         "CISO",
         "IRP document v2.1 dated 2021 provided; no tabletop test evidence",
         "Provided", "Partially Effective",
         "IRP is documented but outdated; contact lists stale; no tabletop exercise since 2021",
         "IRP not updated for cloud environment; roles and contacts not current",
         "Update IRP; conduct annual tabletop exercise; align with CERT-In 6-hour notification rule",
         30),

        ("CTL-007", "NIST CSF 2.0 PR.PS-02 | ISO 27001:2022 A.8.8",
         "PROTECT — Platform Security", "A.8.8 Management of Technical Vulnerabilities",
         "Patch critical and high CVEs within 30 days; medium within 90 days",
         "IT Operations Lead",
         "Patch management report provided; average patch age 97 days for critical CVEs",
         "Provided", "Ineffective",
         "No automated patching; critical patches applied on average 97 days after release",
         "No patch SLA enforced; patching requires manual approval causing delays",
         "Implement automated patch management (WSUS/Ansible); enforce SLAs with exception process",
         30),

        ("CTL-008", "NIST CSF 2.0 GV.SC-06 | ISO 27001:2022 A.5.19",
         "GOVERN — Supply Chain", "A.5.19 Information Security in Supplier Relationships",
         "Conduct annual security assessments for all critical vendors",
         "Procurement Manager",
         "No formal vendor assessment programme; contracts lack security clauses",
         "Missing", "Ineffective",
         "No vendor risk programme; critical vendors have not been assessed",
         "No vendor security questionnaires; no right-to-audit clauses in contracts",
         "Establish vendor risk programme; deploy standardised security questionnaire; add audit rights",
         45),

        ("CTL-009", "NIST CSF 2.0 PR.AT-01 | ISO 27001:2022 A.6.3",
         "PROTECT — Awareness", "A.6.3 Information Security Awareness",
         "Deliver mandatory security awareness training annually to all staff",
         "HR Manager",
         "Training completion report: 62 % completion rate for FY 2024",
         "Provided", "Partially Effective",
         "Training exists but 38 % of staff have not completed it; phishing sim click rate 35 %",
         "Low completion rate; no consequence for non-completion; training content outdated",
         "Make training mandatory with HR escalation; update content quarterly; run monthly phishing sims",
         60),

        ("CTL-010", "NIST CSF 2.0 ID.AM-01 | ISO 27001:2022 A.8.1",
         "IDENTIFY — Asset Management", "A.8.1 Inventory of Information and Other Assets",
         "Maintain a complete and current inventory of all information assets",
         "IT Operations Lead",
         "Asset inventory spreadsheet provided; last updated 6 months ago; 30 % coverage estimated",
         "Provided", "Ineffective",
         "Asset inventory is incomplete and stale; cloud assets not tracked; shadow IT prevalent",
         "No automated discovery; manual spreadsheet; cloud resources not inventoried",
         "Deploy asset discovery tool (e.g. Tenable, Qualys); integrate with CMDB; automate updates",
         60),

        ("CTL-011", "NIST CSF 2.0 PR.IR-01 | ISO 27001:2022 A.8.22",
         "PROTECT — Infrastructure", "A.8.22 Segregation of Networks",
         "Segment network into security zones (DMZ, production, user, management)",
         "Network Engineer",
         "Network diagram provided; flat VLAN structure confirmed by penetration test finding",
         "Provided", "Ineffective",
         "Network is largely flat; limited VLAN segmentation; no micro-segmentation",
         "Flat network enables lateral movement; no east-west traffic inspection",
         "Design and implement network segmentation using VLANs and next-gen firewall policies",
         90),

        ("CTL-012", "NIST CSF 2.0 PR.DS-10 | ISO 27001:2022 A.8.13",
         "PROTECT — Data Security", "A.8.13 Information Backup",
         "Take daily backups; test restoration quarterly",
         "Infrastructure Manager",
         "Backup job logs provided; no restoration test records available",
         "Provided", "Partially Effective",
         "Backups are scheduled and running; restoration has never been formally tested",
         "No documented restoration test; backup integrity unknown",
         "Conduct quarterly restoration drill; document results; implement backup integrity checksums",
         45),

        ("CTL-013", "NIST CSF 2.0 PR.PS-04 | ISO 27001:2022 A.8.29",
         "PROTECT — Platform Security", "A.8.29 Security Testing in Development",
         "Integrate SAST/DAST into CI/CD pipeline; remediate critical findings pre-release",
         "DevOps Lead",
         "No SAST/DAST tooling in pipeline; manual code review only for senior engineers",
         "Missing", "Ineffective",
         "No automated security testing in pipeline; vulnerabilities discovered post-production",
         "No SAST/DAST; dependency scanning absent; no SBOM",
         "Integrate Semgrep/Snyk into pipeline; mandate SBOM; block release on critical findings",
         60),

        ("CTL-014", "NIST CSF 2.0 PR.AA-05 | ISO 27001:2022 A.8.18",
         "PROTECT — Identity Management", "A.8.18 Use of Privileged Utility Programs",
         "Restrict and log all privileged utility program usage",
         "IT Security Manager",
         "No PAM solution deployed; shared root credentials in use on Linux servers",
         "Missing", "Ineffective",
         "Shared root credentials in use; no individual accountability for privileged actions",
         "No PAM; shared credentials; no session recording for privileged access",
         "Deploy PAM solution (CyberArk/BeyondTrust/Teleport); eliminate shared credentials",
         30),

        ("CTL-015", "NIST CSF 2.0 DE.AE-02 | ISO 27001:2022 A.8.16",
         "DETECT — Adverse Event Analysis", "A.8.16 Monitoring Activities",
         "Monitor security events and generate alerts for anomalous activity",
         "IT Security Manager",
         "No automated alerting; manual log review performed ad-hoc",
         "Missing", "Ineffective",
         "No automated detection capability; threats would be identified only by chance",
         "No SIEM alerting; no anomaly detection; no threat hunting",
         "Deploy SIEM with use-case-driven alert rules; establish SOC monitoring capability",
         30),

        ("CTL-016", "NIST CSF 2.0 GV.PO-01 | ISO 27001:2022 A.5.1",
         "GOVERN — Policy", "A.5.1 Policies for Information Security",
         "Maintain and annually review an information security policy suite",
         "CISO",
         "IS Policy v3.0 dated Jan 2023 provided; no evidence of 2024 review",
         "Provided", "Partially Effective",
         "Policies exist but some are >18 months old without evidence of review",
         "Policy review cycle not adhered to; sub-policies missing (e.g. cloud, AI use)",
         "Establish annual policy review calendar; develop missing sub-policies for cloud and AI",
         90),

        ("CTL-017", "NIST CSF 2.0 PR.DS-01 | ISO 27001:2022 A.8.10",
         "PROTECT — Data Security", "A.8.10 Information Deletion",
         "Securely delete data at end of retention period per classification policy",
         "Chief Data Officer",
         "No data retention schedule enforced; no secure deletion evidence",
         "Missing", "Ineffective",
         "Data retained indefinitely; no retention schedule; DPDP Act requirements not met",
         "No retention schedule; data accumulating beyond legal and business need",
         "Define and enforce data retention schedules; implement secure deletion procedures",
         90),

        ("CTL-018", "NIST CSF 2.0 PR.AA-02 | ISO 27001:2022 A.8.3",
         "PROTECT — Identity Management", "A.8.3 Information Access Restriction",
         "Enforce role-based access control (RBAC) across all systems",
         "IT Security Manager",
         "RBAC implemented in core banking; not implemented in legacy ERP",
         "Provided", "Partially Effective",
         "RBAC inconsistently applied; legacy ERP uses broad permission groups",
         "Legacy systems not RBAC-compliant; access reviews not linked to RBAC roles",
         "Extend RBAC to all systems; map roles to business functions; link to access review process",
         60),

        ("CTL-019", "NIST CSF 2.0 GV.SC-07 | ISO 27001:2022 A.5.20",
         "GOVERN — Supply Chain", "A.5.20 Addressing Security in Supplier Agreements",
         "Include security requirements, SLAs, and audit rights in all vendor contracts",
         "Procurement Manager",
         "Sample contracts reviewed; 7 of 10 critical vendor contracts lack security annexures",
         "Provided", "Ineffective",
         "Majority of vendor contracts do not contain security obligations or audit rights",
         "No standard security schedule in contracts; no penalty clauses for breaches",
         "Develop standard security schedule; retrofit to critical contracts at next renewal",
         60),

        ("CTL-020", "NIST CSF 2.0 PR.PS-01 | ISO 27001:2022 A.8.9",
         "PROTECT — Platform Security", "A.8.9 Configuration Management",
         "Maintain hardened baseline configurations for all server and network device classes",
         "IT Operations Lead",
         "No baseline configuration standards documented; ad-hoc server builds",
         "Missing", "Ineffective",
         "No CIS benchmark hardening applied; default credentials found on 2 network devices",
         "No configuration baselines; default credentials; no compliance scanning",
         "Adopt CIS benchmarks; automate compliance scanning; remediate default credentials immediately",
         45),

        ("CTL-021", "NIST CSF 2.0 ID.RA-01 | ISO 27001:2022 A.8.8",
         "IDENTIFY — Risk Assessment", "A.8.8 Management of Technical Vulnerabilities",
         "Conduct quarterly vulnerability scans and annual penetration tests",
         "IT Security Manager",
         "Last pentest: March 2023; no vulnerability scanning evidence",
         "Provided", "Ineffective",
         "Penetration testing 18+ months overdue; no continuous vulnerability scanning",
         "No scanner deployed; pentest cadence not met",
         "Deploy vulnerability scanner (Tenable/Qualys); conduct pentest H1 2025; establish quarterly cadence",
         30),

        ("CTL-022", "NIST CSF 2.0 PR.DS-06 | ISO 27001:2022 A.8.20",
         "PROTECT — Data Security", "A.8.20 Network Security",
         "Deploy and tune next-generation firewall with IPS/IDS capability",
         "Network Engineer",
         "Legacy stateful firewall in place; no IPS/IDS; rule review last done 2022",
         "Provided", "Partially Effective",
         "Firewall in place but without IPS/IDS; ruleset not reviewed in 2 years; shadow rules present",
         "No intrusion prevention; stale firewall rules; no egress filtering",
         "Upgrade to NGFW with IPS/IDS; conduct firewall rule review; implement egress filtering",
         60),

        ("CTL-023", "NIST CSF 2.0 RC.RP-01 | ISO 27001:2022 A.5.30",
         "RECOVER — Recovery Planning", "A.5.30 ICT Readiness for Business Continuity",
         "Test BCP/DR annually with documented results",
         "Infrastructure Manager",
         "BCP document provided; DR test last conducted April 2022; no 2023/2024 test evidence",
         "Provided", "Ineffective",
         "BCP/DR not tested in over 2 years; recovery times unvalidated",
         "DR not tested; failover procedures undocumented for cloud workloads",
         "Conduct DR exercise within 60 days; document results; update runbooks for cloud",
         60),

        ("CTL-024", "NIST CSF 2.0 PR.AT-02 | ISO 27001:2022 A.6.3",
         "PROTECT — Awareness", "A.6.3 Information Security Awareness",
         "Conduct role-specific security training for privileged users and developers",
         "HR Manager",
         "No role-specific training programme; developers receive same training as general staff",
         "Missing", "Ineffective",
         "Developers and sysadmins lack role-specific security training (secure coding, cloud security)",
         "One-size-fits-all training; no technical deep-dives for high-risk roles",
         "Design role-specific training tracks: secure coding for devs, cloud security for ops",
         90),

        ("CTL-025", "NIST CSF 2.0 GV.RM-01 | ISO 27001:2022 A.5.2",
         "GOVERN — Risk Management", "A.5.2 Information Security Roles and Responsibilities",
         "Define and document information security roles and responsibilities",
         "CISO",
         "RACI matrix provided; security responsibilities absent from 60 % of job descriptions",
         "Provided", "Partially Effective",
         "RACI exists at senior level; security not embedded in individual JDs",
         "Security accountabilities not formalised at individual level",
         "Embed security responsibilities in all JDs; include in performance reviews",
         90),

        ("CTL-026", "NIST CSF 2.0 DE.CM-09 | ISO 27001:2022 A.8.7",
         "DETECT — Continuous Monitoring", "A.8.7 Protection Against Malware",
         "Deploy and maintain EDR on all endpoints and servers",
         "IT Operations Lead",
         "EDR deployed on 70 % of servers; AV on all workstations; no centralised dashboard",
         "Provided", "Partially Effective",
         "EDR coverage incomplete; no centralised visibility; AV not EDR-grade on older endpoints",
         "30 % server coverage gap; no centralised EDR console; alert fatigue due to misconfiguration",
         "Extend EDR to 100 % coverage; configure centralised management; tune detection rules",
         45),

        ("CTL-027", "NIST CSF 2.0 PR.DS-09 | ISO 27001:2022 A.8.12",
         "PROTECT — Data Security", "A.8.12 Data Leakage Prevention",
         "Deploy DLP controls at email gateway and endpoints",
         "IT Security Manager",
         "No DLP solution deployed; email gateway lacks content inspection",
         "Missing", "Ineffective",
         "No DLP capability; sensitive data can be emailed or copied without controls",
         "No email DLP; no endpoint DLP; no USB restriction policy enforced technically",
         "Evaluate and deploy DLP solution (Microsoft Purview or equivalent); define policies",
         60),

        ("CTL-028", "NIST CSF 2.0 PR.AA-06 | ISO 27001:2022 A.8.6",
         "PROTECT — Identity Management", "A.8.6 Capacity Management",
         "Implement and enforce a formal change management process",
         "IT Operations Lead",
         "Change management policy exists; CAB meets ad-hoc; 40 % of changes bypass CAB",
         "Provided", "Partially Effective",
         "Change process defined but not enforced; emergency changes bypass review",
         "CAB effectiveness low; no automation; rollback plans absent from many change records",
         "Enforce CAB gate for all production changes; require rollback plan; track change success rate",
         60),

        ("CTL-029", "NIST CSF 2.0 ID.AM-05 | ISO 27001:2022 A.8.1",
         "IDENTIFY — Asset Management", "A.8.1 Inventory of Information and Other Assets",
         "Classify all data assets and maintain a data flow map",
         "Chief Data Officer",
         "Partial data flow diagrams exist for payment processing; no classification applied",
         "Provided", "Ineffective",
         "Data classification not implemented; data flows undocumented for HR and customer systems",
         "No classification labels; data flows incomplete; DPDP Act data mapping not started",
         "Complete data classification; map all personal data flows for DPDP Act compliance",
         90),

        ("CTL-030", "NIST CSF 2.0 PR.PS-03 | ISO 27001:2022 A.8.32",
         "PROTECT — Platform Security", "A.8.32 Change Management",
         "Validate security configurations in cloud accounts using CSPM tooling",
         "Cloud Architect",
         "No CSPM tool; manual cloud security review conducted last year",
         "Missing", "Ineffective",
         "AWS environment lacks continuous compliance monitoring; misconfigurations go undetected",
         "No CSPM; public S3 buckets identified in manual review; no guardrails on IAM",
         "Deploy CSPM (AWS Security Hub / Prisma Cloud); enforce SCPs; remediate open findings",
         30),
    ]

    for c in controls_raw:
        (cid, fw_ref, nist_cat, iso_annex, obj, owner, evidence_desc,
         ev_status, effectiveness, result, gap, rec, review_days) = c

        db.add(models.Control(
            control_id=cid,
            framework_reference=fw_ref,
            nist_csf_category=nist_cat,
            iso_27001_annex=iso_annex,
            control_objective=obj,
            control_owner=owner,
            evidence_description=evidence_desc,
            evidence_status=ev_status,
            effectiveness=effectiveness,
            assessment_result=result,
            identified_gap=gap,
            recommendation=rec,
            review_date=date.today() + timedelta(days=review_days),
        ))


# ─────────────────────────────────────────────────────────────────────────────
# REMEDIATION ITEMS  (15 findings)
# ─────────────────────────────────────────────────────────────────────────────

def _seed_remediation(db):
    today = date.today()
    items = [
        ("FND-001", "MFA Not Enforced on Core Banking Portal", "Critical",
         "Core banking system accessible with single-factor authentication only. Credential compromise could result in mass customer account fraud.",
         "Deploy TOTP or FIDO2 MFA on core banking portal as emergency measure within 30 days.",
         "IT Security Manager", today + timedelta(days=30), "Open", None, "RSK-001", "CTL-002"),

        ("FND-002", "Shared Root Credentials on Linux Servers", "Critical",
         "Multiple administrators share root credentials on 18 Linux production servers. Individual accountability is impossible.",
         "Implement PAM solution; rotate and vault all root credentials; enable session recording.",
         "IT Operations Lead", today + timedelta(days=30), "In Progress", None, "RSK-002", "CTL-014"),

        ("FND-003", "Critical CVE Patch Lag >90 Days", "High",
         "Average time to patch critical CVEs is 97 days. Multiple servers running kernel and OpenSSL versions with known exploitable CVEs.",
         "Implement automated patch management; enforce 30-day SLA for critical CVEs.",
         "IT Operations Lead", today + timedelta(days=45), "In Progress", None, "RSK-005", "CTL-007"),

        ("FND-004", "No SIEM / Centralised Log Management", "High",
         "No SIEM deployed. Logs retained for <90 days. No alerting, correlation, or threat hunting capability.",
         "Procure and deploy SIEM within 60 days. Define top 20 use cases and alerting rules.",
         "IT Security Manager", today + timedelta(days=60), "Open", None, "RSK-006", "CTL-005"),

        ("FND-005", "Vendor Contracts Lack Security Clauses", "High",
         "7 of 10 critical vendor contracts have no security annexures, audit rights, or breach notification requirements.",
         "Develop standard security schedule; retrofit to critical vendor contracts at next renewal.",
         "Procurement Manager", today + timedelta(days=60), "Open", None, "RSK-004", "CTL-019"),

        ("FND-006", "Backup Restoration Never Tested", "High",
         "Daily backups are scheduled but restoration has never been formally tested. Backup integrity is unknown.",
         "Conduct restoration drill for critical systems within 45 days. Document results and repeat quarterly.",
         "Infrastructure Manager", today + timedelta(days=45), "Open", None, "RSK-003", "CTL-012"),

        ("FND-007", "Incident Response Plan Outdated (2021)", "High",
         "IRP last updated in 2021 and never tabletop-tested. Contact lists are stale. Cloud IR procedures absent.",
         "Update IRP to reflect current environment; conduct tabletop exercise; align with CERT-In 6-hour rule.",
         "CISO", today + timedelta(days=30), "Open", None, "RSK-007", "CTL-006"),

        ("FND-008", "No DLP Controls at Email Gateway or Endpoints", "High",
         "Sensitive customer data and financial records can be emailed externally without any content inspection.",
         "Deploy DLP at email gateway within 60 days; define data-in-motion policies; block USB on high-risk endpoints.",
         "IT Security Manager", today + timedelta(days=60), "Open", None, "RSK-012", "CTL-027"),

        ("FND-009", "TLS 1.0/1.1 Active on Internal Services", "Medium",
         "Four internal services accept TLS 1.0 and 1.1 connections. RC4 cipher suites also enabled.",
         "Disable TLS 1.0/1.1 and RC4 on all internal services; enforce TLS 1.2+ minimum.",
         "Network Engineer", today + timedelta(days=45), "In Progress", None, "RSK-023", "CTL-004"),

        ("FND-010", "Security Awareness Training Completion at 62 %", "Medium",
         "38 % of employees have not completed mandatory security awareness training for FY 2024. Phishing click rate is 35 %.",
         "Make training mandatory with HR escalation for non-completions; run monthly phishing simulations.",
         "HR Manager", today + timedelta(days=60), "In Progress", None, "RSK-009", "CTL-009"),

        ("FND-011", "AWS Cloud Misconfigurations Identified", "High",
         "Manual AWS review found 3 publicly readable S3 buckets and over-permissive IAM roles in development accounts.",
         "Remediate open S3 buckets immediately; deploy CSPM; enforce IAM least-privilege via SCPs.",
         "Cloud Architect", today - timedelta(days=10), "Overdue", None, "RSK-025", "CTL-030"),

        ("FND-012", "No Network Segmentation — Flat Network", "High",
         "Internal network lacks segmentation. Production, user, and DMZ segments are on the same VLAN.",
         "Design segmentation architecture; implement VLANs and NGFW zone policies over 90-day programme.",
         "Network Engineer", today + timedelta(days=90), "Open", None, "RSK-015", "CTL-011"),

        ("FND-013", "Asset Inventory Incomplete (30 % Coverage)", "Medium",
         "Asset inventory spreadsheet covers approximately 30 % of actual estate. Cloud assets not tracked.",
         "Deploy automated discovery tool; integrate with CMDB; achieve 95 % coverage within 90 days.",
         "IT Operations Lead", today + timedelta(days=90), "Open", None, None, "CTL-010"),

        ("FND-014", "No SAST/DAST in CI/CD Pipeline", "Medium",
         "Applications are deployed without automated security testing. Vulnerabilities discovered post-production.",
         "Integrate Semgrep and OWASP ZAP into CI/CD pipeline; block release on critical findings.",
         "DevOps Lead", today + timedelta(days=60), "Open", None, "RSK-018", "CTL-013"),

        ("FND-015", "Default Credentials on Network Devices", "Critical",
         "Two network switches found with vendor default credentials. These were identified during manual review.",
         "Change default credentials immediately (Day 0 action); rotate all network device passwords; implement TACACS+.",
         "Network Engineer", today + timedelta(days=7), "Completed",
         "Default credentials rotated on both devices on 2024-10-15. TACACS+ implementation in progress.",
         None, "CTL-020"),
    ]

    for item in items:
        (fid, title, sev, desc, rec, owner, tgt, status, closure, rsk_id, ctl_id) = item
        db.add(models.RemediationItem(
            finding_id=fid,
            finding_title=title,
            severity=sev,
            description=desc,
            recommendation=rec,
            accountable_owner=owner,
            target_date=tgt,
            status=status,
            closure_evidence=closure,
            linked_risk_id=rsk_id,
            linked_control_id=ctl_id,
            created_date=today - timedelta(days=30),
        ))


# ─────────────────────────────────────────────────────────────────────────────
# VENDORS  (10 third-party vendors)
# ─────────────────────────────────────────────────────────────────────────────

def _seed_vendors(db):
    vendors_raw = [
        ("VND-001", "StratusCloud India Pvt Ltd", "Cloud Hosting (AWS Reseller / MSP)",
         "Restricted", "Manages Apex AWS infrastructure; full admin access to cloud accounts",
         "Critical", 20,
         "No MFA enforced on StratusCloud admin accounts; access not reviewed quarterly; no VAPT evidence",
         16, "Mandate MFA; conduct annual security assessment; add audit rights to contract",
         date(2025, 3, 31), date(2024, 10, 1), "Rajiv Mehta"),

        ("VND-002", "PaySecure Solutions", "Payment Processing Gateway",
         "Restricted", "Processes all card and UPI transactions; access to cardholder data",
         "Critical", 16,
         "PCI-DSS SAQ-D submitted but not independently verified; penetration test results not shared",
         12, "Obtain full PCI-DSS AOC; review pentest results; enforce tokenisation",
         date(2025, 6, 30), date(2024, 9, 15), "Sunita Sharma"),

        ("VND-003", "DataVault Archives", "Data Storage & Long-Term Archival",
         "Confidential", "Stores encrypted archival records; read/write access to archive buckets",
         "High", 15,
         "Encryption key management unclear; no SOC 2 Type II report available; SLAs not tested",
         10, "Obtain SOC 2 report; clarify key management; test data retrieval SLA annually",
         date(2025, 4, 30), date(2024, 8, 20), "Arvind Nair"),

        ("VND-004", "TechAssist Customer Support", "Customer Support (BPO)",
         "Confidential", "Access to customer records and transaction history for support resolution",
         "High", 12,
         "Agents access customer data via web portal; no DLP at vendor site; high staff turnover",
         9, "Restrict data access to minimum required; conduct on-site security audit; add DLP requirement",
         date(2025, 1, 31), date(2024, 7, 10), "Priya Krishnan"),

        ("VND-005", "SecureNet Connectivity", "Network & Leased Line Provider",
         "Internal", "Provides dedicated MPLS and internet links; access to router management",
         "High", 10,
         "SLA breach not penalised in contract; no security review of network equipment performed",
         8, "Add SLA penalties for outages; conduct annual joint network security review",
         date(2025, 9, 30), date(2024, 6, 5), "Deepak Iyer"),

        ("VND-006", "HRPro Systems", "HR Software (SaaS)",
         "Confidential", "Stores employee PII, payroll data, and performance records; SSO integration",
         "High", 12,
         "SOC 2 Type II 2022 report provided but 2023 not yet available; SSO config not reviewed",
         8, "Obtain current SOC 2 report; review SSO scopes; assess subprocessors",
         date(2025, 2, 28), date(2024, 9, 1), "Anitha Rao"),

        ("VND-007", "AuditTrail Compliance Tools", "GRC / Compliance SaaS",
         "Internal", "Access to risk and compliance data; read-only access to control evidence",
         "Medium", 9,
         "Vendor is small startup; limited security programme; no formal certifications",
         7, "Request security questionnaire; limit data shared to non-sensitive; annual review",
         date(2025, 7, 31), date(2024, 10, 5), "Vikram Singh"),

        ("VND-008", "PentaShield Cyber Services", "Penetration Testing & Security Consulting",
         "Restricted", "Conducts authorised pentests; short-term privileged access during engagements",
         "Medium", 10,
         "Engagement scope not always formally agreed; data handling after engagement unclear",
         6, "Formalise scope agreements; NDA and data destruction confirmation post-engagement",
         date(2025, 12, 31), date(2024, 5, 20), "Kedar Bhatt"),

        ("VND-009", "CloudMail Services", "Email Delivery & Anti-Spam (SaaS)",
         "Internal", "Routes all outbound transactional email; stores email metadata for 30 days",
         "Low", 6,
         "DMARC enforcement not configured on all sending domains through this vendor",
         5, "Enforce DMARC; review SPF/DKIM alignment; conduct annual vendor review",
         date(2025, 11, 30), date(2024, 8, 15), "Meera Pillai"),

        ("VND-010", "Facility Guard Physical Security", "Physical Security & CCTV Management",
         "Internal", "Manages CCTV, access control, and visitor management at data centre and HQ",
         "Medium", 8,
         "CCTV footage retention only 14 days; visitor logs paper-based; guard training not verified",
         6, "Extend CCTV retention to 90 days; digitise visitor management; verify guard vetting",
         date(2025, 5, 31), date(2024, 9, 30), "Sanjay Desai"),
    ]

    for v in vendors_raw:
        (vid, name, cat, data_sens, access, crit, inh_score,
         weaknesses, res_score, rec, contract_date, assess_date, contact) = v
        db.add(models.Vendor(
            vendor_id=vid,
            name=name,
            service_category=cat,
            data_sensitivity=data_sens,
            access_privileges=access,
            criticality=crit,
            inherent_risk_score=inh_score,
            control_weaknesses=weaknesses,
            residual_risk_score=res_score,
            recommended_actions=rec,
            contract_review_date=contract_date,
            assessment_date=assess_date,
            contact_name=contact,
        ))


if __name__ == "__main__":
    reseed()
