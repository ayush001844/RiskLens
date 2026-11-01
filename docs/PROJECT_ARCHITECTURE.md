# RiskLens — Project Architecture

> **Version:** 2.0 (Target)
> **Last Updated:** 2026-11-01
> **Status:** Phase 0 Complete — Implementation in progress

---

## 1. Business Problem

Enterprise organizations require a structured platform to manage cybersecurity risks, assess controls, track remediation, evaluate third-party vendors, and demonstrate compliance with frameworks such as NIST CSF 2.0 and ISO/IEC 27001:2022. RiskLens is a cybersecurity consulting demonstration platform simulating such a GRC (Governance, Risk & Compliance) platform for the fictional company Apex Financial Services.

---

## 2. Target Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel CDN)                     │
│  React 18 + TypeScript + Vite + Tailwind CSS + Recharts     │
│  ┌──────────┐ ┌────────┐ ┌────────────┐ ┌──────────────┐   │
│  │Dashboard │ │Risk Reg│ │Controls    │ │Reports       │   │
│  │(Module10)│ │(Mod 1) │ │(Module 2)  │ │(Module 11)   │   │
│  └──────────┘ └────────┘ └────────────┘ └──────────────┘   │
│  ┌──────────┐ ┌────────┐ ┌────────────┐ ┌──────────────┐   │
│  │NIST CSF  │ │Comply  │ │Vendors     │ │Auth/RBAC     │   │
│  │(Module 4)│ │(Mod 5) │ │(Module 6)  │ │(Module 8)    │   │
│  └──────────┘ └────────┘ └────────────┘ └──────────────┘   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS / REST API
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              BACKEND (Fly.io or Railway)                     │
│              Python FastAPI + Uvicorn                        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  API Routers                         │   │
│  │  /auth  /risks  /controls  /remediation  /vendors   │   │
│  │  /compliance  /maturity  /evidence  /audit  /reports│   │
│  └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
│  ┌─────────────────────────▼───────────────────────────┐   │
│  │              Service Layer                           │   │
│  │  RiskScoringService  ControlAssuranceService         │   │
│  │  ComplianceService   AuditTrailService               │   │
│  │  ReportService       AuthService                     │   │
│  └─────────────────────────┬───────────────────────────┘   │
│                             │                               │
│  ┌─────────────────────────▼───────────────────────────┐   │
│  │              Data Layer (SQLAlchemy ORM)             │   │
│  │  Risk  Control  Finding  Vendor  User  AuditLog      │   │
│  │  MaturityAssessment  ComplianceMapping  Evidence     │   │
│  └─────────────────────────┬───────────────────────────┘   │
└────────────────────────────┼────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │  (persistent)   │
                    │  Fly.io/Neon    │
                    └─────────────────┘
```

---

## 3. Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18.3.1 | UI framework |
| TypeScript | 5.6.3 | Type safety |
| Vite | 5.4.10 | Build tool |
| Tailwind CSS | 3.4.14 | Styling |
| Recharts | 2.13.0 | Data visualization |
| Lucide React | 0.454.0 | Icons |
| Axios | 1.7.7 | HTTP client |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.13.1 | Runtime |
| FastAPI | 0.115.0 | Web framework |
| Uvicorn | 0.32.0 | ASGI server |
| SQLAlchemy | 2.0.36 | ORM |
| Pydantic | 2.9.2 | Validation |
| Alembic | (to add) | Database migrations |
| passlib[bcrypt] | (to add) | Password hashing |
| python-jose | (to add) | JWT tokens |
| slowapi | (to add) | Rate limiting |

### Database
| Environment | Database | Notes |
|---|---|---|
| Local development | SQLite | Zero-config |
| Automated tests | SQLite (in-memory) | Isolated |
| Production | PostgreSQL | Persistent |

---

## 4. Module Architecture

### Module 1: Risk Governance Engine
- Risk appetite configuration (admin-only)
- Enhanced risk register (30+ fields per risk)
- Centralized scoring engine (inherent × impact)
- Risk treatment workflow (Avoid/Mitigate/Transfer/Accept)
- Risk acceptance with approval history

### Module 2: Control Assurance Engine
- NIST CSF 2.0 + ISO 27001:2022 + Custom controls
- Separated design effectiveness and operating effectiveness
- Control testing with population/sample methodology
- Deficiency documentation and recommendation

### Module 3: Evidence Management
- Secure file upload (PDF, Excel, CSV, screenshots)
- Evidence metadata (ID, owner, expiry, version)
- Evidence verification workflow
- Access-controlled downloads
- Evidence audit logs

### Module 4: NIST CSF 2.0 Maturity Assessment
- Six functions: GOVERN, IDENTIFY, PROTECT, DETECT, RESPOND, RECOVER
- Four implementation tiers (Partial → Adaptive)
- Current vs. target profile gap analysis
- Heat map, radar chart, improvement roadmap

### Module 5: Regulatory Compliance Mapping
- NIST CSF 2.0, ISO 27001:2022, RBI IT, DPDP Act 2023, CERT-In, PCI DSS 4.0.1
- Many-to-many control-to-requirement mapping
- Compliance status tracking (Compliant/Partially/Non-Compliant/Not Assessed/N/A)

### Module 6: Third-Party Risk Management
- Full vendor lifecycle (onboarding → offboarding)
- Business criticality and data sensitivity assessment
- Security questionnaire with weighted scoring
- Vendor risk reports

### Module 7: Remediation & Finding Management
- Enhanced finding fields (criteria, root cause, management response)
- Workflow: Open → Assigned → In Progress → Pending Verification → Closed
- Overdue detection and escalation
- Remediation metrics dashboard

### Module 8: Authentication & RBAC
- Secure login with bcrypt password hashing
- JWT tokens with refresh
- Six roles: Administrator, Consultant, Risk Owner, Control Owner, Auditor, Executive
- Backend authorization enforcement

### Module 9: Immutable Audit Trail
- Append-only audit log table
- Tracks: user, action, entity, before/after values, timestamp, IP
- Protected from modification by ordinary users

### Module 10: Executive Dashboard
- All metrics from real database records
- Risk heat map, trend charts, maturity radar
- Control effectiveness (design vs. operating)
- Recharts visualizations with labels, tooltips, legends

### Module 11: Consulting Report Generator
- Structured JSON report from real records
- PDF export (WeasyPrint or ReportLab)
- Excel and CSV export
- Professional consulting visual identity

### Module 12: Threat Scenario Intelligence (Optional)
- MITRE ATT&CK technique mapping
- Threat actor profiling
- Detection gap analysis

---

## 5. Deployment Architecture (Target)

### Current State (Vercel)
- Frontend: Vercel CDN (working)
- Backend: Vercel Python serverless (working but SQLite is ephemeral)
- Database: SQLite /tmp (DATA LOST ON COLD START)

### Target State
**Option A: Fly.io (Recommended)**
- Frontend: Vercel CDN
- Backend: Fly.io Docker container (FastAPI + Uvicorn)
- Database: Fly.io Postgres (persistent, managed)
- Pros: True persistent storage, websocket support, low latency
- Cons: Additional service to manage

**Option B: Railway**
- Frontend: Vercel CDN  
- Backend: Railway (FastAPI)
- Database: Railway PostgreSQL
- Pros: Simple deployment, GitHub integration
- Cons: Cold starts on free tier

**Option C: Render**
- Frontend: Vercel CDN
- Backend: Render Web Service (FastAPI)
- Database: Render PostgreSQL
- Pros: Free tier, no cold starts on paid
- Cons: Slower free tier

**Recommended for demo/portfolio:** Railway or Render (simplest setup)

---

## 6. Security Design

### Authentication Flow
1. POST /api/auth/login → validates credentials → returns JWT access token (15 min) + refresh token (7 days)
2. All protected endpoints require Bearer token in Authorization header
3. Token refresh: POST /api/auth/refresh → new access token

### Authorization Model
| Role | Permissions |
|---|---|
| Administrator | Full access including user management, system config |
| Consultant | Create/edit risks, controls, findings, vendors, reports |
| Risk Owner | View all; update assigned risks |
| Control Owner | View all; submit evidence for owned controls |
| Auditor | Read-only on all assessment records |
| Executive | Dashboard and reports only |

### Backend Enforcement
- All sensitive endpoints use FastAPI Depends for auth injection
- Role checked server-side, not relying on frontend hiding
- Audit trail written before response is returned

---

## 7. API Design Principles

- RESTful resource paths
- Consistent error response format: `{detail: string, code: string}`
- Pagination: `?skip=0&limit=100` with `X-Total-Count` header
- Filtering: query parameters per resource type
- Sorting: `?sort=field&order=asc|desc`
- All dates: ISO 8601 format (YYYY-MM-DD)
- All scores: Integers or rounded floats per documented formula

