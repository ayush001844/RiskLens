"""
Unit and integration tests for RiskLens v2.0 Authentication & RBAC.
"""
import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

TEST_DB_PATH = "/tmp/test_risklens_auth.db"
if os.path.exists(TEST_DB_PATH):
    os.remove(TEST_DB_PATH)

TEST_DB_URL = f"sqlite:///{TEST_DB_PATH}"
os.environ["DATABASE_URL"] = TEST_DB_URL

import app.database as db_mod
from app.database import get_db, Base
from app.main import app
from app.seed import _seed_users
from app.auth import create_access_token

test_engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)
db_mod.engine = test_engine
db_mod.SessionLocal = TestSession


@pytest.fixture(scope="module")
def client():
    Base.metadata.drop_all(bind=test_engine)
    Base.metadata.create_all(bind=test_engine)

    db = TestSession()
    try:
        _seed_users(db)
        db.commit()
    finally:
        db.close()

    def override_get_db():
        session = TestSession()
        try:
            yield session
        finally:
            session.close()

    app.dependency_overrides[get_db] = override_get_db
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=test_engine)
    if os.path.exists(TEST_DB_PATH):
        os.remove(TEST_DB_PATH)


def test_login_admin_success(client):
    res = client.post("/api/auth/login", json={"username": "admin", "password": "RiskLens@Admin1"})
    assert res.status_code == 200
    data = res.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["role"] == "Administrator"


def test_login_consultant_success(client):
    res = client.post("/api/auth/login", json={"username": "consultant", "password": "RiskLens@Consult1"})
    assert res.status_code == 200
    assert res.json()["user"]["role"] == "Consultant"


def test_login_invalid_password(client):
    res = client.post("/api/auth/login", json={"username": "admin", "password": "WrongPassword"})
    assert res.status_code == 401
    assert "Invalid" in res.json()["detail"]


def test_login_nonexistent_user(client):
    res = client.post("/api/auth/login", json={"username": "ghost_user", "password": "password"})
    assert res.status_code == 401


def test_get_current_user_me(client):
    token = create_access_token({"sub": "consultant"})
    res = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert res.json()["username"] == "consultant"
    assert res.json()["role"] == "Consultant"


def test_get_me_unauthorized(client):
    res = client.get("/api/auth/me")
    assert res.status_code == 401


def test_admin_list_users(client):
    token = create_access_token({"sub": "admin"})
    res = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    assert len(res.json()) >= 4


def test_non_admin_cannot_list_users(client):
    token = create_access_token({"sub": "auditor"})
    res = client.get("/api/auth/users", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 403


def test_token_refresh(client):
    login_res = client.post("/api/auth/login", json={"username": "admin", "password": "RiskLens@Admin1"})
    refresh_token = login_res.json().get("refresh_token")
    if refresh_token:
        res = client.post("/api/auth/refresh", json={"refresh_token": refresh_token})
        assert res.status_code == 200
        assert "access_token" in res.json()
