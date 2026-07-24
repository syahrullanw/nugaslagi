"""Validation and canonicalization helpers for YouTube material links."""

from __future__ import annotations

import re
from urllib.parse import parse_qsl, urlsplit


YOUTUBE_VIDEO_ID_PATTERN = re.compile(r"^[A-Za-z0-9_-]{6,20}$")
YOUTUBE_HOSTS = {
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "music.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
}


def youtube_video_id(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    candidate_url = raw if re.match(r"^https?://", raw, re.IGNORECASE) else f"https://{raw}"
    try:
        parsed = urlsplit(candidate_url)
    except ValueError:
        return ""
    host = (parsed.hostname or "").lower()
    parts = [part for part in parsed.path.split("/") if part]
    candidate = ""
    if host in {"youtu.be", "www.youtu.be"} and parts:
        candidate = parts[0]
    elif host in YOUTUBE_HOSTS:
        if parts and parts[0].lower() == "watch":
            candidate = dict(parse_qsl(parsed.query)).get("v", "")
        elif len(parts) >= 2 and parts[0].lower() in {"embed", "shorts", "live"}:
            candidate = parts[1]
    return candidate if YOUTUBE_VIDEO_ID_PATTERN.fullmatch(candidate) else ""


def normalize_youtube_url(value: str) -> str:
    raw = str(value or "").strip()
    if not raw:
        return ""
    video_id = youtube_video_id(raw)
    if not video_id:
        raise ValueError("Link video harus berupa URL YouTube yang valid")
    return f"https://www.youtube.com/watch?v={video_id}"
