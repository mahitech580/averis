from backend.services.ai_engine import classify_operational_text, inventory_anomalies


def test_tfidf_model_returns_bounded_nonclinical_routing_suggestion():
    result = classify_operational_text("Critical stock shortage blocks replenishment and supply workflow.")
    assert result["category"] in {"inventory", "scheduling", "capacity", "workflow", "communications", "quality"}
    assert result["priority"] in {"CRITICAL", "HIGH", "NORMAL"}
    assert 0 <= result["confidence"] <= 100
    assert 0 <= result["priority_confidence"] <= 100
    assert result["persisted"] is False
    assert result["clinical_decisioning"] is False


def test_inventory_anomaly_scan_handles_empty_and_low_stock_records():
    empty = inventory_anomalies([])
    assert empty["scanned"] == 0
    rows = [
        {"id": "a", "name": "Item A", "sku": "A", "quantity": 0, "reorder_level": 2, "unit_cost": 1},
        {"id": "b", "name": "Item B", "sku": "B", "quantity": 25, "reorder_level": 5, "unit_cost": 3},
    ]
    report = inventory_anomalies(rows)
    assert report["scanned"] == 2
    assert report["reorder_risk_count"] == 1
    assert any(item["sku"] == "A" and item["reorder_risk"] for item in report["anomalies"])
    assert report["clinical_decisioning"] is False
