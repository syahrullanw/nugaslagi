"""Application release metadata shared by API responses and deployment tooling."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, Optional


_VERSION_FILE = Path(__file__).resolve().parents[1] / "VERSION"
APP_NAME = "E-Learning Dosen"
APP_VERSION = _VERSION_FILE.read_text(encoding="utf-8").strip() if _VERSION_FILE.exists() else "0.0.0-dev"
RELEASE_CHANNEL = os.environ.get("APP_RELEASE_CHANNEL", "stable")
BUILD_ID = os.environ.get("APP_BUILD_ID", "local")
GIT_COMMIT = os.environ.get("APP_GIT_COMMIT", "unknown")
BUILD_AT = os.environ.get("APP_BUILD_AT", "unknown")
SCHEMA_VERSION = "002_domain_tables"


def version_payload(database_backend: str = "postgresql", schema_versions: Optional[list[str]] = None) -> Dict[str, Any]:
    """Return non-secret metadata useful for support and deployment checks."""
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "release_channel": RELEASE_CHANNEL,
        "build_id": BUILD_ID,
        "git_commit": GIT_COMMIT,
        "build_at": BUILD_AT,
        "database_backend": database_backend,
        "schema_version": SCHEMA_VERSION,
        "schema_versions": schema_versions or [SCHEMA_VERSION],
    }


__all__ = [
    "APP_NAME",
    "APP_VERSION",
    "BUILD_AT",
    "BUILD_ID",
    "GIT_COMMIT",
    "RELEASE_CHANNEL",
    "SCHEMA_VERSION",
    "version_payload",
]
