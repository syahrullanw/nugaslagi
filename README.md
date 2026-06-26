# Nugas Site

## Google Drive Storage

Upload file mahasiswa akan masuk ke Google Drive otomatis jika admin mengisi konfigurasi Google Drive dari UI admin.

1. Buat service account di Google Cloud dan aktifkan Google Drive API.
2. Salin email service account, lalu share folder Drive yang sudah disediakan ke email tersebut sebagai Editor.
3. Login sebagai admin, buka menu `Google Drive`.
4. Isi ID folder Drive, nama folder root, dan paste isi file JSON service account.
5. Klik `Simpan Google Drive`, lalu `Tes koneksi`.

Struktur folder Drive yang dibuat:

```text
E-Learning Dosen / Tahun Akademik / Semester / Mata Kuliah / Kelas / Tugas / NIM - Nama Mahasiswa / file
```

Jika `GOOGLE_DRIVE_ROOT_FOLDER_ID` diisi, folder akademik dibuat langsung di dalam folder Drive tersebut. File tetap dilayani lewat endpoint aplikasi `/api/files/{file_id}/...` dengan token sesi, sehingga file tidak perlu dibuat publik di Google Drive.

Set `GOOGLE_DRIVE_REQUIRE_UPLOAD=true` jika submission harus ditolak saat Google Drive belum siap atau upload Drive gagal.

Credential dari UI disimpan terenkripsi oleh backend. Kunci enkripsi default berada di `backend/.drive_config.key`; simpan file ini di server produksi agar credential tetap bisa dibaca setelah restart atau redeploy. Untuk deployment terkontrol, isi `GOOGLE_DRIVE_CONFIG_KEY` di environment.
