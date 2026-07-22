# Aturan kontribusi dan histori GitHub

Repository utama aplikasi ini adalah [syahrullanw/nugaslagi](https://github.com/syahrullanw/nugaslagi). Tujuan aturan ini adalah menjaga agar backup, histori perubahan, versioning aplikasi, dan migration database dapat ditelusuri dari GitHub.

## Aturan branch

- `main` harus selalu dalam kondisi dapat dibuild dan siap dijadikan sumber deployment.
- Pekerjaan baru dibuat dari `main` menggunakan branch singkat dan deskriptif: `feat/nama-fitur`, `fix/nama-bug`, `db/nama-migration`, `docs/nama-dokumen`, atau `codex/nama-tugas`.
- Jangan mengembangkan langsung di `main` untuk perubahan besar. Gunakan Pull Request agar diff, test, dan alasan perubahan tersimpan di GitHub.
- Sinkronisasi dari GitHub harus menggunakan `git pull --ff-only` agar histori tidak membuat merge commit yang tidak disengaja.

## Aturan commit

Satu commit harus mewakili satu perubahan logis. Gunakan format berikut:

```text
<tipe>: <ringkasan singkat>
```

Tipe yang digunakan:

- `feat`: fitur baru.
- `fix`: perbaikan bug.
- `security`: perubahan hak akses atau keamanan.
- `db`: migration, query, atau optimasi database.
- `docs`: dokumentasi saja.
- `test`: perubahan test.
- `build`: dependency, build, atau deployment.
- `chore`: pemeliharaan repository.
- `release`: commit pemotongan versi.

Contoh:

```text
security: batasi pengelolaan akun mahasiswa untuk admin kampus
db: tambahkan indeks pencarian mahasiswa aktif
release: v1.0.2
```

Hindari pesan seperti `update`, `fix`, atau `perubahan terbaru` karena tidak menjelaskan histori.

## Checklist sebelum commit

1. Pastikan tidak ada password, token, service-account JSON, private key, file `.env`, backup database, atau data pengguna di dalam diff.
2. Jalankan `git diff --check`.
3. Jalankan test backend yang relevan dan build frontend.
4. Catat perubahan di bagian `Unreleased` pada `CHANGELOG.md`.
5. Jika kontrak/skema database berubah, buat migration SQL baru dan perbarui `SCHEMA_VERSION`.
6. Tinjau hasil `git diff --cached` sebelum membuat commit.

## Pull Request

- Judul Pull Request mengikuti format commit di atas.
- Isi checklist pada template Pull Request.
- Pastikan workflow `Verify` lulus.
- Untuk satu perubahan logis, gunakan **Squash and merge** agar histori `main` tetap ringkas.
- Jangan merge jika migration, rollback, perubahan permission, atau dampak deployment belum dijelaskan.

## Pengaturan GitHub yang direkomendasikan

Pada GitHub, buat branch protection rule untuk `main` dengan ketentuan:

- Pull Request diperlukan sebelum merge.
- Status check `Backend checks` dan `Frontend build` harus lulus.
- Force push dan penghapusan branch `main` diblokir.
- Conversation pada review harus diselesaikan sebelum merge.

Pengaturan tersebut dilakukan satu kali melalui **Settings → Branches → Branch protection rules** oleh pemilik repository.

## Release dan tag

- Versi mengikuti `VERSION` dan SemVer.
- Commit release harus mencantumkan changelog versi tersebut.
- Setiap versi yang dideploy diberi annotated tag, misalnya `v1.0.2`.
- Gunakan `./scripts/github-release.sh 1.0.2 --check` sebelum release dan tambahkan `--push` hanya ketika benar-benar siap.
- Server produksi sebaiknya mencatat `APP_GIT_COMMIT` sesuai SHA yang dideploy.

Panduan perintah harian tersedia di [`BACKUP_GITHUB.md`](./BACKUP_GITHUB.md).
