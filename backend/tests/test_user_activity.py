"""Regression coverage for user activity classification and chart aggregation."""

from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from backend.user_activity import aggregate_user_activity, classify_activity


JAKARTA = ZoneInfo("Asia/Jakarta")


def test_activity_classification_does_not_depend_on_resource_ids():
    assert classify_activity("POST", "/api/assignments/id-123/submit") == {
        "category": "assessment",
        "category_label": "Penilaian",
        "action": "submit",
        "activity_label": "Mengumpulkan tugas",
    }
    assert classify_activity("GET", "/api/files/id-456/download")["action"] == "download"
    assert classify_activity("DELETE", "/api/materials/id-789")["activity_label"] == (
        "Menghapus data pembelajaran"
    )


def test_activity_aggregation_counts_unique_users_and_daily_events():
    now = datetime(2026, 7, 24, 8, 0, tzinfo=timezone.utc)
    logs = [
        {
            "id": "one",
            "user_id": "student-1",
            "user_role": "student",
            "action": "login",
            "category": "authentication",
            "success": True,
            "created_at": (now - timedelta(hours=1)).isoformat(),
        },
        {
            "id": "two",
            "user_id": "student-1",
            "user_role": "student",
            "action": "view",
            "category": "learning",
            "success": True,
            "created_at": now.isoformat(),
        },
        {
            "id": "three",
            "user_id": "lecturer-1",
            "user_role": "lecturer",
            "action": "grade",
            "category": "assessment",
            "success": False,
            "created_at": now.isoformat(),
        },
    ]

    activity = aggregate_user_activity(logs, 14, now, JAKARTA)

    assert activity["summary"] == {
        "activities": 3,
        "active_users": 2,
        "active_today": 2,
        "logins": 1,
        "failures": 1,
    }
    assert activity["trend"][-1]["activities"] == 3
    assert activity["trend"][-1]["active_users"] == 2
    assert activity["categories"][0] == {
        "category": "assessment",
        "label": "Penilaian",
        "count": 1,
    }
    assert {item["role"]: item["active_users"] for item in activity["roles"]} == {
        "lecturer": 1,
        "student": 1,
    }


def test_activity_aggregation_ignores_logs_outside_chart_window():
    now = datetime(2026, 7, 24, 8, 0, tzinfo=timezone.utc)
    activity = aggregate_user_activity(
        [
            {
                "user_id": "old-user",
                "action": "view",
                "category": "other",
                "created_at": (now - timedelta(days=30)).isoformat(),
            }
        ],
        7,
        now,
        JAKARTA,
    )

    assert activity["summary"]["activities"] == 0
    assert len(activity["trend"]) == 7
