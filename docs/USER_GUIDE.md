# RiskLens v2.0 — User & Evaluator Guide

> **Welcome to RiskLens!** An enterprise Governance, Risk, and Compliance (GRC) assessment platform designed for cybersecurity consultants, risk officers, and auditors.

---

## 1. Navigating the Workspace

The application provides 10 purpose-built modules accessible from the persistent navigation bar:

1. **Executive Dashboard:** High-level KPIs, risk appetite violations, residual risk distributions, and control gap statistics.
2. **Risk Register:** Comprehensive $5 \times 5$ interactive heat matrix, multi-dimensional impact scoring, and risk treatment workflows.
3. **Control Assessment:** Catalog of controls evaluated across design effectiveness and operating effectiveness with attached evidence.
4. **NIST CSF 2.0 Maturity:** Radar chart and gap analysis visualizing organizational maturity against target implementation tiers.
5. **Regulatory Compliance:** Real-time crosswalk comparing posture against NIST CSF, ISO 27001, RBI IT, DPDP, and PCI DSS.
6. **Threat Intelligence:** MITRE ATT&CK technique breakdown mapped directly to internal risks and detection gaps.
7. **Remediation Tracker:** Corrective action plan workflow ($Open \rightarrow Assigned \rightarrow In\ Progress \rightarrow Pending\ Verification \rightarrow Closed$) with overdue alerts.
8. **Vendor Risk:** Third-party vendor portfolio management, SOC 2 status tracking, and criticality tiering.
9. **Audit Trail:** Immutable log of system changes with inspectable before/after JSON diffs.
10. **Consulting Reports:** Client-ready deliverable format with one-click print/PDF and multi-sheet Excel export.

---

## 2. Interactive Role Switcher

For evaluation and demonstration purposes, RiskLens includes a **Live RBAC Role Switcher** in the top navigation bar:

- **Administrator:** Full system access, appetite configuration, user management, and database reset.
- **Consultant:** Standard assessor permissions; can edit risks, test controls, upload evidence, and close findings.
- **Risk Owner:** Departmental risk representative; can view register and execute formal risk acceptances.
- **Auditor:** Independent assurance officer; has read-only access to all modules and full access to the Audit Trail.
- **Executive:** C-suite viewer; streamlined dashboard with governance summaries.

Switching roles in the dropdown automatically issues a new JWT token signed with that role's authority.

---

## 3. Risk Acceptance Workflow

When a residual risk exceeds organizational appetite ($> 9$), a formal risk acceptance can be logged:
1. Open the risk item in the **Risk Register**.
2. Select **Accept Risk** (requires Risk Owner or Administrator authority).
3. Specify the business justification and compensating controls.
4. The system validates whether the residual score complies with governance authority thresholds (e.g., scores $\ge 15$ require Board approval).
5. The acceptance is archived in the immutable audit trail.
