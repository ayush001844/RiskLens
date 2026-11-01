# RiskLens — Codebase Audit Report

> **Audit Date:** 2026-11-01
> **Auditor:** Antigravity IDE (automated audit)
> **Basis:** Direct inspection of all source files. README was not used as a reference.
> **Test Run:** 45/45 existing tests PASS.

---

## 1. Project Overview (Verified)

| Property | Verified Value |
|---|---|
| Project Name | RiskLens |
| Demo Organisation | Apex Financial Services (fictional) |
| Frontend Framework | React 18.3.1 + TypeScript 5.6.3 + Vite 5.4.10 |
| Styling | Tailwind CSS 3.4.14 |
| Charts | Recharts 2.13.0 |
| Icons | Lucide React 0.454.0 |
| HTTP Client | Axios 1.7.7 |
| Backend Framework | FastAPI 0.115.0 + Uvicorn 0.32.0 |
| ORM | SQLAlchemy 2.0.36 |
| Validation | Pydantic 2.9.2 |
| Database (local) | SQLite (file: backend/app/risklens.db) |
| Database (Vercel) | SQLite in /tmp (ephemeral — data lost on cold start) |
| Deployment | Vercel (frontend SPA + Python serverless functions) |
| Python Version | 3.13.1 |

---

## 2. Directory Structure (Verified)

```
GRCPROJECT/
├── .env.local                  # Vercel OIDC token only — no app secrets
├── vercel.json                 # Frontend build + SPA rewrites (no API routing for /api/*)
├── requirements.txt            # Root-level (used by Vercel Python runtime)
├── api/
│   ├── index.py               # Vercel serverless entrypoint
│   └── [...path].py           # Catch-all path handler
├── backend/
│   ├── requirements.txt       # Full dev requirements including pytest
│   ├── app/
│   │   ├── main.py            # FastAPI app: routers, CORS, SPA serving, auto-seed
│   │   ├── database.py        # SQLAlchemy engine + session; SQLite/tmp detection
│   │   ├── models.py          # 4 ORM models: Risk, Control, RemediationItem, Vendor
│   │   ├── schemas.py         # Pydantic schemas for all 4 entities + DashboardStats
│   │   ├── scoring.py         # Risk scoring engine: inherent, residual, band
│   │   ├── seed.py            # 25 risks, 30 controls, 15 findings, 10 vendors
│   │   └── routers/
│   │       ├── risks.py       # CRUD + filter/search for risks
│   │       ├── controls.py    # CRUD + filter/search for controls
│   │       ├── remediation.py # CRUD + filter/search for remediation
│   │       ├── vendors.py     # CRUD + filter/search for vendors
│   │       └── reports.py     # Dashboard stats + CSV exports + full report JSON
│   └── tests/
│       ├── test_api.py        # 21 integration tests (all pass)
│       └── test_scoring.py    # 24 unit tests for scoring engine (all pass)
└── frontend/
    └── src/
        ├── App.tsx            # Root component: state mgmt, data loading, routing
        ├── index.css          # Tailwind base + custom component classes
        ├── api/client.ts      # Axios wrapper: all API calls
        ├── types/index.ts     # TypeScript interfaces mirroring backend schemas
        ├── utils/index.ts     # Score bands, badge classes, date formatting
        └── components/        # 13 components (Navbar, Dashboard, Risk, Control, etc.)
```

---

## 3. Backend API Endpoints (All Verified)

### Health & Admin
| Method | Path | Status |
|---|---|---|
| GET | /api/health | Working |
| POST | /api/admin/reseed | Working, UNPROTECTED |

### Risk Register (5 endpoints)
| Method | Path | Filters Available |
|---|---|---|
| GET | /api/risks/ | category, status, search, skip, limit |
| GET | /api/risks/{risk_id} | — |
| POST | /api/risks/ | Scores auto-calculated |
| PATCH | /api/risks/{risk_id} | Scores recalculated on update |
| DELETE | /api/risks/{risk_id} | — |

### Controls (5 endpoints), Remediation (5 endpoints), Vendors (5 endpoints)
Same CRUD pattern with domain-specific filters.

### Dashboard & Reports (6 endpoints)
- GET /api/dashboard — aggregated stats
- GET /api/reports/full — JSON for frontend rendering
- GET /api/reports/csv/{risks|controls|remediation|vendors} — CSV exports

> **Note:** All routers registered TWICE in main.py (with and without /api prefix). Vercel serverless workaround.

---

## 4. Database Schema (4 Tables Verified)

### risks: 18 columns
risk_id (unique), title, category, affected_asset, threat, vulnerability, business_impact,
likelihood (1-5), impact (1-5), inherent_risk_score, existing_controls,
control_effectiveness_pct (0-100), residual_risk_score, risk_owner,
treatment_strategy (enum), status (enum), review_date, notes

### controls: 13 columns
control_id (unique), framework_reference, nist_csf_category, iso_27001_annex,
control_objective, control_owner, evidence_description, evidence_status (enum),
effectiveness (enum), assessment_result, identified_gap, recommendation, review_date

### remediation_items: 13 columns
finding_id (unique), finding_title, severity (enum), description, recommendation,
accountable_owner, target_date, status (enum), closure_evidence,
linked_risk_id (SOFT FK - no constraint), linked_control_id (SOFT FK), created_date

### vendors: 13 columns
vendor_id (unique), name, service_category, data_sensitivity (enum),
access_privileges, criticality (enum), inherent_risk_score (1-25),
control_weaknesses, residual_risk_score (0-25), recommended_actions,
contract_review_date, assessment_date, contact_name

---

## 5. Risk Scoring Engine (Verified)

| Formula | Implementation | Notes |
|---|---|---|
| Inherent Risk | likelihood × impact | Both validated 1-5 |
| Residual Risk | inherent × (1 - eff/100) | eff = consultant-assessed % |
| Low band | 1–4 | |
| Medium band | 5–9 | |
| High band | 10–14 | |
| Critical band | 15–25 | |

**Gap:** residual can reach 0.0 (100% effectiveness). Spec requires minimum = 1.

---

## 6. Seed Data (Verified)

| Entity | Count | Categories |
|---|---|---|
| Risks | 25 | IAM, BCP, Data Protection, AppSec, SecOps, Vendor Risk, Compliance |
| Controls | 30 | NIST CSF 2.0 + ISO 27001:2022 mapped |
| Remediation Findings | 15 | Mix of all statuses |
| Vendors | 10 | Various criticality/sensitivity ratings |

---

## 7. Security Issues (Critical)

| ID | Issue | Location | Impact |
|---|---|---|---|
| S-1 | No authentication or authorization | Entire application | Anyone reads/writes/deletes all data |
| S-2 | CORS only allows localhost | main.py | Production CORS will fail |
| S-3 | Admin reseed endpoint unprotected | /api/admin/reseed | Anyone can wipe database |
| S-4 | No rate limiting | All endpoints | DoS possible |
| S-5 | No input sanitization beyond Pydantic | All routers | Injection risk if DB changes |

---

## 8. Architecture Issues (High)

| ID | Issue | Impact |
|---|---|---|
| D-1 | Vercel SQLite is EPHEMERAL (/tmp) | All user data lost on cold start |
| D-2 | No foreign key constraints in DB | Orphaned records possible |
| D-3 | No Alembic migrations | Schema changes = manual drop/recreate |
| D-4 | Double router registration (workaround) | Route duplication, maintenance risk |
| D-5 | _ensure_seeded() runs on every import | Risk in production |

---

## 9. Missing Features vs. Specification

| ID | Feature | Module |
|---|---|---|
| F-1 | Authentication and RBAC | Module Eight |
| F-2 | Audit trail | Module Nine |
| F-3 | NIST CSF 2.0 maturity assessment | Module Four |
| F-4 | Regulatory compliance mapping | Module Five |
| F-5 | Evidence management with file uploads | Module Three |
| F-6 | Threat scenario / MITRE ATT&CK mapping | Module Twelve |
| F-7 | Risk appetite configuration | Module One A |
| F-8 | PDF export | Module Eleven |
| F-9 | Design vs. operating effectiveness split | Module Two |
| F-10 | Vendor lifecycle and questionnaire scoring | Module Six |
| F-11 | Risk acceptance workflow | Module One C |
| F-12 | Executive dashboard enhancements | Module Ten |

---

## 10. Frontend/Backend Schema Consistency

| Entity | Frontend Type | Backend Schema | Consistent? |
|---|---|---|---|
| Risk | types/index.ts:Risk | schemas.py:RiskOut | YES |
| Control | types/index.ts:Control | schemas.py:ControlOut | YES |
| RemediationItem | types/index.ts:RemediationItem | schemas.py:RemediationOut | YES |
| Vendor | types/index.ts:Vendor | schemas.py:VendorOut | YES |
| DashboardStats | types/index.ts:DashboardStats | schemas.py:DashboardStats | YES |

**Conclusion:** All frontend/backend schemas are consistent.

---

## 11. Test Coverage

| File | Tests | Status |
|---|---|---|
| test_scoring.py | 24 | ALL PASS |
| test_api.py | 21 | ALL PASS |
| **Total** | **45** | **ALL PASS** |

Not covered: authentication, residual=0 edge case, concurrent ID generation, frontend components.

---

## 12. Framework Mapping Accuracy

NIST CSF 2.0 identifiers in seed data (GV.RM, ID.AM, PR.AC, etc.) are authentic.
ISO 27001:2022 Annex A identifiers (A.5.x, A.8.x) are authentic.
reports.py correctly labels all mappings as "for educational purposes only."

