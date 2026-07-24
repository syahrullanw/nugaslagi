"""Classification and aggregation helpers for user activity audit logs."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List
from zoneinfo import ZoneInfo


CATEGORY_LABELS = {
    "authentication": "Autentikasi",
    "users": "Pengguna",
    "academic": "Akademik",
    "learning": "Pembelajaran",
    "assessment": "Penilaian",
    "communication": "Komunikasi",
    "files": "File & penyimpanan",
    "reports": "Laporan",
    "system": "Sistem",
    "other": "Lainnya",
}


def _path_segments(path: str) -> List[str]:
    return [segment for segment in str(path or "").strip("/").split("/") if segment]


def activity_category(path: str) -> str:
    segments = _path_segments(path)
    resource = segments[1] if len(segments) > 1 and segments[0] == "api" else (segments[0] if segments else "")
    if resource == "auth":
        return "authentication"
    if resource in {"students", "lecturers", "enrollment-requests"}:
        return "users"
    if resource in {"programs", "courses", "classes", "calendar"}:
        return "academic"
    if resource in {"materials", "comments"}:
        return "learning"
    if resource in {"assignments", "submissions", "grade-predicates", "progress"}:
        return "assessment"
    if resource in {"chat", "reminders", "whatsapp", "email"}:
        return "communication"
    if resource in {"files", "drive", "storage"}:
        return "files"
    if resource == "reports":
        return "reports"
    if resource in {"settings", "sso", "backups", "clean-data"}:
        return "system"
    return "other"


def activity_action(method: str, path: str) -> str:
    clean_method = str(method or "GET").upper()
    clean_path = str(path or "").lower()
    if "/auth/login" in clean_path or "/auth/sso/exchange" in clean_path:
        return "login"
    if "/auth/logout" in clean_path:
        return "logout"
    if clean_path.endswith("/submit"):
        return "submit"
    if clean_path.endswith("/grade") or "bulk-grade" in clean_path:
        return "grade"
    if "request-revision" in clean_path:
        return "request_revision"
    if "google-meet" in clean_path:
        return "generate_meeting"
    if clean_method == "GET" and any(
        marker in clean_path for marker in ("/download", "/preview", "/inline")
    ):
        return "download"
    if clean_method == "POST" and any(
        marker in clean_path for marker in ("/attachment", "/attachments")
    ):
        return "upload"
    if clean_method == "GET":
        return "view"
    if clean_method == "POST":
        return "create"
    if clean_method in {"PUT", "PATCH"}:
        return "update"
    if clean_method == "DELETE":
        return "delete"
    return clean_method.lower()


def activity_label(action: str, category: str) -> str:
    category_label = CATEGORY_LABELS.get(category, CATEGORY_LABELS["other"])
    labels = {
        "login": "Masuk ke aplikasi",
        "logout": "Keluar dari aplikasi",
        "view": f"Melihat data {category_label.lower()}",
        "create": f"Membuat data {category_label.lower()}",
        "update": f"Memperbarui data {category_label.lower()}",
        "delete": f"Menghapus data {category_label.lower()}",
        "submit": "Mengumpulkan tugas",
        "grade": "Memberikan nilai",
        "request_revision": "Meminta revisi tugas",
        "generate_meeting": "Membuat ruang Google Meet",
        "download": "Mengakses atau mengunduh file",
        "upload": "Mengunggah lampiran",
    }
    return labels.get(action, f"Menjalankan aksi {category_label.lower()}")


def classify_activity(method: str, path: str) -> Dict[str, str]:
    category = activity_category(path)
    action = activity_action(method, path)
    return {
        "category": category,
        "category_label": CATEGORY_LABELS.get(category, CATEGORY_LABELS["other"]),
        "action": action,
        "activity_label": activity_label(action, category),
    }


def _parse_datetime(value: Any) -> datetime | None:
    if isinstance(value, datetime):
        parsed = value
    else:
        try:
            parsed = datetime.fromisoformat(str(value or "").replace("Z", "+00:00"))
        except (TypeError, ValueError):
            return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def aggregate_user_activity(
    logs: Iterable[Dict[str, Any]],
    days: int,
    now: datetime,
    activity_timezone: ZoneInfo,
) -> Dict[str, Any]:
    safe_days = max(7, min(int(days or 14), 90))
    current = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    local_today = current.astimezone(activity_timezone).date()
    day_keys = [
        (local_today - timedelta(days=safe_days - 1 - index)).isoformat()
        for index in range(safe_days)
    ]
    daily = {
        key: {
            "date": key,
            "activities": 0,
            "active_users": set(),
            "logins": 0,
            "failures": 0,
        }
        for key in day_keys
    }
    categories: Dict[str, int] = {}
    roles: Dict[str, set[str]] = {}
    all_users: set[str] = set()
    normalized: List[Dict[str, Any]] = []
    for raw in logs:
        created_at = _parse_datetime(raw.get("created_at"))
        if created_at is None:
            continue
        day_key = created_at.astimezone(activity_timezone).date().isoformat()
        if day_key not in daily:
            continue
        item = dict(raw)
        normalized.append(item)
        user_id = str(item.get("user_id") or "")
        category = str(item.get("category") or "other")
        role = str(item.get("user_role") or "unknown")
        daily[day_key]["activities"] += 1
        if user_id:
            daily[day_key]["active_users"].add(user_id)
            all_users.add(user_id)
            roles.setdefault(role, set()).add(user_id)
        if item.get("action") == "login":
            daily[day_key]["logins"] += 1
        if not bool(item.get("success", True)):
            daily[day_key]["failures"] += 1
        categories[category] = categories.get(category, 0) + 1
    normalized.sort(key=lambda item: str(item.get("created_at") or ""), reverse=True)
    trend = [
        {
            **{key: value for key, value in daily[day_key].items() if key != "active_users"},
            "active_users": len(daily[day_key]["active_users"]),
            "label": datetime.fromisoformat(day_key).strftime("%d/%m"),
        }
        for day_key in day_keys
    ]
    category_rows = [
        {
            "category": category,
            "label": CATEGORY_LABELS.get(category, CATEGORY_LABELS["other"]),
            "count": count,
        }
        for category, count in sorted(categories.items(), key=lambda item: (-item[1], item[0]))
    ]
    role_rows = [
        {"role": role, "active_users": len(users)}
        for role, users in sorted(roles.items(), key=lambda item: (-len(item[1]), item[0]))
    ]
    return {
        "days": safe_days,
        "timezone": str(activity_timezone),
        "summary": {
            "activities": sum(item["activities"] for item in trend),
            "active_users": len(all_users),
            "active_today": trend[-1]["active_users"] if trend else 0,
            "logins": sum(item["logins"] for item in trend),
            "failures": sum(item["failures"] for item in trend),
        },
        "trend": trend,
        "categories": category_rows,
        "roles": role_rows,
        "recent": normalized[:12],
    }
