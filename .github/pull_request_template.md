## Ringkasan

Jelaskan perubahan dan alasan bisnis/teknisnya.

## Dampak

- [ ] Backend/API
- [ ] Frontend/UI
- [ ] Hak akses/keamanan
- [ ] Database/migration
- [ ] Deployment/configuration
- [ ] Dokumentasi saja

## Verifikasi

- [ ] Tidak ada credential, `.env`, backup database, atau data pengguna di diff.
- [ ] `git diff --check` lulus.
- [ ] Test backend yang relevan lulus.
- [ ] Build frontend lulus.
- [ ] `CHANGELOG.md` diperbarui.
- [ ] `VERSION` diperbarui bila ini adalah release.
- [ ] Migration baru bersifat forward-only dan memiliki rencana rollback/verifikasi.

## Cara rollback

Tuliskan commit/tag yang harus digunakan dan dampak terhadap database.
