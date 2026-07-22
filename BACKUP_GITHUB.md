# Backup dan histori GitHub

Remote resmi:

```text
origin  https://github.com/syahrullanw/nugaslagi.git
```

GitHub hanya menyimpan perubahan yang sudah menjadi commit. File yang masih berstatus modified/untracked belum termasuk backup repository.

## Alur update harian

Mulai dari working tree yang bersih:

```bash
git switch main
git pull --ff-only origin main
git switch -c codex/nama-perubahan
```

Setelah perubahan selesai:

```bash
./scripts/github-backup.sh --check
git status --short
git diff --check
git add <file-yang-memang-ingin-disimpan>
git diff --cached
git commit -m "fix: ringkasan perubahan"
./scripts/github-backup.sh --push
```

Script tidak menjalankan `git add` atau membuat commit otomatis. Tujuannya agar file rahasia dan perubahan yang tidak berkaitan tidak ikut terunggah.

Setelah branch ter-push, buka:

- [Daftar Pull Request](https://github.com/syahrullanw/nugaslagi/pulls)
- [Histori commit main](https://github.com/syahrullanw/nugaslagi/commits/main)
- [Daftar branch](https://github.com/syahrullanw/nugaslagi/branches)

## Membuat release

1. Merge perubahan ke `main` dan tarik versi terbaru dengan `git pull --ff-only origin main`.
2. Pastikan `VERSION`, package frontend, dan `CHANGELOG.md` memuat nomor versi yang sama.
3. Pastikan working tree bersih dan test/build lulus.
4. Jalankan pemeriksaan:

   ```bash
   ./scripts/github-release.sh 1.0.2 --check
   ```

5. Jika hasilnya siap, push `main` dan tag:

   ```bash
   ./scripts/github-release.sh 1.0.2 --push
   ```

Tag dapat dilihat di [GitHub Tags](https://github.com/syahrullanw/nugaslagi/tags). Dari tag tersebut, GitHub Release dapat dibuat bila diperlukan untuk menyertakan catatan rilis atau file build.

## Melihat histori dari terminal

```bash
git log --graph --decorate --oneline --all
git log --date=short --pretty='%h %ad %an %s' -20
git show v1.0.1
git diff v1.0.1..main
```

Untuk membandingkan dua versi di GitHub, gunakan pola:

```text
https://github.com/syahrullanw/nugaslagi/compare/v1.0.1...v1.0.2
```

## Update aplikasi di server

Jangan menjalankan `git pull` jika server memiliki perubahan source code lokal. Simpan konfigurasi server di `.env`, bukan di file source.

```bash
git status --short
git fetch --tags origin
git switch main
git pull --ff-only origin main
git show --stat --oneline HEAD
```

Untuk deployment yang mudah diulang, deploy dari tag yang sudah diuji dan simpan SHA commit pada `APP_GIT_COMMIT`.

## File yang dilarang masuk GitHub

- `.env` dan credential environment lainnya.
- Private key, service-account JSON, token, password, dan cookie/session.
- Backup PostgreSQL/MongoDB yang berisi data pengguna.
- Isi `backend/storage/`, log, cache, virtual environment, dan `node_modules/`.

Jika file rahasia terlanjur masuk commit, jangan hanya menghapus file. Segera rotasi credential lalu bersihkan histori repository dengan prosedur khusus.
