#!/usr/bin/env python3
"""Copy every application collection from MongoDB into PostgreSQL JSONB."""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Iterable, List

import asyncpg
from dotenv import load_dotenv
from pymongo import MongoClient


BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from postgres_database import PostgresDatabase, json_value  # noqa: E402


def arguments() -> argparse.Namespace:
    load_dotenv(BACKEND_DIR / ".env")
    parser = argparse.ArgumentParser(
        description="Migrasikan seluruh dokumen MongoDB aplikasi Nugas Lagi ke PostgreSQL.",
    )
    parser.add_argument("--mongo-url", default=os.environ.get("MONGO_URL", ""))
    parser.add_argument(
        "--mongo-db",
        default=os.environ.get("MONGO_DB_NAME", os.environ.get("DB_NAME", "")),
    )
    parser.add_argument("--postgres-url", default=os.environ.get("DATABASE_URL", ""))
    parser.add_argument("--batch-size", type=int, default=500)
    parser.add_argument(
        "--truncate-target",
        action="store_true",
        help="Hapus seluruh app_documents di PostgreSQL sebelum menyalin (destruktif).",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Periksa koneksi dan tampilkan jumlah dokumen tanpa menulis ke PostgreSQL.",
    )
    values = parser.parse_args()
    if not values.mongo_url or not values.mongo_db:
        parser.error("--mongo-url dan --mongo-db wajib diisi (atau set MONGO_URL/MONGO_DB_NAME)")
    if not values.dry_run and not values.postgres_url:
        parser.error("--postgres-url wajib diisi (atau set DATABASE_URL)")
    if values.batch_size < 1:
        parser.error("--batch-size minimal 1")
    return values


def source_collections(database: Any) -> List[str]:
    return sorted(name for name in database.list_collection_names() if not name.startswith("system."))


def source_counts(database: Any, collections: Iterable[str]) -> Dict[str, int]:
    return {name: int(database[name].count_documents({})) for name in collections}


async def target_counts(database: PostgresDatabase) -> Dict[str, int]:
    names = await database.list_collection_names()
    return {name: await database[name].count_documents({}) for name in names}


async def migrate(values: argparse.Namespace) -> int:
    mongo = MongoClient(values.mongo_url, serverSelectionTimeoutMS=10_000)
    try:
        mongo.admin.command("ping")
        source = mongo[values.mongo_db]
        collections = source_collections(source)
        expected = source_counts(source, collections)
        total = sum(expected.values())
        print(f"Sumber MongoDB: {values.mongo_db} ({len(collections)} collection, {total} dokumen)")
        for name, count in expected.items():
            print(f"  {name}: {count}")
        if values.dry_run:
            print("Dry run selesai; PostgreSQL tidak diubah.")
            return 0

        postgres_url = values.postgres_url.replace("postgresql+asyncpg://", "postgresql://", 1)
        database = PostgresDatabase(postgres_url)
        await database.connect()
        try:
            existing_counts = await target_counts(database)
            existing = sum(existing_counts.values())
            if existing and not values.truncate_target:
                print(
                    f"BATAL: target PostgreSQL sudah berisi {existing} dokumen. "
                    "Gunakan database kosong atau --truncate-target jika memang ingin menggantinya.",
                    file=sys.stderr,
                )
                return 2

            domain_collections = []
            for name in collections:
                collection = database[name]
                await collection._ensure_table()
                domain_collections.append(collection)

            async with database.pool.acquire() as connection:
                async with connection.transaction():
                    if values.truncate_target:
                        rows = await connection.fetch("SELECT table_name FROM app_collection_registry")
                        for row in rows:
                            table_name = str(row["table_name"])
                            if not table_name.startswith("app_doc_") or not table_name.replace("_", "").isalnum():
                                raise ValueError(f"Nama tabel target tidak valid: {table_name}")
                            await connection.execute(f"TRUNCATE TABLE {table_name} RESTART IDENTITY")
                        if await connection.fetchval("SELECT to_regclass('public.app_documents') IS NOT NULL"):
                            await connection.execute("TRUNCATE TABLE app_documents RESTART IDENTITY")

                    for collection in domain_collections:
                        name = collection.name
                        batch: List[tuple[str, ...]] = []
                        copied = 0
                        cursor = source[name].find({}).batch_size(values.batch_size)
                        try:
                            for document in cursor:
                                normalized = json_value(document)
                                batch.append((json.dumps(normalized, ensure_ascii=False, separators=(",", ":"), allow_nan=False),))
                                if len(batch) >= values.batch_size:
                                    await connection.executemany(
                                        f"INSERT INTO {collection.table_name} (data) VALUES ($1::jsonb)",
                                        batch,
                                    )
                                    copied += len(batch)
                                    batch.clear()
                            if batch:
                                await connection.executemany(
                                    f"INSERT INTO {collection.table_name} (data) VALUES ($1::jsonb)",
                                    batch,
                                )
                                copied += len(batch)
                            print(f"Tersalin {name}: {copied}")
                        finally:
                            cursor.close()

            actual = await target_counts(database)
            mismatches = {
                name: {"mongo": count, "postgresql": actual.get(name, 0)}
                for name, count in expected.items()
                if actual.get(name, 0) != count
            }
            extras = {name: count for name, count in actual.items() if name not in expected and count}
            if mismatches or extras:
                print(f"VALIDASI GAGAL: mismatch={mismatches}, extra={extras}", file=sys.stderr)
                return 3
            print(f"Migrasi dan validasi berhasil: {sum(actual.values())} dokumen di PostgreSQL.")
            return 0
        finally:
            await database.close()
    finally:
        mongo.close()


def main() -> int:
    try:
        return asyncio.run(migrate(arguments()))
    except (asyncpg.PostgresError, OSError, ValueError) as exc:
        print(f"Migrasi gagal: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
