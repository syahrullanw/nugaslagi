# Perbaikan Identitas Mahasiswa Duplikat

Dokumen ini mendampingi rilis `v1.0.11`. Semua perintah perbaikan bersifat
**dry-run** secara default. Jangan menggunakan `--apply` sebelum backup
PostgreSQL terverifikasi dan hasil dry-run sudah diperiksa.

## Urutan aman

1. Deploy kode `v1.0.11`. Startup tidak lagi gagal ketika menemukan duplikat
   lama, tetapi mencatat error dan memasang indeks non-unique sementara.
2. Pastikan `nugas-backend`, Nginx, dan PostgreSQL sehat.
3. Jalankan dry-run untuk setiap perubahan identitas.
4. Cocokkan nama, NIM, email tersamarkan, referensi, dan token konfirmasi.
5. Jalankan ulang dengan `--apply` dan token yang dicetak dry-run.
6. Restart backend. Startup akan mengaktifkan unique index `username` dan
   `nim` setelah seluruh duplikat diselesaikan.
7. Audit ulang jumlah user, kelas, submission, dan keanggotaan mahasiswa.

## Haris Fajriansyah

Keputusan pemilik aplikasi: akun dengan email berawalan `h***` dipertahankan;
akun `a***` menjadi akun sumber. Gunakan UUID penuh dari audit server:

```bash
cd /var/www/nugas
sudo -u www-data backend/.venv/bin/python \
  backend/scripts/repair_duplicate_student_identities.py \
  merge-inactive \
  --source-user-id '<UUID akun a***>' \
  --target-user-id '<UUID akun h***>'
```

Perintah akan menolak merge jika akun sumber memiliki submission, session,
enrollment, chat, atau referensi lain di luar keanggotaan kelas. Jika dry-run
aman, salin token yang dicetak dan jalankan:

```bash
sudo -u www-data backend/.venv/bin/python \
  backend/scripts/repair_duplicate_student_identities.py \
  merge-inactive \
  --source-user-id '<UUID akun a***>' \
  --target-user-id '<UUID akun h***>' \
  --apply \
  --confirmation 'MERGE:<UUID akun a***>:<UUID akun h***>'
```

Akun sumber tidak dihapus. Statusnya menjadi `merged`, login dinonaktifkan,
identitas lamanya disimpan pada `identity_archive`, dan keanggotaan kelas
dipindahkan ke akun target.

## Rafiq Firmansyah dan Siti Rohmah

Keputusan pemilik aplikasi: NIM `24010230` tetap milik Rafiq. NIM Siti harus
dikonfirmasi dari sumber akademik sebelum koreksi dilakukan.

Setelah NIM Siti diketahui, jalankan dry-run:

```bash
sudo -u www-data backend/.venv/bin/python \
  backend/scripts/repair_duplicate_student_identities.py \
  set-nim \
  --user-id '<UUID akun Siti>' \
  --new-nim '<NIM Siti yang benar>'
```

Lanjutkan hanya jika identitas dan token konfirmasi benar:

```bash
sudo -u www-data backend/.venv/bin/python \
  backend/scripts/repair_duplicate_student_identities.py \
  set-nim \
  --user-id '<UUID akun Siti>' \
  --new-nim '<NIM Siti yang benar>' \
  --apply \
  --confirmation 'SET-NIM:<UUID akun Siti>:<NIM SITI>'
```

Koreksi juga memperbarui salinan `student_nim` pada submission dan permintaan
enrollment, tanpa menghapus aktivitas mahasiswa.
