#!/usr/bin/env python3
"""Audit and repair confirmed duplicate student identities.

The utility is read-only unless ``--apply`` and the exact confirmation token
printed by its dry-run are both supplied. Run it from the repository root with
the production ``DATABASE_URL`` available in ``backend/.env`` or the
environment.
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Tuple

import asyncpg
from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from identity_integrity import normalize_nim, normalize_username, replace_exact_identity  # noqa: E402


TABLE_NAME = re.compile(r"^app_doc_[A-Za-z0-9_-]+$")


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def redact_email(value: Any) -> str:
    email = str(value or "")
    if "@" not in email:
        return ""
    local, domain = email.split("@", 1)
    return f"{local[:1]}***@{domain}"


def contains_exact(value: Any, needle: str) -> bool:
    if isinstance(value, str):
        return value == needle
    if isinstance(value, dict):
        return any(contains_exact(item, needle) for item in value.values())
    if isinstance(value, list):
        return any(contains_exact(item, needle) for item in value)
    return False


async def user_by_id(connection: asyncpg.Connection, user_id: str) -> Dict[str, Any]:
    value = await connection.fetchval(
        "SELECT data FROM app_doc_users WHERE document_id = $1",
        user_id,
    )
    if not value:
        raise RuntimeError(f"User {user_id!r} tidak ditemukan")
    return dict(json.loads(value) if isinstance(value, str) else value)


async def collection_tables(connection: asyncpg.Connection) -> List[Tuple[str, str]]:
    rows = await connection.fetch(
        "SELECT collection_name, table_name FROM app_collection_registry ORDER BY collection_name"
    )
    output: List[Tuple[str, str]] = []
    for row in rows:
        table_name = str(row["table_name"])
        if not TABLE_NAME.fullmatch(table_name):
            raise RuntimeError(f"Nama tabel registry tidak aman: {table_name!r}")
        output.append((str(row["collection_name"]), table_name))
    return output


async def external_references(
    connection: asyncpg.Connection,
    user_id: str,
) -> List[Tuple[str, str, Dict[str, Any]]]:
    references: List[Tuple[str, str, Dict[str, Any]]] = []
    for collection_name, table_name in await collection_tables(connection):
        if collection_name == "users":
            continue
        rows = await connection.fetch(
            f"SELECT document_id, data FROM {table_name} WHERE data::text LIKE $1",
            f"%{user_id}%",
        )
        for row in rows:
            document = row["data"]
            document = json.loads(document) if isinstance(document, str) else dict(document)
            if contains_exact(document, user_id):
                references.append((collection_name, str(row["document_id"] or ""), document))
    return references


def safe_inactive_merge_reference(collection_name: str, document: Dict[str, Any], source_user_id: str) -> bool:
    if collection_name == "classes":
        reference_field = "student_ids"
        student_ids = document.get(reference_field, [])
        expected_reference = isinstance(student_ids, list) and source_user_id in student_ids
    elif collection_name == "reminder_logs":
        reference_field = "student_id"
        expected_reference = (
            document.get(reference_field) == source_user_id
            and document.get("reminder_type") == "tugas_baru"
            and document.get("status") == "in_app"
        )
    else:
        return False

    return expected_reference and not any(
        contains_exact(value, source_user_id)
        for key, value in document.items()
        if key != reference_field
    )


async def print_user(label: str, user: Dict[str, Any]) -> None:
    print(
        f"{label}: id={user.get('id')} name={user.get('name')} "
        f"nim={user.get('nim')} username={user.get('username')} "
        f"email={redact_email(user.get('email'))} status={user.get('status', 'active')}"
    )


async def merge_inactive_duplicate(
    connection: asyncpg.Connection,
    source_user_id: str,
    target_user_id: str,
    *,
    apply: bool,
    confirmation: str,
) -> None:
    expected_confirmation = f"MERGE:{source_user_id}:{target_user_id}"
    async with connection.transaction():
        source = await user_by_id(connection, source_user_id)
        target = await user_by_id(connection, target_user_id)
        await print_user("Akun sumber (dinonaktifkan)", source)
        await print_user("Akun target (dipertahankan)", target)

        if source.get("role") != "student" or target.get("role") != "student":
            raise RuntimeError("Kedua akun wajib memiliki role student")
        if source_user_id == target_user_id:
            raise RuntimeError("Akun sumber dan target tidak boleh sama")
        if normalize_nim(source.get("nim")) != normalize_nim(target.get("nim")):
            raise RuntimeError("Merge ditolak: NIM kedua akun tidak sama")
        if str(source.get("name", "")).strip().casefold() != str(target.get("name", "")).strip().casefold():
            raise RuntimeError("Merge ditolak: nama kedua akun tidak sama")

        references = await external_references(connection, source_user_id)
        unsafe = [
            (collection_name, document_id)
            for collection_name, document_id, document in references
            if not safe_inactive_merge_reference(collection_name, document, source_user_id)
        ]
        print(f"Referensi eksternal ditemukan: {len(references)}")
        for collection_name, document_id, _document in references:
            print(f"  - {collection_name}/{document_id}")
        if unsafe:
            raise RuntimeError(
                "Merge otomatis ditolak karena akun sumber memiliki aktivitas di luar "
                "keanggotaan kelas atau reminder tugas baru pasif: "
                + ", ".join(f"{name}/{document_id}" for name, document_id in unsafe)
            )

        target_class_ids = list(
            dict.fromkeys([*target.get("class_ids", []), *source.get("class_ids", [])])
        )
        source_archive = {
            "username": source.get("username"),
            "nim": source.get("nim"),
            "email": source.get("email"),
        }
        target["class_ids"] = target_class_ids
        target["identity_merged_at"] = now_iso()
        source.update(
            {
                "status": "merged",
                "merged_into": target_user_id,
                "merged_at": now_iso(),
                "identity_archive": source_archive,
                "username": None,
                "nim": None,
                "whatsapp": "",
                "password_hash": "",
                "class_ids": [],
            }
        )

        print(f"Token konfirmasi: {expected_confirmation}")
        if not apply:
            print("DRY-RUN: tidak ada data yang diubah.")
            return
        if confirmation != expected_confirmation:
            raise RuntimeError("Token konfirmasi tidak cocok; perubahan dibatalkan")

        for collection_name, document_id, document in references:
            updated = replace_exact_identity(document, source_user_id, target_user_id)
            table_name = next(
                table
                for name, table in await collection_tables(connection)
                if name == collection_name
            )
            await connection.execute(
                f"UPDATE {table_name} SET data = $1::jsonb, updated_at = NOW() WHERE document_id = $2",
                json.dumps(updated, ensure_ascii=False),
                document_id,
            )
        await connection.execute(
            "UPDATE app_doc_users SET data = $1::jsonb, updated_at = NOW() WHERE document_id = $2",
            json.dumps(target, ensure_ascii=False),
            target_user_id,
        )
        await connection.execute(
            "UPDATE app_doc_users SET data = $1::jsonb, updated_at = NOW() WHERE document_id = $2",
            json.dumps(source, ensure_ascii=False),
            source_user_id,
        )
        print(
            "APPLIED: akun sumber diarsipkan, keanggotaan kelas dan reminder tugas baru pasif "
            "dipindahkan ke akun target."
        )


async def set_student_nim(
    connection: asyncpg.Connection,
    user_id: str,
    new_nim: str,
    *,
    apply: bool,
    confirmation: str,
) -> None:
    normalized_nim = normalize_nim(new_nim)
    normalized_username = normalize_username(normalized_nim)
    if not normalized_nim:
        raise RuntimeError("NIM baru tidak boleh kosong")
    expected_confirmation = f"SET-NIM:{user_id}:{normalized_nim}"

    async with connection.transaction():
        user = await user_by_id(connection, user_id)
        await print_user("Mahasiswa", user)
        if user.get("role") != "student":
            raise RuntimeError("Akun yang dikoreksi wajib memiliki role student")
        conflict = await connection.fetchrow(
            """
            SELECT document_id, data
            FROM app_doc_users
            WHERE document_id <> $1
              AND ((data->>'nim') = $2 OR LOWER(data->>'username') = $3)
            LIMIT 1
            """,
            user_id,
            normalized_nim,
            normalized_username,
        )
        if conflict:
            raise RuntimeError(f"NIM/username baru masih digunakan oleh user {conflict['document_id']}")

        previous = {"nim": user.get("nim"), "username": user.get("username")}
        user.update(
            {
                "nim": normalized_nim,
                "username": normalized_username,
                "identity_corrected_at": now_iso(),
                "previous_identity": previous,
            }
        )
        print(f"NIM baru: {normalized_nim}; username baru: {normalized_username}")
        print(f"Token konfirmasi: {expected_confirmation}")
        if not apply:
            print("DRY-RUN: tidak ada data yang diubah.")
            return
        if confirmation != expected_confirmation:
            raise RuntimeError("Token konfirmasi tidak cocok; perubahan dibatalkan")

        await connection.execute(
            "UPDATE app_doc_users SET data = $1::jsonb, updated_at = NOW() WHERE document_id = $2",
            json.dumps(user, ensure_ascii=False),
            user_id,
        )
        for collection_name in ("submissions", "enrollment_requests"):
            table_name = next(
                (table for name, table in await collection_tables(connection) if name == collection_name),
                "",
            )
            if not table_name:
                continue
            rows = await connection.fetch(
                f"SELECT document_id, data FROM {table_name} WHERE data->>'student_id' = $1",
                user_id,
            )
            for row in rows:
                document = row["data"]
                document = json.loads(document) if isinstance(document, str) else dict(document)
                document["student_nim"] = normalized_nim
                await connection.execute(
                    f"UPDATE {table_name} SET data = $1::jsonb, updated_at = NOW() WHERE document_id = $2",
                    json.dumps(document, ensure_ascii=False),
                    str(row["document_id"]),
                )
        print("APPLIED: NIM, username, dan salinan NIM pada dokumen terkait sudah diperbarui.")


def parser() -> argparse.ArgumentParser:
    command = argparse.ArgumentParser(description=__doc__)
    command.add_argument("--database-url", default="", help="Override DATABASE_URL")
    subcommands = command.add_subparsers(dest="action", required=True)

    merge = subcommands.add_parser(
        "merge-inactive",
        help="Gabungkan akun duplikat tanpa aktivitas ke akun yang dipertahankan",
    )
    merge.add_argument("--source-user-id", required=True)
    merge.add_argument("--target-user-id", required=True)
    merge.add_argument("--apply", action="store_true")
    merge.add_argument("--confirmation", default="")

    set_nim = subcommands.add_parser("set-nim", help="Koreksi NIM dan username satu mahasiswa")
    set_nim.add_argument("--user-id", required=True)
    set_nim.add_argument("--new-nim", required=True)
    set_nim.add_argument("--apply", action="store_true")
    set_nim.add_argument("--confirmation", default="")
    return command


async def run(args: argparse.Namespace) -> None:
    load_dotenv(BACKEND_DIR / ".env")
    database_url = (args.database_url or os.environ.get("DATABASE_URL", "")).replace(
        "postgresql+asyncpg://",
        "postgresql://",
        1,
    )
    if not database_url:
        raise RuntimeError("DATABASE_URL belum tersedia")
    connection = await asyncpg.connect(database_url)
    try:
        if args.action == "merge-inactive":
            await merge_inactive_duplicate(
                connection,
                args.source_user_id,
                args.target_user_id,
                apply=args.apply,
                confirmation=args.confirmation,
            )
        elif args.action == "set-nim":
            await set_student_nim(
                connection,
                args.user_id,
                args.new_nim,
                apply=args.apply,
                confirmation=args.confirmation,
            )
    finally:
        await connection.close()


if __name__ == "__main__":
    asyncio.run(run(parser().parse_args()))
