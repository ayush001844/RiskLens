# RiskLens v2.0 — Technical Interview & Portfolio Guide

> **Purpose:** Executive summary and technical talking points for architecture interviews, senior engineering reviews, and portfolio presentations.

---

## 1. High-Level Elevator Pitch

> *"RiskLens is an enterprise Governance, Risk, and Compliance (GRC) platform that simulates an engagement for a commercial financial institution (Apex Financial Services). It replaces error-prone spreadsheets with automated risk quantification, NIST CSF 2.0 implementation tier assessment, regulatory crosswalks across 5 major standards, and tamper-evident audit logging."*

---

## 2. Key Architectural Decisions to Highlight

### 1. Mathematical Risk Modeling ($1.0$ Residual Floor)
- **Problem in Traditional GRC Tools:** Often calculate residual risk as `Inherent × (1 - Effectiveness%)`. At $100\%$ control effectiveness, residual risk drops to $0.0$.
- **Why this is Methodologically Flawed:** In real-world security engineering, zero residual risk does not exist—there is always residual threat, human error, zero-day vulnerabilities, or control drift.
- **RiskLens Solution:** Implemented a non-zero mathematical floor of $1.0$ (Low). Even with $100\%$ control effectiveness, residual risk cannot drop below $1.0$.

### 2. XSS-Safe Authentication Design
- **Problem with LocalStorage JWTs:** If an XSS vulnerability exists anywhere in a React bundle, malicious scripts can read `localStorage.getItem("token")` and exfiltrate credentials.
- **RiskLens Solution:** Access tokens are stored exclusively in an in-memory module closure. No token ever touches browser storage.

### 3. Separation of Design vs. Operating Effectiveness
- Controls can be well-designed on paper (*Design Effective*) but fail in practice due to lack of enforcement or sample exceptions (*Operating Ineffective*). RiskLens tracks these two dimensions separately.

---

## 3. Anticipated Technical Questions & Answers

**Q: How does the system handle concurrent updates and audit integrity?**  
*A: All writes go through SQLAlchemy ORM with ACID transaction guarantees. Every mutating endpoint records a synchronous audit log entry containing before and after JSON snapshots, user identity, and IP address.*

**Q: Why choose FastAPI over Django or Flask?**  
*A: FastAPI provides automatic Pydantic v2 data validation, OpenAPI 3.1 documentation out-of-the-box, high-performance ASGI async execution, and standard dependency injection for clean RBAC enforcement.*
