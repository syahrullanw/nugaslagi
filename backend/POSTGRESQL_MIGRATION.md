# Migrasi MongoDB ke PostgreSQL

Backend sekarang menggunakan `DATABASE_URL`. Setiap domain aplikasi memiliki
tabel PostgreSQL fisik tersendiri dengan payload `JSONB`, generated document ID,
GIN index, serta indeks B-tree/unique sesuai pola query di `server.py`. Sorting,
pagination, dan agregasi yang dipakai dashboard dijalankan langsung oleh SQL.

## 1. Cadangkan dan hentikan penulisan

Hentikan backend/worker terlebih dahulu agar tidak ada data baru selama copy.
Buat backup MongoDB sebelum migrasi:

```bash
mongodump --uri="$MONGO_URL" --db="$MONGO_DB_NAME" --out=./mongo-backup
```

## 2. Siapkan PostgreSQL

Untuk development lokal:

```bash
docker compose -f backend/docker-compose.postgres.yml up -d
```

Untuk server/managed PostgreSQL, buat database dan user khusus aplikasi. Gunakan
TLS (`sslmode=require`) bila diwajibkan provider.

## 3. Instal dependency dan periksa sumber

```bash
python -m pip install -r backend/requirements-migration.txt
python backend/scripts/migrate_mongodb_to_postgresql.py \
  --mongo-url="mongodb://localhost:27017" \
  --mongo-db="elearning_dosen" \
  --dry-run
```

## 4. Jalankan migrasi

Target PostgreSQL harus kosong. Skrip menolak target berisi data secara default.

```bash
python backend/scripts/migrate_mongodb_to_postgresql.py \
  --mongo-url="mongodb://localhost:27017" \
  --mongo-db="elearning_dosen" \
  --postgres-url="postgresql://nugaslagi:nugaslagi@localhost:5432/elearning_dosen"
```

Opsi `--truncate-target` hanya untuk mengulang migrasi dengan menghapus seluruh
isi tabel `app_documents`. Jangan gunakan opsi ini pada target yang ingin
dipertahankan.

## 5. Cutover dan verifikasi

Isi `.env` backend:

```dotenv
DATABASE_URL=postgresql://nugaslagi:nugaslagi@localhost:5432/elearning_dosen
DB_POOL_MIN_SIZE=1
DB_POOL_MAX_SIZE=10
DB_COMMAND_TIMEOUT=60
```

Mulai backend. Startup akan membuat/memastikan indeks dan menjalankan seed hanya
jika data utama memang belum ada. Periksa jumlah data:

```sql
SELECT collection_name, table_name
FROM app_collection_registry
ORDER BY collection_name;
```

Lalu smoke-test login admin/mahasiswa, daftar kelas, materi, tugas, submission,
chat, upload/download, dan backup database. Simpan MongoDB dalam mode read-only
sampai verifikasi selesai. Rollback dilakukan dengan menjalankan rilis aplikasi
lama menggunakan MongoDB backup; skrip migrasi tidak mengubah data sumber.
