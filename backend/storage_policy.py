"""Pure scheduling rules for attachment storage maintenance."""

from __future__ import annotations

from datetime import datetime, time, timedelta, timezone
from zoneinfo import ZoneInfo


DRIVE_SYNC_MAX_ATTEMPTS_PER_DAY = 5
DRIVE_LOCAL_RETENTION_DAYS = 14
DRIVE_SYNC_RETRY_DELAYS_MINUTES = (5, 30, 120, 360)


def parse_policy_datetime(value: str) -> datetime | None:
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
    except (TypeError, ValueError):
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def sync_attempt_day(now: datetime, policy_timezone: ZoneInfo) -> str:
    return now.astimezone(policy_timezone).date().isoformat()


def next_drive_retry_at(
    attempts_today: int,
    now: datetime,
    policy_timezone: ZoneInfo,
) -> str:
    """Return a UTC retry timestamp without exceeding the daily attempt cap."""
    current = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    if attempts_today >= DRIVE_SYNC_MAX_ATTEMPTS_PER_DAY:
        local_now = current.astimezone(policy_timezone)
        next_day = local_now.date() + timedelta(days=1)
        retry = datetime.combine(next_day, time.min, tzinfo=policy_timezone)
    else:
        delay_index = max(0, min(attempts_today - 1, len(DRIVE_SYNC_RETRY_DELAYS_MINUTES) - 1))
        retry = current + timedelta(minutes=DRIVE_SYNC_RETRY_DELAYS_MINUTES[delay_index])
    return retry.astimezone(timezone.utc).isoformat()


def retry_is_due(next_retry_at: str, now: datetime) -> bool:
    scheduled = parse_policy_datetime(next_retry_at)
    if scheduled is None:
        return True
    current = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    return scheduled <= current


def local_copy_is_expired(
    drive_uploaded_at: str,
    now: datetime,
    retention_days: int = DRIVE_LOCAL_RETENTION_DAYS,
) -> bool:
    uploaded = parse_policy_datetime(drive_uploaded_at)
    if uploaded is None:
        return False
    current = now if now.tzinfo else now.replace(tzinfo=timezone.utc)
    return uploaded <= current - timedelta(days=max(1, retention_days))
