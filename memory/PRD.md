# PRD — E-Learning Dosen PWA

## Original Problem Statement
Aplikasi web e-learning pribadi untuk dosen yang mobile-friendly/PWA, digunakan untuk mengelola mata kuliah, materi, tugas, pengumpulan tugas mahasiswa, penilaian, diskusi, reminder WhatsApp, penyimpanan file Google Drive, monitoring progres akademik, dan export laporan. Role utama: Dosen/Admin dan Mahasiswa.

## User Choices
- Prioritas MVP diserahkan ke agent.
- Login: email/password untuk Dosen/Admin dan Mahasiswa; mahasiswa juga dapat bergabung memakai kode kelas.
- Penyimpanan file: Google Drive dilewati sementara atas instruksi user; file submission disimpan di server dengan struktur folder jelas.
- WhatsApp: ditunda; reminder cukup tampil/log di aplikasi.
- Import/Export Excel: aktif untuk import mahasiswa dan export rekap nilai.

## Architecture Decisions
- Frontend: React PWA dengan Tailwind, Shadcn UI, layout sidebar untuk dosen dan top-nav untuk mahasiswa.
- Backend: FastAPI dengan MongoDB via Motor; semua response MongoDB mengecualikan `_id`.
- Auth: session token opaque tersimpan di MongoDB, password bcrypt.
- File submission: endpoint multipart menyimpan file di server pada folder `/app/backend/storage/E-Learning Dosen/{Tahun Akademik}/{Semester}/{Mata Kuliah}/{Kelas}/{Tugas}/{NIM - Nama}/`. Metadata menyimpan `file_name`, `file_id`, `file_url`, `mime_type`, `size`, `folder_path`, `storage_path`, `uploaded_by`, `uploaded_at`, dan `submission_id`.
- Excel: openpyxl untuk import mahasiswa dan export rekap nilai.

## User Personas
- Dosen/Admin: mengelola mata kuliah, kelas, mahasiswa, materi, tugas, submission, nilai, reminder, laporan.
- Mahasiswa: login/gabung kelas, membaca materi/tugas, upload submission, melihat status, nilai, dan feedback.

## Core Requirements
- Dashboard dosen dengan statistik akademik dan progres.
- Manajemen mata kuliah, kelas, kode kelas, mahasiswa manual/import Excel.
- Modul materi dan komentar diskusi dasar.
- Modul tugas termasuk deadline, toleransi, format file, rubrik berbobot, mode praktikum.
- Submission mahasiswa, metadata file, status submission.
- Penilaian berbobot, feedback, penalty keterlambatan.
- Reminder in-app dan log reminder.
- Kalender deadline dan laporan/export Excel.
- PWA manifest dan service worker.

## Implemented — 2026-05-23
- MVP full-stack selesai: auth dosen/mahasiswa, join kode kelas, dashboard, CRUD mata kuliah/kelas/mahasiswa, import Excel, materi, komentar, tugas, praktikum, submission, grading, progress, calendar, reminder in-app, export Excel.
- UI responsif desktop/mobile mengikuti tema Swiss high-contrast dengan data-testid pada elemen utama/interaktif.
- Seed data demo tersedia: admin `dosen@demo.id / Dosen123!`, mahasiswa `alya@demo.id / Mahasiswa123!`, kelas `WEB4A1`.
- Pengujian: backend regression 16 test passed via testing agent; self-test frontend admin/student/mobile passed; build frontend passed.
- Update lanjutan: Google Drive dilewati sementara; submission kini disimpan lokal di server dengan endpoint download aman `/api/files/{file_id}/download`. Self-test submit/download file lokal berhasil.
- Update lanjutan: login menjadi satu pintu memakai username/NIM/nomor HP/email + password; mahasiswa meminta masuk kelas dengan kode kelas setelah login, lalu dosen ACC sebelum kelas terlihat.
- Update lanjutan: tugas mendukung pilihan tutup setelah deadline atau terima terlambat dengan `late_hours`, `late_days`, dan `late_text`; submission mendukung banyak file dokumen/foto.
- Update lanjutan: diskusi materi mendukung lampiran gambar via endpoint multipart; tugas dapat dikaitkan ke materi tertentu.
- Update lanjutan: penilaian massal tersedia untuk banyak submission sekaligus; Settings aplikasi ditambahkan untuk kampus, mapel/prodi, dosen, logo, tahun ajaran, semester, serta panduan ganti tahun ajaran.
- Pengujian lanjutan: testing agent menjalankan suite baru untuk unified login, enrollment approval, deadline behavior, multi-file submission, comment image, bulk grading, settings, rollover preview, dan UI desktop/mobile — 9 backend tests passed, frontend build passed.
- Update revisi: penilaian massal kini berupa daftar semua submission siap dinilai dengan nilai/feedback terpisah per mahasiswa, bukan satu nilai untuk semua.
- Update revisi: materi menampilkan tugas yang terkait langsung, termasuk pada panel mahasiswa; data demo seeded sudah di-backfill agar tugas terkait muncul di materi.
- Update revisi: komentar materi memakai state per materi sehingga mengetik di satu komentar tidak lagi mengisi komentar materi lain; komentar juga mendukung lampiran gambar.
- Update revisi: settings mendukung penggantian nama aplikasi dan logo; sidebar admin mengikuti nama aplikasi tersimpan.
- Update revisi: kelas dapat diakhiri menjadi status `ended/Berakhir` sebagai riwayat mahasiswa; halaman Mahasiswa memiliki manajemen user per kelas untuk aktivasi/nonaktivasi dan melepas mahasiswa dari kelas.
- Update revisi lanjutan: penilaian massal kini terstruktur dengan filter kelas/mapel dan tugas, lalu menampilkan grup nilai per tugas beserta course/class agar tidak acak.
- Update revisi lanjutan: tugas terkait di panel materi mahasiswa menjadi link klik langsung ke kartu pengerjaan tugas.
- Update revisi lanjutan: manajemen user per kelas memiliki reset password mahasiswa.
- Update revisi lanjutan: pembuatan tugas/soal mendukung lampiran PDF/DOC/DOCX, disimpan lokal dan dapat diunduh dengan token.
- Update revisi UI: tema aplikasi diganti ke basis biru dan navigasi mobile admin dibuat lebih ramah layar kecil.
- Pengujian iteration 3: backend pytest 3/3 passed, frontend Playwright passed, build passed; tidak ada issue fungsional pada scope revisi.
- Update auth lanjutan: halaman depan kembali memiliki tombol/tab Daftar untuk mahasiswa baru, tombol/tab Lupa Password, serta form request reset password.
- Update auth lanjutan: dashboard dosen dan mahasiswa memiliki kartu Ganti Password yang memanggil endpoint `/api/auth/change-password`.
- Pengujian iteration 4: register mahasiswa, forgot password, change password mahasiswa/admin, unified login, dan mobile auth usability lulus; backend test 7/7 passed.
- Update auth/WhatsApp lanjutan: form ganti password dipindahkan dari dashboard ke halaman khusus PasswordPage; header dosen dan mahasiswa hanya menampilkan tombol Ganti Password.
- Update auth/WhatsApp lanjutan: lupa password memakai OTP otomatis via WhatsApp gateway; endpoint `/api/auth/forgot-password` membuat OTP + antrean pesan, dan `/api/auth/reset-password-otp` mengganti password dengan OTP.
- Update WhatsApp gateway: halaman konfigurasi Fonnte/WAHA ditambahkan, termasuk app reset link, token/API key, session, template OTP, antrean pesan, histori pesan, dan retry.
- Update review tugas: dosen bisa menandai submission sudah dilihat (`reviewed`), meminta revisi (`revision_requested`/`Direvisi`), atau memberi nilai (`graded`/`Dinilai`). Mahasiswa dapat submit ulang setelah revisi mengikuti aturan deadline/telat tugas.
- Pengujian iteration 5: backend regression 4/4 passed dan frontend Playwright passed; tidak ada issue fungsional. WhatsApp berstatus `pending_config` bila provider disabled sampai gateway dikonfigurasi.
- Update iteration 6: halaman ganti password dipastikan tidak tampil inline di dashboard; header admin/mahasiswa membuka PasswordPage.
- Update iteration 6: forgot-password OTP UI menampilkan field OTP dan password baru setelah request; backend membuat antrean WhatsApp otomatis.
- Update iteration 6: halaman WhatsApp menampilkan konfigurasi Fonnte/WAHA serta antrean/histori pesan dengan tombol retry.
- Update iteration 6: grading page menampilkan aksi Dilihat/Revisi; backend review/revision/resubmission rules tervalidasi.
- Pengujian iteration 6: backend regression 7/7 passed, frontend Playwright passed, build passed; tidak ada issue fungsional.
- Update iteration 7: predikat nilai A-E otomatis ditambahkan saat tugas dinilai, baik penilaian satu submission maupun penilaian massal.
- Update iteration 7: range predikat default tersedia: A 85-100, B 70-84.99, C 60-69.99, D 50-59.99, E 0-49.99; admin dapat mengubah range default atau per kelas melalui halaman Predikat.
- Update iteration 7: submission response memperkaya data lama yang belum punya predikat, export Excel memiliki kolom Predikat, grading UI menampilkan kolom predikat, dan mahasiswa melihat nilai beserta predikat.
- Pengujian iteration 7: backend regression 7/7 passed, Playwright frontend passed, build passed; tidak ada broken flow pada scope predikat.

## Current Known Configuration State
- Penyimpanan aktif saat ini: server lokal terstruktur. Submission baru berstatus `stored_on_server`; submission lama dari fase sebelumnya dapat muncul sebagai `File lama` bila belum tersimpan ulang.
- WhatsApp Cloud API belum diintegrasikan sesuai pilihan user; reminder berjalan sebagai in-app log.
- Public join-class lama masih ada untuk backward compatibility, tetapi UI utama memakai alur baru: login → request kode kelas → ACC dosen.
- Kelas berstatus `ended` tetap tercatat pada riwayat/kelas mahasiswa dan bisa dilihat kemudian.

## Prioritized Backlog
### P0
- Tambahkan halaman detail tugas yang menampilkan daftar submit/belum submit per kelas.
- Tambahkan manajemen file lokal: hapus/replace file submission dan batas ukuran file.
- Tambahkan UI lampiran gambar pada komentar diskusi; backend endpoint sudah tersedia.
- Tambahkan tampilan detail riwayat kelas berakhir di profil mahasiswa.
- Bersihkan warning React Hook dependency agar build benar-benar tanpa warning.
- Tambahkan panel admin untuk melihat dan memproses daftar permintaan lupa password dari mahasiswa.
- Konfigurasi real Fonnte/WAHA diperlukan untuk menguji transisi pesan dari `pending` ke `sent/failed` secara nyata.
- Build masih memiliki warning non-blocking React Hook exhaustive-deps di App.js.
- Range predikat tidak boleh overlap; validasi backend sudah aktif.

### P1
- Tambahkan detail halaman kelas/tugas/materi per entity, thread diskusi penuh, pin/unpin komentar.
- Tambahkan template bank tugas, template rubrik, dan template feedback cepat.
- Tambahkan arsip semester lengkap.

### P2
- Integrasi WhatsApp Cloud API/gateway untuk reminder otomatis H-3, H-1, H-6 jam, after-deadline.
- Laporan aktivitas kelas lebih detail dan visualisasi tren nilai.
- Push notification PWA.

## Next Tasks
1. Tambahkan halaman detail assignment dengan daftar mahasiswa belum submit.
2. Tambahkan scheduler reminder otomatis.
3. Tambahkan template rubrik dan bank tugas.
4. Tambahkan manajemen file lokal lanjutan.
5. Tambahkan UI detail thread diskusi dengan preview lampiran gambar.
6. Tambahkan halaman riwayat akademik mahasiswa per kelas/mapel berakhir.
7. Rapikan warning useEffect dependency di frontend.
8. Tambahkan UI daftar permintaan reset password untuk dosen/admin.
9. Konfigurasikan gateway WhatsApp nyata di UI dan retest pengiriman OTP sampai status `sent`.
10. Bersihkan warning React Hook dependency di App.js.
