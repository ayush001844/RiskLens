# RiskLens v2.0 — Deployment & Operations Guide

> **Platforms Supported:** Docker, Render, Railway, Fly.io, Vercel, AWS ECS  
> **Database:** PostgreSQL 14+ (Recommended for Production), SQLite 3 (Dev/Test)  

---

## 1. Environment Configuration

Create a `.env` file or configure system environment variables:

```bash
# Application Environment
ENVIRONMENT=production
DEBUG=false
APP_NAME="RiskLens GRC Platform"

# Database Configuration (PostgreSQL in production)
DATABASE_URL=postgresql://risklens_user:SecurePass123!@db-host:5432/risklens

# Security & Tokens
JWT_SECRET_KEY=09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS Allowed Origins (Comma-separated)
ALLOWED_ORIGINS=https://risklens.yourcompany.com,http://localhost:5173
```

---

## 2. Docker Deployment

### 2.1 Backend `Dockerfile`
```dockerfile
FROM python:3.13-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### 2.2 Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: risklens
      POSTGRES_USER: risklens_user
      POSTGRES_PASSWORD: SecurePass123!
    volumes:
      - pgdata:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://risklens_user:SecurePass123!@db:5432/risklens
      JWT_SECRET_KEY: change-me-in-production
    ports:
      - "8000:8000"
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  pgdata:
```

---

## 3. 1-Click Production Orchestration (Docker Compose)

To launch the full production stack (PostgreSQL 16 + FastAPI + Nginx React Frontend):

```bash
# Build and run containers in detached mode
docker compose up --build -d

# Check service health and logs
docker compose ps
docker compose logs -f backend
```

Once started:
- **Frontend & App:** `http://localhost`
- **Backend API Docs:** `http://localhost:8000/api/docs`
- **PostgreSQL Database:** `localhost:5432`

To shut down:
```bash
docker compose down -v
```

---

## 4. Database Migrations (Alembic)

RiskLens uses Alembic to manage database schema evolutions:

```bash
cd backend
source venv/bin/activate

# Apply all migrations to the latest revision
alembic upgrade head

# Rollback one revision
alembic downgrade -1

# Generate a new migration revision
alembic revision --autogenerate -m "describe_schema_change"
```

---

## 5. Seed Synthetic Baseline Data

To load the full synthetic dataset for *Apex Financial Services*:

```bash
cd backend
source venv/bin/activate
python -c "from app.seed import reseed; reseed()"
```

