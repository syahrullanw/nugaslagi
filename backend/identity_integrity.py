"""Normalization and conflict helpers for account identities.

These functions are deliberately database-independent so the HTTP layer,
maintenance scripts, and regression tests use exactly the same rules.
"""

from __future__ import annotations

from typing import Any, Dict, List


def normalize_email(value: Any) -> str:
    return str(value or "").strip().lower()


def normalize_nim(value: Any) -> str:
    return str(value or "").strip().upper()


def normalize_username(value: Any) -> str:
    return str(value or "").strip().lower()


def student_identity_values(email: Any, nim: Any, username: Any = "", whatsapp: Any = "") -> Dict[str, str]:
    normalized_nim = normalize_nim(nim)
    return {
        "email": normalize_email(email),
        "nim": normalized_nim,
        "username": normalize_username(username or normalized_nim),
        "whatsapp": str(whatsapp or "").strip(),
    }


def student_identity_conflict_query(
    email: Any,
    nim: Any,
    username: Any = "",
    whatsapp: Any = "",
    *,
    exclude_user_id: str = "",
) -> Dict[str, Any]:
    values = student_identity_values(email, nim, username, whatsapp)
    candidates: List[Dict[str, str]] = [
        {"email": values["email"]},
        {"nim": values["nim"]},
        {"username": values["username"]},
    ]
    if values["whatsapp"]:
        candidates.append({"whatsapp": values["whatsapp"]})
    query: Dict[str, Any] = {"$or": candidates}
    if exclude_user_id:
        query["id"] = {"$ne": exclude_user_id}
    return query


def replace_exact_identity(value: Any, source_user_id: str, target_user_id: str) -> Any:
    """Replace exact user-id references while preserving document structure."""
    if isinstance(value, str):
        return target_user_id if value == source_user_id else value
    if isinstance(value, dict):
        return {
            key: replace_exact_identity(item, source_user_id, target_user_id)
            for key, item in value.items()
        }
    if isinstance(value, list):
        replaced = [replace_exact_identity(item, source_user_id, target_user_id) for item in value]
        if all(isinstance(item, str) for item in replaced):
            return list(dict.fromkeys(replaced))
        return replaced
    return value


__all__ = [
    "normalize_email",
    "normalize_nim",
    "normalize_username",
    "replace_exact_identity",
    "student_identity_conflict_query",
    "student_identity_values",
]
