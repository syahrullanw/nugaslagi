"""Regression coverage for campus-wide multi-lecturer data isolation."""

import io
import os
import uuid

import httpx
import pytest


BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


def auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def login(client: httpx.Client, identifier: str, password: str) -> str:
    response = client.post(
        f"{BASE_URL}/api/auth/login",
        json={"identifier": identifier, "password": password},
    )
    response.raise_for_status()
    return response.json()["token"]


@pytest.mark.skipif(not BASE_URL, reason="REACT_APP_BACKEND_URL is required")
def test_lecturers_only_access_their_own_academic_data():
    suffix = uuid.uuid4().hex[:8]
    client = httpx.Client(timeout=20)
    admin_token = login(client, "dosenadmin", "Dosen123!")
    course = client.get(f"{BASE_URL}/api/courses", headers=auth(admin_token)).json()[0]
    lecturers = []
    classes = []

    try:
        lecturer_tokens = []
        for label in ("a", "b"):
            username = f"dosen_{label}_{suffix}"
            response = client.post(
                f"{BASE_URL}/api/lecturers",
                headers=auth(admin_token),
                json={
                    "employee_id": f"NIDN-{label}-{suffix}",
                    "username": username,
                    "name": f"Dosen {label.upper()} Multi",
                    "email": f"{username}@demo.id",
                    "whatsapp": "",
                    "password": "Dosen123!",
                    "status": "active",
                },
            )
            response.raise_for_status()
            lecturers.append(response.json())
            lecturer_tokens.append(login(client, username, "Dosen123!"))

        for index, token in enumerate(lecturer_tokens):
            response = client.post(
                f"{BASE_URL}/api/classes",
                headers=auth(token),
                json={
                    "academic_year": "2026/2027",
                    "semester": "Ganjil",
                    "course_id": course["id"],
                    "name": f"Tenant-{index + 1}-{suffix}",
                    "schedule": "Senin 08.00",
                },
            )
            response.raise_for_status()
            classes.append(response.json())

        visible_a = client.get(f"{BASE_URL}/api/classes", headers=auth(lecturer_tokens[0])).json()
        visible_b = client.get(f"{BASE_URL}/api/classes", headers=auth(lecturer_tokens[1])).json()
        assert {item["id"] for item in visible_a} == {classes[0]["id"]}
        assert {item["id"] for item in visible_b} == {classes[1]["id"]}

        admin_students_response = client.get(
            f"{BASE_URL}/api/students", headers=auth(admin_token)
        )
        admin_students_response.raise_for_status()
        active_students = [
            item
            for item in admin_students_response.json()
            if item.get("status", "active") == "active"
        ]
        lecturer_students_response = client.get(
            f"{BASE_URL}/api/students", headers=auth(lecturer_tokens[0])
        )
        lecturer_students_response.raise_for_status()
        lecturer_student_ids = {
            item["id"] for item in lecturer_students_response.json()
        }
        assert {item["id"] for item in active_students}.issubset(
            lecturer_student_ids
        )

        forbidden_create = client.post(
            f"{BASE_URL}/api/students",
            headers=auth(lecturer_tokens[0]),
            json={
                "nim": f"FORBIDDEN-{suffix}",
                "name": "Tidak boleh dibuat dosen",
                "email": f"forbidden-{suffix}@demo.id",
                "whatsapp": "",
                "class_id": classes[0]["id"],
                "password": "Mahasiswa123!",
            },
        )
        assert forbidden_create.status_code == 403
        forbidden_import = client.post(
            f"{BASE_URL}/api/classes/{classes[0]['id']}/students/import",
            headers=auth(lecturer_tokens[0]),
            files={
                "file": (
                    "students.xlsx",
                    io.BytesIO(b"not-an-xlsx"),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                )
            },
        )
        assert forbidden_import.status_code == 403

        if active_students:
            existing_student = active_students[0]
            forbidden_status = client.post(
                f"{BASE_URL}/api/students/{existing_student['id']}/status",
                headers=auth(lecturer_tokens[0]),
                json={"status": "inactive"},
            )
            assert forbidden_status.status_code == 403
            forbidden_reset = client.post(
                f"{BASE_URL}/api/students/{existing_student['id']}/reset-password",
                headers=auth(lecturer_tokens[0]),
                json={"password": "MahasiswaBaru123!"},
            )
            assert forbidden_reset.status_code == 403
            add_existing = client.post(
                f"{BASE_URL}/api/classes/{classes[0]['id']}/students/{existing_student['id']}/add",
                headers=auth(lecturer_tokens[0]),
            )
            add_existing.raise_for_status()
            remove_existing = client.post(
                f"{BASE_URL}/api/classes/{classes[0]['id']}/students/{existing_student['id']}/remove",
                headers=auth(lecturer_tokens[0]),
            )
            remove_existing.raise_for_status()

        material_payload = {
            "class_id": classes[0]["id"],
            "title": "Materi tenant A",
            "description": "isolasi",
            "meeting": "Pertemuan 1",
            "file_url": "",
            "video_url": "",
            "is_active": True,
            "locked_until": "",
        }
        material_response = client.post(
            f"{BASE_URL}/api/materials", json=material_payload, headers=auth(lecturer_tokens[0])
        )
        material_response.raise_for_status()
        material = material_response.json()

        forbidden = client.put(
            f"{BASE_URL}/api/materials/{material['id']}",
            json={**material_payload, "title": "Tidak boleh"},
            headers=auth(lecturer_tokens[1]),
        )
        assert forbidden.status_code == 404
        visible_material_ids = {
            item["id"]
            for item in client.get(
                f"{BASE_URL}/api/materials", headers=auth(lecturer_tokens[1])
            ).json()
        }
        assert material["id"] not in visible_material_ids
        assert client.get(f"{BASE_URL}/api/lecturers", headers=auth(lecturer_tokens[0])).status_code == 403
    finally:
        for class_doc in classes:
            client.delete(f"{BASE_URL}/api/classes/{class_doc['id']}", headers=auth(admin_token))
        for lecturer in lecturers:
            client.delete(f"{BASE_URL}/api/lecturers/{lecturer['id']}", headers=auth(admin_token))
        client.close()
