"""Lightweight ML helpers for synthetic, non-clinical Averis operations.

No external inference services are called. Inputs are handled in memory. The
triage model is trained on small synthetic examples and is not a clinical model.
"""
from __future__ import annotations

from functools import lru_cache
from typing import Any

import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

_TRAINING_ROWS = [
    ("stock is below reorder threshold and replenishment is delayed", "inventory", "HIGH"),
    ("critical stock shortage blocked the supply workflow", "inventory", "CRITICAL"),
    ("supplier delivery is late and inventory will run out", "inventory", "HIGH"),
    ("count mismatch found on warehouse stock receipt", "inventory", "NORMAL"),
    ("pharmacy cabinet inventory needs a cycle count", "inventory", "NORMAL"),
    ("inventory item is out of stock and order is urgent", "inventory", "CRITICAL"),
    ("appointment schedule has two overlapping reservations", "scheduling", "HIGH"),
    ("room booking conflicts with the next planned slot", "scheduling", "HIGH"),
    ("reschedule a non urgent appointment to the next available time", "scheduling", "NORMAL"),
    ("calendar slot was changed but the team did not get notified", "scheduling", "NORMAL"),
    ("tomorrow morning schedule is blocked by an unavailable resource", "scheduling", "CRITICAL"),
    ("confirm the coordinator meeting for next week", "scheduling", "NORMAL"),
    ("the team workload is above capacity and queues are growing", "capacity", "HIGH"),
    ("no staff coverage for the urgent shift today", "capacity", "CRITICAL"),
    ("resource utilization is above the agreed limit", "capacity", "HIGH"),
    ("capacity planning review is needed for the next reporting period", "capacity", "NORMAL"),
    ("reassign work because one coordinator has a high load", "capacity", "HIGH"),
    ("available workforce can cover a low priority task", "capacity", "NORMAL"),
    ("workflow is blocked waiting for an approval", "workflow", "HIGH"),
    ("critical operational handoff failed and escalation is required", "workflow", "CRITICAL"),
    ("task has passed its due date without an owner", "workflow", "HIGH"),
    ("complete the standard checklist when the queue is clear", "workflow", "NORMAL"),
    ("quality gate failed and the delivery cannot continue", "workflow", "CRITICAL"),
    ("the process is ready for a routine review", "workflow", "NORMAL"),
    ("unread message requests a callback from the coordinator", "communications", "NORMAL"),
    ("important escalation email has not received a response", "communications", "HIGH"),
    ("critical message reports that the handoff contact is unavailable", "communications", "CRITICAL"),
    ("send the weekly status note to the team", "communications", "NORMAL"),
    ("follow up on a delayed response from the operations group", "communications", "HIGH"),
    ("the message thread has been acknowledged", "communications", "NORMAL"),
    ("quality check failed on a batch and needs immediate containment", "quality", "CRITICAL"),
    ("audit found a missing approval record", "quality", "HIGH"),
    ("verification results are inconsistent and need review", "quality", "HIGH"),
    ("routine quality inspection is complete and passed", "quality", "NORMAL"),
    ("repeat the checklist because one validation field is blank", "quality", "NORMAL"),
    ("a severe quality exception prevents release", "quality", "CRITICAL"),
]

@lru_cache(maxsize=1)
def _models():
    frame = pd.DataFrame(_TRAINING_ROWS, columns=["text", "category", "priority"])
    vectorizer = TfidfVectorizer(ngram_range=(1, 2), strip_accents="unicode", sublinear_tf=True)
    features = vectorizer.fit_transform(frame["text"])
    category_model = LogisticRegression(max_iter=500, class_weight="balanced", random_state=42)
    priority_model = LogisticRegression(max_iter=500, class_weight="balanced", random_state=43)
    category_model.fit(features, frame["category"])
    priority_model.fit(features, frame["priority"])
    return vectorizer, category_model, priority_model

def classify_operational_text(text: str) -> dict[str, Any]:
    """Classify an ephemeral operational note and return a transparent routing aid."""
    clean = " ".join(str(text).split())[:2000]
    vectorizer, category_model, priority_model = _models()
    features = vectorizer.transform([clean])
    category_probabilities = category_model.predict_proba(features)[0]
    priority_probabilities = priority_model.predict_proba(features)[0]
    category_idx = int(np.argmax(category_probabilities))
    priority_idx = int(np.argmax(priority_probabilities))
    category = str(category_model.classes_[category_idx])
    priority = str(priority_model.classes_[priority_idx])
    keyword_groups = {
        "inventory": ("stock", "inventory", "replenishment", "supplier", "reorder", "out of stock"),
        "scheduling": ("schedule", "appointment", "calendar", "slot", "reschedule", "booking"),
        "capacity": ("capacity", "workload", "staff", "coverage", "utilization", "coordinator"),
        "workflow": ("blocked", "handoff", "approval", "overdue", "workflow", "queue"),
        "communications": ("message", "email", "response", "callback", "contact", "follow up"),
        "quality": ("quality", "audit", "verification", "inspection", "checklist", "validation"),
    }
    lower = clean.lower()
    signals = [word for word in keyword_groups[category] if word in lower][:5]
    return {
        "category": category,
        "priority": priority,
        "confidence": round(float(category_probabilities[category_idx]) * 100, 1),
        "priority_confidence": round(float(priority_probabilities[priority_idx]) * 100, 1),
        "recommended_queue": category,
        "signals": signals,
        "model": "tfidf-logistic-regression-synthetic-v1",
        "persisted": False,
        "clinical_decisioning": False,
        "notice": "Review this synthetic operational routing suggestion. It is not clinical advice or a substitute for human review.",
    }

def inventory_anomalies(records: list[dict[str, Any]]) -> dict[str, Any]:
    """Screen a tenant's inventory using reorder rules and peer-group outlier detection."""
    frame = pd.DataFrame(records)
    if frame.empty:
        return {
            "scanned": 0, "reorder_risk_count": 0, "anomaly_count": 0,
            "anomalies": [], "method": "isolation-forest + reorder-threshold screening",
            "clinical_decisioning": False, "notice": "Synthetic operational analysis only.",
        }
    for column in ("quantity", "reorder_level", "unit_cost", "selling_price"):
        if column not in frame:
            frame[column] = 0
        frame[column] = pd.to_numeric(frame[column], errors="coerce").replace([np.inf, -np.inf], np.nan).fillna(0)
    for column in ("quantity", "reorder_level", "unit_cost", "selling_price"):
        frame[column] = frame[column].clip(lower=0)
    frame["reorder_risk"] = frame["quantity"] <= frame["reorder_level"]
    matrix = np.log1p(frame[["quantity", "reorder_level", "unit_cost", "selling_price"]].to_numpy(dtype=float))
    is_outlier = np.zeros(len(frame), dtype=bool)
    scores = np.zeros(len(frame), dtype=float)
    method = "reorder-threshold + interquartile range (small sample)"
    if len(frame) >= 8 and np.isfinite(matrix).all():
        model = IsolationForest(n_estimators=120, contamination="auto", random_state=42)
        model.fit(matrix)
        is_outlier = model.predict(matrix) == -1
        raw_scores = -model.decision_function(matrix)
        scores = np.clip((raw_scores - raw_scores.min()) / (np.ptp(raw_scores) or 1.0) * 100, 0, 100)
        method = "IsolationForest + reorder-threshold screening"
    else:
        q1 = float(frame["quantity"].quantile(.25))
        q3 = float(frame["quantity"].quantile(.75))
        iqr = q3 - q1
        low, high = q1 - 1.5 * iqr, q3 + 1.5 * iqr
        is_outlier = (frame["quantity"].to_numpy() < low) | (frame["quantity"].to_numpy() > high)
        scores = np.where(is_outlier, 75.0, 0.0)
    result = []
    for idx, row in frame.reset_index(drop=True).iterrows():
        outlier = bool(is_outlier[idx])
        reorder = bool(row["reorder_risk"])
        if not outlier and not reorder:
            continue
        base = records[idx] if idx < len(records) else {}
        qty = float(row["quantity"])
        result.append({
            "id": str(base.get("id") or base.get("sku") or f"product-{idx + 1}"),
            "name": str(base.get("name") or base.get("sku") or "Unnamed inventory item")[:120],
            "sku": str(base.get("sku") or "")[:80],
            "quantity": int(qty) if qty.is_integer() else round(qty, 2),
            "reorder_level": float(row["reorder_level"]),
            "reorder_risk": reorder,
            "outlier": outlier,
            "score": round(float(scores[idx]), 1),
            "signals": [label for label, active in (("below_reorder_level", reorder), ("peer_group_outlier", outlier)) if active],
        })
    result.sort(key=lambda item: (not item["reorder_risk"], -item["score"], item["name"].lower()))
    return {
        "scanned": int(len(frame)),
        "reorder_risk_count": int(frame["reorder_risk"].sum()),
        "anomaly_count": int(is_outlier.sum()),
        "anomalies": result[:50],
        "method": method,
        "clinical_decisioning": False,
        "notice": "Synthetic inventory screening only. Confirm findings before operational action.",
    }
