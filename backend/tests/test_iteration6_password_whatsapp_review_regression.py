"""Iteration 6 regression: password page-related APIs, WhatsApp queue/settings, and review/revision flows."""

import os
import re
import uuid
from datetime import datetime, timedelta, timezone

import requests
from dotenv import load_dotenv


load_dotenv("/app/frontend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
assert BASE_URL, "REACT_APP_BACKEND_URL is required"
API_BASE = f"{BASE_URL.rstrip('/')}/api"


def _login(identifier: str, password: str) -> dict:
    # Auth module: unified login helper for admin/student flows.
    resp = requests.post(
        f"{API_BASE}/auth/login",
        json={"identifier": identifier, "password": password},
        timeout=45,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert isinstance(data.get("token"), str) and data["token"]
    assert isinstance(data.get("user"), dict)
    return data


def _auth_header(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_existing_login_and_change_password_still_work_roundtrip():
    # Auth module: existing student login and change-password remain functional.
    student = _login("230001001", "Mahasiswa123!")
    changed_password = "Mahasiswa123!T6"

    change_resp = requests.post(
        f"{API_BASE}/auth/change-password",
        headers=_auth_header(student["token"]),
        json={"current_password": "Mahasiswa123!", "new_password": changed_password},
        timeout=45,
    )
    assert change_resp.status_code == 200, change_resp.text
    assert change_resp.json().get("ok") is True

    relogin = _login("230001001", changed_password)
    assert relogin["user"].get("role") == "student"

    revert_resp = requests.post(
        f"{API_BASE}/auth/change-password",
        headers=_auth_header(relogin["token"]),
        json={"current_password": changed_password, "new_password": "Mahasiswa123!"},
        timeout=45,
    )
    assert revert_resp.status_code == 200, revert_resp.text
    assert revert_resp.json().get("ok") is True


def test_register_student_still_works_and_returns_token():
    # Auth module: register-student endpoint still creates active session.
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "username": f"iter6{suffix[:5]}",
        "nim": f"IT6{suffix[:7]}",
        "name": f"TEST Iter6 Student {suffix}",
        "email": f"iter6.student.{suffix}@demo.id",
        "whatsapp": "628111000999",
        "password": "Mahasiswa123!",
    }
    resp = requests.post(f"{API_BASE}/auth/register-student", json=payload, timeout=45)
    assert resp.status_code == 200, resp.text
    body = resp.json()
    assert isinstance(body.get("token"), str) and body["token"]
    assert body["user"].get("role") == "student"
    assert body["user"].get("email") == payload["email"]


def test_forgot_password_creates_pending_config_queue_entry_when_provider_disabled():
    # WhatsApp module: forgot-password should enqueue pending_config when provider is disabled.
    admin = _login("dosenadmin", "Dosen123!")
    admin_headers = _auth_header(admin["token"])

    disable_payload = {
        "provider": "disabled",
        "app_url": "",
        "fonnte_token": "",
        "fonnte_url": "https://api.fonnte.com/send",
        "waha_base_url": "",
        "waha_api_key": "",
        "waha_session": "default",
        "otp_template": "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
    }
    settings_resp = requests.put(
        f"{API_BASE}/whatsapp/settings",
        headers=admin_headers,
        json=disable_payload,
        timeout=45,
    )
    assert settings_resp.status_code == 200, settings_resp.text
    assert settings_resp.json().get("provider") == "disabled"

    forgot_resp = requests.post(
        f"{API_BASE}/auth/forgot-password",
        json={"identifier": "230001001"},
        timeout=45,
    )
    assert forgot_resp.status_code == 200, forgot_resp.text
    assert forgot_resp.json().get("ok") is True

    messages_resp = requests.get(f"{API_BASE}/whatsapp/messages", headers=admin_headers, timeout=45)
    assert messages_resp.status_code == 200, messages_resp.text
    messages = messages_resp.json()
    assert isinstance(messages, list)

    otp_messages = [m for m in messages if m.get("message_type") == "password_reset_otp"]
    assert otp_messages, "No password_reset_otp message found"
    latest = otp_messages[0]
    assert latest.get("provider") == "disabled"
    assert latest.get("status") == "pending_config"
    assert "Gateway" in (latest.get("error") or "")
    assert "reset=password" in (latest.get("message") or "")
    assert "identifier=230001001" in (latest.get("message") or "")


def test_reset_password_otp_endpoint_changes_password_successfully():
    # OTP reset module: forgot-password then reset-password-otp with OTP from queued WhatsApp body.
    forgot_resp = requests.post(
        f"{API_BASE}/auth/forgot-password",
        json={"identifier": "230001001"},
        timeout=45,
    )
    assert forgot_resp.status_code == 200, forgot_resp.text

    admin = _login("dosenadmin", "Dosen123!")
    messages_resp = requests.get(
        f"{API_BASE}/whatsapp/messages",
        headers=_auth_header(admin["token"]),
        timeout=45,
    )
    assert messages_resp.status_code == 200, messages_resp.text
    otp_messages = [m for m in messages_resp.json() if m.get("message_type") == "password_reset_otp"]
    assert otp_messages, "No OTP message found"
    otp_text = otp_messages[0].get("message") or ""
    code_match = re.search(r"\b(\d{6})\b", otp_text)
    assert code_match, f"OTP code not found in message: {otp_text}"
    otp = code_match.group(1)

    new_password = "Mahasiswa123!OTP"
    reset_resp = requests.post(
        f"{API_BASE}/auth/reset-password-otp",
        json={"identifier": "230001001", "otp": otp, "new_password": new_password},
        timeout=45,
    )
    assert reset_resp.status_code == 200, reset_resp.text
    assert reset_resp.json().get("ok") is True

    relogin = _login("230001001", new_password)
    assert relogin["user"].get("email") == "alya@demo.id"

    revert_resp = requests.post(
        f"{API_BASE}/auth/change-password",
        headers=_auth_header(relogin["token"]),
        json={"current_password": new_password, "new_password": "Mahasiswa123!"},
        timeout=45,
    )
    assert revert_resp.status_code == 200, revert_resp.text
    assert revert_resp.json().get("ok") is True


def test_whatsapp_settings_disabled_fonnte_waha_configs_are_saved():
    # WhatsApp settings module: provider and required field values persist for disabled/fonnte/waha.
    admin = _login("dosenadmin", "Dosen123!")
    headers = _auth_header(admin["token"])

    for payload in [
        {
            "provider": "disabled",
            "app_url": "https://iter6.app/reset",
            "fonnte_token": "",
            "fonnte_url": "https://api.fonnte.com/send",
            "waha_base_url": "",
            "waha_api_key": "",
            "waha_session": "default",
            "otp_template": "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
        },
        {
            "provider": "fonnte",
            "app_url": "https://iter6.app/reset-fonnte",
            "fonnte_token": "TOKEN-ITER6-FAKE",
            "fonnte_url": "https://api.fonnte.com/send",
            "waha_base_url": "",
            "waha_api_key": "",
            "waha_session": "default",
            "otp_template": "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
        },
        {
            "provider": "waha",
            "app_url": "https://iter6.app/reset-waha",
            "fonnte_token": "",
            "fonnte_url": "https://api.fonnte.com/send",
            "waha_base_url": "https://waha.example.test",
            "waha_api_key": "WAHA-KEY-ITER6",
            "waha_session": "iter6",
            "otp_template": "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
        },
    ]:
        put_resp = requests.put(f"{API_BASE}/whatsapp/settings", headers=headers, json=payload, timeout=45)
        assert put_resp.status_code == 200, put_resp.text
        updated = put_resp.json()
        assert updated.get("provider") == payload["provider"]
        assert updated.get("app_url") == payload["app_url"]

    # restore disabled after provider roundtrip to keep environment predictable
    restore = {
        "provider": "disabled",
        "app_url": "",
        "fonnte_token": "",
        "fonnte_url": "https://api.fonnte.com/send",
        "waha_base_url": "",
        "waha_api_key": "",
        "waha_session": "default",
        "otp_template": "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
    }
    restore_resp = requests.put(f"{API_BASE}/whatsapp/settings", headers=headers, json=restore, timeout=45)
    assert restore_resp.status_code == 200, restore_resp.text
    assert restore_resp.json().get("provider") == "disabled"


def test_review_endpoint_marks_reviewed_and_request_revision_sets_revision_status():
    # Review module: review and revision-request status transitions for seeded assignment submission.
    admin = _login("dosenadmin", "Dosen123!")
    student = _login("230001001", "Mahasiswa123!")

    assignments_resp = requests.get(f"{API_BASE}/assignments", headers=_auth_header(student["token"]), timeout=45)
    assert assignments_resp.status_code == 200, assignments_resp.text
    assignments = assignments_resp.json()
    assert assignments, "No student assignment available"

    assignment_id = assignments[0]["id"]
    submit_resp = requests.post(
        f"{API_BASE}/assignments/{assignment_id}/submit",
        headers=_auth_header(student["token"]),
        files=[("files", ("iter6_review.pdf", b"%PDF-iter6-review", "application/pdf"))],
        data={"note": "iter6 review flow submit"},
        timeout=45,
    )
    assert submit_resp.status_code == 200, submit_resp.text
    submission_id = submit_resp.json()["id"]

    review_resp = requests.post(
        f"{API_BASE}/submissions/{submission_id}/review",
        headers=_auth_header(admin["token"]),
        timeout=45,
    )
    assert review_resp.status_code == 200, review_resp.text
    reviewed = review_resp.json()
    assert reviewed.get("review_status") == "reviewed"

    revision_resp = requests.post(
        f"{API_BASE}/submissions/{submission_id}/request-revision",
        headers=_auth_header(admin["token"]),
        json={"revision_note": "Perbaiki format penulisan"},
        timeout=45,
    )
    assert revision_resp.status_code == 200, revision_resp.text
    revised = revision_resp.json()
    assert revised.get("status") == "Direvisi"
    assert revised.get("review_status") == "revision_requested"
    assert revised.get("revision_note") == "Perbaiki format penulisan"


def test_student_can_resubmit_after_revision_with_deadline_late_rules_applied():
    # Deadline/late module: after revision request, resubmit remains allowed with late status when deadline passed and close_after_deadline=False.
    admin = _login("dosenadmin", "Dosen123!")
    student = _login("230001001", "Mahasiswa123!")
    admin_headers = _auth_header(admin["token"])
    student_headers = _auth_header(student["token"])

    classes_resp = requests.get(f"{API_BASE}/classes", headers=student_headers, timeout=45)
    assert classes_resp.status_code == 200, classes_resp.text
    classes = classes_resp.json()
    assert classes, "Student has no class for assignment creation test"
    class_id = classes[0]["id"]

    past_deadline = (datetime.now(timezone.utc) - timedelta(hours=4)).isoformat()
    suffix = uuid.uuid4().hex[:6]
    assignment_payload = {
        "class_id": class_id,
        "title": f"TEST_IT6_RevisiLate_{suffix}",
        "description": "Assignment for revision+late policy regression",
        "deadline": past_deadline,
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
        "late_penalty_per_day": 5,
        "close_after_deadline": False,
        "material_id": "",
    }
    create_assignment_resp = requests.post(
        f"{API_BASE}/assignments",
        headers=admin_headers,
        json=assignment_payload,
        timeout=45,
    )
    assert create_assignment_resp.status_code == 200, create_assignment_resp.text
    assignment = create_assignment_resp.json()
    assert assignment.get("title") == assignment_payload["title"]

    first_submit = requests.post(
        f"{API_BASE}/assignments/{assignment['id']}/submit",
        headers=student_headers,
        files=[("files", ("iter6_late_first.pdf", b"%PDF-iter6-late-1", "application/pdf"))],
        data={"note": "iter6 late first submit"},
        timeout=45,
    )
    assert first_submit.status_code == 200, first_submit.text
    first_doc = first_submit.json()
    assert first_doc.get("status") == "Terlambat"
    submission_id = first_doc["id"]

    revision_resp = requests.post(
        f"{API_BASE}/submissions/{submission_id}/request-revision",
        headers=admin_headers,
        json={"revision_note": "Perbaiki dan upload ulang"},
        timeout=45,
    )
    assert revision_resp.status_code == 200, revision_resp.text
    assert revision_resp.json().get("status") == "Direvisi"

    resubmit = requests.post(
        f"{API_BASE}/assignments/{assignment['id']}/submit",
        headers=student_headers,
        files=[("files", ("iter6_late_resubmit.pdf", b"%PDF-iter6-late-2", "application/pdf"))],
        data={"note": "iter6 late resubmit"},
        timeout=45,
    )
    assert resubmit.status_code == 200, resubmit.text
    resubmit_doc = resubmit.json()
    assert resubmit_doc["id"] == submission_id
    assert resubmit_doc.get("review_status") == "submitted"
    assert resubmit_doc.get("status") == "Terlambat"
    assert int(resubmit_doc.get("revision_count", 0)) >= 1
