"""Regression coverage for editing and deleting a material meeting."""

import os
import uuid
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


load_dotenv("/app/frontend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
assert BASE_URL, "REACT_APP_BACKEND_URL is required"
API_BASE = f"{BASE_URL.rstrip('/')}/api"


def admin_headers() -> dict:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"identifier": "dosenadmin", "password": "Dosen123!"},
        timeout=40,
    )
    assert response.status_code == 200, response.text
    return {"Authorization": f"Bearer {response.json()['token']}"}


def test_edit_delete_meeting_cleans_discussion_and_preserves_task():
    headers = admin_headers()
    suffix = uuid.uuid4().hex[:8]

    classes_response = requests.get(f"{API_BASE}/classes", headers=headers, timeout=40)
    assert classes_response.status_code == 200, classes_response.text
    class_id = classes_response.json()[0]["id"]

    material_payload = {
        "class_id": class_id,
        "title": f"TEST Material CRUD {suffix}",
        "description": "Materi sebelum diperbarui",
        "meeting": "Pertemuan 1",
        "file_url": "",
        "video_url": "",
        "is_active": True,
        "locked_until": "",
    }
    material_response = requests.post(f"{API_BASE}/materials", headers=headers, json=material_payload, timeout=40)
    assert material_response.status_code == 200, material_response.text
    material_id = material_response.json()["id"]

    updated_payload = {
        **material_payload,
        "title": f"TEST Material CRUD Edited {suffix}",
        "description": "Materi telah diperbarui",
        "file_url": "https://example.test/material.pdf",
    }
    update_response = requests.put(
        f"{API_BASE}/materials/{material_id}",
        headers=headers,
        json=updated_payload,
        timeout=40,
    )
    assert update_response.status_code == 200, update_response.text
    assert update_response.json()["title"] == updated_payload["title"]
    assert update_response.json()["file_url"] == updated_payload["file_url"]

    attachment_response = requests.post(
        f"{API_BASE}/materials/{material_id}/attachment",
        headers=headers,
        files={"attachment": ("materi-pertemuan.pdf", b"%PDF-1.4 uploaded material", "application/pdf")},
        timeout=40,
    )
    assert attachment_response.status_code == 200, attachment_response.text
    material_attachment = attachment_response.json()
    assert material_attachment["attachment"]["file_name"] == "materi-pertemuan.pdf"
    assert material_attachment["file_url"].startswith("/api/files/")
    attachment_url = material_attachment["file_url"]

    download_response = requests.get(
        f"{BASE_URL.rstrip('/')}{attachment_url}",
        headers=headers,
        timeout=40,
    )
    assert download_response.status_code == 200, download_response.text
    assert download_response.content == b"%PDF-1.4 uploaded material"

    comment_response = requests.post(
        f"{API_BASE}/materials/{material_id}/comments",
        headers=headers,
        data={"content": "Lampiran diskusi yang harus ikut dihapus", "parent_id": ""},
        files={"attachment": ("diskusi.txt", b"material discussion attachment", "text/plain")},
        timeout=40,
    )
    assert comment_response.status_code == 200, comment_response.text

    assignment_payload = {
        "class_id": class_id,
        "title": f"TEST Assignment Material CRUD {suffix}",
        "description": "Tugas yang terkait dengan pertemuan",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "allowed_formats": ["pdf"],
        "rubric": [{"criterion": "Nilai total", "weight": 100}],
        "material_id": material_id,
    }
    assignment_response = requests.post(
        f"{API_BASE}/assignments",
        headers=headers,
        json=assignment_payload,
        timeout=40,
    )
    assert assignment_response.status_code == 200, assignment_response.text
    assignment_id = assignment_response.json()["id"]

    delete_response = requests.delete(f"{API_BASE}/materials/{material_id}", headers=headers, timeout=40)
    assert delete_response.status_code == 200, delete_response.text
    deletion = delete_response.json()
    assert deletion["comments_deleted"] == 1
    assert deletion["attachments_deleted"] == 2
    assert deletion["assignments_unlinked"] == 1

    deleted_file_response = requests.get(
        f"{BASE_URL.rstrip('/')}{attachment_url}",
        headers=headers,
        timeout=40,
    )
    assert deleted_file_response.status_code == 404

    assignments_response = requests.get(f"{API_BASE}/assignments", headers=headers, timeout=40)
    assert assignments_response.status_code == 200, assignments_response.text
    assignment = next(item for item in assignments_response.json() if item["id"] == assignment_id)
    assert assignment["material_id"] == ""
    assert assignment.get("material_link_removed_at")

    materials_response = requests.get(f"{API_BASE}/materials", headers=headers, timeout=40)
    assert materials_response.status_code == 200, materials_response.text
    assert material_id not in {item["id"] for item in materials_response.json()}
