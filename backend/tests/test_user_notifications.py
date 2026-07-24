"""Regression coverage for persistent in-app notification state."""

from backend.user_notifications import (
    finalize_notifications,
    notification_event,
    notification_id,
)


def test_notification_id_changes_when_same_object_has_new_activity():
    first = notification_id("discussion", "comment-1", "2026-07-24T08:00:00+00:00")
    repeated = notification_id("discussion", "comment-1", "2026-07-24T08:00:00+00:00")
    newer = notification_id("discussion", "comment-1", "2026-07-24T09:00:00+00:00")

    assert first == repeated
    assert first != newer
    assert len(first) == 32


def test_notification_count_only_decreases_for_opened_notification():
    first = notification_event(
        kind="discussion",
        source_id="comment-1",
        occurred_at="2026-07-24T08:00:00+00:00",
        title="Komentar baru",
        message="Ada komentar baru",
        target={"page": "materials", "material_id": "material-1"},
    )
    second = notification_event(
        kind="submission",
        source_id="submission-1",
        occurred_at="2026-07-24T09:00:00+00:00",
        title="Submission baru",
        message="Ada tugas yang dikumpulkan",
        target={"page": "grading", "submission_id": "submission-1"},
    )

    unopened = finalize_notifications([first, second], [], limit=30)
    opened = finalize_notifications(
        [first, second],
        [{"notification_id": first["id"], "read_at": "2026-07-24T10:00:00+00:00"}],
        limit=30,
    )

    assert unopened["unread_count"] == 2
    assert opened["unread_count"] == 1
    assert opened["items"][0]["id"] == second["id"]
    assert opened["items"][0]["read"] is False
    assert opened["items"][1]["read"] is True
