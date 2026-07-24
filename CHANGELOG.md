# Changelog

Semua perubahan penting pada aplikasi ini dicatat di sini. Versi rilis utama disimpan di file [`VERSION`](./VERSION), sedangkan versi skema database yang sudah diterapkan dicatat oleh tabel `app_schema_migrations` di PostgreSQL.

## [Unreleased]

Gunakan bagian ini untuk perubahan yang belum dirilis. Setiap perubahan database harus memiliki migration SQL baru yang idempotent dan forward-only; jangan mengubah atau menghapus migration yang sudah pernah diterapkan.

## [1.1.0] — 2026-07-24

### Google Meet dan Google Drive

- Memperbaiki pembuatan ruang Google Meet ketika delegasi akun dosen ditolak dengan mencoba akun Workspace default yang telah diverifikasi.
- Mengubah pesan `unauthorized_client` menjadi petunjuk konfigurasi Domain-wide Delegation yang dapat ditindaklanjuti, termasuk Client ID numerik, scope Meet, dan domain akun penyelenggara.
- Menambahkan monitor sinkronisasi file Google Drive beserta status, jumlah percobaan, jadwal percobaan berikutnya, tautan file Drive, serta aksi retry manual.
- Menambahkan scheduler pemeliharaan yang terus mencoba sinkronisasi gagal maksimal lima kali per hari dan melanjutkannya kembali pada hari berikutnya.
- Menghapus salinan lokal file yang telah berhasil tersinkron ke Google Drive setelah 14 hari tanpa menghapus file di Drive atau referensi lampirannya.
- Memperbaiki konsistensi referensi file pada materi, tugas, submission, diskusi, dan chat setelah status penyimpanan berubah.

### Audit aktivitas dan notifikasi

- Menambahkan pencatatan aktivitas pengguna untuk login dan permintaan API terautentikasi, termasuk peran, kategori, status keberhasilan, durasi, serta retensi log yang dapat dikonfigurasi.
- Menambahkan grafik tren aktivitas, ringkasan pengguna aktif, login, kegagalan, dan daftar aktivitas terbaru pada dashboard admin kampus.
- Menambahkan pusat notifikasi pada header admin/dosen dan mahasiswa untuk komentar atau balasan diskusi, submission baru, permintaan masuk kelas, tugas baru, nilai, serta permintaan revisi.
- Mengarahkan klik notifikasi langsung ke materi, komentar, submission, enrollment, atau tugas terkait.
- Mempertahankan angka notifikasi sampai objek tujuan benar-benar berhasil dibuka dan menyimpan status baca per pengguna.

### Materi YouTube dan navigasi halaman

- Menambahkan input khusus link YouTube pada form tambah/edit materi dengan validasi di frontend dan backend.
- Mendukung format `youtube.com`, YouTube Shorts, `youtu.be`, `live`, serta URL embed dan menyimpannya dalam format kanonis.
- Menampilkan video pada halaman materi mahasiswa sebagai embed responsif 16:9 dengan fullscreen, lazy loading, mode `youtube-nocookie.com`, dan tautan cadangan ke YouTube.
- Memisahkan scroll formulir dan daftar pada halaman materi serta tugas, termasuk batas tinggi yang sesuai untuk perangkat seluler.
- Memisahkan scroll daftar pertemuan dan detail materi mahasiswa agar kedua panel dapat dinavigasi secara mandiri.

### Validasi rilis

- Menambahkan test kebijakan storage, agregasi aktivitas, status baca notifikasi, dan normalisasi URL YouTube ke GitHub Actions.
- Build frontend produksi dan pemeriksaan URL backend lokal pada bundle tetap dijalankan pada setiap verifikasi.
- Tidak ada migration SQL atau perubahan versi skema PostgreSQL pada rilis ini.

## [1.0.12] — 2026-07-24

### Penyelesaian repair identitas mahasiswa

- Mengizinkan utility penggabungan akun tidak aktif memindahkan reminder pasif `tugas_baru` berstatus `in_app` ke akun yang dipertahankan.
- Tetap memblokir merge apabila akun sumber memiliki submission, session, enrollment, chat, reminder nilai/revisi, atau referensi lain yang menunjukkan aktivitas pengguna.
- Mendokumentasikan koreksi final: Rafiq Firmansyah menggunakan NIM `24020130` dan Siti Rohmah menggunakan NIM `24010202`.
- Menambahkan test regresi untuk memastikan hanya keanggotaan kelas dan reminder tugas baru pasif yang dapat dipindahkan otomatis.
- Menjalankan test integritas identitas dan kompilasi utility repair sebagai bagian dari verifikasi GitHub Actions.
- Tidak ada migration SQL atau perubahan skema PostgreSQL pada rilis ini.

## [1.0.11] — 2026-07-24

### Integritas identitas mahasiswa

- Menolak email, username, NIM, atau WhatsApp duplikat pada registrasi, tambah mahasiswa manual, join kelas legacy, dan import Excel.
- Menghapus perilaku lama yang diam-diam menambahkan suffix pada username ketika NIM sudah dipakai.
- Menampilkan jumlah konflik identitas pada hasil import agar baris yang dilewati dapat diperiksa admin.
- Menolak login dengan identitas ambigu serta mencegah reset password memilih salah satu akun secara acak.
- Memperbaiki validasi perubahan profil agar konflik email dan username selalu diperiksa, termasuk ketika WhatsApp tidak berubah.
- Menambahkan unique index PostgreSQL untuk `nim`; data legacy duplikat menggunakan fallback non-unique sementara agar backend tetap dapat start sampai repair selesai.
- Menambahkan utility repair dengan mode dry-run, token konfirmasi, transaksi, dan guard aktivitas untuk koreksi NIM serta penggabungan akun mahasiswa duplikat.
- Mendokumentasikan keputusan pemilik data untuk mempertahankan NIM `24010230` pada Rafiq dan akun Haris dengan email berawalan `h***`.
- Tidak ada migration SQL baru; indeks identitas dibuat secara idempotent oleh startup setelah data duplikat diselesaikan.

## [1.0.10] — 2026-07-24

### Hotfix sinkronisasi Google Drive

- Menambahkan dukungan `array_filters` pada adapter PostgreSQL untuk memperbarui referensi file yang tersimpan di dalam array submission dan lampiran tugas.
- Menambahkan pencarian JSONB untuk dotted path yang melewati embedded array, seperti `files.file_id` dan `attachments.file_id`.
- Mencegah proses Retry mengunggah ulang file yang sebenarnya sudah berhasil tersimpan di Google Drive tetapi sebelumnya gagal ketika memperbarui referensi internal.
- Menambahkan test regresi untuk pencarian embedded array, filtered positional update `$[item]`, dan kontrak kompatibilitas `update_many()`.
- Tidak ada migration atau perubahan skema PostgreSQL pada rilis ini.

## [1.0.9] — 2026-07-23

### Hotfix deployment frontend

- Menghapus URL backend lokal `127.0.0.1:8002` dari konfigurasi build produksi.
- Menggunakan origin situs yang sedang dibuka sebagai alamat backend default, sehingga frontend dan endpoint `/api` tetap bekerja melalui domain serta reverse proxy yang sama.
- Menyesuaikan callback dan URL frontend SSO agar mengikuti origin situs, tanpa menanam alamat komputer lokal ke dalam bundle produksi.
- Menambahkan pemeriksaan GitHub Actions yang menggagalkan build jika URL backend lokal port `8002` kembali masuk ke aset JavaScript produksi.
- Tidak ada perubahan skema atau data PostgreSQL pada rilis ini.

## [1.0.8] — 2026-07-23

### Lifecycle kelas dan akhir semester

- Menetapkan status kelas berurutan `Aktif → Berakhir → Nilai difinalisasi → Arsip`, dengan aturan server yang menutup perubahan materi, tugas, anggota, submission, diskusi, dan konfigurasi kelas setelah kelas diakhiri.
- Mempertahankan ruang penilaian pada status `Berakhir` agar dosen dapat menyelesaikan koreksi sebelum finalisasi; kelas `Nilai difinalisasi` dan `Arsip` sepenuhnya read-only.
- Menambahkan finalisasi nilai eksplisit dengan konfirmasi `FINALISASI`, pemeriksaan kelengkapan komponen Tugas/UTS/UAS, snapshot rekap akhir, identitas pemroses, dan waktu finalisasi.
- Menyimpan snapshot bobot nilai saat kelas diakhiri sehingga perubahan bobot mata kuliah pada semester berikutnya tidak mengubah histori nilai semester lama.
- Menambahkan backfill startup yang idempotent untuk snapshot bobot kelas lama berstatus berakhir/final/arsip; tidak ada perubahan versi skema SQL karena field tersimpan dalam dokumen JSONB.
- Menambahkan aksi `Periode baru` dengan konfirmasi `DUPLIKASI` untuk membuat kelas aktif baru berkode baru, tanpa menyalin mahasiswa, materi, tugas, atau submission dari kelas sumber.

### Approval, konfirmasi, dan panduan pengguna

- Menutup bypass endpoint registrasi lama: akun mahasiswa tidak lagi langsung masuk kelas dan selalu membuat permintaan enrollment `pending` yang harus disetujui dosen/admin.
- Menambahkan verifikasi password pada akun lama sebelum endpoint kompatibilitas membuat permintaan kelas.
- Menambahkan konfirmasi pada tindakan penting: membuat/mengubah kelas, publikasi materi, pembuatan tugas, import mahasiswa, approval/reject enrollment, perubahan anggota, bobot/predikat nilai, penilaian, revisi, pengumpulan tugas, penutupan kelas, finalisasi, arsip, dan perubahan periode akademik.
- Menambahkan menu `Panduan LMS` khusus admin, dosen, dan mahasiswa yang menjelaskan alur setup, permintaan masuk kelas, approval, pembelajaran, penilaian, finalisasi, arsip, dan pergantian semester.
- Menambahkan `PANDUAN_LMS.md` sebagai referensi onboarding, checklist finalisasi, dan verifikasi upgrade server.
- Menampilkan status lifecycle dan pesan read-only pada halaman kelas, materi, tugas, penilaian, rekap, diskusi, dan ruang mahasiswa agar pengguna memahami alasan sebuah aksi ditutup.

### Continuous integration

- Memperbarui GitHub Actions ke runtime Node 24 dan menyesuaikan instalasi frontend agar peer dependency proyek dapat dipasang secara konsisten di CI.

## [1.0.7] — 2026-07-23

### Dashboard informatif untuk semua pengguna

- Menata ulang dashboard superadmin dan dosen menjadi pusat kendali berbasis peran dengan sapaan, progres penilaian, status penyimpanan, metrik kelas, dan shortcut tindakan utama.
- Menambahkan prioritas operasional untuk submission belum dinilai, tugas belum dikumpulkan, permintaan masuk kelas, serta mahasiswa yang membutuhkan perhatian.
- Menambahkan grafik aktivitas submission tujuh hari, agenda deadline dengan countdown dan reminder, tabel progres mahasiswa, serta feed submission dan diskusi terbaru.
- Memastikan seluruh data dashboard dosen tetap mengikuti batas kelas yang dikelola, sementara superadmin mendapat ringkasan kampus dan jumlah dosen aktif.
- Memperkaya dashboard mahasiswa dengan persentase penyelesaian tugas, deadline prioritas, progres per kelas, ringkasan aksi, agenda mendatang, serta nilai dan feedback terbaru.
- Menyesuaikan dashboard baru untuk desktop, tablet, perangkat seluler, empty state, dan kebutuhan cetak.

## [1.0.6] — 2026-07-23

### Dashboard laporan analitik

- Mengubah halaman Laporan menjadi dashboard analitik dengan filter kelas dan rentang tren 7, 14, atau 30 hari.
- Menambahkan grafik tren submission harian, status submission, serta perbandingan rata-rata nilai dan ketuntasan penilaian per kelas.
- Menambahkan sorotan submission yang belum dinilai, tingkat keterlambatan, dan kelas dengan performa terbaik untuk mempercepat tindak lanjut.
- Menyesuaikan ringkasan mahasiswa, tugas, submission, dan progres penilaian dengan kelas yang dipilih.
- Menambahkan export Excel/PDF dan cetak langsung dari halaman laporan; export mengikuti filter kelas aktif.
- Menyediakan empty state, layout responsif untuk perangkat seluler, dan tampilan khusus cetak.

## [1.0.5] — 2026-07-22

### Bobot nilai dan rekap per mata kuliah

- Menambahkan pengaturan bobot Tugas, UTS, dan UAS per mata kuliah untuk akun dosen dan superadmin, dengan default 25% · 35% · 40% serta validasi total wajib 100%.
- Menambahkan penandaan komponen nilai pada tugas agar setiap tugas dapat masuk ke kelompok Tugas, UTS, atau UAS.
- Mengubah rekap nilai menjadi nilai akhir berbobot per mahasiswa, menampilkan komposisi bobot, nilai komponen, status sementara/lengkap, dan distribusi grade.
- Menambahkan export rekap per kelas/mata kuliah dalam format Excel dan PDF, serta tombol cetak dari detail rekap.

## [1.0.4] — 2026-07-22

### Tampilan ruang mahasiswa

- Memprioritaskan tugas yang belum dikumpulkan atau diminta revisi pada beranda mahasiswa dan mengganti hitungan aktivitas dengan jumlah tindakan yang benar-benar perlu dikerjakan.
- Mengurutkan daftar tugas berdasarkan kebutuhan tindakan dan deadline, serta membuka tugas pilihan langsung dari kartu prioritas di beranda.
- Memperjelas pengumpulan tugas menjadi tiga langkah: pilih file, tambahkan catatan opsional, lalu kumpulkan.
- Memperjelas status tugas yang sudah terkumpul dan alasan pengiriman ulang dikunci sampai dosen meminta revisi.
- Menyesuaikan tata letak kartu prioritas, progres, status, dan formulir pengumpulan untuk desktop maupun perangkat seluler.

## [1.0.3] — 2026-07-22

### Konfigurasi akademik

- Menata ulang halaman `Prodi, MK & Kelas` menjadi alur tiga langkah: program studi → mata kuliah → kelas semester.
- Menambahkan ringkasan jumlah prodi, mata kuliah, dan kelas aktif serta navigasi lompat ke setiap langkah.
- Menambahkan penjelasan prasyarat agar mata kuliah hanya dibuat setelah prodi tersedia dan kelas hanya dibuat setelah mata kuliah tersedia.
- Menambahkan input SKS pada mata kuliah, placeholder konfigurasi kelas, dan keterangan bahwa kode kelas dibuat otomatis.
- Memperjelas status kelas menjadi `Aktif` atau `Berakhir`, serta menampilkan tahun akademik dan semester di daftar kelas.
- Menyesuaikan kartu, tabel, mode edit, empty state, dan layout mobile agar konfigurasi lebih mudah dipahami.

## [1.0.2] — 2026-07-22

### Penilaian

- Menata ulang halaman Penilaian menjadi alur tiga langkah: pilih tugas/status, pilih mahasiswa, lalu nilai pada satu ruang kerja.
- Menambahkan ringkasan progres kelas, antrean submission dengan prioritas submission yang belum dinilai, pencarian nama/NIM/tugas, dan filter status.
- Memindahkan nilai massal ke panel yang dapat dibuka saat diperlukan agar tidak mengganggu alur penilaian satu submission.
- Menampilkan konteks tugas, waktu kirim, status keterlambatan, catatan mahasiswa, lampiran, rubrik, feedback, dan catatan revisi secara berurutan.
- Memperbaiki sinkronisasi nilai dan feedback saat berpindah submission serta memperbaiki judul kelas yang sebelumnya dapat tampil kosong.
- Menyesuaikan layout desktop dan mobile untuk menjaga antrean, form nilai, tombol aksi, dan navigasi tetap mudah digunakan.

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
