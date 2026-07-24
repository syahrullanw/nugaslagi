"""Helpers for stable, user-scoped in-app notifications."""

from __future__ import annotations

import hashlib
from typing import Any, Dict, Iterable, List


def notification_id(kind: str, source_id: str, occurred_at: str) -> str:
    value = "|".join(
        [
            str(kind or "activity").strip().lower(),
            str(source_id or "").strip(),
            str(occurred_at or "").strip(),
        ]
    )
    return hashlib.sha256(value.encode("utf-8")).hexdigest()[:32]


def notification_event(
    *,
    kind: str,
    source_id: str,
    occurred_at: str,
    title: str,
    message: str,
    actor_name: str = "",
    target: Dict[str, Any] | None = None,
) -> Dict[str, Any]:
    return {
        "id": notification_id(kind, source_id, occurred_at),
        "type": str(kind or "activity"),
        "source_id": str(source_id or ""),
        "title": str(title or "Aktivitas baru"),
        "message": str(message or ""),
        "actor_name": str(actor_name or ""),
        "occurred_at": str(occurred_at or ""),
        "target": dict(target or {}),
    }


def finalize_notifications(
    events: Iterable[Dict[str, Any]],
    read_receipts: Iterable[Dict[str, Any]],
    limit: int = 30,
) -> Dict[str, Any]:
    receipts = {
        str(item.get("notification_id") or ""): str(item.get("read_at") or "")
        for item in read_receipts
        if item.get("notification_id")
    }
    unique: Dict[str, Dict[str, Any]] = {}
    for event in events:
        event_id = str(event.get("id") or "")
        if event_id:
            unique[event_id] = dict(event)
    ordered: List[Dict[str, Any]] = sorted(
        unique.values(),
        key=lambda item: str(item.get("occurred_at") or ""),
        reverse=True,
    )
    normalized = []
    for event in ordered:
        read_at = receipts.get(event["id"], "")
        normalized.append(
            {
                **event,
                "read": bool(read_at),
                "read_at": read_at,
            }
        )
    safe_limit = max(10, min(int(limit or 30), 100))
    visible_items = [
        *[item for item in normalized if not item["read"]],
        *[item for item in normalized if item["read"]],
    ][:safe_limit]
    return {
        "unread_count": sum(1 for item in normalized if not item["read"]),
        "total": len(normalized),
        "items": visible_items,
    }
