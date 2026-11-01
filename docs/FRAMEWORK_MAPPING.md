# RiskLens v2.0 — Regulatory & Standards Framework Mapping

> **Scope:** Multi-Framework Cybersecurity Compliance Crosswalk  
> **Target Entity:** Apex Financial Services (Synthetic Banking Simulation)  
> **Disclaimer:** Self-assessment crosswalk for demonstration and educational purposes only. Does not constitute formal certification or regulatory endorsement.  

---

## 1. Supported Frameworks Overview

| Framework Code | Name | Version | Jurisdiction / Standard | Mandatory for Financial Sector |
|---|---|---|---|:---:|
| `NIST_CSF_2` | NIST Cybersecurity Framework | 2.0 (2024) | Global / US Standard | Voluntary / Best Practice |
| `ISO_27001_2022` | ISO/IEC 27001 Annex A | 2022 Revision | International Standard | Industry Standard |
| `RBI_IT_2023` | RBI Master Direction on IT Governance | 2023 | India (Banking) |  Mandatory |
| `DPDP_2023` | Digital Personal Data Protection Act | 2023 | India (Privacy) |  Mandatory |
| `PCI_DSS_4` | Payment Card Industry Data Security Standard | 4.0.1 (2024) | Payment Processors |  Mandatory for Cards |

---

## 2. NIST CSF 2.0 Core Function Structure

NIST CSF 2.0 expands the traditional 5 functions into **6 Core Functions**:

```
                       ┌─────────────────────────┐
                       │       GOVERN (GV)       │
                       │ Strategy & Oversight    │
                       └────────────┬────────────┘
                                    │
       ┌────────────────────────────┼────────────────────────────┐
       ▼                            ▼                            ▼
┌──────────────┐             ┌──────────────┐             ┌──────────────┐
│IDENTIFY (ID) │             │ PROTECT (PR) │             │ DETECT (DE)  │
│Assets & Risks│             │Safeguards    │             │Anomalies     │
└──────┬───────┘             └──────┬───────┘             └──────┬───────┘
       │                            │                            │
       └────────────────────────────┼────────────────────────────┘
                                    │
                       ┌────────────┴────────────┐
                       ▼                         ▼
                ┌──────────────┐          ┌──────────────┐
                │ RESPOND (RS) │          │ RECOVER (RC) │
                │ Containment  │          │ Restoration  │
                └──────────────┘          └──────────────┘
```

### Implementation Tiers (1 to 4)
- **Tier 1 (Partial):** Informal, reactive, risk is addressed ad-hoc.
- **Tier 2 (Risk Informed):** Risk management practices are approved but not organization-wide.
- **Tier 3 (Repeatable):** Formally documented, updated based on business context.
- **Tier 4 (Adaptive):** Continuous improvement, automated posture adjustments, threat-informed.

---

## 3. High-Priority Control Crosswalk Matrix

| Risk ID | Title | NIST CSF 2.0 | ISO 27001:2022 | RBI IT Framework | DPDP Act 2023 | PCI DSS 4.0.1 |
|---|---|---|---|---|---|---|
| `RSK-001` | Core Banking Portal Credential Stuffing | `PR.AA-01`, `PR.AA-05` | `A.5.15`, `A.5.17` | Section 3.2.1 | Section 8(5) | Req 8.3 |
| `RSK-002` | Swift / Payment Switch Insider Manipulation | `PR.AA-02`, `PR.DS-01` | `A.5.16`, `A.8.2` | Section 4.1.2 | Section 8(4) | Req 7.2 |
| `RSK-003` | Ransomware Lateral Movement in AD | `PR.PS-01`, `DE.CM-01` | `A.8.7`, `A.8.16` | Section 5.3 | Section 8(5) | Req 5.2 |
| `RSK-004` | AWS Core Banking S3 Bucket Exposure | `PR.DS-02`, `GV.OC-01` | `A.8.11`, `A.5.23` | Section 6.2 | Section 9 | Req 3.4 |
| `RSK-005` | Unmonitored Shadow Cloud Deployments | `ID.AM-01`, `ID.RA-01` | `A.5.9`, `A.8.1` | Section 2.1 | Section 8(1) | Req 1.2 |
| `RSK-006` | Payment Gateway Vendor API Key Leak | `GV.SC-04`, `PR.AA-03` | `A.5.19`, `A.5.21` | Section 7.4 | Section 8(6) | Req 12.8 |
