# RiskLens v2.0 — Enterprise Cybersecurity GRC Platform

> **Portfolio Showcase Project**: Simulating an enterprise cybersecurity consulting engagement for **Apex Financial Services Ltd.** (Fictional FinTech / NBFC institution).  
> ⚠️ **Disclaimer**: All company assets, vendors, evidence records, findings, and metrics in this platform are **100% synthetic demo records**. Framework mappings to NIST CSF 2.0, ISO/IEC 27001:2022, RBI IT Framework, DPDP Act 2023, and PCI DSS 4.0.1 are for educational demonstration and do not constitute an official compliance determination or certification.

---

## 🏛️ Business Scenario: Apex Financial Services

**Apex Financial Services** is a high-growth non-banking financial company (NBFC) operating digital lending, UPI micro-payments, and wealth management across India. 

RiskLens simulates an enterprise GRC (Governance, Risk, and Compliance) advisory engagement conducted by a Senior Cybersecurity Consultant to evaluate:
- Core banking APIs and customer NetBanking portals
- AWS Mumbai (ap-south-1) cloud infrastructure and IAM posture
- Payment gateway integrations (Razorpay, NPCI UPI switches)
- Customer PII data stores (Aadhaar, PAN, bank statements)
- Third-party SaaS vendors and sub-processors

---

## 🚀 Key Modules & Architecture (10 Integrated Views)

1. **📊 Executive Dashboard**: Real-time KPI telemetry, appetite violation alerts, risk distributions, and control gap metrics.
2. **⚠️ Enterprise Risk Register**: 5×5 interactive heat matrix, multi-dimensional impact scoring (financial, operational, reputational, regulatory), and formal risk acceptance workflows.
3. **🛡️ Control Assessment**: Catalog of controls evaluated across design effectiveness and operating effectiveness with attached evidence verification.
4. **🎯 NIST CSF 2.0 Maturity**: Interactive radar chart comparing Current vs. Target implementation profiles with gap analysis bar chart across all 6 core functions: `GOVERN`, `IDENTIFY`, `PROTECT`, `DETECT`, `RESPOND`, `RECOVER`.
5. **⚖️ Regulatory Compliance**: Crosswalk across 5 major standards: NIST CSF 2.0, ISO/IEC 27001:2022, RBI IT Framework, DPDP Act 2023, and PCI DSS 4.0.1.
6. **🎯 Threat Intelligence**: MITRE ATT&CK technique breakdown mapped directly to internal risks and detection gaps.
7. **🔧 Remediation Tracker**: Workflow tracking ($Open \rightarrow Assigned \rightarrow In\ Progress \rightarrow Pending\ Verification \rightarrow Closed$) with automated SLA overdue alerts.
8. **🏢 Vendor Risk Management**: Third-party lifecycle tracking, SOC 2 Type II status, and data sensitivity tiering.
9. **📜 Security Audit Trail**: Immutable, append-only event log capturing user identity, role, IP address, and before/after JSON state snapshots.
10. **📄 Consulting Reports & Exports**: Client-ready deliverable format with one-click print/PDF, streaming CSVs, and multi-sheet styled Excel workbook (`.xlsx`) via `openpyxl`.

---

## 🛠️ Technology Stack

| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite | Tailwind CSS, Lucide React, Recharts, Axios |
| **Backend** | Python 3.11+ / FastAPI | Pydantic v2, SQLAlchemy 2.0, Uvicorn, Jose JWT, bcrypt, openpyxl |
| **Database** | SQLite 3 (Dev) / PostgreSQL (Prod) | Embedded persistent database (`risklens.db`) with Alembic migration readiness |
| **Testing** | Pytest 8.3 | `pytest-asyncio`, FastAPI `TestClient` — **62 / 62 Tests Passing** |

---

## 📦 Getting Started

### 1. Backend Setup
```bash
cd backend

# Create virtual environment & activate
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database with synthetic data
python3 -c "from app.seed import reseed; reseed()"

# Start the FastAPI server (Port 8000)
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/api/docs`

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start the Vite development server (Port 5173)
npm run dev
```
Open your browser at: `http://localhost:5173`

---

## 🧪 Automated Testing

RiskLens includes a comprehensive 62-test suite covering risk-scoring algorithms, boundary conditions, auth, RBAC permissions, maturity radar data, compliance mappings, and report streaming.

```bash
cd backend
source venv/bin/activate
python3 -m pytest tests/ -v
```

**Result: 62 passed in ~6.9s**

---

## 📚 Complete Project Documentation

All formal documentation deliverables are located in the [`docs/`](docs/) directory:
- [`docs/CODEBASE_AUDIT.md`](docs/CODEBASE_AUDIT.md): Comprehensive initial audit and security analysis
- [`docs/PROJECT_ARCHITECTURE.md`](docs/PROJECT_ARCHITECTURE.md): Technical architecture specification
- [`docs/RISK_METHODOLOGY.md`](docs/RISK_METHODOLOGY.md): Mathematical formulas and scoring methodology
- [`docs/IMPLEMENTATION_ROADMAP.md`](docs/IMPLEMENTATION_ROADMAP.md): Phased delivery tracking (Phases 0–7)
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md): Complete ERD and table specifications
- [`docs/API_DOCUMENTATION.md`](docs/API_DOCUMENTATION.md): REST API reference manual
- [`docs/SECURITY_DESIGN.md`](docs/SECURITY_DESIGN.md): Threat model, in-memory auth, and RBAC matrix
- [`docs/FRAMEWORK_MAPPING.md`](docs/FRAMEWORK_MAPPING.md): NIST CSF 2.0, ISO 27001, RBI, DPDP & PCI DSS crosswalk
- [`docs/DEPLOYMENT_GUIDE.md`](docs/DEPLOYMENT_GUIDE.md): Docker, PostgreSQL, and cloud hosting guide
- [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md): End-user and evaluator walkthrough
- [`docs/INTERVIEW_GUIDE.md`](docs/INTERVIEW_GUIDE.md): Technical talking points for architecture interviews
- [`docs/TESTING_REPORT.md`](docs/TESTING_REPORT.md): Pytest and Vite build verification report
