from backend.services.prioritization import prioritize_inventory

def test_prioritize_inventory_puts_shortage_first():
    rows = [
        {"sku": "OK", "quantity": 20, "reorder_level": 5},
        {"sku": "LOW", "quantity": 2, "reorder_level": 8},
        {"sku": "OUT", "quantity": 0, "reorder_level": 10},
        {"sku": "JUST", "quantity": 5, "reorder_level": 5},
    ]
    ranked = prioritize_inventory(rows, limit=3)
    assert [row["sku"] for row in ranked] == ["OUT", "LOW", "JUST"]
    assert ranked[0]["shortage"] == 10
    assert ranked[0]["reorder_alert"] is True
    assert ranked[-1]["reorder_alert"] is True
    all_rows = prioritize_inventory(rows, limit=4)
    assert all_rows[-1]["sku"] == "OK"
    assert all_rows[-1]["reorder_alert"] is False

def test_prioritize_inventory_does_not_mutate_input():
    source = [{"sku": "A", "quantity": 1, "reorder_level": 2}]
    result = prioritize_inventory(source, limit=10000)
    assert len(result) == 1
    assert "shortage" not in source[0]
    assert result[0]["shortage"] == 1
