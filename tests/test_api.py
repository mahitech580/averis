from __future__ import annotations
import os, sys, uuid
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
os.environ["DATABASE_URL"]=f"sqlite:///./test_averis_{uuid.uuid4().hex}.db"
os.environ["APP_ENV"]="test"
from fastapi.testclient import TestClient
from backend import main as api
import pytest

@pytest.fixture()
def client():
    api.Base.metadata.drop_all(bind=api.engine)
    api.Base.metadata.create_all(bind=api.engine)
    with TestClient(api.app) as client:
        yield client
    api.Base.metadata.drop_all(bind=api.engine)

def register(client,email,org="Ops Team"):
    r=client.post("/api/auth/register",json={"full_name":"Test Owner","email":email,"password":"ThisIsATestPassword123!","organization_name":org})
    assert r.status_code==201,r.text
    return r.json()

def test_health(client):
    r=client.get("/api/health")
    assert r.status_code==200
    assert r.json()["database"]=="SQLite"
    assert r.json()["live_sync_seconds"]==5

def test_server_session_password_and_logout(client):
    body=register(client,"owner@example.test")
    assert body["user"]["email"]=="owner@example.test"
    assert "password_hash" not in body["user"]
    assert "averis_session" in client.cookies
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code==401
    assert client.post("/api/auth/login",json={"email":"owner@example.test","password":"wrong-password"}).status_code==401
    accepted=client.post("/api/auth/login",json={"email":"owner@example.test","password":"ThisIsATestPassword123!"})
    assert accepted.status_code==200
    assert client.get("/api/auth/me").json()["user"]["email"]=="owner@example.test"

def test_workspace_json_whitelist_and_revision_conflict(client):
    register(client,"owner@example.test")
    assert client.get("/api/workspace").json()["revision"]==0
    saved=client.put("/api/workspace",json={"revision":0,"data":{"people":[{"id":"P-1","name":"Synthetic Person"}],"account":{"email":"not-persisted"},"session":{"authenticated":True},"profile":{"name":"owner"},"audit":[{"action":"test"}]}})
    assert saved.status_code==200
    assert saved.json()["revision"]==1
    assert "account" not in saved.json()["data"] and "session" not in saved.json()["data"] and "profile" not in saved.json()["data"]
    conflict=client.put("/api/workspace",json={"revision":0,"data":{"people":[{"id":"P-2"}]}})
    assert conflict.status_code==409
    assert conflict.json()["revision"]==1
    assert client.get("/api/workspace").json()["data"]["people"][0]["id"]=="P-1"

def test_invite_shares_the_org_snapshot(client):
    register(client,"owner-a@example.test","Team A")
    client.put("/api/workspace",json={"revision":0,"data":{"people":[{"id":"A-1"}]}})
    code=client.get("/api/organization").json()["invite_code"]
    client.post("/api/auth/logout")
    register(client,"owner-b@example.test","Team B")
    assert client.get("/api/workspace").json()["data"] is None
    joined=client.post("/api/organization/join",json={"invite_code":code})
    assert joined.status_code==200
    assert joined.json()["name"]=="Team A" and joined.json()["role"]=="member"
    assert client.get("/api/workspace").json()["data"]["people"][0]["id"]=="A-1"

def test_origin_guard(client):
    r=client.post("/api/auth/register",headers={"Origin":"https://attacker.example"},json={"full_name":"Bad Origin","email":"bad-origin@example.test","password":"ThisIsATestPassword123!","organization_name":"Origin Team"})
    assert r.status_code==403
