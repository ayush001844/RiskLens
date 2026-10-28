# RiskLens — Enterprise Cybersecurity Risk & Controls Assessment Platform

> **Portfolio Showcase Project**: Simulating a cybersecurity consulting engagement for **Apex Financial Services Ltd.** (Fictional Indian Financial Services / FinTech company).  
> ⚠️ **Disclaimer**: All company assets, vendors, evidence records, findings, and metrics in this platform are **100% synthetic demo records**. Framework mappings to NIST CSF 2.0 and ISO/IEC 27001:2022 are for educational demonstration and do not constitute an official compliance determination or certification.

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

## 🚀 Key Modules & Architecture

### 1. 📊 Executive Dashboard
- **Dynamic KPI Telemetry**: Total assessed risks, high & critical scenarios, open control gaps, overdue remediation actions, and third-party vendor count calculated live from the database.
- **Interactive 5 × 5 Inherent Risk Heat Matrix**: Plots Likelihood (1–5) vs. Business Impact (1–5) with live hover inspections and cell filtering.
- **Recharts Visualizations**:
  - Inherent vs. Residual Risk Reduction grouped bar chart
  - Risk distribution by business domain (Identity, Cloud, AppSec, Data Protection, etc.)
  - Control assessment effectiveness donut chart
  - Remediation action status distribution

### 2. ⚠️ Enterprise Risk Register
- **25 Realistic Synthetic Risk Scenarios**: Missing MFA on bastion hosts, unpatched payment API vulnerabilities, stale privileged IAM keys, untested DR failover, customer database backups unencrypted, delayed patch cycles, etc.
- **Documented 5×5 Scoring Engine**:
  $$\text{Inherent Risk Score} = \text{Likelihood (1–5)} \times \text{Impact (1–5)} \quad [1 - 25]$$
  - **Low**: 1–4 (Green)
  - **Medium**: 5–9 (Yellow)
  - **High**: 10–14 (Orange)
  - **Critical**: 15–25 (Red)
- **Residual Risk Calculation**:
  $$\text{Residual Risk Score} = \max\left(1.0, \, \text{round}\left(\text{Inherent Score} \times (1 - \frac{\text{Control Effectiveness \%}}{100}), 1\right)\right)$$
- **Features**: Real-time interactive scoring slider in Add/Edit modal, search, multi-factor filtering, expandable row details, and CSV export.

### 3. 🛡️ Control Assessment (NIST CSF 2.0 & ISO/IEC 27001:2022)
- **30 Evaluated Cybersecurity Controls** mapped to:
  - **NIST CSF 2.0**: GOVERN (`GV.OC`), IDENTIFY (`ID.AM`, `ID.RA`), PROTECT (`PR.AA`, `PR.DS`, `PR.PS`), DETECT (`DE.CM`, `DE.AE`), RESPOND (`RS.MA`), RECOVER (`RC.RP`).
  - **ISO/IEC 27001:2022 Annex A**: A.5 (Organizational), A.7 (Physical), A.8 (Technological: Privileged Access, Threat Intel, Secure Coding, Backup, Cryptography).
- **Audit Verification Fields**: Evidence documentation, evidence status (Provided, Pending, Missing, Expired), effectiveness determination (Effective, Partially Effective, Ineffective, Not Tested), and corrective recommendations.

### 4. 🎯 Remediation Tracker
- **15 Corrective Action Items**: Directly tied to identified risk scenarios and control deficiencies.
- **SLA & Overdue Engine**: Automatic calculation of overdue status against scheduled target dates.
- **Workflow State Management**: Open, In Progress, Completed, Overdue, and Deferred with mandatory closure verification artifact notes.

### 5. 🏢 Third-Party Vendor Risk Assessment (SCRM)
- **10 Synthetic Cloud & SaaS Vendors**: AWS Mumbai, Razorpay Gateway, Snowflake Data Cloud, Salesforce CRM, Okta IDP, Cloudflare CDN/WAF, Zendesk Support, Infosys SOC Outsourcing, TCS Core Banking Support, CrowdStrike Falcon EDR.
- **Evaluation Criteria**: Inherent risk, residual risk, data sensitivity (Restricted, Confidential, Internal, Public), access privileges, identified control weaknesses, and contract review dates.

### 6. 📄 Consulting Assessment Reports & CSV Exports
- **Executive Deliverable Report**: Client-ready format containing Executive Summary, Scope & Assumptions, Methodology, Top 10 Residual Risks, Critical Deficiencies, Phased Remediation Roadmap (0–30 Days, 31–60 Days, 61–90 Days), and Limitations.
- **Export Capabilities**:
  - One-click CSV downloads for Risks, Controls, Remediation, and Vendors
  - Print-friendly layout optimized for browser "Save as PDF" (`window.print()`).

---

## 🛠️ Technology Stack

| Layer | Technology | Key Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 18 + TypeScript + Vite | Tailwind CSS, Lucide React, Recharts, Axios |
| **Backend** | Python 3.11+ / FastAPI | Pydantic v2, SQLAlchemy 2.0, Uvicorn |
| **Database** | SQLite 3 | Embedded persistent database (`risklens.db`) |
| **Testing** | Pytest | `pytest-asyncio`, FastAPI `TestClient` |

---

## 📦 Getting Started

### Prerequisites
- Node.js v18+ and npm
- Python 3.10+

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

RiskLens includes a test suite covering risk-scoring algorithms, score-band thresholds, edge cases, database transactions, and API endpoints.

```bash
cd backend
source venv/bin/activate
python3 -m pytest tests/ -v
```

### Test Coverage Highlights:
- **`tests/test_scoring.py`**:
  - Inherent risk calculation ($1 \times 1 = 1$, $5 \times 5 = 25$, boundary bounds)
  - Residual risk calculation with varying control effectiveness percentages ($0\% \to 100\%$)
  - Score band classification boundaries (Low: 1–4, Medium: 5–9, High: 10–14, Critical: 15–25)
  - Input validation (rejection of scores outside 1–5 range)
- **`tests/test_api.py`**:
  - Health check & CORS headers
  - Full CRUD lifecycle on Risk Register
  - Control assessment filtering & updates
  - Remediation item status transitions & overdue calculation
  - Vendor risk management endpoints
  - Full consulting report JSON generation & CSV export streams
  - Dynamic dashboard metric calculation (verifying no hardcoded values)

---

## 🔄 Sample Data Reset / Reseed

To reset the database back to its default clean synthetic state at any time:
- Click the **"Reset Demo Data"** button in the top banner of the web application.
- Or trigger via HTTP POST:
  ```bash
  curl -X POST http://localhost:8000/api/admin/reseed
  ```
- Or run via Python:
  ```bash
  python3 -c "from app.seed import reseed; reseed()"
  ```

---

## ⚖️ Synthetic Data & Educational Disclosure

This project is built purely as a portfolio demonstration of full-stack engineering and cybersecurity GRC consulting concepts.
- **Apex Financial Services** is an entirely fictional organization.
- None of the risk findings, control ratings, employee names, or vulnerability descriptions correspond to any real entity or system.
- Standard framework designations from the **National Institute of Standards and Technology (NIST)** and the **International Organization for Standardization (ISO)** are referenced under fair-use educational principles.
