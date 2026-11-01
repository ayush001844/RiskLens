# RiskLens v2.0 — API Reference Manual

> **Base URL:** `/api`  
> **Interactive Docs:** `/api/docs` (Swagger UI) & `/api/redoc` (ReDoc)  
> **Security Schemes:** HTTP Bearer JWT (`Authorization: Bearer <token>`)  

---

## 1. Authentication & RBAC

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticate user with credentials; returns JWT and user profile |
| `POST` | `/api/auth/refresh`| Public | Exchange valid refresh token for a new access token |
| `GET` | `/api/auth/me` | Authenticated | Retrieve current session user and permissions |
| `GET` | `/api/auth/users` | Administrator | List all registered system users |
| `POST` | `/api/auth/users` | Administrator | Register new user account with specific role |

---

## 2. Risk Management & Governance

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/risks` | Authenticated | List risks with optional category, status, and appetite filters |
| `POST` | `/api/risks` | Consultant+ | Create a new risk with auto-calculated scores and audit entry |
| `GET` | `/api/risks/{id}`| Authenticated | Get full risk details including mapped threats and acceptances |
| `PATCH` | `/api/risks/{id}`| Consultant+ | Update risk metrics, status, or controls; recalculates residual |
| `DELETE`| `/api/risks/{id}`| Administrator | Archive or delete risk record (writes audit log) |
| `POST` | `/api/risks/{id}/accept` | Risk Owner / CISO | Submit formal risk acceptance with justification |
| `GET` | `/api/risks/appetite` | Authenticated | Retrieve organisation risk appetite thresholds |
| `PUT` | `/api/risks/appetite` | Administrator | Update risk appetite configuration |

---

## 3. Controls & Assurance

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/controls` | Authenticated | List all controls with effectiveness and gap indicators |
| `GET` | `/api/controls/{id}` | Authenticated | Retrieve specific control with test history and attached evidence |
| `PATCH` | `/api/controls/{id}` | Consultant+ | Update implementation status or design/operating effectiveness |
| `POST` | `/api/controls/{id}/tests` | Consultant+ | Record formal control testing procedure and sampling results |
| `POST` | `/api/controls/{id}/evidence` | Consultant+ | Upload or link compliance evidence document |

---

## 4. NIST CSF 2.0 & Compliance Crosswalk

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/maturity/latest` | Authenticated | Retrieve latest NIST CSF 2.0 maturity profile across 6 functions |
| `GET` | `/api/maturity/{id}/gap-analysis` | Authenticated | Get numerical delta between current and target tiers |
| `GET` | `/api/compliance/summary` | Authenticated | Overview of compliance status across all 5 frameworks |
| `GET` | `/api/compliance/frameworks` | Authenticated | List frameworks (NIST, ISO 27001, RBI, DPDP, PCI DSS) |
| `GET` | `/api/compliance/frameworks/{id}/requirements` | Authenticated | Drilldown into specific compliance requirements |

---

## 5. Threat Intelligence & Audit

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/threats` | Authenticated | List MITRE ATT&CK mapped threat scenarios |
| `POST` | `/api/threats` | Consultant+ | Create a new threat scenario mapped to a risk |
| `GET` | `/api/audit` | Auditor / Admin | Query immutable audit logs with entity and action filters |

---

## 6. Dashboard & Reporting

| Method | Endpoint | Access Level | Description |
|---|---|---|---|
| `GET` | `/api/dashboard` | Authenticated | Aggregated KPIs, appetite violations, and risk distributions |
| `GET` | `/api/reports/full` | Authenticated | Comprehensive assessment document payload |
| `GET` | `/api/reports/excel` | Authenticated | Stream multi-sheet styled Excel workbook (`.xlsx`) |
| `GET` | `/api/reports/csv/risks` | Authenticated | Stream raw Risk Register CSV |
| `GET` | `/api/reports/csv/controls`| Authenticated | Stream Control Assessment CSV |
| `GET` | `/api/reports/csv/remediation`| Authenticated | Stream Remediation Findings CSV |
| `GET` | `/api/reports/csv/vendors`| Authenticated | Stream Vendor Portfolio CSV |
