"""Iteration 5 regression tests: auth reset via OTP, WhatsApp settings/messages, and submission review-revision flow."""

import os
from datetime import datetime, timedelta, timezone

import pytest
import requests
from dotenv import load_dotenv

try:
    from pymongo import MongoClient
except Exception:  # pragma: no cover
    MongoClient = None


load_dotenv("/app/frontend/.env")
load_dotenv("/app/backend/.env")

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL")
assert BASE_URL, "REACT_APP_BACKEND_URL is required"
API_BASE = f"{BASE_URL.rstrip('/')}/api"


ADMIN_IDENTIFIER = "dosenadmin"
ADMIN_PASSWORD = "Dosen123!"
STUDENT_IDENTIFIER = "230001001"
STUDENT_EMAIL = "alya@demo.id"
STUDENT_PASSWORD = "Mahasiswa123!"


def _login(identifier: str, password: str):
    resp = requests.post(
        f"{API_BASE}/auth/login",
        json={"identifier": identifier, "password": password},
        timeout=40,
    )
    assert resp.status_code == 200, resp.text
    data = resp.json()
    assert isinstance(data.get("token"), str) and data["token"]
    return data


def _auth_header(token: str):
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="module")
def mongo_db():
    # DB integration module: fetch OTP directly to validate reset-password-otp endpoint end-to-end.
    if MongoClient is None:
        pytest.skip("pymongo not installed; cannot read OTP from MongoDB")

    mongo_url = os.environ.get("MONGO_URL")
    db_name = os.environ.get("DB_NAME")
    if not mongo_url or not db_name:
        pytest.skip("MONGO_URL/DB_NAME not configured")

    client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
    db = client[db_name]
    yield db
    client.close()


def test_login_and_change_password_flow_still_works():
    # Auth module: login + change-password + re-login with new password + revert.
    student = _login(STUDENT_IDENTIFIER, STUDENT_PASSWORD)
    token = student["token"]

    changed_password = "Mahasiswa123!X"
    change_resp = requests.post(
        f"{API_BASE}/auth/change-password",
        headers=_auth_header(token),
        json={"current_password": STUDENT_PASSWORD, "new_password": changed_password},
        timeout=40,
    )
    assert change_resp.status_code == 200, change_resp.text
    assert change_resp.json().get("ok") is True

    relogin = _login(STUDENT_IDENTIFIER, changed_password)
    assert relogin["user"]["role"] == "student"

    revert_resp = requests.post(
        f"{API_BASE}/auth/change-password",
        headers=_auth_header(relogin["token"]),
        json={"current_password": changed_password, "new_password": STUDENT_PASSWORD},
        timeout=40,
    )
    assert revert_resp.status_code == 200, revert_resp.text
    assert revert_resp.json().get("ok") is True


def test_forgot_password_enqueues_whatsapp_and_reset_password_otp_works(mongo_db):
    # Forgot/reset module: forgot-password creates OTP and WhatsApp queue entry, reset-password-otp updates credentials.
    forgot_resp = requests.post(
        f"{API_BASE}/auth/forgot-password",
        json={"identifier": STUDENT_IDENTIFIER},
        timeout=40,
    )
    assert forgot_resp.status_code == 200, forgot_resp.text
    assert forgot_resp.json().get("ok") is True

    admin = _login(ADMIN_IDENTIFIER, ADMIN_PASSWORD)
    messages_resp = requests.get(
        f"{API_BASE}/whatsapp/messages",
        headers=_auth_header(admin["token"]),
        timeout=40,
    )
    assert messages_resp.status_code == 200, messages_resp.text
    messages = messages_resp.json()
    otp_msgs = [m for m in messages if m.get("message_type") == "password_reset_otp"]
    assert otp_msgs, "No password_reset_otp message found"
    latest_msg = otp_msgs[0]
    assert latest_msg.get("to"), latest_msg
    assert latest_msg.get("status") in ["pending_config", "pending", "sent", "failed"]

    user = mongo_db.users.find_one({"email": STUDENT_EMAIL}, {"_id": 0})
    assert user is not None
    otp_doc = (
        mongo_db.password_reset_otps.find({"user_id": user["id"], "status": "active"}, {"_id": 0})
        .sort("created_at", -1)
        .limit(1)
    )
    otp_list = list(otp_doc)
    assert otp_list, "No active OTP found in DB"
    otp = otp_list[0]["otp"]

    reset_password = "Mahasiswa123!R"
    reset_resp = requests.post(
        f"{API_BASE}/auth/reset-password-otp",
        json={"identifier": STUDENT_IDENTIFIER, "otp": otp, "new_password": reset_password},
        timeout=40,
    )
    assert reset_resp.status_code == 200, reset_resp.text
    assert reset_resp.json().get("ok") is True

    relogin = _login(STUDENT_IDENTIFIER, reset_password)
    assert relogin["user"]["role"] == "student"

    revert_resp = requests.post(
        f"{API_BASE}/auth/change-password",
        headers=_auth_header(relogin["token"]),
        json={"current_password": reset_password, "new_password": STUDENT_PASSWORD},
        timeout=40,
    )
    assert revert_resp.status_code == 200, revert_resp.text


def test_whatsapp_settings_get_put_and_messages_endpoints_work():
    # WhatsApp module: settings GET/PUT and message queue/history retrieval.
    admin = _login(ADMIN_IDENTIFIER, ADMIN_PASSWORD)
    headers = _auth_header(admin["token"])

    get_resp = requests.get(f"{API_BASE}/whatsapp/settings", headers=headers, timeout=40)
    assert get_resp.status_code == 200, get_resp.text
    current = get_resp.json()
    assert current.get("provider") in ["disabled", "fonnte", "waha"]

    payload = {
        "provider": "disabled",
        "app_url": "https://example.app/reset",
        "fonnte_token": "",
        "fonnte_url": "https://api.fonnte.com/send",
        "waha_base_url": "",
        "waha_api_key": "",
        "waha_session": "default",
        "otp_template": "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
    }
    put_resp = requests.put(f"{API_BASE}/whatsapp/settings", headers=headers, json=payload, timeout=40)
    assert put_resp.status_code == 200, put_resp.text
    updated = put_resp.json()
    assert updated.get("provider") == "disabled"
    assert updated.get("app_url") == payload["app_url"]

    msg_resp = requests.get(f"{API_BASE}/whatsapp/messages", headers=headers, timeout=40)
    assert msg_resp.status_code == 200, msg_resp.text
    assert isinstance(msg_resp.json(), list)


def test_submission_review_request_revision_and_resubmit_flow():
    # Submission review module: reviewed -> revision requested -> student resubmission with deadline/late status.
    admin = _login(ADMIN_IDENTIFIER, ADMIN_PASSWORD)
    student = _login(STUDENT_IDENTIFIER, STUDENT_PASSWORD)
    admin_headers = _auth_header(admin["token"])
    student_headers = _auth_header(student["token"])

    assignments_resp = requests.get(f"{API_BASE}/assignments", headers=student_headers, timeout=40)
    assert assignments_resp.status_code == 200, assignments_resp.text
    assignments = assignments_resp.json()
    assert assignments, "No assignments found for student"
    base_assignment = assignments[0]
    create_resp = requests.post(
        f"{API_BASE}/assignments",
        headers=admin_headers,
        json={
            "class_id": base_assignment["class_id"],
            "title": f"ITER5 Revision Flow {datetime.now(timezone.utc).timestamp()}",
            "description": "Fresh assignment for locked resubmission regression",
            "deadline": (datetime.now(timezone.utc) + timedelta(days=2)).isoformat(),
            "allowed_formats": ["pdf"],
            "rubric": [{"criterion": "File", "weight": 100}],
            "practicum_steps": [],
        },
        timeout=40,
    )
    assert create_resp.status_code == 200, create_resp.text
    assignment = create_resp.json()

    submit_resp = requests.post(
        f"{API_BASE}/assignments/{assignment['id']}/submit",
        headers=student_headers,
        files=[("files", ("iter5_submission.pdf", b"%PDF-iteration-5", "application/pdf"))],
        data={"note": "Iteration 5 initial submit"},
        timeout=40,
    )
    assert submit_resp.status_code == 200, submit_resp.text
    submission = submit_resp.json()
    submission_id = submission["id"]
    assert submission.get("status") in ["Sudah Submit", "Terlambat", "Direvisi", "Dinilai"]

    review_resp = requests.post(f"{API_BASE}/submissions/{submission_id}/review", headers=admin_headers, timeout=40)
    assert review_resp.status_code == 200, review_resp.text
    reviewed = review_resp.json()
    assert reviewed.get("review_status") == "reviewed"

    revision_resp = requests.post(
        f"{API_BASE}/submissions/{submission_id}/request-revision",
        headers=admin_headers,
        json={"revision_note": "Perbaiki analisis dan dokumentasi"},
        timeout=40,
    )
    assert revision_resp.status_code == 200, revision_resp.text
    revised = revision_resp.json()
    assert revised.get("status") == "Direvisi"
    assert revised.get("review_status") == "revision_requested"

    resubmit_resp = requests.post(
        f"{API_BASE}/assignments/{assignment['id']}/submit",
        headers=student_headers,
        files=[("files", ("iter5_submission_revised.pdf", b"%PDF-iteration-5-revised", "application/pdf"))],
        data={"note": "Iteration 5 resubmit"},
        timeout=40,
    )
    assert resubmit_resp.status_code == 200, resubmit_resp.text
    resubmission = resubmit_resp.json()
    assert resubmission["id"] == submission_id
    assert resubmission.get("review_status") == "submitted"
    assert resubmission.get("status") in ["Sudah Submit", "Terlambat"]
    assert int(resubmission.get("revision_count", 0)) >= 1

    # Validate updated submission from list endpoint as persistence check.
    list_resp = requests.get(f"{API_BASE}/submissions", headers=student_headers, timeout=40)
    assert list_resp.status_code == 200, list_resp.text
    listed = next((item for item in list_resp.json() if item["id"] == submission_id), None)
    assert listed is not None
    assert listed.get("review_status") == "submitted"
