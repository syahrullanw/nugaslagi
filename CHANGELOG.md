# Changelog

Semua perubahan penting pada aplikasi ini dicatat di sini. Versi rilis utama disimpan di file [`VERSION`](./VERSION), sedangkan versi skema database yang sudah diterapkan dicatat oleh tabel `app_schema_migrations` di PostgreSQL.

## [Unreleased]

Gunakan bagian ini untuk perubahan yang belum dirilis. Setiap perubahan database harus memiliki migration SQL baru yang idempotent dan forward-only; jangan mengubah atau menghapus migration yang sudah pernah diterapkan.

### Continuous integration

- Memperbarui GitHub Actions ke runtime Node 24 dan menyesuaikan instalasi frontend agar peer dependency proyek dapat dipasang secara konsisten di CI.

## [1.0.1] — 2026-07-22

### Hak akses mahasiswa

- Membatasi pembuatan akun mahasiswa manual dan import Excel hanya untuk admin kampus.
- Dosen dapat melihat katalog mahasiswa aktif yang sudah terdaftar di sistem dan memasukkannya ke kelas yang dikelola.
- Mahasiswa nonaktif hanya terlihat oleh dosen bila sudah menjadi anggota kelas yang dikelolanya.
- Ringkasan progres yang diterima dosen dibatasi pada kelas milik dosen tersebut meskipun katalog mahasiswa aktif bersifat kampus-wide.
- Perubahan status akun dan reset password mahasiswa dibatasi untuk admin kampus; dosen tetap dapat mengelola keanggotaan kelas.
- Form tambah mahasiswa dan import Excel disembunyikan dari UI dosen, sementara pencarian serta aksi memasukkan mahasiswa aktif tetap tersedia.
- Tidak ada perubahan skema database; versi skema tetap `002_domain_tables`.

### Repository dan backup

- Menetapkan `https://github.com/syahrullanw/nugaslagi.git` sebagai remote resmi dan sumber histori aplikasi.
- Menambahkan aturan branch, commit konvensional, Pull Request, release, tag, perlindungan credential, serta deployment berbasis commit/tag.
- Menambahkan script pemeriksaan/push backup dan release yang tidak melakukan stage atau commit otomatis.
- Menambahkan template Pull Request dan workflow GitHub Actions untuk compile/test backend serta build frontend.

## [1.0.0] — 2026-07-22

Rilis baseline untuk operasional PostgreSQL dan pelacakan upgrade.

### Versi dan dukungan operasional

- Menambahkan sumber versi terpusat melalui `VERSION` (`1.0.0`) dan metadata backend di `backend/app_version.py`.
- Menambahkan endpoint `GET /api/version` serta field `version` pada respons root API.
- Menampilkan versi aplikasi dan versi skema database pada layar login serta sidebar admin/dosen/mahasiswa.
- Menambahkan `VERSIONING.md` berisi prosedur bump versi, deployment, pemeriksaan skema, dan rollback.
- Menetapkan metadata deployment opsional: `APP_RELEASE_CHANNEL`, `APP_BUILD_ID`, `APP_GIT_COMMIT`, dan `APP_BUILD_AT`.

### PostgreSQL

- Runtime aplikasi berpindah dari MongoDB ke PostgreSQL melalui adapter kompatibilitas async.
- Data domain disimpan pada tabel `app_doc_<collection>` dengan payload `JSONB`, `document_id`, timestamp, indeks GIN untuk pencarian JSONB, serta indeks B-tree untuk filter/sort umum.
- Menambahkan unique index per domain agar semantik `_id` tetap terjaga.
- Query filter, sort, pagination, dan aggregate yang digunakan aplikasi dikompilasi ke SQL PostgreSQL.
- Menambahkan pool koneksi yang dapat dikonfigurasi melalui `DB_POOL_MIN_SIZE`, `DB_POOL_MAX_SIZE`, dan `DB_COMMAND_TIMEOUT`.

### Migration dan deployment

- `backend/migrations/001_postgresql_jsonb.sql`: metadata migration dan baseline PostgreSQL.
- `backend/migrations/002_domain_tables.sql`: registry tabel domain.
- `backend/scripts/migrate_mongodb_to_postgresql.py`: migrasi MongoDB ke tabel domain PostgreSQL, validasi jumlah dokumen, mode `--dry-run`, dan `--truncate-target`.
- `backend/docker-compose.postgres.yml`: PostgreSQL lokal/development.
- `backend/migration-requirements.txt`: dependensi terpisah untuk menjalankan migrasi.
- `.env.example` diperbarui untuk membedakan koneksi runtime PostgreSQL dari koneksi MongoDB yang hanya diperlukan sebagai sumber migrasi.

### Validasi rilis

- Endpoint kritis backend, login admin, alur OTP, dan frontend diverifikasi berjalan.
- Adapter PostgreSQL dan integration test yang relevan lulus.
- Migrasi diuji pada database PostgreSQL sementara dengan validasi collection dan jumlah dokumen.

## Riwayat Git yang dapat diverifikasi

Riwayat formal yang dapat diverifikasi di repository:

| Tanggal | Commit | Ringkasan |
| --- | --- | --- |
| 2026-07-20 | `28636a8` | `feat: add visual grade recap per course with Recharts charts` — baseline aplikasi dan rekap nilai visual. |
| 2026-07-20 | `9272451` | `chore: include frontend build output for deployment` — memasukkan hasil build frontend untuk deployment. |
| 2026-07-22 | `d24f393` | `release: v1.0.1 PostgreSQL and access-control baseline` — baseline PostgreSQL, permission mahasiswa, versioning, dan workflow GitHub. |

## Perubahan working tree yang dipetakan sebelum `1.0.0`

Bagian ini sengaja tidak diberi SHA per fitur karena perubahan tersebut masih berupa working tree/uncommitted ketika inventaris awal dibuat. Seluruh baseline tersebut kemudian dibakukan dalam commit `d24f393`.

- **Identitas dan akses:** integrasi SSO SCI-ID/OIDC, login lokal, logout, registrasi, lupa/reset password, OTP email/WhatsApp, serta konfigurasi provider.
- **Tenancy dan peran:** dukungan multi-lecturer, admin kampus, dosen, mahasiswa, enrollment kelas, dan isolasi data per tenant.
- **Pembelajaran:** course/class, materi, pertemuan online/offline, komentar, attachment, assignment, deadline, submission, revisi, rubrik, penilaian, grade predicate, rekap, export, dan notifikasi.
- **UI:** branding kampus, dashboard per peran, widget chat, kalender, progress, empty state, dan visualisasi nilai dengan Recharts.
- **Storage:** adapter PostgreSQL, migration SQL, tool migrasi MongoDB, indeks domain, konfigurasi pool, compose PostgreSQL, serta test kompatibilitas.

### Inventaris artefak yang dapat ditelusuri

- **Backend/runtime:** `backend/server.py`, `backend/postgres_database.py`, `backend/app_version.py`, `backend/.env.example`, `backend/requirements.txt`, dan `backend/requirements-migration.txt`.
- **Database/deployment:** `backend/migrations/001_postgresql_jsonb.sql`, `backend/migrations/002_domain_tables.sql`, `backend/scripts/migrate_mongodb_to_postgresql.py`, `backend/docker-compose.postgres.yml`, dan `backend/POSTGRESQL_MIGRATION.md`.
- **Frontend:** `frontend/src/App.js`, `frontend/src/App.css`, `frontend/package.json`, `frontend/package-lock.json`, `frontend/.env.production`, dan hasil `frontend/build/`.
- **Test yang dipetakan:** `test_auth_front_register_forgot_change_password.py`, `test_iteration3_revision_features.py`, `test_iteration5_password_whatsapp_review.py`, `test_iteration6_password_whatsapp_review_regression.py`, `test_iteration7_grade_predicates.py`, `test_material_meeting_crud.py`, `test_multi_lecturer_tenancy.py`, `test_mvp_elearning_flows.py`, `test_postgres_database_compat.py`, `test_revision_feature_set.py`, `test_sso_oidc_integration.py`, dan `test_unified_login_enrollment_deadline_settings.py`.

Saat memotong rilis berikutnya, pindahkan item yang sudah selesai ke bagian versi baru dan sertakan SHA commit yang benar-benar dibuat.
