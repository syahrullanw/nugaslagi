# Nugas Site — E-Learning Dosen PWA

Full-stack **E-Learning platform** for university lecturers. Manage courses, materials, assignments, student submissions, grading with predicates, WhatsApp notifications, and Google Drive integration — all in a mobile-friendly PWA.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, React Router 7, Tailwind CSS, Shadcn UI, Recharts |
| **Backend** | Python 3.12, FastAPI, Motor (async MongoDB), Uvicorn |
| **Database** | MongoDB (via Motor async driver) |
| **Auth** | bcrypt + session tokens |
| **File Storage** | Local filesystem + optional Google Drive |
| **WhatsApp** | Fonnte / WAHA gateway (optional) |
| **Build** | CRACO (Create React App with config override) |
| **Package** | Yarn (frontend) / pip (backend) |

---

## Features

### 👨‍🏫 Lecturer / Admin
- Dashboard with academic statistics and progress charts
- Course & class management with auto-generated join codes
- Student management: manual add, Excel import, activate/deactivate, password reset
- **Materials**: create, edit, reorder, attach files, threaded discussions with image attachments
- **Assignments**: deadlines, late tolerance, weighted rubrics, practicum mode, file attachments
- **Submission grading**: single or bulk grading, feedback, revision requests
- **Grade predicates**: A–E with configurable ranges (per class or global)
- **WhatsApp gateway**: Fonnte / WAHA configuration, OTP for forgot password, assignment & grade notifications
- **Google Drive**: automatic upload of student submissions to structured Drive folders
- **Export**: grade recap to Excel
- **Settings**: app name, logo, campus info, academic year, semester, rollover

### 👨‍🎓 Student
- Unified login (email / NIM / phone + password)
- Join class with code + lecturer approval
- View materials and linked assignments
- Submit assignments with multiple files
- Track submission status, grades, and predicates
- Revision workflow: revise and resubmit
- Forgot password with WhatsApp OTP
- Change password

### 🔐 Authentication
- Unified login screen (register, forgot password, change password)
- Session-based auth with opaque tokens stored in MongoDB
- Role-based access (admin/dosen vs mahasiswa)
- Rate-limited OTP for password reset

---

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- MongoDB (local or remote)
- Yarn (for frontend)

### 1. Clone & Setup

```bash
git clone https://github.com/syahrullanw/nugaslagi.git
cd nugaslagi
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```env
MONGO_URL=mongodb://127.0.0.1:27017
DB_NAME=nugas_local
CORS_ORIGINS=http://localhost:3010,http://127.0.0.1:3010
ALLOW_LOCAL_RESET_OTP=true
```

Start backend:

```bash
uvicorn server:app --reload --port 8010
```

### 3. Frontend Setup

```bash
cd frontend
yarn install
```

Create `frontend/.env`:

```env
REACT_APP_BACKEND_URL=http://localhost:8010
PORT=3010
```

Start frontend:

```bash
yarn start
```

Open http://localhost:3010.

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin/Dosen | `dosen@demo.id` | `Dosen123!` |
| Mahasiswa | `alya@demo.id` | `Mahasiswa123!` |
| Kode Kelas | `WEB4A1` | |

---

## Project Structure

```
nugaslagi/
├── backend/
│   ├── server.py              # FastAPI app (4374 lines)
│   ├── requirements.txt
│   ├── .drive_config.key      # Encryption key for Drive credentials
│   ├── storage/               # Uploaded student files (gitignored)
│   └── tests/                 # Pytest regression tests
├── frontend/
│   ├── src/
│   │   ├── App.js             # React app (2349 lines)
│   │   ├── components/ui/     # Shadcn UI components
│   │   ├── hooks/
│   │   └── lib/
│   ├── public/                # PWA manifest, service worker, icons
│   ├── plugins/               # Health check webpack plugin
│   └── package.json
├── memory/                    # PRD and project memory
├── release/                   # Release SHA256 checksums
├── test_reports/              # Screenshots and test results
├── tests/                     # Shared test fixtures
└── .gitignore
```

---

## API Overview

All endpoints are prefixed with `/api`.

| Group | Key Endpoints |
|-------|--------------|
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

## Google Drive Integration

Student submissions can be automatically synced to Google Drive.

1. Create a service account in Google Cloud Console, enable Google Drive API.
2. Share your target Drive folder with the service account email (as Editor).
3. Login as admin → **Google Drive** menu.
4. Enter folder ID, root folder name, and paste the service account JSON.
5. Click **Save** then **Test Connection**.

Folder structure on Drive:
```
E-Learning Dosen / Tahun Akademik / Semester / Mata Kuliah / Kelas / Tugas / NIM - Nama / file
```

Set `GOOGLE_DRIVE_REQUIRE_UPLOAD=true` to reject submissions when Drive upload fails.
Set `GOOGLE_DRIVE_CONFIG_KEY` environment variable for server-side encryption key management.

---

## WhatsApp Notifications

Optional WhatsApp gateway for:
- **OTP** for forgot password flow
- **Assignment reminders** when new tasks are published
- **Grade notifications** with predicate and feedback
- **Revision requests** with lecturer notes

Supports **Fonnte** and **WAHA** providers.

---

## Testing

### Backend Tests

```bash
cd backend
pytest tests/ -v
```

### Test reports

Screenshots and JSON reports are available in `test_reports/`.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URL` | ✅ | MongoDB connection string |
| `DB_NAME` | ✅ | Database name |
| `CORS_ORIGINS` | ✅ | Comma-separated allowed origins |
| `ALLOW_LOCAL_RESET_OTP` | ❌ | Set `true` for local dev OTP |
| `APP_URL` | ❌ | App URL for reset links |
| `GOOGLE_DRIVE_CONFIG_KEY` | ❌ | Custom encryption key for Drive credentials |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `REACT_APP_BACKEND_URL` | ✅ | Backend API URL |
| `PORT` | ❌ | Dev server port (default: 3010) |
