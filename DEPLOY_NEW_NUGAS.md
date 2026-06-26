# Update Server `new.nugas.site`

Target:
- Domain: `new.nugas.site`
- SSH: `syahrul@10.11.12.100`
- Direktori aplikasi: `/var/www/nugas/`
- Backend lokal server: `127.0.0.1:8010`
- Frontend build: `/var/www/nugas/frontend/build`

Paket rilis terbaru:

```text
release/nugas-update-new.nugas.site-20260601-assignment-edit-upgrade.tar.gz
```

Isi update:
- Dosen/admin bisa menekan tombol `Edit` pada card tugas berjalan.
- Form tugas berubah ke mode edit untuk mengubah judul, instruksi, link lampiran, tanggal tayang, deadline, format jawaban, maksimal upload, materi terkait, dan mode praktikum.
- Edit tugas tidak mengubah submission mahasiswa yang sudah masuk.
- Deadline dan penalti tugas disimpan sebagai snapshot pada submission, sehingga penilaian submission lama tidak berubah setelah informasi tugas diedit.
- Card tugas mahasiswa menampilkan format jawaban dan ukuran maksimal upload per file.
- Form pembuatan tugas memiliki field `Lampiran link`.
- Form pembuatan tugas memiliki field `Maksimal upload per file (MB)`, default 5 MB per file.
- Backend memvalidasi ukuran setiap file jawaban berdasarkan setting tugas masing-masing.
- Lupa password tidak lagi mengisi OTP otomatis saat WhatsApp gateway aktif.
- Lupa password menampilkan status/antrian pesan OTP WhatsApp dari backend.
- Respons reset password publik tidak lagi mengirim nilai OTP lokal; OTP lokal hanya dipakai fallback saat gateway lokal belum siap.

## 1. Build Di Komputer Lokal

Jalankan dari root project:

```bash
cd /Users/syahrulanwar/Documents/nugas.site-main
REACT_APP_BACKEND_URL=https://new.nugas.site npm --prefix frontend run build

MAIN_JS=$(node -p "require('./frontend/build/asset-manifest.json').files['main.js'].replace(/^\\//, '')")
grep -aoE 'https://new\.nugas\.site|http://10\.10\.10\.111:8010' "frontend/build/$MAIN_JS" | sort -u
```

Build production disiapkan untuk:

```env
REACT_APP_BACKEND_URL=https://new.nugas.site
```

Hasil `grep` hanya boleh memuat `https://new.nugas.site`. Jika masih muncul
`http://10.10.10.111:8010`, frontend akan gagal memuat data saat dibuka dari
domain production meskipun backend sehat.

## 2. Upload Paket Update

Paket update lengkap yang sudah disiapkan berada di folder `release/`. Gunakan
paket lengkap ini saat menjalankan `rsync --delete`; jangan gunakan arsip
`nugas-material-meeting-fix-20260526.tar.gz` karena arsip tersebut hanya berisi
file patch dan dapat membuat file runtime lain terhapus.

```bash
scp release/nugas-update-new.nugas.site-20260601-assignment-edit-upgrade.tar.gz syahrul@10.11.12.100:/tmp/
scp release/nugas-update-new.nugas.site-20260601-assignment-edit-upgrade.tar.gz.sha256 syahrul@10.11.12.100:/tmp/
```

## 3. Backup Server

Masuk ke server:

```bash
ssh syahrul@10.11.12.100
```

Buat backup aplikasi saat ini:

```bash
sudo mkdir -p /var/www/backups
sudo tar \
  --exclude='/var/www/nugas/backend/.venv' \
  --exclude='/var/www/nugas/backend/.venv312' \
  --exclude='/var/www/nugas/frontend/node_modules' \
  --exclude='/var/www/nugas/backend/__pycache__' \
  -czf /var/www/backups/nugas-before-update-$(date +%Y%m%d-%H%M%S).tar.gz \
  -C /var/www nugas
```

## 4. Extract Dan Sync Update

```bash
RELEASE_DIR=/tmp/nugas-update-$(date +%Y%m%d-%H%M%S)
mkdir -p "$RELEASE_DIR"
cd /tmp
sha256sum -c nugas-update-new.nugas.site-20260601-assignment-edit-upgrade.tar.gz.sha256
tar -xzf /tmp/nugas-update-new.nugas.site-20260601-assignment-edit-upgrade.tar.gz -C "$RELEASE_DIR"

test -f "$RELEASE_DIR/backend/requirements.txt"
test -f "$RELEASE_DIR/backend/server.py"
test -f "$RELEASE_DIR/frontend/build/index.html"

sudo rsync -a --delete \
  --exclude='backend/.env' \
  --exclude='backend/.drive_config.key' \
  --exclude='backend/storage/' \
  --exclude='backend/.venv/' \
  --exclude='backend/.venv312/' \
  --exclude='backend/__pycache__/' \
  --exclude='frontend/node_modules/' \
  "$RELEASE_DIR"/ /var/www/nugas/

test -f /var/www/nugas/backend/requirements.txt
```

## 5. Pastikan Environment Backend

Edit `/var/www/nugas/backend/.env`:

```bash
sudo nano /var/www/nugas/backend/.env
```

Minimal isi production:

```env
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=nugas
CORS_ORIGINS=https://new.nugas.site
ALLOW_LOCAL_RESET_OTP=false
APP_URL=https://new.nugas.site
```

Jangan hapus file berikut jika Google Drive sudah dikonfigurasi:

```text
/var/www/nugas/backend/.drive_config.key
/var/www/nugas/backend/storage/
```

## 6. Install/Update Dependency Backend

```bash
cd /var/www/nugas/backend
python3 -m venv .venv
. .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
python -m py_compile server.py
```

## 7. Systemd Backend

Jika service belum ada, buat:

```bash
sudo nano /etc/systemd/system/nugas-backend.service
```

Isi:

```ini
[Unit]
Description=Nugas Backend API
After=network.target

[Service]
User=syahrul
Group=www-data
WorkingDirectory=/var/www/nugas/backend
EnvironmentFile=/var/www/nugas/backend/.env
ExecStart=/var/www/nugas/backend/.venv/bin/uvicorn server:app --host 127.0.0.1 --port 8010
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

Aktifkan/restart:

```bash
sudo systemctl daemon-reload
sudo systemctl enable nugas-backend
sudo systemctl restart nugas-backend
sudo systemctl status nugas-backend --no-pager
```

Jika server sudah punya nama service lain, cek dulu:

```bash
systemctl list-units --type=service | grep -i nugas
```

Lalu restart service yang sesuai.

## 8. Konfigurasi Nginx

Contoh config:

```bash
sudo nano /etc/nginx/sites-available/new.nugas.site
```

Isi:

```nginx
server {
    listen 80;
    server_name new.nugas.site;

    root /var/www/nugas/frontend/build;
    index index.html;
    client_max_body_size 200M;

    location /api/ {
        proxy_pass http://127.0.0.1:8010/api/;
        proxy_http_version 1.1;
        proxy_connect_timeout 60s;
        proxy_send_timeout 600s;
        proxy_read_timeout 600s;
        proxy_request_buffering off;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location = /service-worker.js {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        try_files $uri =404;
    }

    location = /index.html {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        try_files $uri =404;
    }

    location /static/ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    location / {
        add_header Cache-Control "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0" always;
        try_files $uri /index.html;
    }
}
```

Catatan upload tugas:
- `client_max_body_size` wajib lebih besar dari ZIP tugas terbesar yang diizinkan.
- `proxy_request_buffering off` membantu upload besar diteruskan bertahap ke backend.
- Submission disimpan dulu di server lokal, lalu sinkron Google Drive berjalan di background jika Drive aktif. Jadi status submit tetap berubah walaupun proses Drive lebih lama.
- Pantau sinkron Drive dari menu admin `Google Drive` bagian `Monitor sinkron Google Drive`. Jika status `Gagal`, perbaiki konfigurasi Drive lalu tekan `Retry`.
- Jika folder Drive terbuat tetapi file tidak muncul, biasanya service account tidak punya kuota menulis file di My Drive. Gunakan Shared Drive atau root folder yang memang mengizinkan service account mengunggah file.

Enable config:

```bash
sudo ln -sf /etc/nginx/sites-available/new.nugas.site /etc/nginx/sites-enabled/new.nugas.site
sudo nginx -t
sudo systemctl reload nginx
```

Aktifkan HTTPS jika belum:

```bash
sudo certbot --nginx -d new.nugas.site
sudo nginx -t
sudo systemctl reload nginx
```

## 9. Verifikasi

```bash
curl -I https://new.nugas.site/
curl https://new.nugas.site/api/
sudo journalctl -u nugas-backend -n 80 --no-pager
```

Header penting untuk memastikan update tidak perlu hard reload terus:

```bash
curl -I https://new.nugas.site/service-worker.js
curl -I https://new.nugas.site/index.html
```

Keduanya harus mengandung `Cache-Control: no-store`.

## 10. Rollback

Jika update gagal:

```bash
sudo systemctl stop nugas-backend
sudo rm -rf /var/www/nugas.rollback
sudo mv /var/www/nugas /var/www/nugas.rollback
sudo mkdir -p /var/www/nugas
sudo tar -xzf /var/www/backups/nugas-before-update-YYYYMMDD-HHMMSS.tar.gz -C /var/www
sudo systemctl start nugas-backend
sudo systemctl reload nginx
```

Ganti nama file backup sesuai hasil langkah backup.
