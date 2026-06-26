# Nugas Site — E-Learning Dosen PWA

Platform **E-Learning** full-stack untuk dosen. Kelola mata kuliah, materi, tugas, pengumpulan tugas mahasiswa, penilaian dengan predikat, notifikasi WhatsApp, dan integrasi Google Drive — semua dalam PWA yang mobile-friendly.

---

## Tech Stack

| Lapisan | Teknologi |
|---------|-----------|
| **Frontend** | React 19, React Router 7, Tailwind CSS, Shadcn UI, Recharts |
| **Backend** | Python 3.12, FastAPI, Motor (async MongoDB), Uvicorn |
| **Database** | MongoDB (via Motor async driver) |
| **Auth** | bcrypt + session tokens |
| **Penyimpanan File** | Local filesystem + opsional Google Drive |
| **WhatsApp** | Gateway Fonnte / WAHA (opsional) |
| **Build** | CRACO (Create React App + config override) |
| **Package Manager** | Yarn (frontend) / pip (backend) |

---

## Fitur

### 👨‍🏫 Dosen / Admin
- Dashboard dengan statistik akademik dan grafik progres
- Manajemen mata kuliah & kelas dengan kode join otomatis
- Manajemen mahasiswa: tambah manual, import Excel, aktivasi/nonaktivasi, reset password
- **Materi**: buat, edit, urutkan, lampirkan file, diskusi dengan lampiran gambar
- **Tugas**: deadline, toleransi keterlambatan, rubrik berbobot, mode praktikum, lampiran soal
- **Penilaian**: nilai satuan atau massal, feedback, request revisi
- **Predikat nilai**: A–E dengan range bisa diatur (global atau per kelas)
- **WhatsApp gateway**: konfigurasi Fonnte/WAHA, OTP lupa password, notifikasi tugas & nilai
- **Google Drive**: upload otomatis submission mahasiswa ke folder Drive terstruktur
- **Export**: rekap nilai ke Excel
- **Pengaturan**: nama aplikasi, logo, info kampus, tahun akademik, semester, rollover

### 👨‍🎓 Mahasiswa
- Login terpadu (email / NIM / no HP + password)
- Gabung kelas dengan kode + persetujuan dosen
- Lihat materi dan tugas terkait
- Kumpulkan tugas dengan banyak file
- Cek status submission, nilai, dan predikat
- Alur revisi: revisi dan kumpulkan ulang
- Lupa password dengan OTP WhatsApp
- Ganti password

### 🔐 Autentikasi
- Layar login terpadu (daftar, lupa password, ganti password)
- Session-based auth dengan token tersimpan di MongoDB
- Role-based access (admin/dosen vs mahasiswa)
- OTP rate-limited untuk reset password

---

## Persiapan

### Prasyarat
- Python 3.12+
- Node.js 18+
- MongoDB (lokal atau remote)
- Yarn

### 1. Clone & Setup

```bash
git clone https://github.com/syahrullanw/nugaslagi.git
cd nugaslagi
```

### 2. Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Buat `backend/.env`:

```env
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=nugas_local
CORS_ORIGINS=http://localhost:3010,http://127.0.0.1:3010
ALLOW_LOCAL_RESET_OTP=true
```

Jalankan backend:

```bash
uvicorn server:app --reload --port 8010
```

### 3. Frontend

```bash
cd frontend
yarn install
```

Buat `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8010
PORT=3010
```

Jalankan frontend:

```bash
yarn start
```

Buka http://localhost:3010.

### Demo

| Role | Email | Password |
|------|-------|----------|
| Admin/Dosen | `dosen@demo.id` | `Dosen123!` |
| Mahasiswa | `alya@demo.id` | `Mahasiswa123!` |
| Kode Kelas | `WEB4A1` | |

---

## Struktur Proyek

```
nugaslagi/
├── backend/
│   ├── server.py              # Aplikasi FastAPI (4374 baris)
│   ├── requirements.txt
│   ├── .drive_config.key      # Kunci enkripsi untuk kredensial Drive
│   ├── storage/               # File upload mahasiswa (diabaikan git)
│   └── tests/                 # Regression test pytest
├── frontend/
│   ├── src/
│   │   ├── App.js             # Aplikasi React (2349 baris)
│   │   ├── components/ui/     # Komponen Shadcn UI
│   │   ├── hooks/
│   │   └── lib/
│   ├── public/                # PWA manifest, service worker, icon
│   ├── plugins/               # Webpack plugin health check
│   └── package.json
├── memory/                    # PRD dan memori proyek
├── release/                   # Checksum SHA256 rilis
├── test_reports/              # Screenshot dan hasil test
├── tests/                     # Fixture test bersama
└── .gitignore
```

---

## Ringkasan API

Semua endpoint diawali `/api`.

| Grup | Endpoint Utama |
|------|----------------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `POST /auth/forgot-password`, `POST /auth/reset-password-otp`, `POST /auth/change-password` |
| **Dashboard** | `GET /dashboard/admin-stats`, `GET /dashboard/student-stats` |
| **Courses** | `GET /courses`, `POST /courses`, `PUT /courses/{id}`, `DELETE /courses/{id}` |
| **Classes** | `GET /classes`, `POST /classes`, `PUT /classes/{id}`, `POST /classes/{id}/join`, `POST /classes/{id}/approve` |
| **Students** | `GET /students`, `POST /students`, `POST /students/import-excel`, `POST /students/{id}/reset-password` |
| **Materials** | `GET /materials`, `POST /materials`, `PUT /materials/{id}`, `POST /materials/{id}/comments` |
| **Assignments** | `GET /assignments`, `POST /assignments`, `PUT /assignments/{id}`, `POST /assignments/{id}/submit` |
| **Submissions** | `GET /submissions`, `POST /submissions/{id}/grade`, `POST /submissions/{id}/review`, `POST /submissions/{id}/request-revision` |
| **Grades** | `GET /grades`, `POST /grades/bulk` |
| **Predicates** | `GET /predicates`, `PUT /predicates` |
| **WhatsApp** | `GET /whatsapp/config`, `PUT /whatsapp/config`, `GET /whatsapp/queue`, `POST /whatsapp/retry/{id}` |
| **Google Drive** | `GET /drive/config`, `PUT /drive/config`, `POST /drive/test` |
| **Files** | `GET /files/{file_id}/download`, `GET /files/{file_id}/view`, `DELETE /files/{file_id}` |
| **Export** | `GET /export/grades` |
| **Settings** | `GET /settings`, `PUT /settings` |
| **WebSocket** | `WS /ws/chat/{class_id}` |

---

## Integrasi Google Drive

Submission mahasiswa bisa otomatis tersinkron ke Google Drive.

1. Buat service account di Google Cloud Console, aktifkan Google Drive API.
2. Share folder Drive tujuan ke email service account (sebagai Editor).
3. Login sebagai admin → menu **Google Drive**.
4. Isi ID folder, nama folder root, dan paste isi file JSON service account.
5. Klik **Simpan Google Drive** lalu **Tes koneksi**.

Struktur folder di Drive:
```
E-Learning Dosen / Tahun Akademik / Semester / Mata Kuliah / Kelas / Tugas / NIM - Nama / file
```

Set `GOOGLE_DRIVE_REQUIRE_UPLOAD=true` untuk menolak submission jika upload Drive gagal.
Set `GOOGLE_DRIVE_CONFIG_KEY` di environment untuk kunci enkripsi kustom.

---

## Notifikasi WhatsApp

Gateway WhatsApp opsional untuk:
- **OTP** untuk lupa password
- **Pengingat tugas** saat tugas baru dipublikasikan
- **Notifikasi nilai** dengan predikat dan feedback
- **Notifikasi revisi** dengan catatan dosen

Mendukung provider **Fonnte** dan **WAHA**.

---

## Testing

### Backend

```bash
cd backend
pytest tests/ -v
```

Laporan test (screenshot & JSON) ada di folder `test_reports/`.

---

## Variabel Environment

### Backend (`backend/.env`)

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `MONGO_URL` | ✅ | MongoDB connection string |
| `DB_NAME` | ✅ | Nama database |
| `CORS_ORIGINS` | ✅ | Origin yang diizinkan (dipisah koma) |
| `ALLOW_LOCAL_RESET_OTP` | ❌ | Set `true` untuk dev lokal |
| `APP_URL` | ❌ | URL aplikasi untuk link reset |
| `GOOGLE_DRIVE_CONFIG_KEY` | ❌ | Kunci enkripsi kustom untuk kredensial Drive |

### Frontend (`frontend/.env`)

| Variable | Wajib | Deskripsi |
|----------|-------|-----------|
| `REACT_APP_BACKEND_URL` | ✅ | URL backend API |
| `PORT` | ❌ | Port dev server (default: 3010) |
