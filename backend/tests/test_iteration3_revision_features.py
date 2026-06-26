"""Iteration 3 regression tests for revised grading, attachments, and password reset flows."""

import os
import uuid
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


load_dotenv("/app/frontend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
assert BASE_URL, "REACT_APP_BACKEND_URL is required"
API_BASE = f"{BASE_URL.rstrip('/')}/api"


def login(identifier: str, password: str) -> dict:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"identifier": identifier, "password": password},
        timeout=40,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    return data


def test_reset_password_endpoint_allows_student_relogin():
    # Student management module: reset-password endpoint must update student credentials.
    admin = login("dosenadmin", "Dosen123!")
    admin_headers = {"Authorization": f"Bearer {admin['token']}"}

    classes_resp = requests.get(f"{API_BASE}/classes", headers=admin_headers, timeout=40)
    assert classes_resp.status_code == 200, classes_resp.text
    class_doc = classes_resp.json()[0]

    suffix = uuid.uuid4().hex[:8]
    original_password = "Mahasiswa123!"
    updated_password = f"Reset{suffix}!"
    student_payload = {
        "nim": f"RST{suffix[:6]}",
        "name": f"TEST Reset Student {suffix}",
        "email": f"reset.student.{suffix}@demo.id",
        "whatsapp": "628111000111",
        "class_id": class_doc["id"],
        "status": "active",
        "password": original_password,
    }
    create_resp = requests.post(f"{API_BASE}/students", headers=admin_headers, json=student_payload, timeout=40)
    assert create_resp.status_code == 200, create_resp.text
    created = create_resp.json()
    assert created["email"] == student_payload["email"]

    reset_resp = requests.post(
        f"{API_BASE}/students/{created['id']}/reset-password",
        headers=admin_headers,
        json={"password": updated_password},
        timeout=40,
    )
    assert reset_resp.status_code == 200, reset_resp.text
    reset_body = reset_resp.json()
    assert reset_body["ok"] is True
    assert reset_body["temporary_password"] == updated_password

    relogin = login(student_payload["email"], updated_password)
    assert relogin["user"]["role"] == "student"
    assert relogin["user"]["email"] == student_payload["email"]


def test_assignment_attachment_upload_and_download_supports_token_and_header_auth():
    # Assignment attachments module: upload PDF/DOCX and download with token query/header auth.
    admin = login("dosenadmin", "Dosen123!")
    admin_headers = {"Authorization": f"Bearer {admin['token']}"}

    classes_resp = requests.get(f"{API_BASE}/classes", headers=admin_headers, timeout=40)
    assert classes_resp.status_code == 200, classes_resp.text
    class_doc = classes_resp.json()[0]

    assignment_payload = {
        "class_id": class_doc["id"],
        "title": f"TEST Attachment Assignment {uuid.uuid4().hex[:7]}",
        "description": "Attachment regression",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "tolerance_hours": 0,
        "allowed_formats": ["pdf", "docx"],
        "rubric": [{"criterion": "Nilai total", "weight": 100}],
        "assignment_type": "individu",
        "allow_revision": True,
        "is_active": True,
        "is_practicum": False,
        "practicum_goal": "",
        "practicum_tools": "",
        "practicum_steps": [],
        "required_screenshot": False,
        "late_penalty_per_day": 0,
        "close_after_deadline": False,
        "material_id": "",
    }
    assignment_resp = requests.post(f"{API_BASE}/assignments", headers=admin_headers, json=assignment_payload, timeout=40)
    assert assignment_resp.status_code == 200, assignment_resp.text
    assignment = assignment_resp.json()
    assert assignment["title"] == assignment_payload["title"]

    upload_resp = requests.post(
        f"{API_BASE}/assignments/{assignment['id']}/attachments",
        headers=admin_headers,
        files=[
            ("files", ("soal.pdf", b"%PDF-1.4 attachment", "application/pdf")),
            ("files", ("instruksi.docx", b"PK\x03\x04docx", "application/vnd.openxmlformats-officedocument.wordprocessingml.document")),
        ],
        timeout=60,
    )
    assert upload_resp.status_code == 200, upload_resp.text
    upload_doc = upload_resp.json()
    assert len(upload_doc.get("attachments", [])) == 2
    attachment = upload_doc["attachments"][0]
    assert attachment["file_url"].startswith("/api/files/")

    # token query download
    query_dl = requests.get(
        f"{BASE_URL.rstrip('/')}{attachment['file_url']}?token={admin['token']}",
        timeout=40,
    )
    assert query_dl.status_code == 200, query_dl.text
    assert len(query_dl.content) > 0

    # authorization header download
    header_dl = requests.get(
        f"{BASE_URL.rstrip('/')}{attachment['file_url']}",
        headers=admin_headers,
        timeout=40,
    )
    assert header_dl.status_code == 200, header_dl.text
    assert len(header_dl.content) > 0


def test_bulk_grading_persists_different_scores_and_feedback_per_submission():
    # Grading module: bulk grading should persist different per-student score and feedback.
    admin = login("dosenadmin", "Dosen123!")
    admin_headers = {"Authorization": f"Bearer {admin['token']}"}

    classes_resp = requests.get(f"{API_BASE}/classes", headers=admin_headers, timeout=40)
    assert classes_resp.status_code == 200, classes_resp.text
    class_doc = classes_resp.json()[0]
    class_id = class_doc["id"]

    suffix = uuid.uuid4().hex[:8]
    students = []
    for idx in [1, 2]:
        payload = {
            "nim": f"BLK{suffix[:4]}{idx}",
            "name": f"TEST Bulk Student {idx} {suffix}",
            "email": f"bulk.student{idx}.{suffix}@demo.id",
            "whatsapp": "628118880000",
            "class_id": class_id,
            "status": "active",
            "password": "Mahasiswa123!",
        }
        create_resp = requests.post(f"{API_BASE}/students", headers=admin_headers, json=payload, timeout=40)
        assert create_resp.status_code == 200, create_resp.text
        created = create_resp.json()
        students.append({"id": created["id"], "email": payload["email"]})

    assignment_payload = {
        "class_id": class_id,
        "title": f"TEST Bulk Grade Assignment {suffix}",
        "description": "Bulk grading regression",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "tolerance_hours": 0,
        "allowed_formats": ["pdf"],
        "rubric": [{"criterion": "Nilai total", "weight": 100}],
        "assignment_type": "individu",
        "allow_revision": True,
        "is_active": True,
        "is_practicum": False,
        "practicum_goal": "",
        "practicum_tools": "",
        "practicum_steps": [],
        "required_screenshot": False,
        "late_penalty_per_day": 0,
        "close_after_deadline": False,
        "material_id": "",
    }
    assignment_resp = requests.post(f"{API_BASE}/assignments", headers=admin_headers, json=assignment_payload, timeout=40)
    assert assignment_resp.status_code == 200, assignment_resp.text
    assignment_id = assignment_resp.json()["id"]

    submission_ids = []
    for student in students:
        student_login = login(student["email"], "Mahasiswa123!")
        submit_resp = requests.post(
            f"{API_BASE}/assignments/{assignment_id}/submit",
            headers={"Authorization": f"Bearer {student_login['token']}"},
            files=[("files", ("jawaban.pdf", b"%PDF-1.4 jawaban", "application/pdf"))],
            data={"note": "submit bulk"},
            timeout=60,
        )
        assert submit_resp.status_code == 200, submit_resp.text
        submission_ids.append(submit_resp.json()["id"])

    bulk_payload = {
        "grades": [
            {
                "submission_id": submission_ids[0],
                "score": 91,
                "feedback": "Mantap",
                "revision_note": "",
            },
            {
                "submission_id": submission_ids[1],
                "score": 73,
                "feedback": "Perbaiki penjelasan",
                "revision_note": "Lengkapi dokumentasi",
            },
        ]
    }
    bulk_resp = requests.post(f"{API_BASE}/submissions/bulk-grade", headers=admin_headers, json=bulk_payload, timeout=40)
    assert bulk_resp.status_code == 200, bulk_resp.text
    bulk_doc = bulk_resp.json()
    assert bulk_doc["updated"] >= 2

    submissions_resp = requests.get(f"{API_BASE}/submissions", headers=admin_headers, timeout=40)
    assert submissions_resp.status_code == 200, submissions_resp.text
    submissions = submissions_resp.json()
    s1 = next((s for s in submissions if s["id"] == submission_ids[0]), None)
    s2 = next((s for s in submissions if s["id"] == submission_ids[1]), None)
    assert s1 and s2
    assert s1["grade"] == 91
    assert s1["feedback"] == "Mantap"
    assert s2["grade"] == 73
    assert s2["feedback"] == "Perbaiki penjelasan"
