"""Deterministic triage algorithm for synthetic ERP inventory records."""
from __future__ import annotations
from heapq import nsmallest
from typing import Any, Iterable

def _priority_key(item: dict[str, Any]) -> tuple[int, float, float, str]:
    quantity=max(0.0,float(item.get("quantity") or 0))
    threshold=max(0.0,float(item.get("reorder_level") or 0))
    shortage=max(0.0,threshold-quantity)
    return (0 if shortage>0 else 1,-shortage,quantity,str(item.get("name") or item.get("sku") or ""))

def prioritize_inventory(items: Iterable[dict[str, Any]], limit: int=5) -> list[dict[str, Any]]:
    """Use bounded-heap selection to put the most urgent reorder records first."""
    bounded=max(1,min(int(limit),100))
    candidates=[]
    for source in items:
        item=dict(source)
        quantity=max(0.0,float(item.get("quantity") or 0))
        threshold=max(0.0,float(item.get("reorder_level") or 0))
        shortage=max(0.0,threshold-quantity)
        item["shortage"]=int(shortage) if shortage.is_integer() else shortage
        item["reorder_alert"]=shortage>0
        candidates.append(item)
    return nsmallest(bounded,candidates,key=_priority_key)
