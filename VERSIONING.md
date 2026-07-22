# Panduan versioning dan upgrade

Dokumen ini menjaga agar upgrade aplikasi dan database dapat ditelusuri tanpa bergantung pada ingatan atau perubahan manual di server.

## Sumber kebenaran

- **Versi aplikasi:** file `VERSION` di root repository, mengikuti SemVer (`MAJOR.MINOR.PATCH`).
- **Versi API:** `GET /api/version`. Endpoint ini aman dibaca oleh health check, panel dukungan, dan proses deployment.
- **Versi skema:** konstanta `SCHEMA_VERSION` di `backend/app_version.py` dan baris pada tabel PostgreSQL `app_schema_migrations`.
- **Jejak perubahan:** `CHANGELOG.md` dan histori Git. Hanya SHA commit yang benar-benar ada yang boleh ditulis sebagai riwayat formal.

Frontend mengambil metadata dari backend, sehingga label versi yang terlihat pengguna selalu menunjukkan backend/database yang sedang dilayani.

## Prosedur merilis perubahan

1. Tentukan bump SemVer: patch untuk perbaikan kompatibel, minor untuk fitur kompatibel, dan major untuk perubahan kontrak atau migrasi database besar.
2. Ubah `VERSION` dan `frontend/package.json`/`frontend/package-lock.json` ke versi yang sama.
3. Jika skema berubah, tambahkan file migration baru bernomor berikutnya di `backend/migrations/`, perbarui `SCHEMA_VERSION`, dan dokumentasikan dampak serta cara verifikasinya di `CHANGELOG.md`.
4. Jalankan test backend, build frontend, dan smoke test `GET /api/version`.
5. Buat satu commit rilis yang deskripsinya menyebut versi, lalu catat SHA commit tersebut di changelog.
6. Deploy backend dan frontend dari commit yang sama. Setelah restart, cocokkan `version`, `git_commit`, dan `schema_versions` dari `/api/version`.

## Metadata deployment

Server dapat mengisi nilai berikut tanpa mengubah source code:

```env
APP_RELEASE_CHANNEL=stable
APP_BUILD_ID=2026-07-22.1
APP_GIT_COMMIT=9272451
APP_BUILD_AT=2026-07-22T10:00:00Z
```

Nilai tersebut muncul di `/api/version` dan membantu mengidentifikasi binary/container yang sedang aktif.

## Verifikasi setelah deploy

```bash
curl -fsS https://domain-anda.example/api/version

psql "$DATABASE_URL" -c \
  'SELECT version, applied_at FROM app_schema_migrations ORDER BY version;'

git log -5 --date=short --pretty='%h %ad %s'
```

Pastikan `database_backend` bernilai `postgresql`, `schema_versions` berisi migration yang diharapkan, dan versi frontend/backend sama.

## Aturan rollback

- Migration database bersifat forward-only. Untuk memperbaiki data, buat migration koreksi baru; jangan menghapus baris migration lama.
- Rollback rilis dilakukan dengan mengembalikan source/frontend ke commit sebelumnya dan memastikan migration yang sudah terpasang tetap kompatibel.
- Sebelum migration produksi, ambil backup PostgreSQL dan simpan hasil `/api/version` sebelum/sesudah deploy.
- MongoDB lama dipertahankan hanya sebagai sumber migrasi atau rollback terencana sampai PostgreSQL dinyatakan stabil; jangan menghapusnya otomatis dari prosedur deploy.

## GitHub sebagai backup dan histori

- Repository resmi: [syahrullanw/nugaslagi](https://github.com/syahrullanw/nugaslagi).
- Setiap perubahan harus masuk melalui commit yang deskriptif; file modified/untracked belum termasuk backup.
- Gunakan branch dan Pull Request untuk menyimpan konteks perubahan serta hasil pemeriksaan GitHub Actions.
- Gunakan annotated tag `vMAJOR.MINOR.PATCH` untuk setiap versi yang dideploy.
- Jalankan `./scripts/github-backup.sh --check` sebelum commit/push dan `./scripts/github-release.sh <versi> --check` sebelum membuat tag.
- Aturan lengkap terdapat pada `CONTRIBUTING.md` dan prosedur operasional terdapat pada `BACKUP_GITHUB.md`.
