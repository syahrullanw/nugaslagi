"""Regression tests for revised grading, materials, class lifecycle, and class-user management."""

import os
import uuid
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv


load_dotenv("/app/frontend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
assert BASE_URL, "REACT_APP_BACKEND_URL is required"
API_BASE = f"{BASE_URL.rstrip('/')}/api"


def _login(identifier: str, password: str) -> dict:
    response = requests.post(
        f"{API_BASE}/auth/login",
        json={"identifier": identifier, "password": password},
        timeout=40,
    )
    assert response.status_code == 200, response.text
    data = response.json()
    assert isinstance(data.get("token"), str) and data["token"]
    return data


@pytest.fixture(scope="module")
def state():
    suffix = uuid.uuid4().hex[:8]
    return {
        "suffix": suffix,
        "course_id": "",
        "class_id": "",
        "material_1_id": "",
        "material_2_id": "",
        "assignment_id": "",
        "student_1": {
            "nim": f"REV{suffix[:6]}1",
            "name": f"TEST Rev Student 1 {suffix}",
            "email": f"rev.student1.{suffix}@demo.id",
            "password": "Mahasiswa123!",
            "id": "",
            "token": "",
        },
        "student_2": {
            "nim": f"REV{suffix[:6]}2",
            "name": f"TEST Rev Student 2 {suffix}",
            "email": f"rev.student2.{suffix}@demo.id",
            "password": "Mahasiswa123!",
            "id": "",
            "token": "",
        },
        "submission_1_id": "",
        "submission_2_id": "",
    }


@pytest.fixture(scope="module")
def admin_auth():
    # Auth module: admin token for protected endpoints.
    data = _login("dosenadmin", "Dosen123!")
    assert data["user"]["role"] == "admin"
    return {"Authorization": f"Bearer {data['token']}"}


def test_setup_course_class_materials_assignment(admin_auth, state):
    # Class/material/assignment module: setup isolated data for revision testing.
    course_payload = {
        "code": f"RV{state['suffix'][:4].upper()}",
        "name": f"TEST Revision Course {state['suffix']}",
        "credits": 3,
        "description": "Revision regression setup",
    }
    course_response = requests.post(f"{API_BASE}/courses", json=course_payload, headers=admin_auth, timeout=40)
    assert course_response.status_code == 200, course_response.text
    course_doc = course_response.json()
    assert course_doc["name"] == course_payload["name"]
    state["course_id"] = course_doc["id"]

    class_payload = {
        "academic_year": "2025/2026",
        "semester": "Ganjil",
        "course_id": state["course_id"],
        "name": f"TEST-REV-{state['suffix'][:4]}",
        "schedule": "Jumat 09.00",
    }
    class_response = requests.post(f"{API_BASE}/classes", json=class_payload, headers=admin_auth, timeout=40)
    assert class_response.status_code == 200, class_response.text
    class_doc = class_response.json()
    state["class_id"] = class_doc["id"]
    assert class_doc["status"] == "active"

    material_1_payload = {
        "class_id": state["class_id"],
        "title": f"TEST Revision Material A {state['suffix']}",
        "description": "Material A",
        "meeting": "Pertemuan 1",
        "file_url": "",
        "video_url": "",
        "is_active": True,
        "locked_until": "",
    }
    material_1_resp = requests.post(f"{API_BASE}/materials", json=material_1_payload, headers=admin_auth, timeout=40)
    assert material_1_resp.status_code == 200, material_1_resp.text
    state["material_1_id"] = material_1_resp.json()["id"]

    material_2_payload = {
        "class_id": state["class_id"],
        "title": f"TEST Revision Material B {state['suffix']}",
        "description": "Material B",
        "meeting": "Pertemuan 2",
        "file_url": "",
        "video_url": "",
        "is_active": True,
        "locked_until": "",
    }
    material_2_resp = requests.post(f"{API_BASE}/materials", json=material_2_payload, headers=admin_auth, timeout=40)
    assert material_2_resp.status_code == 200, material_2_resp.text
    state["material_2_id"] = material_2_resp.json()["id"]

    assignment_payload = {
        "class_id": state["class_id"],
        "title": f"TEST Revision Assignment {state['suffix']}",
        "description": "Assignment linked to Material A",
        "deadline": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
        "tolerance_hours": 0,
        "allowed_formats": ["pdf", "png"],
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
        "material_id": state["material_1_id"],
    }
    assignment_resp = requests.post(f"{API_BASE}/assignments", json=assignment_payload, headers=admin_auth, timeout=40)
    assert assignment_resp.status_code == 200, assignment_resp.text
    assignment_doc = assignment_resp.json()
    state["assignment_id"] = assignment_doc["id"]
    assert assignment_doc["material_id"] == state["material_1_id"]


def test_create_two_students_and_verify_class_user_management_endpoints(admin_auth, state):
    # Class-user management module: list class members, toggle status, and remove member.
    for student_key in ["student_1", "student_2"]:
        payload = {
            "nim": state[student_key]["nim"],
            "name": state[student_key]["name"],
            "email": state[student_key]["email"],
            "whatsapp": "628777777777",
            "class_id": state["class_id"],
            "status": "active",
            "password": state[student_key]["password"],
        }
        create_resp = requests.post(f"{API_BASE}/students", json=payload, headers=admin_auth, timeout=40)
        assert create_resp.status_code == 200, create_resp.text
        student_doc = create_resp.json()
        state[student_key]["id"] = student_doc["id"]
        assert state["class_id"] in student_doc["class_ids"]

        student_login = _login(state[student_key]["email"], state[student_key]["password"])
        assert student_login["user"]["role"] == "student"
        state[student_key]["token"] = student_login["token"]

    class_students_resp = requests.get(f"{API_BASE}/classes/{state['class_id']}/students", headers=admin_auth, timeout=40)
    assert class_students_resp.status_code == 200, class_students_resp.text
    class_students = class_students_resp.json()
    ids = {s["id"] for s in class_students["students"]}
    assert state["student_1"]["id"] in ids
    assert state["student_2"]["id"] in ids

    inactive_resp = requests.post(
        f"{API_BASE}/students/{state['student_2']['id']}/status",
        headers=admin_auth,
        json={"status": "inactive"},
        timeout=40,
    )
    assert inactive_resp.status_code == 200, inactive_resp.text
    assert inactive_resp.json()["status"] == "inactive"

    all_students_resp = requests.get(f"{API_BASE}/students", headers=admin_auth, timeout=40)
    assert all_students_resp.status_code == 200
    student_2 = next((s for s in all_students_resp.json() if s["id"] == state["student_2"]["id"]), None)
    assert student_2 is not None
    assert student_2["status"] == "inactive"

    remove_resp = requests.post(
        f"{API_BASE}/classes/{state['class_id']}/students/{state['student_2']['id']}/remove",
        headers=admin_auth,
        timeout=40,
    )
    assert remove_resp.status_code == 200, remove_resp.text
    assert remove_resp.json()["ok"] is True

    class_students_after_remove_resp = requests.get(
        f"{API_BASE}/classes/{state['class_id']}/students", headers=admin_auth, timeout=40
    )
    assert class_students_after_remove_resp.status_code == 200
    after_ids = {s["id"] for s in class_students_after_remove_resp.json()["students"]}
    assert state["student_2"]["id"] not in after_ids


def test_material_comments_are_isolated_per_material(admin_auth, state):
    # Discussion module: comments should be independent for each material.
    comment_a = requests.post(
        f"{API_BASE}/comments",
        headers=admin_auth,
        json={"material_id": state["material_1_id"], "content": f"Komentar A {state['suffix']}", "parent_id": ""},
        timeout=40,
    )
    assert comment_a.status_code == 200, comment_a.text
    comment_a_doc = comment_a.json()

    comment_b = requests.post(
        f"{API_BASE}/comments",
        headers=admin_auth,
        json={"material_id": state["material_2_id"], "content": f"Komentar B {state['suffix']}", "parent_id": ""},
        timeout=40,
    )
    assert comment_b.status_code == 200, comment_b.text
    comment_b_doc = comment_b.json()

    list_a_resp = requests.get(f"{API_BASE}/materials/{state['material_1_id']}/comments", headers=admin_auth, timeout=40)
    assert list_a_resp.status_code == 200
    list_b_resp = requests.get(f"{API_BASE}/materials/{state['material_2_id']}/comments", headers=admin_auth, timeout=40)
    assert list_b_resp.status_code == 200

    ids_a = {item["id"] for item in list_a_resp.json()}
    ids_b = {item["id"] for item in list_b_resp.json()}
    assert comment_a_doc["id"] in ids_a
    assert comment_b_doc["id"] in ids_b
    assert comment_b_doc["id"] not in ids_a


def test_bulk_grade_accepts_different_scores_per_submission(admin_auth, state):
    # Bulk grading module: different score/feedback must persist per submission.
    submit_1 = requests.post(
        f"{API_BASE}/assignments/{state['assignment_id']}/submit",
        headers={"Authorization": f"Bearer {state['student_1']['token']}"},
        files=[("files", ("s1.pdf", b"%PDF-s1", "application/pdf"))],
        data={"note": "Submission one"},
        timeout=40,
    )
    assert submit_1.status_code == 200, submit_1.text
    state["submission_1_id"] = submit_1.json()["id"]

    submit_2 = requests.post(
        f"{API_BASE}/assignments/{state['assignment_id']}/submit",
        headers={"Authorization": f"Bearer {state['student_2']['token']}"},
        files=[("files", ("s2.pdf", b"%PDF-s2", "application/pdf"))],
        data={"note": "Submission two"},
        timeout=40,
    )
    assert submit_2.status_code == 403, submit_2.text

    # Re-attach student_2 to class so we can test two independent submission scores.
    readd_resp = requests.post(
        f"{API_BASE}/students",
        headers=admin_auth,
        json={
            "nim": state["student_2"]["nim"],
            "name": state["student_2"]["name"],
            "email": f"readd.{state['student_2']['email']}",
            "whatsapp": "628999999999",
            "class_id": state["class_id"],
            "status": "active",
            "password": state["student_2"]["password"],
        },
        timeout=40,
    )
    assert readd_resp.status_code == 200, readd_resp.text
    readd_login = _login(f"readd.{state['student_2']['email']}", state["student_2"]["password"])
    student_2_readd_token = readd_login["token"]

    submit_2b = requests.post(
        f"{API_BASE}/assignments/{state['assignment_id']}/submit",
        headers={"Authorization": f"Bearer {student_2_readd_token}"},
        files=[("files", ("s2b.pdf", b"%PDF-s2b", "application/pdf"))],
        data={"note": "Submission two re-added"},
        timeout=40,
    )
    assert submit_2b.status_code == 200, submit_2b.text
    state["submission_2_id"] = submit_2b.json()["id"]

    bulk_payload = {
        "grades": [
            {
                "submission_id": state["submission_1_id"],
                "score": 92,
                "feedback": "Feedback S1",
                "revision_note": "",
            },
            {
                "submission_id": state["submission_2_id"],
                "score": 78,
                "feedback": "Feedback S2",
                "revision_note": "Perbaiki dokumentasi",
            },
        ]
    }
    bulk_resp = requests.post(f"{API_BASE}/submissions/bulk-grade", headers=admin_auth, json=bulk_payload, timeout=40)
    assert bulk_resp.status_code == 200, bulk_resp.text
    bulk_doc = bulk_resp.json()
    assert bulk_doc["updated"] >= 2

    submissions_resp = requests.get(f"{API_BASE}/submissions", headers=admin_auth, timeout=40)
    assert submissions_resp.status_code == 200
    items = submissions_resp.json()
    s1 = next((s for s in items if s["id"] == state["submission_1_id"]), None)
    s2 = next((s for s in items if s["id"] == state["submission_2_id"]), None)
    assert s1 is not None and s2 is not None
    assert s1["grade"] == 92
    assert s1["feedback"] == "Feedback S1"
    assert s2["grade"] == 78
    assert s2["feedback"] == "Feedback S2"


def test_end_class_status_changes_to_ended(admin_auth, state):
    # Class lifecycle module: ended class must move to ended/riwayat state.
    end_resp = requests.post(f"{API_BASE}/classes/{state['class_id']}/end", headers=admin_auth, timeout=40)
    assert end_resp.status_code == 200, end_resp.text
    assert end_resp.json()["ok"] is True

    classes_resp = requests.get(f"{API_BASE}/classes", headers=admin_auth, timeout=40)
    assert classes_resp.status_code == 200
    class_doc = next((c for c in classes_resp.json() if c["id"] == state["class_id"]), None)
    assert class_doc is not None
    assert class_doc["status"] == "ended"
