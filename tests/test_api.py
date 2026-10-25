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


def test_erp_catalog_create_search_update_delete_and_summary(client):
    register(client,"erp-owner@example.test","ERP Company")
    catalog=client.get("/api/erp/modules")
    assert catalog.status_code==200
    assert "products" in {x["key"] for x in catalog.json()["modules"]}
    created=client.post("/api/erp/products",json={"name":"Keyboard","sku":"kb-001","quantity":7,"reorder_level":2,"selling_price":25.50,"status":"Active"})
    assert created.status_code==201,created.text
    item=created.json()["item"]
    assert item["sku"]=="KB-001"
    row_id=item["id"]
    found=client.get("/api/erp/products?q=keyboard")
    assert found.json()["count"]==1 and found.json()["items"][0]["id"]==row_id
    updated=client.put(f"/api/erp/products/{row_id}",json={"name":"Keyboard Pro","sku":"KB-001","quantity":1,"reorder_level":2,"selling_price":30,"status":"Active"})
    assert updated.status_code==200,updated.text
    summary=client.get("/api/erp/summary").json()
    assert summary["counts"]["products"]==1 and summary["low_stock"]==1
    assert client.delete(f"/api/erp/products/{row_id}").status_code==200
    assert client.get("/api/erp/products").json()["count"]==0

def test_erp_module_tenant_isolation_and_field_validation(client):
    register(client,"erp-a@example.test","Company A")
    created=client.post("/api/erp/customers",json={"name":"Acme Co","email":"buyer@example.test"})
    assert created.status_code==201
    row_id=created.json()["item"]["id"]
    client.post("/api/auth/logout")
    register(client,"erp-b@example.test","Company B")
    assert client.get("/api/erp/customers").json()["count"]==0
    assert client.put(f"/api/erp/customers/{row_id}",json={"name":"Hijack"}).status_code==404
    invalid=client.post("/api/erp/products",json={"name":"Invalid","sku":"BAD","quantity":-1,"unknown_field":"blocked"})
    assert invalid.status_code==422
