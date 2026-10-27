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


def test_concurrent_workspace_writes_have_one_revision_winner(client):
    from concurrent.futures import ThreadPoolExecutor
    from threading import Barrier

    register(client,"concurrent-owner@example.test","Concurrent Team")
    token=client.cookies.get("averis_session")
    assert token
    barrier=Barrier(2)

    def write_snapshot(label):
        with TestClient(api.app) as parallel_client:
            parallel_client.cookies.set("averis_session",token)
            barrier.wait(timeout=5)
            return parallel_client.put(
                "/api/workspace",
                json={"revision":0,"data":{"people":[{"id":label,"name":"Synthetic"}]}},
            )

    with ThreadPoolExecutor(max_workers=2) as pool:
        responses=list(pool.map(write_snapshot,["P-LEFT","P-RIGHT"]))

    assert sorted(response.status_code for response in responses)==[200,409]
    final=client.get("/api/workspace").json()
    assert final["revision"]==1
    assert final["data"]["people"][0]["id"] in {"P-LEFT","P-RIGHT"}

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



def test_all_erp_collections_support_create_read_update_delete(client):
    register(client,"all-modules@example.test","All Modules Team")
    catalog=client.get("/api/erp/modules")
    assert catalog.status_code==200
    modules={item["key"] for item in catalog.json()["modules"]}
    assert modules==set(api.ERP_FIELDS)==set(api.ERP_REQUIRED)==set(api.ERP_PREFIX)
    assert len(modules)==15

    for collection in sorted(modules):
        payload={}
        for key,kind in api.ERP_FIELDS[collection].items():
            if kind=="number":
                payload[key]=1
            elif kind=="date":
                payload[key]="2026-10-27"
            elif kind=="email":
                payload[key]=f"{collection}-first@example.test"
            elif key=="sku":
                payload[key]=f"{collection.upper()}-FIRST"
            else:
                payload[key]=f"{key}-{collection}-first"

        for required in api.ERP_REQUIRED[collection]:
            assert payload.get(required) not in (None,""), f"{collection} missing required fixture field {required}"

        created=client.post(f"/api/erp/{collection}",json=payload)
        assert created.status_code==201, f"{collection} create failed: {created.status_code} {created.text}"
        record_key=created.json()["item"]["id"]
        assert record_key

        listed=client.get(f"/api/erp/{collection}?limit=10")
        assert listed.status_code==200, f"{collection} list failed: {listed.text}"
        assert listed.json()["count"]==1
        assert listed.json()["items"][0]["id"]==record_key

        change_key=next((key for key in api.ERP_REQUIRED[collection] if api.ERP_FIELDS[collection][key] in {"text","email"}),None)
        if change_key is None:
            change_key=next((key for key,kind in api.ERP_FIELDS[collection].items() if kind in {"text","email"}),None)
        assert change_key, f"{collection} fixture needs a mutable textual field"
        if api.ERP_FIELDS[collection][change_key]=="email":
            payload[change_key]=f"{collection}-updated@example.test"
        else:
            payload[change_key]=f"{change_key}-{collection}-updated"

        changed=client.put(f"/api/erp/{collection}/{record_key}",json=payload)
        assert changed.status_code==200, f"{collection} update failed: {changed.status_code} {changed.text}"
        assert changed.json()["item"][change_key]==payload[change_key]

        removed=client.delete(f"/api/erp/{collection}/{record_key}")
        assert removed.status_code==200, f"{collection} delete failed: {removed.status_code} {removed.text}"
        assert client.get(f"/api/erp/{collection}").json()["count"]==0
        assert client.delete(f"/api/erp/{collection}/{record_key}").status_code==404

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


def test_erp_global_search_and_reorder_priority(client):
    register(client,"search-owner@example.test","Search Team")
    client.post("/api/erp/products",json={"name":"Low Stock Cable","sku":"CABLE-LOW","quantity":1,"reorder_level":8,"selling_price":12,"status":"Active"})
    client.post("/api/erp/products",json={"name":"Healthy Monitor","sku":"MON-OK","quantity":20,"reorder_level":4,"selling_price":80,"status":"Active"})
    result=client.get("/api/erp/search?q=cable")
    assert result.status_code==200
    assert result.json()["count"]==1
    assert result.json()["items"][0]["collection"]=="products"
    summary=client.get("/api/erp/summary").json()
    assert summary["low_stock"]==1
    assert summary["reorder_alerts"][0]["sku"]=="CABLE-LOW"
    assert summary["reorder_alerts"][0]["reorder_alert"] is True


def test_sku_uniqueness_and_erp_field_validation(client):
    register(client,"sku-owner@example.test","Stock Team")
    first=client.post("/api/erp/products",json={"name":"Dock","sku":"same-sku","quantity":2,"reorder_level":1,"status":"Active"})
    assert first.status_code==201, first.text
    duplicate=client.post("/api/erp/products",json={"name":"Dock Duplicate","sku":"SAME-SKU","quantity":5,"reorder_level":2,"status":"Active"})
    assert duplicate.status_code==409
    bad_invoice=client.post("/api/erp/invoices",json={"invoice_number":"INV-1","party":"Synthetic Co","amount":None})
    assert bad_invoice.status_code==422
    bad_date=client.post("/api/erp/purchase_orders",json={"po_number":"PO-1","supplier":"Synthetic supplier","order_date":"next Friday"})
    assert bad_date.status_code==422
    bad_email=client.post("/api/erp/employees",json={"name":"Demo User","email":"not-an-email"})
    assert bad_email.status_code==422


def test_allowed_origin_can_preflight_erp_delete(client):
    response = client.options(
        "/api/erp/products/PRD-1",
        headers={
            "Origin": "https://mahitech580.github.io",
            "Access-Control-Request-Method": "DELETE",
            "Access-Control-Request-Headers": "x-averis-request",
        },
    )
    assert response.status_code == 200
    assert "DELETE" in response.headers.get("access-control-allow-methods", "")


def test_production_mode_rejects_ephemeral_sqlite_database():
    import os
    import subprocess
    import sys

    env = os.environ.copy()
    env["APP_ENV"] = "production"
    env["DATABASE_URL"] = "sqlite:///./ephemeral.db"
    result = subprocess.run(
        [sys.executable, "-c", "import backend.main"],
        env=env,
        capture_output=True,
        text=True,
        timeout=15,
    )
    assert result.returncode != 0
    assert "requires a persistent DATABASE_URL" in result.stderr


def test_isolated_cloud_demo_seeds_all_erp_modules_and_is_tenant_scoped(client):
    demo_a = client.post("/api/auth/demo", json={})
    assert demo_a.status_code == 200, demo_a.text
    body_a = demo_a.json()
    assert body_a["demo_workspace"] is True
    assert body_a["seeded_erp_records"] >= 300
    assert client.get("/api/auth/me").json()["user"]["role"] == "owner"
    counts_a = client.get("/api/erp/summary").json()["counts"]
    assert len(counts_a) == 15
    assert all(count > 0 for count in counts_a.values())
    products_a = client.get("/api/erp/products").json()["items"]
    assert len(products_a) == 25
    product_a_id = products_a[0]["id"]

    client.post("/api/auth/logout")
    demo_b = client.post("/api/auth/demo", json={})
    assert demo_b.status_code == 200, demo_b.text
    assert demo_b.json()["organization"]["id"] != body_a["organization"]["id"]
    assert client.get("/api/erp/products").json()["count"] == 25
    assert client.put(f"/api/erp/products/{product_a_id}", json={"name": "Cross-tenant edit", "sku": "AVR-DEMO-0001"}).status_code == 404


def test_demo_endpoint_is_available_without_account_and_marks_session_cookie_secure_in_production(monkeypatch, client):
    monkeypatch.setattr(api, "APP_ENV", "production")
    response = client.post("/api/auth/demo", json={})
    assert response.status_code == 200
    cookie = response.headers.get("set-cookie", "").lower()
    assert "httponly" in cookie
    assert "secure" in cookie
    assert "samesite=none" in cookie


def test_local_static_preview_origin_can_preflight_api(client):
    response = client.options(
        "/api/health",
        headers={
            "Origin": "http://127.0.0.1:4173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type, authorization, apikey, x-averis-request",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://127.0.0.1:4173"
    assert "POST" in response.headers.get("access-control-allow-methods", "")
    allowed_headers = {value.strip().lower() for value in response.headers.get("access-control-allow-headers", "").split(",")}
    assert {"authorization", "content-type", "apikey", "x-averis-request"} <= allowed_headers

def test_authenticated_ml_triage_does_not_echo_or_persist_input(client):
    register(client, "ml-owner@example.test", "ML Team")
    note = "Critical inventory shortage is blocking the morning schedule."
    response = client.post("/api/ai/triage", json={"text": note})
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["category"] in {"inventory", "scheduling", "capacity", "workflow", "communications", "quality"}
    assert body["priority"] in {"CRITICAL", "HIGH", "NORMAL"}
    assert 0 <= body["confidence"] <= 100
    assert body["clinical_decisioning"] is False
    assert body["persisted"] is False
    assert note not in response.text
    activity = client.get("/api/activity").json()["items"]
    assert any(row["action"] == "ai.operational_triage" for row in activity)
    assert all(note not in str(row.get("details", {})) for row in activity)


def test_inventory_anomaly_endpoint_is_authenticated_and_tenant_scoped(client):
    assert client.get("/api/ai/inventory/anomalies").status_code == 401
    register(client, "ml-inventory@example.test", "Inventory Team")
    for i in range(10):
        response = client.post("/api/erp/products", json={
            "name": f"Synthetic item {i}", "sku": f"ML-SKU-{i:03}",
            "quantity": 1 if i == 9 else 20 + i, "reorder_level": 5,
            "unit_cost": 12 + i, "selling_price": 20 + i, "status": "Active"
        })
        assert response.status_code == 201, response.text
    scanned = client.get("/api/ai/inventory/anomalies")
    assert scanned.status_code == 200, scanned.text
    body = scanned.json()
    assert body["scanned"] == 10
    assert body["reorder_risk_count"] >= 1
    assert body["clinical_decisioning"] is False
    client.post("/api/auth/logout")
    register(client, "other-inventory@example.test", "Other Team")
    assert client.get("/api/ai/inventory/anomalies").json()["scanned"] == 0
