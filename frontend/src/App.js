import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import "@/App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toaster, toast } from "@/components/ui/sonner";
import {
  AlertTriangle, ArrowLeft, Bell, BookOpen, CalendarDays, CheckCircle2, ClipboardList, Download,
  Eye, FileText, FileSpreadsheet, GraduationCap, LayoutDashboard, LogOut, MessageSquare, Pencil, Plus, Send,
  Trash2, Upload, Users, Settings, ImagePlus, Minus, Paperclip, Reply, Search, Smile, X,
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;
const DEFAULT_SUBMISSION_MAX_FILE_MB = 5;
const DEFAULT_SUBMISSION_FORMATS = ["pdf", "doc", "docx", "xls", "xlsx", "zip", "png", "jpg", "jpeg", "webp"];

const logoUrl = "/app-icon.svg";
const authBg = "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85";
const practicumCover = "https://images.unsplash.com/photo-1619410283995-43d9134e7656?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMHNjaWVuY2UlMjBwcm9ncmFtbWluZyUyMHNjcmVlbnxlbnwwfHx8fDE3Nzk1NTA1NDd8MA&ixlib=rb-4.1.0&q=85";
const defaultWhatsAppForm = {
  provider: "disabled",
  app_url: "",
  fonnte_token: "",
  fonnte_url: "https://api.fonnte.com/send",
  waha_base_url: "",
  waha_api_key: "",
  waha_session: "default",
  send_delay_seconds: 3,
  otp_template: "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
  assignment_template: "Halo {name}, ada tugas baru: {title}. Kelas: {class_name}. Deadline: {deadline}. Link: {link}",
  grade_template: "Halo {name}, tugas {title} sudah dinilai. Nilai: {grade} ({predicate}). Feedback: {feedback}. Link: {link}",
  revision_template: "Halo {name}, tugas {title} perlu revisi. Catatan: {revision_note}. Link: {link}",
};
const defaultDriveForm = {
  enabled: true,
  root_folder_id: "",
  root_folder_name: "E-Learning Dosen",
  require_upload: false,
  service_account_json: "",
  clear_service_account: false,
};
const defaultBranding = {
  app_name: "E-Learning Dosen",
  campus_name: "",
  campus_logo_url: "",
};

function brandingName(branding) {
  return branding?.app_name?.trim() || defaultBranding.app_name;
}

function brandingLogo(branding) {
  return branding?.campus_logo_url?.trim() || logoUrl;
}

function toLocalDateTimeValue(date) {
  const value = new Date(date);
  value.setMinutes(value.getMinutes() - value.getTimezoneOffset());
  return value.toISOString().slice(0, 16);
}

function toDateTimeInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return toLocalDateTimeValue(date);
}

function defaultAssignmentRubric() {
  return [
    { criterion: "Ketepatan jawaban", weight: 40 },
    { criterion: "Kerapian laporan", weight: 20 },
    { criterion: "Kreativitas", weight: 20 },
    { criterion: "Ketepatan waktu", weight: 20 },
  ];
}

function getResetPasswordQuery() {
  if (typeof window === "undefined") return { active: false, identifier: "" };
  const params = new URLSearchParams(window.location.search);
  const reset = (params.get("reset") || "").toLowerCase();
  const mode = (params.get("mode") || "").toLowerCase();
  const active = reset === "password" || reset === "1" || mode === "forgot";
  return { active, identifier: params.get("identifier") || "" };
}

function fmtDate(value) {
  if (!value) return "-";
  try { return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)); } catch { return value; }
}

function formatApiError(error, fallback) {
  const status = error?.response?.status;
  if (status === 413) return "File terlalu besar untuk batas server/Nginx. Naikkan client_max_body_size lalu coba lagi.";
  const detail = error?.response?.data?.detail || error?.response?.data?.message || error?.message;
  if ([502, 503, 504].includes(status) && !detail) return "Server belum selesai memproses upload. Coba lagi atau periksa log backend/Nginx.";
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail.map((item) => {
      if (typeof item === "string") return item;
      if (item?.msg) return item.msg;
      return "";
    }).filter(Boolean);
    return messages.length ? messages.join("; ") : fallback;
  }
  if (typeof detail === "object") return detail.message || JSON.stringify(detail);
  return String(detail);
}

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function remainingDeadline(deadline, nowMs) {
  const date = new Date(deadline);
  if (!deadline || Number.isNaN(date.getTime())) return { label: "Deadline tidak valid", status: "neutral" };
  const diff = date.getTime() - nowMs;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const parts = days > 0 ? `${days} hari ${hours} jam` : hours > 0 ? `${hours} jam ${minutes} menit` : `${Math.max(1, minutes)} menit`;
  if (diff <= 0) return { label: `Lewat ${parts}`, status: "overdue" };
  if (diff <= 86400000) return { label: `Sisa ${parts}`, status: "urgent" };
  return { label: `Sisa ${parts}`, status: "normal" };
}

function DeadlineCountdown({ deadline, testid, compact = false }) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const remaining = remainingDeadline(deadline, nowMs);
  const color = remaining.status === "overdue" ? "border-red-200 bg-red-50 text-red-700" : remaining.status === "urgent" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700";
  return <Badge className={`${color} ${compact ? "" : "mt-2"}`} data-testid={testid}>{remaining.label}</Badge>;
}

function statusClass(status) {
  if (["Aman", "Dinilai", "Sudah Submit", "uploaded_to_drive", "stored_on_server", "synced"].includes(status)) return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (["Perlu Perhatian", "Risiko Rendah", "Terlambat", "Direvisi", "Belum Submit", "pending_drive_config", "pending", "not_configured"].includes(status)) return "bg-amber-50 text-amber-700 border-amber-200";
  if (["Risiko Tinggi", "Ditolak", "drive_upload_failed", "failed"].includes(status)) return "bg-red-50 text-red-700 border-red-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

function fileStatusLabel(status) {
  if (status === "stored_on_server") return "Tersimpan server";
  if (status === "pending_drive_config") return "File lama";
  if (status === "pending") return "Sinkron Drive";
  if (status === "uploaded_to_drive") return "Drive";
  if (status === "drive_upload_failed") return "Drive gagal";
  return status || "-";
}

function submissionStatusLabel(status) {
  if (status === "Sudah Submit") return "Submit";
  return status || "Belum Submit";
}

function driveSyncLabel(status) {
  if (status === "synced") return "Drive tersinkron";
  if (status === "pending") return "Menunggu sinkron Drive";
  if (status === "failed") return "Sinkron Drive gagal";
  if (status === "not_configured") return "Drive belum aktif";
  return status || "Belum ada status Drive";
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function assignmentAllowedFormats(assignment) {
  const source = assignment?.allowed_formats;
  const values = Array.isArray(source) ? source : String(source || "").split(",");
  const cleaned = values.map((item) => String(item || "").trim().replace(/^\./, "").toLowerCase()).filter(Boolean);
  return cleaned.length ? Array.from(new Set(cleaned)) : DEFAULT_SUBMISSION_FORMATS;
}

function assignmentFormatLabel(assignment) {
  return assignmentAllowedFormats(assignment).map((item) => item.toUpperCase()).join(", ");
}

function fileAcceptFromFormats(formats) {
  return (formats || DEFAULT_SUBMISSION_FORMATS).map((item) => `.${String(item).replace(/^\./, "")}`).join(",");
}

function assignmentMaxSubmissionMb(assignment) {
  const value = Number(assignment?.max_file_size_mb || assignment?.max_upload_mb || assignment?.max_submission_size_mb || DEFAULT_SUBMISSION_MAX_FILE_MB);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_SUBMISSION_MAX_FILE_MB;
}

function normalizedExternalLink(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function otpDeliveryClass(status) {
  if (status === "sent") return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function otpDeliveryText(delivery) {
  const provider = delivery?.provider && delivery.provider !== "disabled" ? ` via ${delivery.provider}` : "";
  if (delivery?.status === "sent") return `Pesan OTP sudah dikirim${provider}${delivery.sent_at ? ` pada ${fmtDate(delivery.sent_at)}` : ""}.`;
  if (delivery?.status === "pending") return `Pesan OTP sudah masuk antrian${provider} dan menunggu proses kirim.`;
  if (delivery?.status === "pending_config") return `Pesan OTP masuk antrian, tetapi gateway WhatsApp belum aktif.${delivery.error ? ` ${delivery.error}.` : ""}`;
  if (delivery?.status === "failed") return `Pesan OTP gagal dikirim${provider}.${delivery.error ? ` ${delivery.error}` : ""}`;
  if (delivery?.status === "no_whatsapp") return "OTP tidak masuk antrian WhatsApp karena nomor WhatsApp belum terdaftar pada akun.";
  return "Status antrian OTP belum tersedia.";
}

function submissionFiles(submission) {
  const files = Array.isArray(submission?.files) && submission.files.length ? submission.files : submission?.file ? [submission.file] : [];
  return files.filter((item) => item && (item.file_id || item.id));
}

function fileId(file) {
  return file?.file_id || file?.id || "";
}

function authenticatedFileLink(url, token) {
  if (!url) return "";
  const resolved = url.startsWith("/") ? `${BACKEND_URL}${url}` : url;
  const isProtectedFile = url.startsWith("/api/") || resolved.startsWith(`${BACKEND_URL}/api/`);
  if (!isProtectedFile) return resolved;
  const separator = resolved.includes("?") ? "&" : "?";
  return `${resolved}${separator}token=${encodeURIComponent(token)}`;
}

const ActionProgressContext = createContext(null);

function ActionProgressProvider({ children }) {
  const [action, setAction] = useState(null);
  const sequence = useRef(0);
  const motionTimer = useRef(null);
  const hideTimer = useRef(null);

  function stopTimers() {
    window.clearInterval(motionTimer.current);
    window.clearTimeout(hideTimer.current);
  }

  useEffect(() => () => {
    window.clearInterval(motionTimer.current);
    window.clearTimeout(hideTimer.current);
  }, []);

  function begin(label, detail = "Memproses permintaan...") {
    stopTimers();
    const id = ++sequence.current;
    setAction({ id, label, detail, percent: 4, status: "busy" });
    motionTimer.current = window.setInterval(() => {
      setAction((current) => {
        if (!current || current.id !== id || current.status !== "busy" || current.percent >= 90) return current;
        return { ...current, percent: Math.min(90, current.percent + Math.max(1, Math.ceil((92 - current.percent) / 7))) };
      });
    }, 320);
    return id;
  }

  function update(id, percent, label, detail) {
    setAction((current) => current && current.id === id ? {
      ...current,
      percent: Math.max(current.percent, Math.min(96, Math.round(percent))),
      label: label || current.label,
      detail: detail || current.detail,
    } : current);
  }

  function finish(id, label = "Selesai", detail = "Proses berhasil diselesaikan.") {
    window.clearInterval(motionTimer.current);
    setAction((current) => current && current.id === id ? { ...current, percent: 100, status: "done", label, detail } : current);
    hideTimer.current = window.setTimeout(() => setAction((current) => current?.id === id ? null : current), 1100);
  }

  function fail(id, detail = "Proses tidak berhasil. Silakan coba kembali.") {
    window.clearInterval(motionTimer.current);
    setAction((current) => current && current.id === id ? { ...current, status: "error", label: "Proses gagal", detail } : current);
    hideTimer.current = window.setTimeout(() => setAction((current) => current?.id === id ? null : current), 3500);
  }

  return <ActionProgressContext.Provider value={{ begin, update, finish, fail }}>
    {children}
    {action && <div className={`action-progress ${action.status}`} role="status" aria-live="polite" data-testid="action-progress-panel">
      <div className="action-progress-topline"><strong>{action.label}</strong><span data-testid="action-progress-percent">{action.percent}%</span></div>
      <div className="action-progress-bar" aria-hidden="true"><span style={{ width: `${action.percent}%` }} /></div>
      <p>{action.detail}</p>
    </div>}
  </ActionProgressContext.Provider>;
}

function useActionProgress() {
  return useContext(ActionProgressContext);
}

function uploadProgressPercent(event, start = 15, end = 94) {
  if (!event.total) return start;
  const ratio = Math.max(0, Math.min(1, event.loaded / event.total));
  return Math.round(start + ((end - start) * ratio));
}

function clampScoreInput(value) {
  if (value === "") return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  return Math.max(0, Math.min(100, numeric));
}

function needsSubmissionReview(submission) {
  return ["Sudah Submit", "Terlambat", "Direvisi"].includes(submission?.status) && !["reviewed", "graded"].includes(submission?.review_status);
}

function NotificationBadge({ count, testid }) {
  if (!count) return null;
  return <Badge className="ml-auto border-red-200 bg-red-50 text-red-700" data-testid={testid}>{count > 99 ? "99+" : count}</Badge>;
}

function attentionKey(item) {
  return [item?.id || item?.file_id || "", item?.updated_at || item?.submitted_at || item?.reviewed_at || item?.graded_at || item?.created_at || item?.requested_at || item?.status || ""].join(":");
}

function unseenCount(items, seenKeys = []) {
  const seen = new Set(seenKeys || []);
  return (items || []).filter((item) => !seen.has(attentionKey(item))).length;
}

function Field({ id, label, children }) {
  return <div className="space-y-2"><Label htmlFor={id} data-testid={`${id}-label`}>{label}</Label>{children}</div>;
}

function EmptyState({ title, description }) {
  return <div className="border border-dashed border-slate-300 bg-white p-8 text-center" data-testid="empty-state-panel"><p className="font-display text-lg font-semibold text-slate-900" data-testid="empty-state-title">{title}</p><p className="mt-2 text-sm text-slate-500" data-testid="empty-state-description">{description}</p></div>;
}

function LoginScreen({ onAuth, branding }) {
  const resetQuery = useMemo(() => getResetPasswordQuery(), []);
  const [mode, setMode] = useState(resetQuery.active ? "forgot" : "login");
  const [login, setLogin] = useState({ identifier: "", password: "" });
  const [register, setRegister] = useState({ username: "", nim: "", name: "", email: "", whatsapp: "", password: "" });
  const [forgot, setForgot] = useState({ identifier: resetQuery.identifier, otp: "", new_password: "", sent: resetQuery.active, message: resetQuery.active ? "Masukkan OTP dari WhatsApp dan password baru." : "", delivery: null });
  const [busy, setBusy] = useState(false);
  const progress = useActionProgress();
  const otpMessageId = forgot.delivery?.message_id || "";
  const otpDeliveryStatus = forgot.delivery?.status || "";

  useEffect(() => {
    if (!forgot.sent || !otpMessageId || otpDeliveryStatus !== "pending") return undefined;
    let cancelled = false;
    const refreshDelivery = async () => {
      try {
        const { data } = await axios.get(`${API}/auth/forgot-password/messages/${otpMessageId}`);
        if (!cancelled) setForgot((prev) => ({ ...prev, delivery: data }));
      } catch {
        if (!cancelled) setForgot((prev) => ({ ...prev, delivery: { ...prev.delivery, status: "failed", error: "Status antrian OTP gagal dimuat" } }));
      }
    };
    const timer = setInterval(refreshDelivery, 3000);
    refreshDelivery();
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [forgot.sent, otpMessageId, otpDeliveryStatus]);

  async function submitLogin(event) {
    event.preventDefault(); setBusy(true); const operation = progress.begin("Masuk ke aplikasi");
    try { const { data } = await axios.post(`${API}/auth/login`, login); progress.finish(operation, "Login berhasil"); onAuth(data); toast.success("Login berhasil"); }
    catch (error) { progress.fail(operation, error.response?.data?.detail || "Login gagal"); toast.error(error.response?.data?.detail || "Login gagal"); }
    finally { setBusy(false); }
  }

  async function submitRegister(event) {
    event.preventDefault(); setBusy(true); const operation = progress.begin("Membuat akun mahasiswa");
    try { const { data } = await axios.post(`${API}/auth/register-student`, register); progress.finish(operation, "Akun berhasil dibuat"); onAuth(data); toast.success("Akun mahasiswa berhasil dibuat"); }
    catch (error) { progress.fail(operation, error.response?.data?.detail || "Daftar gagal"); toast.error(error.response?.data?.detail || "Daftar gagal"); }
    finally { setBusy(false); }
  }

  async function submitForgot(event) {
    event.preventDefault(); setBusy(true); const operation = progress.begin("Mengirim OTP");
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, { identifier: forgot.identifier });
      const delivery = data.otp_delivery || null;
      progress.finish(operation, "OTP diproses");
      toast.success(data.message || "OTP diproses");
      setForgot((prev) => ({ ...prev, sent: true, otp: "", message: data.message || "", delivery }));
    }
    catch (error) { progress.fail(operation, error.response?.data?.detail || "Permintaan reset gagal"); toast.error(error.response?.data?.detail || "Permintaan reset gagal"); }
    finally { setBusy(false); }
  }

  async function submitResetOtp(event) {
    event.preventDefault(); setBusy(true); const operation = progress.begin("Mereset password");
    try { await axios.post(`${API}/auth/reset-password-otp`, { identifier: forgot.identifier, otp: forgot.otp, new_password: forgot.new_password }); progress.finish(operation, "Password berhasil direset"); if (typeof window !== "undefined") window.history.replaceState(null, "", window.location.pathname || "/"); toast.success("Password berhasil direset, silakan login"); setMode("login"); setForgot({ identifier: "", otp: "", new_password: "", sent: false, message: "", delivery: null }); }
    catch (error) { progress.fail(operation, error.response?.data?.detail || "Reset password gagal"); toast.error(error.response?.data?.detail || "Reset password gagal"); }
    finally { setBusy(false); }
  }

  return <main className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_0.95fr]" data-testid="login-screen">
    <section className="relative hidden overflow-hidden bg-slate-950 lg:block" data-testid="login-visual-section"><img src={authBg} alt="E-learning akademik" className="h-full w-full object-cover opacity-75" data-testid="login-background-image" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" /><div className="absolute bottom-12 left-12 right-12 text-white"><img src={brandingLogo(branding)} alt={`Logo ${brandingName(branding)}`} className="mb-8 h-16 w-16" data-testid="login-logo-image" /><h1 className="font-display text-5xl font-bold leading-tight" data-testid="login-hero-title">Ruang kendali pembelajaran dosen.</h1><p className="mt-5 max-w-xl text-lg text-slate-200" data-testid="login-hero-subtitle">Kelola kelas, tugas, submission, rubrik, reminder, dan rekap nilai dari satu aplikasi PWA.</p></div></section>
    <section className="flex min-h-screen items-center px-5 py-10 md:px-12" data-testid="login-form-section"><div className="mx-auto w-full max-w-xl animate-rise"><div className="mb-6 flex items-center gap-3"><img src={brandingLogo(branding)} alt="Logo" className="h-12 w-12" data-testid="login-mobile-logo-image" /><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="login-overline">{brandingName(branding)}</p><h2 className="font-display text-3xl font-bold text-slate-950" data-testid="login-title">{mode === "login" ? "Satu pintu login" : mode === "register" ? "Daftar mahasiswa" : "Lupa password"}</h2></div></div>
      <div className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-blue-200 bg-white p-1" data-testid="front-auth-tabs"><Button type="button" variant={mode === "login" ? "default" : "ghost"} data-testid="front-login-tab-button" onClick={() => setMode("login")}>Masuk</Button><Button type="button" variant={mode === "register" ? "default" : "ghost"} data-testid="front-register-tab-button" onClick={() => setMode("register")}>Daftar</Button><Button type="button" variant={mode === "forgot" ? "default" : "ghost"} data-testid="front-forgot-tab-button" onClick={() => setMode("forgot")}>Lupa</Button></div>
      {mode === "login" && <form onSubmit={submitLogin} className="space-y-5 border border-slate-200 bg-white p-6" data-testid="unified-login-form"><Field id="login-identifier" label="Username / NIM / Nomor HP / Email"><Input id="login-identifier" data-testid="unified-login-identifier-input" value={login.identifier} onChange={(e) => setLogin({ ...login, identifier: e.target.value })} /></Field><Field id="login-password" label="Password"><Input id="login-password" type="password" data-testid="unified-login-password-input" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} /></Field><Button className="w-full" disabled={busy} data-testid="unified-login-submit-button"><GraduationCap /> Masuk</Button><div className="flex flex-wrap justify-between gap-2 text-sm"><button type="button" className="font-semibold text-blue-700" data-testid="front-register-inline-button" onClick={() => setMode("register")}>Belum punya akun? Daftar</button><button type="button" className="font-semibold text-blue-700" data-testid="front-forgot-inline-button" onClick={() => setMode("forgot")}>Lupa password?</button></div><p className="text-sm text-slate-500" data-testid="unified-login-help">Mahasiswa yang sudah login dapat memasukkan kode kelas dari halaman mahasiswa, lalu menunggu persetujuan dosen.</p></form>}
      {mode === "register" && <form onSubmit={submitRegister} className="space-y-4 border border-slate-200 bg-white p-6" data-testid="student-register-form"><div className="grid gap-4 sm:grid-cols-2"><Field id="register-nim" label="NIM"><Input id="register-nim" data-testid="student-register-nim-input" value={register.nim} onChange={(e) => setRegister({ ...register, nim: e.target.value })} /></Field><Field id="register-username" label="Username"><Input id="register-username" data-testid="student-register-username-input" value={register.username} onChange={(e) => setRegister({ ...register, username: e.target.value })} placeholder="Opsional, default NIM" /></Field><Field id="register-name" label="Nama lengkap"><Input id="register-name" data-testid="student-register-name-input" value={register.name} onChange={(e) => setRegister({ ...register, name: e.target.value })} /></Field><Field id="register-email" label="Email"><Input id="register-email" data-testid="student-register-email-input" value={register.email} onChange={(e) => setRegister({ ...register, email: e.target.value })} /></Field><Field id="register-whatsapp" label="Nomor HP / WhatsApp"><Input id="register-whatsapp" data-testid="student-register-whatsapp-input" value={register.whatsapp} onChange={(e) => setRegister({ ...register, whatsapp: e.target.value })} /></Field><Field id="register-password" label="Password"><Input id="register-password" type="password" data-testid="student-register-password-input" value={register.password} onChange={(e) => setRegister({ ...register, password: e.target.value })} /></Field></div><Button className="w-full" disabled={busy} data-testid="student-register-submit-button"><Users /> Buat akun mahasiswa</Button><p className="text-sm text-slate-500" data-testid="student-register-help">Setelah daftar, masukkan kode kelas di dashboard mahasiswa dan tunggu ACC dosen.</p></form>}
      {mode === "forgot" && <form onSubmit={forgot.sent ? submitResetOtp : submitForgot} className="space-y-5 border border-slate-200 bg-white p-6" data-testid="forgot-password-form"><Field id="forgot-identifier" label="Username / NIM / Nomor HP / Email"><Input id="forgot-identifier" data-testid="forgot-password-identifier-input" value={forgot.identifier} onChange={(e) => setForgot({ ...forgot, identifier: e.target.value })} /></Field>{forgot.message && <p className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800" data-testid="forgot-password-message">{forgot.message}</p>}{forgot.delivery && <div className={`rounded-md border p-3 text-sm ${otpDeliveryClass(forgot.delivery.status)}`} data-testid="forgot-password-otp-queue-status"><p className="font-semibold">Antrian pesan OTP</p><p className="mt-1">{otpDeliveryText(forgot.delivery)}</p></div>}{forgot.sent && <><Field id="forgot-otp" label="OTP"><Input id="forgot-otp" data-testid="forgot-password-otp-input" value={forgot.otp} onChange={(e) => setForgot({ ...forgot, otp: e.target.value })} /></Field><Field id="forgot-new-password" label="Password baru"><Input id="forgot-new-password" type="password" data-testid="forgot-password-new-input" value={forgot.new_password} onChange={(e) => setForgot({ ...forgot, new_password: e.target.value })} /></Field></>}<Button className="w-full" disabled={busy} data-testid="forgot-password-submit-button"><Send /> {forgot.sent ? "Reset password" : "Kirim OTP"}</Button><p className="text-sm text-slate-500" data-testid="forgot-password-help">Jika gateway WhatsApp aktif, OTP hanya dikirim ke WhatsApp dan status antriannya ditampilkan di sini. OTP lokal hanya muncul saat gateway tidak siap pada instalasi lokal.</p></form>}
    </div></section>
  </main>;
}

function StatCard({ icon: Icon, label, value, hint, testid }) {
  return <Card className="rounded-md border-slate-200 shadow-none transition-transform hover:-translate-y-1" data-testid={testid}><CardContent className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-500" data-testid={`${testid}-label`}>{label}</p><p className="mt-2 font-display text-3xl font-bold text-slate-950" data-testid={`${testid}-value`}>{value}</p></div><div className="border border-slate-200 p-2 text-slate-700"><Icon className="h-5 w-5" /></div></div><p className="mt-4 text-xs text-slate-500" data-testid={`${testid}-hint`}>{hint}</p></CardContent></Card>;
}

function ChangePasswordPanel({ token }) {
  const [form, setForm] = useState({ current_password: "", new_password: "" });
  const progress = useActionProgress();
  async function submit(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan password baru");
    try {
      await axios.post(`${API}/auth/change-password`, form, { headers: { Authorization: `Bearer ${token}` } });
      progress.finish(operation, "Password diperbarui");
      toast.success("Password berhasil diganti");
      setForm({ current_password: "", new_password: "" });
    } catch (error) {
      progress.fail(operation, error.response?.data?.detail || "Ganti password gagal");
      toast.error(error.response?.data?.detail || "Ganti password gagal");
    }
  }
  return <Card className="rounded-md shadow-none" data-testid="change-password-card"><CardHeader><CardTitle data-testid="change-password-title">Ganti password</CardTitle></CardHeader><CardContent><form onSubmit={submit} className="grid gap-3 md:grid-cols-[1fr_1fr_auto]" data-testid="change-password-form"><Input type="password" placeholder="Password lama" data-testid="change-password-current-input" value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} /><Input type="password" placeholder="Password baru" data-testid="change-password-new-input" value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} /><Button data-testid="change-password-submit-button">Simpan</Button></form></CardContent></Card>;
}

function ProfilePage({ token, user, onUserUpdate, enrollments = [] }) {
  const [form, setForm] = useState({ name: user.name || "", username: user.username || "", email: user.email || "", whatsapp: user.whatsapp || "" });
  const progress = useActionProgress();
  useEffect(() => {
    setForm({ name: user.name || "", username: user.username || "", email: user.email || "", whatsapp: user.whatsapp || "" });
  }, [user]);
  async function saveProfile(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan profil");
    try {
      const { data: updated } = await axios.put(`${API}/auth/me`, form, { headers: { Authorization: `Bearer ${token}` } });
      onUserUpdate(updated);
      progress.finish(operation, "Profil disimpan");
      toast.success("Profil berhasil disimpan");
    } catch (error) {
      progress.fail(operation, error.response?.data?.detail || "Profil gagal disimpan");
      toast.error(error.response?.data?.detail || "Profil gagal disimpan");
    }
  }
  const isStudent = user.role === "student";
  return <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]" data-testid={`${isStudent ? "student" : "admin"}-profile-page`}>
    <Card className="rounded-md shadow-none" data-testid="profile-editor-card">
      <CardHeader><CardTitle data-testid="profile-editor-title">Profil {isStudent ? "mahasiswa" : "admin"}</CardTitle></CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={saveProfile} data-testid="profile-editor-form">
          {isStudent && <Field id="profile-nim" label="NIM"><Input id="profile-nim" value={user.nim || ""} disabled data-testid="profile-nim-input" /></Field>}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="profile-name" label="Nama lengkap"><Input id="profile-name" required value={form.name} data-testid="profile-name-input" onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field id="profile-username" label="Username"><Input id="profile-username" required value={form.username} data-testid="profile-username-input" onChange={(e) => setForm({ ...form, username: e.target.value })} /></Field>
            <Field id="profile-email" label="Email"><Input id="profile-email" type="email" required value={form.email} data-testid="profile-email-input" onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
            <Field id="profile-whatsapp" label="WhatsApp"><Input id="profile-whatsapp" value={form.whatsapp} data-testid="profile-whatsapp-input" onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} /></Field>
          </div>
          {isStudent && <div className="border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="profile-enrollments"><p className="mb-2 font-semibold text-slate-700">Kelas</p><div className="flex flex-wrap gap-2">{enrollments.length === 0 ? <Badge variant="outline">Belum ada pengajuan kelas</Badge> : enrollments.map((item) => <Badge key={item.id} className={statusClass(item.status === "approved" ? "Aman" : "Risiko Rendah")}>{item.class_name}: {item.status}</Badge>)}</div></div>}
          <Button data-testid="profile-save-button"><CheckCircle2 /> Simpan profil</Button>
        </form>
      </CardContent>
    </Card>
    <ChangePasswordPanel token={token} />
  </div>;
}

function WhatsAppPage({ forms, setForms, saveWhatsApp, messages, retryMessage }) {
  const w = { ...defaultWhatsAppForm, ...(forms.whatsapp || {}) };
  const updateWhatsApp = (changes) => setForms({ ...forms, whatsapp: { ...w, ...changes } });
  return <div className="space-y-6" data-testid="whatsapp-page"><form onSubmit={saveWhatsApp} className="space-y-4 border bg-white p-5" data-testid="whatsapp-settings-form"><h2 className="font-display text-2xl font-semibold" data-testid="whatsapp-settings-title">Konfigurasi WhatsApp Gateway</h2><div className="grid gap-4 md:grid-cols-3"><Field id="whatsapp-provider" label="Provider"><select id="whatsapp-provider" className="form-select" data-testid="whatsapp-provider-select" value={w.provider || "disabled"} onChange={(e) => updateWhatsApp({ provider: e.target.value })}><option value="disabled">Nonaktif</option><option value="fonnte">Fonnte</option><option value="waha">WAHA</option></select></Field><Field id="whatsapp-app-url" label="Link reset/aplikasi"><Input id="whatsapp-app-url" data-testid="whatsapp-app-url-input" value={w.app_url || ""} onChange={(e) => updateWhatsApp({ app_url: e.target.value })} placeholder="https://domain-aplikasi" /></Field><Field id="whatsapp-send-delay" label="Delay kirim (detik)"><Input id="whatsapp-send-delay" type="number" min="0" max="300" data-testid="whatsapp-send-delay-input" value={w.send_delay_seconds ?? 3} onChange={(e) => updateWhatsApp({ send_delay_seconds: Number(e.target.value) })} /></Field></div>{w.provider === "fonnte" && <div className="grid gap-4 md:grid-cols-2" data-testid="fonnte-config-fields"><Field id="fonnte-token" label="Token Fonnte"><Input id="fonnte-token" type="password" data-testid="fonnte-token-input" value={w.fonnte_token || ""} onChange={(e) => updateWhatsApp({ fonnte_token: e.target.value })} placeholder={w.fonnte_token_masked || "Token Fonnte"} /></Field><Field id="fonnte-url" label="URL API Fonnte"><Input id="fonnte-url" data-testid="fonnte-url-input" value={w.fonnte_url || "https://api.fonnte.com/send"} onChange={(e) => updateWhatsApp({ fonnte_url: e.target.value })} /></Field></div>}{w.provider === "waha" && <div className="grid gap-4 md:grid-cols-3" data-testid="waha-config-fields"><Field id="waha-base-url" label="WAHA Base URL"><Input id="waha-base-url" data-testid="waha-base-url-input" value={w.waha_base_url || ""} onChange={(e) => updateWhatsApp({ waha_base_url: e.target.value })} /></Field><Field id="waha-api-key" label="WAHA API Key"><Input id="waha-api-key" type="password" data-testid="waha-api-key-input" value={w.waha_api_key || ""} onChange={(e) => updateWhatsApp({ waha_api_key: e.target.value })} placeholder={w.waha_api_key_masked || "X-Api-Key"} /></Field><Field id="waha-session" label="Session"><Input id="waha-session" data-testid="waha-session-input" value={w.waha_session || "default"} onChange={(e) => updateWhatsApp({ waha_session: e.target.value })} /></Field></div>}<div className="grid gap-4 xl:grid-cols-2"><Field id="whatsapp-template" label="Template OTP"><Textarea id="whatsapp-template" data-testid="whatsapp-template-input" value={w.otp_template || ""} onChange={(e) => updateWhatsApp({ otp_template: e.target.value })} /></Field><Field id="whatsapp-assignment-template" label="Template tugas baru"><Textarea id="whatsapp-assignment-template" data-testid="whatsapp-assignment-template-input" value={w.assignment_template || ""} onChange={(e) => updateWhatsApp({ assignment_template: e.target.value })} /></Field><Field id="whatsapp-grade-template" label="Template nilai"><Textarea id="whatsapp-grade-template" data-testid="whatsapp-grade-template-input" value={w.grade_template || ""} onChange={(e) => updateWhatsApp({ grade_template: e.target.value })} /></Field><Field id="whatsapp-revision-template" label="Template revisi"><Textarea id="whatsapp-revision-template" data-testid="whatsapp-revision-template-input" value={w.revision_template || ""} onChange={(e) => updateWhatsApp({ revision_template: e.target.value })} /></Field></div><p className="text-sm text-slate-500" data-testid="whatsapp-template-help">Placeholder: {'{code}'}, {'{minutes}'}, {'{link}'}, {'{name}'}, {'{nim}'}, {'{title}'}, {'{class_name}'}, {'{deadline}'}, {'{grade}'}, {'{predicate}'}, {'{feedback}'}, {'{revision_note}'}.</p><Button data-testid="whatsapp-settings-save-button"><Settings /> Simpan gateway</Button></form><Card className="rounded-md shadow-none" data-testid="whatsapp-message-history-card"><CardHeader><CardTitle data-testid="whatsapp-message-history-title">Antrean & histori pesan otomatis</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Tujuan</TableHead><TableHead>Jenis</TableHead><TableHead>Status</TableHead><TableHead>Provider</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{(messages || []).map((m) => <TableRow key={m.id} data-testid={`whatsapp-message-row-${m.id}`}><TableCell data-testid={`whatsapp-message-time-${m.id}`}>{fmtDate(m.created_at)}</TableCell><TableCell data-testid={`whatsapp-message-to-${m.id}`}>{m.to}</TableCell><TableCell data-testid={`whatsapp-message-type-${m.id}`}>{m.message_type}</TableCell><TableCell><Badge className={statusClass(m.status === "sent" ? "Aman" : "Risiko Rendah")} data-testid={`whatsapp-message-status-${m.id}`}>{m.status}</Badge></TableCell><TableCell data-testid={`whatsapp-message-provider-${m.id}`}>{m.provider}</TableCell><TableCell>{m.status !== "sent" && <Button size="sm" variant="outline" data-testid={`whatsapp-message-retry-${m.id}-button`} onClick={() => retryMessage(m.id)}>Retry</Button>}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div>;
}

function DrivePage({ forms, setForms, saveDrive, testDrive, driveSettings, retryDriveSync, retryFailedDriveSync, refreshDriveStatus }) {
  const d = { ...defaultDriveForm, ...(forms.drive || {}) };
  const updateDrive = (changes) => setForms({ ...forms, drive: { ...d, ...changes } });
  const summary = driveSettings?.summary || {};
  const items = driveSettings?.items || [];
  return <div className="space-y-6" data-testid="drive-page"><form onSubmit={saveDrive} className="space-y-4 border bg-white p-5" data-testid="drive-settings-form"><div className="flex flex-wrap items-start justify-between gap-4"><div><h2 className="font-display text-2xl font-semibold" data-testid="drive-settings-title">Konfigurasi Google Drive</h2><p className="mt-1 text-sm text-slate-500" data-testid="drive-settings-subtitle">Upload mahasiswa disimpan lokal dulu, lalu disinkronkan ke Google Drive di background.</p></div><div className="flex flex-wrap gap-2"><Badge className={statusClass(driveSettings?.drive_enabled ? "Aman" : "Risiko Rendah")} data-testid="drive-status-badge">{driveSettings?.drive_enabled ? "Drive aktif" : "Drive belum aktif"}</Badge>{driveSettings?.service_account_email && <Badge className="border-slate-200 bg-white text-slate-700" data-testid="drive-account-badge">{driveSettings.service_account_email}</Badge>}</div></div><div className="grid gap-4 md:grid-cols-2"><Field id="drive-root-folder-id" label="ID folder Google Drive"><Input id="drive-root-folder-id" data-testid="drive-root-folder-id-input" value={d.root_folder_id || ""} onChange={(e) => updateDrive({ root_folder_id: e.target.value })} placeholder="Contoh: 1AbCDEF..." /></Field><Field id="drive-root-folder-name" label="Nama folder root"><Input id="drive-root-folder-name" data-testid="drive-root-folder-name-input" value={d.root_folder_name || ""} onChange={(e) => updateDrive({ root_folder_name: e.target.value })} /></Field></div><Field id="drive-service-account-json" label="Service account JSON"><Textarea id="drive-service-account-json" data-testid="drive-service-account-json-input" value={d.service_account_json || ""} onChange={(e) => updateDrive({ service_account_json: e.target.value })} placeholder={driveSettings?.service_account_configured ? "Credential sudah tersimpan. Isi hanya jika ingin mengganti." : "Paste isi file JSON service account dari Google Cloud"} /></Field><div className="grid gap-3 md:grid-cols-3"><label className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="drive-enabled-toggle"><input type="checkbox" checked={!!d.enabled} onChange={(e) => updateDrive({ enabled: e.target.checked })} /> Aktifkan upload Drive</label><label className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="drive-require-toggle"><input type="checkbox" checked={!!d.require_upload} onChange={(e) => updateDrive({ require_upload: e.target.checked })} /> Wajib Drive terkonfigurasi</label><label className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm" data-testid="drive-clear-toggle"><input type="checkbox" checked={!!d.clear_service_account} onChange={(e) => updateDrive({ clear_service_account: e.target.checked })} /> Hapus credential tersimpan</label></div><div className="flex flex-wrap gap-2"><Button data-testid="drive-settings-save-button"><Settings /> Simpan Google Drive</Button><Button type="button" variant="outline" data-testid="drive-settings-test-button" onClick={testDrive}>Tes koneksi</Button><Button type="button" variant="outline" data-testid="drive-sync-refresh-button" onClick={refreshDriveStatus}>Refresh antrian</Button></div></form><Card className="rounded-md shadow-none" data-testid="drive-sync-card"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle data-testid="drive-sync-title">Monitor sinkron Google Drive</CardTitle><p className="mt-1 text-sm text-slate-500">Status ini menjelaskan apakah file sudah ada di Drive atau masih tersimpan lokal.</p></div><Button type="button" variant="outline" data-testid="drive-sync-retry-failed-button" disabled={!summary.failed} onClick={retryFailedDriveSync}>Retry semua gagal</Button></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 md:grid-cols-4"><StatCard icon={Upload} label="Menunggu" value={summary.pending || 0} hint="Antrian background" testid="drive-sync-pending" /><StatCard icon={CheckCircle2} label="Tersinkron" value={summary.synced || 0} hint="File sudah di Drive" testid="drive-sync-synced" /><StatCard icon={AlertTriangle} label="Gagal" value={summary.failed || 0} hint="Perlu retry/perbaiki Drive" testid="drive-sync-failed" /><StatCard icon={FileText} label="Lokal" value={summary.not_configured || 0} hint="Drive belum aktif saat upload" testid="drive-sync-local" /></div>{items.length === 0 ? <EmptyState title="Belum ada file tugas" description="File tugas dan lampiran soal akan muncul di sini setelah upload." /> : <Table><TableHeader><TableRow><TableHead>File</TableHead><TableHead>Tugas</TableHead><TableHead>Mahasiswa</TableHead><TableHead>Status Drive</TableHead><TableHead>Waktu</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{items.map((item) => <TableRow key={item.id} data-testid={`drive-sync-row-${item.id}`}><TableCell><div><p className="font-semibold" data-testid={`drive-sync-file-${item.id}`}>{item.file_name}</p><p className="text-xs text-slate-500">{formatBytes(item.size)} · {fileStatusLabel(item.upload_status)}</p>{item.drive_error && <p className="mt-1 max-w-md text-xs text-red-700" data-testid={`drive-sync-error-${item.id}`}>{item.drive_error}</p>}</div></TableCell><TableCell><div><p className="font-medium">{item.assignment_title || "-"}</p><p className="text-xs text-slate-500">{[item.course_name, item.class_name].filter(Boolean).join(" · ")}</p></div></TableCell><TableCell>{item.student_name ? `${item.student_name} (${item.student_nim || "-"})` : "-"}</TableCell><TableCell><Badge className={statusClass(item.drive_sync_status)} data-testid={`drive-sync-status-${item.id}`}>{driveSyncLabel(item.drive_sync_status)}</Badge></TableCell><TableCell className="text-sm text-slate-500">{fmtDate(item.updated_at || item.uploaded_at)}</TableCell><TableCell><div className="flex flex-wrap gap-2">{item.drive_file_url && <a href={item.drive_file_url} target="_blank" rel="noreferrer" className="text-sm font-semibold text-blue-700 underline" data-testid={`drive-sync-open-${item.id}-link`}>Buka Drive</a>}{["failed", "pending", "not_configured"].includes(item.drive_sync_status) && <Button type="button" size="sm" variant="outline" data-testid={`drive-sync-retry-${item.id}-button`} onClick={() => retryDriveSync(item.id)}>Retry</Button>}</div></TableCell></TableRow>)}</TableBody></Table>}</CardContent></Card><Card className="rounded-md shadow-none" data-testid="drive-help-card"><CardContent className="space-y-2 p-5 text-sm text-slate-600"><p data-testid="drive-help-folder">Struktur: {d.root_folder_name || "E-Learning Dosen"} / Tahun Akademik / Semester / Mata Kuliah / Kelas / Tugas / NIM - Nama Mahasiswa.</p><p data-testid="drive-help-security">Credential disimpan di backend dan tidak ditampilkan lagi setelah tersimpan. File tetap diakses lewat token sesi aplikasi.</p><p className="text-amber-700">Jika folder Drive terbuat tetapi file gagal muncul, biasanya service account tidak punya kuota/izin menulis file. Gunakan Shared Drive atau folder yang benar-benar mengizinkan service account mengunggah file, lalu tekan retry.</p></CardContent></Card></div>;
}

function GradePredicatePage({ classes, forms, setForms, token, saveGradePredicates }) {
  const rows = forms.gradePredicates || [];
  const progress = useActionProgress();
  async function loadByClass(classId) {
    setForms({ ...forms, gradePredicateClassId: classId });
    const operation = progress.begin("Memuat range predikat");
    try {
      const { data } = await axios.get(`${API}/grade-predicates?class_id=${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      setForms((prev) => ({ ...prev, gradePredicateClassId: classId, gradePredicates: data.predicates || [] }));
      progress.finish(operation, "Range predikat dimuat");
    } catch (error) {
      const detail = error.response?.data?.detail || "Gagal memuat predikat";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  function updateRow(index, patch) {
    const next = rows.map((item, idx) => (idx === index ? { ...item, ...patch } : item));
    setForms({ ...forms, gradePredicates: next });
  }
  function addRow() {
    setForms({ ...forms, gradePredicates: [...rows, { label: "", min_score: 0, max_score: 0 }] });
  }
  function removeRow(index) {
    setForms({ ...forms, gradePredicates: rows.filter((_, idx) => idx !== index) });
  }
  async function submit(event) {
    event.preventDefault();
    await saveGradePredicates({ class_id: forms.gradePredicateClassId || "", predicates: rows.map((item) => ({ ...item, min_score: Number(item.min_score), max_score: Number(item.max_score) })) });
  }
  return <form onSubmit={submit} className="space-y-6" data-testid="grade-predicate-page"><Card className="rounded-md shadow-none" data-testid="grade-predicate-card"><CardHeader><CardTitle data-testid="grade-predicate-title">Range predikat nilai otomatis</CardTitle></CardHeader><CardContent className="space-y-4"><Field id="grade-predicate-class" label="Terapkan untuk kelas"><select id="grade-predicate-class" className="form-select" data-testid="grade-predicate-class-select" value={forms.gradePredicateClassId || ""} onChange={(e) => loadByClass(e.target.value)}><option value="">Default semua kelas</option>{classes.map((c) => <option key={c.id} value={c.id}>{`${c.course_name || "Mapel"} - ${c.name}`}</option>)}</select></Field><div className="space-y-3" data-testid="grade-predicate-row-list">{rows.map((item, index) => <div key={`${item.label}-${index}`} className="grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]" data-testid={`grade-predicate-row-${index}`}><Field id={`predicate-label-${index}`} label="Predikat"><Input id={`predicate-label-${index}`} data-testid={`predicate-label-${index}-input`} value={item.label} onChange={(e) => updateRow(index, { label: e.target.value.toUpperCase() })} /></Field><Field id={`predicate-min-${index}`} label="Nilai minimum"><Input id={`predicate-min-${index}`} type="number" step="0.01" data-testid={`predicate-min-${index}-input`} value={item.min_score} onChange={(e) => updateRow(index, { min_score: e.target.value })} /></Field><Field id={`predicate-max-${index}`} label="Nilai maksimum"><Input id={`predicate-max-${index}`} type="number" step="0.01" data-testid={`predicate-max-${index}-input`} value={item.max_score} onChange={(e) => updateRow(index, { max_score: e.target.value })} /></Field><Button type="button" variant="outline" data-testid={`predicate-remove-${index}-button`} onClick={() => removeRow(index)}>Hapus</Button></div>)}</div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" data-testid="predicate-add-row-button" onClick={addRow}>Tambah predikat</Button><Button data-testid="predicate-save-button"><CheckCircle2 /> Simpan range</Button></div><p className="text-sm text-slate-500" data-testid="grade-predicate-help">Range bersifat inklusif. Contoh: nilai 85-100 menjadi A. Sistem otomatis menulis predikat saat dosen menyimpan nilai.</p></CardContent></Card></form>;
}

function AdminApp({ token, user, onLogout, branding, onBrandingUpdate, onUserUpdate }) {
  const [page, setPage] = useState("dashboard");
  const [data, setData] = useState({ programs: [], courses: [], classes: [], students: [], assignments: [], materials: [], submissions: [], progress: [], reminders: [], calendar: [], enrollments: [], dashboard: null, report: null, settings: null, whatsappSettings: null, whatsappMessages: [], driveSettings: null, gradePredicates: [], cleanData: [] });
  const [forms, setForms] = useState({ program: { code: "", name: "", description: "" }, course: { program_id: "", code: "", name: "", credits: 3, description: "" }, class: { academic_year: "2025/2026", semester: "Ganjil", course_id: "", name: "", schedule: "" }, student: { nim: "230001099", name: "Nama Mahasiswa", email: "student99@demo.id", whatsapp: "628123", class_id: "", password: "Mahasiswa123!", import_password: "Mahasiswa123!" }, material: { class_id: "", title: "", description: "", file_url: "", video_url: "", is_active: true, locked_until: "" }, assignment: { class_id: "", title: "", description: "", attachment_link: "", deadline: "", published_at: "", tolerance_hours: 6, allowed_formats: "pdf,docx,zip,png,jpg", max_file_size_mb: 5, assignment_type: "individu", allow_revision: true, is_practicum: false, practicum_goal: "", practicum_tools: "", practicum_steps: "", required_screenshot: false, late_penalty_per_day: 5, close_after_deadline: false, material_id: "" }, grade: { submission_id: "", score: 85, feedback: "Pekerjaan sudah baik.", revision_note: "" }, settings: { app_name: "E-Learning Dosen", campus_name: "", campus_address: "", program_name: "", lecturer_name: "", lecturer_email: "", campus_logo_url: "", active_academic_year: "2025/2026", active_semester: "Ganjil" }, whatsapp: defaultWhatsAppForm, drive: defaultDriveForm, gradePredicateClassId: "", gradePredicates: [{ label: "A", min_score: 85, max_score: 100 }, { label: "B", min_score: 70, max_score: 84.99 }, { label: "C", min_score: 60, max_score: 69.99 }, { label: "D", min_score: 50, max_score: 59.99 }, { label: "E", min_score: 0, max_score: 49.99 }] });
  const [importFile, setImportFile] = useState(null);
  const [materialFile, setMaterialFile] = useState(null);
  const [materialFileInputKey, setMaterialFileInputKey] = useState(0);
  const [assignmentFiles, setAssignmentFiles] = useState([]);
  const [assignmentFileInputKey, setAssignmentFileInputKey] = useState(0);
  const seenStorageKey = `elearn_admin_seen_${user.id}`;
  const [seenBadges, setSeenBadges] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`elearn_admin_seen_${user.id}`) || "{}"); } catch { return {}; }
  });
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const progress = useActionProgress();

  async function loadAll(event) {
    const operation = event?.type === "click" ? progress.begin("Memuat ulang data", "Mengambil data terbaru dari server...") : null;
    try {
      const [dashboard, programs, courses, classes, students, assignments, materials, submissions, studentProgress, reminders, calendar, report, enrollments, settings, whatsappSettings, whatsappMessages, gradePredicates, driveSettings, cleanData] = await Promise.all([axios.get(`${API}/dashboard`, auth), axios.get(`${API}/programs`, auth), axios.get(`${API}/courses`, auth), axios.get(`${API}/classes`, auth), axios.get(`${API}/students`, auth), axios.get(`${API}/assignments`, auth), axios.get(`${API}/materials`, auth), axios.get(`${API}/submissions`, auth), axios.get(`${API}/progress`, auth), axios.get(`${API}/reminders`, auth), axios.get(`${API}/calendar`, auth), axios.get(`${API}/reports/summary`, auth), axios.get(`${API}/enrollment-requests`, auth), axios.get(`${API}/settings`, auth), axios.get(`${API}/whatsapp/settings`, auth), axios.get(`${API}/whatsapp/messages`, auth), axios.get(`${API}/grade-predicates`, auth), axios.get(`${API}/drive/settings`, auth), axios.get(`${API}/clean-data/summary`, auth)]);
      const programsData = programs.data;
      const coursesData = courses.data;
      const classesData = classes.data;
      setData({ dashboard: dashboard.data, programs: programsData, courses: coursesData, classes: classesData, students: students.data, assignments: assignments.data, materials: materials.data, submissions: submissions.data, progress: studentProgress.data, reminders: reminders.data, calendar: calendar.data, report: report.data, enrollments: enrollments.data, settings: settings.data, whatsappSettings: whatsappSettings.data, whatsappMessages: whatsappMessages.data, driveSettings: driveSettings.data, gradePredicates: gradePredicates.data.predicates || [], cleanData: cleanData.data || [] });
      setForms((prev) => ({ ...prev, course: { ...prev.course, program_id: prev.course.program_id || programsData[0]?.id || "" }, class: { ...prev.class, course_id: prev.class.course_id || coursesData[0]?.id || "" }, student: { ...prev.student, class_id: prev.student.class_id || classesData[0]?.id || "" }, material: { ...prev.material, class_id: prev.material.class_id || classesData[0]?.id || "" }, assignment: { ...prev.assignment, class_id: prev.assignment.class_id || classesData[0]?.id || "" }, grade: { ...prev.grade, submission_id: prev.grade.submission_id || submissions.data[0]?.id || "" }, settings: settings.data || prev.settings, whatsapp: { ...prev.whatsapp, ...whatsappSettings.data, fonnte_token: "", waha_api_key: "" }, drive: { ...defaultDriveForm, ...driveSettings.data, service_account_json: "", clear_service_account: false }, gradePredicates: gradePredicates.data.predicates || prev.gradePredicates }));
      if (operation) progress.finish(operation, "Data terbaru dimuat");
    } catch (error) {
      if (operation) progress.fail(operation, error.response?.data?.detail || "Gagal memuat data");
      toast.error(error.response?.data?.detail || "Gagal memuat data");
    }
  }
  useEffect(() => {
    loadAll();
    // The authenticated admin shell owns one initial aggregate fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function postJson(path, payload, success) {
    const operation = progress.begin(success, "Mengirim perubahan ke server...");
    try {
      await axios.post(`${API}${path}`, payload, auth);
      progress.update(operation, 92, success, "Memperbarui tampilan...");
      await loadAll();
      progress.finish(operation, success);
      toast.success(success);
    } catch (error) {
      const detail = formatApiError(error, "Aksi gagal");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveMaterial(event) {
    event.preventDefault();
    const { id, ...payload } = forms.material;
    let saved = null;
    const operation = progress.begin(id ? "Menyimpan perubahan pertemuan" : "Membuat pertemuan", materialFile ? "Menyiapkan data dan file materi..." : "Mengirim data materi...");
    try {
      const response = await axios[id ? "put" : "post"](`${API}/materials${id ? `/${id}` : ""}`, payload, auth);
      saved = response.data;
      if (materialFile) {
        const fd = new FormData();
        fd.append("attachment", materialFile);
        await axios.post(`${API}/materials/${saved.id}/attachment`, fd, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (upload) => progress.update(operation, uploadProgressPercent(upload, 22, 91), "Mengunggah file materi", materialFile.name),
        });
      }
      progress.update(operation, 94, "Menyimpan materi", "Memperbarui daftar pertemuan...");
      toast.success(id ? "Pertemuan diperbarui" : "Pertemuan dibuat");
      setMaterialFile(null);
      setMaterialFileInputKey((key) => key + 1);
      setForms((prev) => ({ ...prev, material: { class_id: prev.material.class_id, title: "", description: "", file_url: "", video_url: "", is_active: true, locked_until: "" } }));
      await loadAll();
      progress.finish(operation, id ? "Pertemuan diperbarui" : "Pertemuan dibuat");
    } catch (error) {
      const detail = formatApiError(error, saved ? "Pertemuan tersimpan, tetapi upload file gagal" : "Pertemuan gagal disimpan");
      progress.fail(operation, detail);
      toast.error(detail);
      if (saved) await loadAll();
    }
  }
  async function deleteMaterial(material) {
    if (!window.confirm(`Hapus ${material.meeting}: ${material.title}? Materi dan diskusinya akan dihapus, sedangkan tugas terkait tetap tersedia tanpa pertemuan.`)) return;
    const operation = progress.begin("Menghapus pertemuan", material.title);
    try {
      const { data: result } = await axios.delete(`${API}/materials/${material.id}`, auth);
      const taskInfo = result.assignments_unlinked ? ` ${result.assignments_unlinked} tugas dilepas dari pertemuan.` : "";
      toast.success(`Pertemuan dihapus.${taskInfo}`);
      if (forms.material.id === material.id) {
        setMaterialFile(null);
        setMaterialFileInputKey((key) => key + 1);
      }
      setForms((prev) => prev.material.id === material.id ? ({ ...prev, material: { class_id: prev.material.class_id, title: "", description: "", file_url: "", video_url: "", is_active: true, locked_until: "" } }) : prev);
      await loadAll();
      progress.finish(operation, "Pertemuan dihapus");
    } catch (error) {
      const detail = error.response?.data?.detail || "Pertemuan gagal dihapus";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function createAssignment(event) {
    event.preventDefault();
    const { id, ...assignmentForm } = forms.assignment;
    const allowedFormats = Array.isArray(assignmentForm.allowed_formats)
      ? assignmentForm.allowed_formats
      : String(assignmentForm.allowed_formats || "").split(",");
    const practicumSteps = Array.isArray(assignmentForm.practicum_steps)
      ? assignmentForm.practicum_steps
      : String(assignmentForm.practicum_steps || "").split("\n");
    const payload = {
      ...assignmentForm,
      allowed_formats: allowedFormats.map((x) => String(x).trim()).filter(Boolean),
      max_file_size_mb: Number(assignmentForm.max_file_size_mb || DEFAULT_SUBMISSION_MAX_FILE_MB),
      deadline: assignmentForm.deadline ? new Date(assignmentForm.deadline).toISOString() : "",
      published_at: assignmentForm.published_at ? new Date(assignmentForm.published_at).toISOString() : "",
      rubric: Array.isArray(assignmentForm.rubric) && assignmentForm.rubric.length ? assignmentForm.rubric : defaultAssignmentRubric(),
      practicum_steps: practicumSteps.map((item) => String(item).trim()).filter(Boolean),
    };
    const editing = Boolean(id);
    const operation = progress.begin(editing ? "Menyimpan perubahan tugas" : "Membuat tugas", assignmentFiles.length ? `Menyiapkan ${assignmentFiles.length} lampiran soal...` : "Menyimpan detail tugas...");
    let saved = null;
    try {
      const response = await axios[editing ? "put" : "post"](`${API}/assignments${editing ? `/${id}` : ""}`, payload, auth);
      saved = response.data;
      progress.update(operation, 24, editing ? "Tugas diperbarui" : "Tugas dibuat", assignmentFiles.length ? "Mengunggah lampiran soal..." : "Memperbarui daftar tugas...");
      if (assignmentFiles.length) {
        const fd = new FormData();
        assignmentFiles.forEach((item) => fd.append("files", item));
        await axios.post(`${API}/assignments/${saved.id}/attachments`, fd, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (upload) => progress.update(operation, uploadProgressPercent(upload, 25, 93), "Mengunggah lampiran tugas", `${assignmentFiles.length} file dikirim ke server.`),
        });
      }
      await loadAll();
      progress.finish(operation, editing ? "Tugas berhasil diperbarui" : "Tugas berhasil dibuat", assignmentFiles.length ? "Lampiran tersimpan di server; sinkron Drive diproses di latar." : "Tugas tersimpan.");
      toast.success(editing ? "Tugas berhasil diperbarui" : "Tugas berhasil dibuat");
      setAssignmentFiles([]);
      setAssignmentFileInputKey((key) => key + 1);
      setForms((prev) => ({
        ...prev,
        assignment: {
          ...prev.assignment,
          id: "",
          title: "",
          description: "",
          attachment_link: "",
          deadline: "",
          published_at: "",
          tolerance_hours: 6,
          allowed_formats: "pdf,docx,zip,png,jpg",
          material_id: "",
          max_file_size_mb: DEFAULT_SUBMISSION_MAX_FILE_MB,
          assignment_type: "individu",
          allow_revision: true,
          is_practicum: false,
          practicum_goal: "",
          practicum_tools: "",
          practicum_steps: "",
          required_screenshot: false,
          late_penalty_per_day: 5,
          close_after_deadline: false,
          rubric: defaultAssignmentRubric(),
        },
      }));
    } catch (error) {
      const detail = formatApiError(error, saved ? "Tugas tersimpan, tetapi lampiran gagal diunggah" : "Tugas gagal disimpan");
      progress.fail(operation, detail);
      toast.error(detail);
      if (saved) await loadAll();
    }
  }
  async function importStudents(event) {
    event.preventDefault();
    if (!importFile || !forms.student.class_id) return toast.error("Pilih file Excel dan kelas");
    const operation = progress.begin("Mengimpor mahasiswa", importFile.name);
    const fd = new FormData();
    fd.append("file", importFile);
    fd.append("default_password", forms.student.import_password || "");
    try {
      const { data: result } = await axios.post(`${API}/classes/${forms.student.class_id}/students/import`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (upload) => progress.update(operation, uploadProgressPercent(upload), "Mengunggah file mahasiswa"),
      });
      await loadAll();
      progress.finish(operation, "Import mahasiswa selesai");
      toast.success(`Import selesai: ${result.created} dibuat, ${result.skipped} dilewati`);
    } catch (error) {
      const detail = formatApiError(error, "Import gagal");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function gradeSubmission(event) {
    event.preventDefault();
    const selected = data.submissions.find((item) => item.id === forms.grade.submission_id);
    const assignment = data.assignments.find((item) => item.id === selected?.assignment_id);
    const score = clampScoreInput(forms.grade.score);
    if (score === "") return toast.error("Nilai wajib diisi");
    const rubric = assignment?.rubric?.length ? assignment.rubric : [{ criterion: "Nilai total", weight: 100 }];
    const payload = {
      rubric_scores: rubric.map((item) => ({ ...item, score: Number(score) })),
      feedback: forms.grade.feedback,
      revision_note: forms.grade.revision_note,
      status: "Dinilai",
    };
    await postJson(`/submissions/${forms.grade.submission_id}/grade`, payload, "Nilai berhasil disimpan");
  }
  async function bulkGradeSubmissions(grades) {
    const targets = grades?.length ? grades : data.submissions
      .filter((item) => item.status !== "Dinilai")
      .map((item) => ({
        submission_id: item.id,
        score: Number(clampScoreInput(forms.grade.score)),
        feedback: forms.grade.feedback,
        revision_note: forms.grade.revision_note,
      }));
    const cleanTargets = targets
      .map((item) => ({ ...item, score: Number(clampScoreInput(item.score)) }))
      .filter((item) => !Number.isNaN(item.score));
    if (!cleanTargets.length) return toast.info("Tidak ada submission yang siap dinilai");
    await postJson("/submissions/bulk-grade", { grades: cleanTargets }, "Nilai banyak mahasiswa berhasil disimpan");
  }
  async function exportGrades() {
    const operation = progress.begin("Menyiapkan export nilai");
    try {
      const response = await axios.get(`${API}/reports/grades.xlsx`, { ...auth, responseType: "blob", onDownloadProgress: (download) => progress.update(operation, uploadProgressPercent(download), "Mengunduh rekap nilai") });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "rekap-nilai.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      progress.finish(operation, "Rekap nilai diunduh");
      toast.success("Rekap nilai diunduh");
    } catch (error) {
      progress.fail(operation, "Export gagal");
      toast.error("Export gagal");
    }
  }
  async function sendReminder(assignmentId, studentId = "") { await postJson("/reminders/send", { assignment_id: assignmentId, student_id: studentId, reminder_type: "manual", message: "Reminder deadline tugas" }, "Reminder in-app tersimpan"); }
  async function saveSettings(event) { event.preventDefault(); const operation = progress.begin("Menyimpan settings"); try { const { data: saved } = await axios.put(`${API}/settings`, forms.settings, auth); onBrandingUpdate(saved); await loadAll(); progress.finish(operation, "Settings aplikasi disimpan"); toast.success("Settings aplikasi disimpan"); } catch (error) { const detail = error.response?.data?.detail || "Settings gagal disimpan"; progress.fail(operation, detail); toast.error(detail); } }
  async function saveWhatsApp(event) { event.preventDefault(); const operation = progress.begin("Menyimpan WhatsApp gateway"); try { await axios.put(`${API}/whatsapp/settings`, forms.whatsapp, auth); await loadAll(); progress.finish(operation, "Konfigurasi WhatsApp disimpan"); toast.success("Konfigurasi WhatsApp disimpan"); } catch (error) { const detail = error.response?.data?.detail || "Konfigurasi WhatsApp gagal"; progress.fail(operation, detail); toast.error(detail); } }
  async function saveDrive(event) { event.preventDefault(); const operation = progress.begin("Menyimpan Google Drive"); try { await axios.put(`${API}/drive/settings`, forms.drive, auth); setForms((prev) => ({ ...prev, drive: { ...prev.drive, service_account_json: "", clear_service_account: false } })); await loadAll(); progress.finish(operation, "Konfigurasi Google Drive disimpan"); toast.success("Konfigurasi Google Drive disimpan"); } catch (error) { const detail = error.response?.data?.detail || "Konfigurasi Drive gagal"; progress.fail(operation, detail); toast.error(detail); } }
  async function testDrive() { const operation = progress.begin("Menguji koneksi Google Drive", "Mengunggah file tes ke Drive..."); try { const { data: result } = await axios.post(`${API}/drive/settings/test`, {}, auth); await loadAll(); progress.finish(operation, "Koneksi Google Drive berhasil"); toast.success(result.folder_name ? `Koneksi Drive OK: ${result.folder_name}` : "Koneksi Drive OK"); } catch (error) { const detail = error.response?.data?.detail || "Tes koneksi Drive gagal"; progress.fail(operation, detail); toast.error(detail); } }
  async function refreshDriveStatus() { const operation = progress.begin("Memuat status sinkron Drive"); try { await loadAll(); progress.finish(operation, "Status sinkron diperbarui"); toast.info("Status sinkron Drive diperbarui"); } catch (error) { progress.fail(operation, "Status sinkron gagal dimuat"); } }
  async function retryDriveSync(fileId) { const operation = progress.begin("Mengantre ulang sinkron file"); try { await axios.post(`${API}/drive/sync/${fileId}/retry`, {}, auth); await loadAll(); progress.finish(operation, "File masuk antrean sinkron ulang"); toast.success("File masuk antrean sinkron ulang"); } catch (error) { const detail = formatApiError(error, "Retry sinkron Drive gagal"); progress.fail(operation, detail); toast.error(detail); } }
  async function retryFailedDriveSync() { const operation = progress.begin("Mengantre ulang file gagal"); try { const { data: result } = await axios.post(`${API}/drive/sync/retry-failed`, {}, auth); await loadAll(); progress.finish(operation, `${result.queued || 0} file masuk antrean ulang`); toast.success(`${result.queued || 0} file gagal masuk antrean ulang`); } catch (error) { const detail = formatApiError(error, "Retry semua file gagal tidak berhasil"); progress.fail(operation, detail); toast.error(detail); } }
	  async function retryWhatsAppMessage(id) { await postJson(`/whatsapp/messages/${id}/retry`, {}, "Pesan masuk antrean ulang"); }
	  async function saveGradePredicates(payload) { const operation = progress.begin("Menyimpan range predikat"); try { const { data: saved } = await axios.put(`${API}/grade-predicates`, payload, auth); setForms((prev) => ({ ...prev, gradePredicates: saved.predicates, gradePredicateClassId: saved.class_id })); await loadAll(); progress.finish(operation, "Range predikat disimpan"); toast.success("Range predikat disimpan"); } catch (error) { const detail = error.response?.data?.detail || "Range predikat gagal disimpan"; progress.fail(operation, detail); toast.error(detail); } }
	  async function cleanDataModule(moduleKey, label) { const ok = window.confirm(`Hapus data percobaan modul ${label}? Aksi ini tidak bisa dibatalkan.`); if (!ok) return; const operation = progress.begin(`Membersihkan ${label}`); try { await axios.post(`${API}/clean-data/${moduleKey}`, { confirmation: "HAPUS" }, auth); await loadAll(); progress.finish(operation, `Data ${label} dibersihkan`); toast.success(`Data ${label} dibersihkan`); } catch (error) { const detail = error.response?.data?.detail || "Clean data gagal"; progress.fail(operation, detail); toast.error(detail); } }
	  async function markReviewed(id) { await postJson(`/submissions/${id}/review`, {}, "Submission ditandai sudah dilihat"); }
	  async function requestRevision(id) { const note = window.prompt("Catatan revisi", "Silakan revisi jawaban"); if (note !== null) await postJson(`/submissions/${id}/request-revision`, { revision_note: note }, "Permintaan revisi dikirim"); }
	  async function saveProgram(event) { event.preventDefault(); const { id, ...payload } = forms.program; const operation = progress.begin(id ? "Memperbarui prodi" : "Membuat prodi"); try { await axios[id ? "put" : "post"](`${API}/programs${id ? `/${id}` : ""}`, payload, auth); setForms((prev) => ({ ...prev, program: { code: "", name: "", description: "" } })); await loadAll(); progress.finish(operation, id ? "Prodi diperbarui" : "Prodi dibuat"); toast.success(id ? "Prodi diperbarui" : "Prodi dibuat"); } catch (error) { const detail = error.response?.data?.detail || "Prodi gagal disimpan"; progress.fail(operation, detail); toast.error(detail); } }
	  async function saveCourse(event) { event.preventDefault(); const { id, ...payload } = forms.course; const operation = progress.begin(id ? "Memperbarui mata kuliah" : "Membuat mata kuliah"); try { await axios[id ? "put" : "post"](`${API}/courses${id ? `/${id}` : ""}`, { ...payload, credits: Number(payload.credits || 0) }, auth); setForms((prev) => ({ ...prev, course: { program_id: prev.course.program_id, code: "", name: "", credits: 3, description: "" } })); await loadAll(); progress.finish(operation, id ? "Mata kuliah diperbarui" : "Mata kuliah dibuat"); toast.success(id ? "Mata kuliah diperbarui" : "Mata kuliah dibuat"); } catch (error) { const detail = error.response?.data?.detail || "Mata kuliah gagal disimpan"; progress.fail(operation, detail); toast.error(detail); } }
	  async function saveClass(event) { event.preventDefault(); const { id, ...payload } = forms.class; const operation = progress.begin(id ? "Memperbarui kelas" : "Membuat kelas"); try { await axios[id ? "put" : "post"](`${API}/classes${id ? `/${id}` : ""}`, payload, auth); setForms((prev) => ({ ...prev, class: { academic_year: prev.class.academic_year, semester: prev.class.semester, course_id: prev.class.course_id, name: "", schedule: "" } })); await loadAll(); progress.finish(operation, id ? "Kelas diperbarui" : "Kelas dibuat"); toast.success(id ? "Kelas diperbarui" : "Kelas dibuat"); } catch (error) { const detail = error.response?.data?.detail || "Kelas gagal disimpan"; progress.fail(operation, detail); toast.error(detail); } }
	  async function deleteCatalog(type, id, label) { if (!window.confirm(`Hapus ${label}?`)) return; const operation = progress.begin(`Menghapus ${label}`); try { await axios.delete(`${API}/${type}/${id}`, auth); await loadAll(); progress.finish(operation, `${label} dihapus`); toast.success(`${label} dihapus`); } catch (error) { const detail = error.response?.data?.detail || `${label} gagal dihapus`; progress.fail(operation, detail); toast.error(detail); } }
	  async function endClass(id) { await postJson(`/classes/${id}/end`, {}, "Kelas diakhiri dan masuk riwayat"); }
  const submissionReviewItems = (data.submissions || []).filter(needsSubmissionReview);
  const enrollmentItems = (data.enrollments || []).filter((item) => item.status === "pending");
  const whatsappItems = (data.whatsappMessages || []).filter((item) => ["failed", "pending_config"].includes(item.status));
  const materialCommentItems = data.dashboard?.latest_comments || [];
  const unseenSubmissions = unseenCount(submissionReviewItems, seenBadges.submissionReviews);
  const unseenEnrollments = unseenCount(enrollmentItems, seenBadges.students);
  const unseenWhatsapp = unseenCount(whatsappItems, seenBadges.whatsapp);
  const unseenMaterials = unseenCount(materialCommentItems, seenBadges.materials);
  const adminBadges = { dashboard: unseenSubmissions + unseenEnrollments + unseenWhatsapp + unseenMaterials, assignments: unseenSubmissions, grading: unseenSubmissions, students: unseenEnrollments, materials: unseenMaterials, whatsapp: unseenWhatsapp };
  function saveSeenBadges(next) { setSeenBadges(next); localStorage.setItem(seenStorageKey, JSON.stringify(next)); }
  function rememberCategorySeen(items) { return (items || []).map(attentionKey); }
  function markAdminPageSeen(targetPage) {
    const next = { ...seenBadges };
    if (targetPage === "dashboard") {
      next.submissionReviews = rememberCategorySeen(submissionReviewItems);
      next.students = rememberCategorySeen(enrollmentItems);
      next.materials = rememberCategorySeen(materialCommentItems);
      next.whatsapp = rememberCategorySeen(whatsappItems);
    } else if (targetPage === "assignments" || targetPage === "grading") {
      next.submissionReviews = rememberCategorySeen(submissionReviewItems);
    } else if (targetPage === "students") {
      next.students = rememberCategorySeen(enrollmentItems);
    } else if (targetPage === "materials") {
      next.materials = rememberCategorySeen(materialCommentItems);
    } else if (targetPage === "whatsapp") {
      next.whatsapp = rememberCategorySeen(whatsappItems);
    }
    saveSeenBadges(next);
  }
  function openAdminPage(targetPage) { markAdminPageSeen(targetPage); setPage(targetPage); }
  const nav = [["dashboard", LayoutDashboard, "Dashboard"], ["classes", BookOpen, "Prodi, MK & Kelas"], ["students", Users, "Mahasiswa"], ["materials", MessageSquare, "Materi & Diskusi"], ["assignments", ClipboardList, "Tugas"], ["grading", CheckCircle2, "Penilaian"], ["calendar", CalendarDays, "Kalender"], ["reports", FileSpreadsheet, "Laporan"], ["profile", Users, "Profil"], ["settings", Settings, "Settings"], ["drive", Upload, "Google Drive"], ["whatsapp", Bell, "WhatsApp"], ["predicates", CheckCircle2, "Predikat"], ["clean", Trash2, "Clean Data"]];
		  return <div className="min-h-screen bg-slate-50 text-slate-900" data-testid="admin-app-shell"><aside className="fixed inset-y-0 left-0 z-30 hidden w-72 bg-slate-950 p-5 text-white lg:block" data-testid="admin-sidebar"><div className="mb-8 flex items-center gap-3"><img src={brandingLogo(data.settings || branding)} alt="Logo" className="h-10 w-10" data-testid="admin-sidebar-logo-image" /><div><p className="font-display text-lg font-bold" data-testid="admin-sidebar-title">{brandingName(data.settings || branding)}</p><p className="text-xs text-slate-400" data-testid="admin-sidebar-subtitle">Control Room</p></div></div><nav className="space-y-1" data-testid="admin-navigation">{nav.map(([key, Icon, label]) => { const count = adminBadges[key] || 0; return <Button key={key} variant={page === key ? "secondary" : "ghost"} className="w-full justify-start text-white hover:bg-white/10 hover:text-white data-[active=true]:text-slate-950" data-active={page === key} data-testid={`admin-nav-${key}-button`} onClick={() => openAdminPage(key)}><Icon /><span className="flex-1 text-left">{label}</span><NotificationBadge count={count} testid={`admin-nav-${key}-badge`} /></Button>; })}</nav></aside><main className="lg:pl-72" data-testid="admin-main-content"><header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8" data-testid="admin-topbar"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="admin-role-label">Dosen/Admin</p><h1 className="font-display text-3xl font-bold text-slate-950" data-testid="admin-page-title">{nav.find((item) => item[0] === page)?.[2]}</h1></div><div className="flex flex-wrap items-center gap-2"><Badge className="border-slate-200 bg-white text-slate-700" data-testid="admin-user-badge">{user.name}</Badge><Button variant="outline" data-testid="admin-profile-button" onClick={() => setPage("profile")}>Profil</Button><Button variant="outline" data-testid="admin-refresh-button" onClick={loadAll}>Refresh</Button><Button variant="outline" data-testid="admin-logout-button" onClick={onLogout}><LogOut /> Keluar</Button></div></div><div className="mt-4 flex gap-2 overflow-x-auto lg:hidden" data-testid="admin-mobile-navigation">{nav.map(([key, Icon, label]) => { const count = adminBadges[key] || 0; return <Button key={key} size="sm" variant={page === key ? "default" : "outline"} data-testid={`admin-mobile-nav-${key}-button`} onClick={() => openAdminPage(key)}><Icon /><span>{label}</span><NotificationBadge count={count} testid={`admin-mobile-nav-${key}-badge`} /></Button>; })}</div></header><section className="p-5 md:p-8" data-testid="admin-page-section">{page === "dashboard" && <DashboardPage data={data} sendReminder={sendReminder} token={token} />}{page === "classes" && <ClassesPage data={data} forms={forms} setForms={setForms} saveProgram={saveProgram} saveCourse={saveCourse} saveClass={saveClass} deleteCatalog={deleteCatalog} endClass={endClass} />}{page === "students" && <StudentsPage data={data} forms={forms} setForms={setForms} postJson={postJson} importStudents={importStudents} setImportFile={setImportFile} />}{page === "materials" && <MaterialsPage data={data} forms={forms} setForms={setForms} saveMaterial={saveMaterial} deleteMaterial={deleteMaterial} materialFile={materialFile} setMaterialFile={setMaterialFile} materialFileInputKey={materialFileInputKey} setMaterialFileInputKey={setMaterialFileInputKey} token={token} />}{page === "assignments" && <AssignmentsPage data={data} forms={forms} setForms={setForms} createAssignment={createAssignment} sendReminder={sendReminder} assignmentFiles={assignmentFiles} setAssignmentFiles={setAssignmentFiles} assignmentFileInputKey={assignmentFileInputKey} setAssignmentFileInputKey={setAssignmentFileInputKey} token={token} />}{page === "grading" && <GradingPage data={data} forms={forms} setForms={setForms} gradeSubmission={gradeSubmission} bulkGradeSubmissions={bulkGradeSubmissions} markReviewed={markReviewed} requestRevision={requestRevision} token={token} />}{page === "calendar" && <CalendarPage events={data.calendar} />}{page === "reports" && <ReportsPage data={data} exportGrades={exportGrades} />}{page === "profile" && <ProfilePage token={token} user={user} onUserUpdate={onUserUpdate} />}{page === "settings" && <SettingsPage forms={forms} setForms={setForms} saveSettings={saveSettings} />}{page === "drive" && <DrivePage forms={forms} setForms={setForms} saveDrive={saveDrive} testDrive={testDrive} driveSettings={data.driveSettings} retryDriveSync={retryDriveSync} retryFailedDriveSync={retryFailedDriveSync} refreshDriveStatus={refreshDriveStatus} />}{page === "whatsapp" && <WhatsAppPage forms={forms} setForms={setForms} saveWhatsApp={saveWhatsApp} messages={data.whatsappMessages} retryMessage={retryWhatsAppMessage} />}{page === "predicates" && <GradePredicatePage classes={data.classes} forms={forms} setForms={setForms} token={token} saveGradePredicates={saveGradePredicates} />}{page === "clean" && <CleanDataPage modules={data.cleanData} cleanDataModule={cleanDataModule} />}</section></main></div>;
}

function CleanDataPage({ modules, cleanDataModule }) {
  return <div className="space-y-6" data-testid="clean-data-page">
    <Card className="rounded-md border-red-200 bg-red-50 shadow-none" data-testid="clean-data-warning-card"><CardContent className="p-5"><div className="flex items-start gap-3"><AlertTriangle className="mt-1 h-5 w-5 text-red-700" /><div><h2 className="font-display text-2xl font-semibold text-red-800" data-testid="clean-data-title">Clean data percobaan</h2><p className="mt-2 text-sm text-red-700" data-testid="clean-data-warning">Gunakan halaman ini hanya untuk menghapus data testing. Akun dosen/admin, settings aplikasi, konfigurasi WhatsApp, konfigurasi Google Drive, file .env, dan credential Drive tidak ikut dihapus.</p></div></div></CardContent></Card>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" data-testid="clean-data-module-list">{(modules || []).map((item) => <Card key={item.key} className={`rounded-md shadow-none ${item.key === "all" ? "border-red-300" : ""}`} data-testid={`clean-data-card-${item.key}`}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle data-testid={`clean-data-label-${item.key}`}>{item.label}</CardTitle><Badge className={item.count ? "border-amber-200 bg-amber-50 text-amber-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"} data-testid={`clean-data-count-${item.key}`}>{item.count || 0} data</Badge></div></CardHeader><CardContent className="space-y-4"><p className="text-sm text-slate-600" data-testid={`clean-data-description-${item.key}`}>{item.description}</p><Button type="button" variant={item.key === "all" ? "destructive" : "outline"} data-testid={`clean-data-run-${item.key}-button`} onClick={() => cleanDataModule(item.key, item.label)}><Trash2 /> Bersihkan</Button></CardContent></Card>)}</div>
  </div>;
}

function DashboardPage({ data, sendReminder, token }) {
  const s = data.dashboard?.summary || {};
  return <div className="space-y-6 animate-rise" data-testid="dashboard-page"><div className={`flex items-center gap-3 border p-4 ${s.storage_mode === "google_drive" ? "border-blue-200 bg-blue-50 text-blue-800" : "border-amber-200 bg-amber-50 text-amber-800"}`} data-testid="storage-mode-info"><CheckCircle2 className="h-5 w-5" /><span data-testid="storage-mode-info-text">{s.storage_mode === "google_drive" ? `Google Drive aktif. Folder: ${s.drive_root_folder_name || "E-Learning Dosen"} / Tahun Akademik / Semester / Mata Kuliah / Kelas / Tugas / Mahasiswa.` : "Google Drive belum aktif. Upload tetap disimpan aman di server lokal dengan struktur folder akademik."}</span></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4" data-testid="dashboard-stat-grid"><StatCard icon={BookOpen} label="Mata kuliah aktif" value={s.active_courses || 0} hint="Siap untuk semester berjalan" testid="stat-active-courses" /><StatCard icon={Users} label="Kelas aktif" value={s.active_classes || 0} hint="Termasuk kode kelas mahasiswa" testid="stat-active-classes" /><StatCard icon={ClipboardList} label="Tugas aktif" value={s.active_assignments || 0} hint={`${s.near_deadline || 0} mendekati deadline`} testid="stat-active-assignments" /><StatCard icon={AlertTriangle} label="Belum submit" value={s.missing_submissions || 0} hint={`${s.ungraded_submissions || 0} submission belum dinilai`} testid="stat-missing-submissions" /></div><div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]"><Card className="rounded-md shadow-none" data-testid="dashboard-progress-card"><CardHeader><CardTitle data-testid="dashboard-progress-title">Ringkasan progres mahasiswa</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Nama</TableHead><TableHead>Submit</TableHead><TableHead>Belum</TableHead><TableHead>Rata-rata</TableHead><TableHead>Risiko</TableHead></TableRow></TableHeader><TableBody>{data.progress?.slice(0, 8).map((student) => <TableRow key={student.id} data-testid={`dashboard-progress-row-${student.id}`}><TableCell data-testid={`dashboard-progress-name-${student.id}`}>{student.name}</TableCell><TableCell data-testid={`dashboard-progress-submitted-${student.id}`}>{student.progress?.submitted}</TableCell><TableCell data-testid={`dashboard-progress-missing-${student.id}`}>{student.progress?.missing}</TableCell><TableCell data-testid={`dashboard-progress-grade-${student.id}`}>{student.progress?.avg_grade}</TableCell><TableCell><Badge className={statusClass(student.progress?.risk_label)} data-testid={`dashboard-progress-risk-${student.id}`}>{student.progress?.risk_label}</Badge></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Card className="rounded-md shadow-none" data-testid="dashboard-reminder-card"><CardHeader><CardTitle data-testid="dashboard-reminder-title">Tugas mendekati deadline</CardTitle></CardHeader><CardContent className="space-y-3">{data.assignments?.slice(0, 5).map((item) => <div key={item.id} className="border border-slate-200 p-3" data-testid={`dashboard-deadline-item-${item.id}`}><p className="font-semibold" data-testid={`dashboard-deadline-title-${item.id}`}>{item.title}</p><p className="text-sm text-slate-500" data-testid={`dashboard-deadline-date-${item.id}`}>{fmtDate(item.deadline)}</p><Button size="sm" variant="outline" className="mt-3" data-testid={`dashboard-send-reminder-${item.id}-button`} onClick={() => sendReminder(item.id)}><Bell /> Simpan reminder</Button></div>)}</CardContent></Card></div></div>;
}

function ClassesPage({ data, forms, setForms, saveProgram, saveCourse, saveClass, deleteCatalog, endClass }) {
  const programOptions = data.programs || [];
  const courseOptions = data.courses || [];
  return <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr]" data-testid="classes-page"><div className="space-y-6"><form className="space-y-4 border bg-white p-5" data-testid="program-create-form" onSubmit={saveProgram}><h2 className="font-display text-2xl font-semibold" data-testid="program-create-title">{forms.program.id ? "Edit program studi" : "Program studi"}</h2><Field id="program-code" label="Kode prodi"><Input id="program-code" data-testid="program-code-input" value={forms.program.code} onChange={(e) => setForms({ ...forms, program: { ...forms.program, code: e.target.value } })} /></Field><Field id="program-name" label="Nama prodi"><Input id="program-name" data-testid="program-name-input" value={forms.program.name} onChange={(e) => setForms({ ...forms, program: { ...forms.program, name: e.target.value } })} /></Field><Field id="program-description" label="Deskripsi"><Textarea id="program-description" data-testid="program-description-input" value={forms.program.description} onChange={(e) => setForms({ ...forms, program: { ...forms.program, description: e.target.value } })} /></Field><div className="flex flex-wrap gap-2"><Button data-testid="program-create-submit-button"><Plus /> {forms.program.id ? "Simpan prodi" : "Tambah prodi"}</Button>{forms.program.id && <Button type="button" variant="outline" data-testid="program-cancel-edit-button" onClick={() => setForms({ ...forms, program: { code: "", name: "", description: "" } })}>Batal</Button>}</div></form><form className="space-y-4 border bg-white p-5" data-testid="course-create-form" onSubmit={saveCourse}><h2 className="font-display text-2xl font-semibold" data-testid="course-create-title">{forms.course.id ? "Edit mata kuliah" : "Mata kuliah"}</h2><Field id="course-program" label="Prodi"><select id="course-program" className="form-select" data-testid="course-program-select" value={forms.course.program_id} onChange={(e) => setForms({ ...forms, course: { ...forms.course, program_id: e.target.value } })}>{programOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></Field><Field id="course-code" label="Kode"><Input id="course-code" data-testid="course-code-input" value={forms.course.code} onChange={(e) => setForms({ ...forms, course: { ...forms.course, code: e.target.value } })} /></Field><Field id="course-name" label="Nama"><Input id="course-name" data-testid="course-name-input" value={forms.course.name} onChange={(e) => setForms({ ...forms, course: { ...forms.course, name: e.target.value } })} /></Field><Field id="course-description" label="Deskripsi"><Textarea id="course-description" data-testid="course-description-input" value={forms.course.description} onChange={(e) => setForms({ ...forms, course: { ...forms.course, description: e.target.value } })} /></Field><div className="flex flex-wrap gap-2"><Button data-testid="course-create-submit-button"><Plus /> {forms.course.id ? "Simpan mata kuliah" : "Tambah mata kuliah"}</Button>{forms.course.id && <Button type="button" variant="outline" data-testid="course-cancel-edit-button" onClick={() => setForms({ ...forms, course: { program_id: forms.course.program_id, code: "", name: "", credits: 3, description: "" } })}>Batal</Button>}</div></form><form className="space-y-4 border bg-white p-5" data-testid="class-create-form" onSubmit={saveClass}><h2 className="font-display text-2xl font-semibold" data-testid="class-create-title">{forms.class.id ? "Edit kelas semester" : "Kelas semester"}</h2><Field id="class-course" label="Mata kuliah"><select id="class-course" className="form-select" data-testid="class-course-select" value={forms.class.course_id} onChange={(e) => setForms({ ...forms, class: { ...forms.class, course_id: e.target.value } })}>{courseOptions.map((c) => <option key={c.id} value={c.id}>{`${c.program_name ? `${c.program_name} - ` : ""}${c.name}`}</option>)}</select></Field><div className="grid gap-4 sm:grid-cols-2"><Field id="class-year" label="Tahun akademik"><Input id="class-year" data-testid="class-year-input" value={forms.class.academic_year} onChange={(e) => setForms({ ...forms, class: { ...forms.class, academic_year: e.target.value } })} /></Field><Field id="class-semester" label="Semester"><Input id="class-semester" data-testid="class-semester-input" value={forms.class.semester} onChange={(e) => setForms({ ...forms, class: { ...forms.class, semester: e.target.value } })} /></Field></div><Field id="class-name" label="Nama kelas"><Input id="class-name" data-testid="class-name-input" value={forms.class.name} onChange={(e) => setForms({ ...forms, class: { ...forms.class, name: e.target.value } })} /></Field><Field id="class-schedule" label="Jadwal"><Input id="class-schedule" data-testid="class-schedule-input" value={forms.class.schedule} onChange={(e) => setForms({ ...forms, class: { ...forms.class, schedule: e.target.value } })} /></Field><div className="flex flex-wrap gap-2"><Button data-testid="class-create-submit-button"><Plus /> {forms.class.id ? "Simpan kelas" : "Generate kelas"}</Button>{forms.class.id && <Button type="button" variant="outline" data-testid="class-cancel-edit-button" onClick={() => setForms({ ...forms, class: { academic_year: forms.class.academic_year, semester: forms.class.semester, course_id: forms.class.course_id, name: "", schedule: "" } })}>Batal</Button>}</div></form></div><div className="space-y-6"><Card className="rounded-md shadow-none" data-testid="program-list-card"><CardHeader><CardTitle data-testid="program-list-title">Daftar prodi</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{programOptions.map((item) => <TableRow key={item.id} data-testid={`program-row-${item.id}`}><TableCell data-testid={`program-code-${item.id}`}>{item.code}</TableCell><TableCell data-testid={`program-name-${item.id}`}>{item.name}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" data-testid={`program-edit-${item.id}-button`} onClick={() => setForms({ ...forms, program: { id: item.id, code: item.code || "", name: item.name || "", description: item.description || "" } })}><Pencil /> Edit</Button><Button size="sm" variant="outline" data-testid={`program-delete-${item.id}-button`} onClick={() => deleteCatalog("programs", item.id, "Prodi")}><Trash2 /> Hapus</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Card className="rounded-md shadow-none" data-testid="course-list-card"><CardHeader><CardTitle data-testid="course-list-title">Daftar mata kuliah</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>Prodi</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{courseOptions.map((item) => <TableRow key={item.id} data-testid={`course-row-${item.id}`}><TableCell data-testid={`course-code-${item.id}`}>{item.code}</TableCell><TableCell data-testid={`course-name-${item.id}`}>{item.name}</TableCell><TableCell data-testid={`course-program-${item.id}`}>{item.program_name || "-"}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" data-testid={`course-edit-${item.id}-button`} onClick={() => setForms({ ...forms, course: { id: item.id, program_id: item.program_id || "", code: item.code || "", name: item.name || "", credits: item.credits || 3, description: item.description || "" } })}><Pencil /> Edit</Button><Button size="sm" variant="outline" data-testid={`course-delete-${item.id}-button`} onClick={() => deleteCatalog("courses", item.id, "Mata kuliah")}><Trash2 /> Hapus</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card><Card className="rounded-md shadow-none" data-testid="class-list-card"><CardHeader><CardTitle data-testid="class-list-title">Daftar kelas & riwayat</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Kelas</TableHead><TableHead>Prodi</TableHead><TableHead>Mata kuliah</TableHead><TableHead>Kode</TableHead><TableHead>Mahasiswa</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{data.classes.map((item) => <TableRow key={item.id} data-testid={`class-row-${item.id}`}><TableCell data-testid={`class-name-${item.id}`}>{item.name}</TableCell><TableCell data-testid={`class-program-${item.id}`}>{item.program_name || "-"}</TableCell><TableCell data-testid={`class-course-${item.id}`}>{item.course_name}</TableCell><TableCell><Badge className="bg-slate-950 text-white" data-testid={`class-code-${item.id}`}>{item.class_code}</Badge></TableCell><TableCell data-testid={`class-student-count-${item.id}`}>{item.student_count}</TableCell><TableCell><Badge className={statusClass(item.status)} data-testid={`class-status-${item.id}`}>{item.status === "ended" ? "Berakhir" : item.status}</Badge></TableCell><TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" data-testid={`class-edit-${item.id}-button`} onClick={() => setForms({ ...forms, class: { id: item.id, academic_year: item.academic_year || "", semester: item.semester || "", course_id: item.course_id || "", name: item.name || "", schedule: item.schedule || "" } })}><Pencil /> Edit</Button>{item.status !== "ended" && <Button size="sm" variant="outline" data-testid={`class-end-${item.id}-button`} onClick={() => endClass(item.id)}>Akhiri</Button>}<Button size="sm" variant="outline" data-testid={`class-delete-${item.id}-button`} onClick={() => deleteCatalog("classes", item.id, "Kelas")}><Trash2 /> Hapus</Button></div></TableCell></TableRow>)}</TableBody></Table></CardContent></Card></div></div>;
}

function StudentsPage({ data, forms, setForms, postJson, importStudents, setImportFile }) {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [progressCourseId, setProgressCourseId] = useState("");
  const pending = data.enrollments?.filter((r) => r.status === "pending") || [];
  const selectedClass = data.classes.find((c) => c.id === forms.student.class_id);
  const classMembers = data.students.filter((s) => s.class_ids?.includes(forms.student.class_id));
  const activeCandidates = data.students.filter((s) => (s.status || "active") === "active" && !s.class_ids?.includes(forms.student.class_id));
  const searchText = studentSearch.trim().toLowerCase();
  const filteredCandidates = activeCandidates.filter((s) => {
    const haystack = `${s.name || ""} ${s.nim || ""} ${s.email || ""} ${s.whatsapp || ""}`.toLowerCase();
    return !searchText || haystack.includes(searchText);
  });
  const activeCandidateIds = new Set(activeCandidates.map((s) => s.id));
  const selectedIds = selectedStudentIds.filter((id) => activeCandidateIds.has(id));
  const filteredCandidateIds = filteredCandidates.map((s) => s.id);
  const allFilteredSelected = filteredCandidateIds.length > 0 && filteredCandidateIds.every((id) => selectedIds.includes(id));
  const progressClassIds = data.classes.filter((c) => !progressCourseId || c.course_id === progressCourseId).map((c) => c.id);
  const progressStudents = data.students.filter((s) => !progressCourseId || s.class_ids?.some((id) => progressClassIds.includes(id)));
  const setManagedClass = (classId) => { setSelectedStudentIds([]); setForms({ ...forms, student: { ...forms.student, class_id: classId, existing_student_id: "" } }); };
  const toggleCandidate = (studentId, checked) => setSelectedStudentIds((prev) => checked ? Array.from(new Set([...prev, studentId])) : prev.filter((id) => id !== studentId));
  const toggleFilteredCandidates = (checked) => setSelectedStudentIds((prev) => checked ? Array.from(new Set([...prev, ...filteredCandidateIds])) : prev.filter((id) => !filteredCandidateIds.includes(id)));
  async function runBulkStudentAction(endpoint, ids, success) {
    const cleanIds = Array.from(new Set(ids.filter(Boolean)));
    if (!cleanIds.length) return toast.error("Pilih minimal satu mahasiswa");
    await postJson(`/classes/${forms.student.class_id}/students/${endpoint}`, { student_ids: cleanIds }, success);
    setSelectedStudentIds((prev) => prev.filter((id) => !cleanIds.includes(id)));
  }
  return <div className="space-y-6" data-testid="students-page">
    <div className="grid gap-6 xl:grid-cols-2">
      <form className="space-y-4 border bg-white p-5" data-testid="student-create-form" onSubmit={(e) => { e.preventDefault(); postJson("/students", forms.student, "Mahasiswa ditambahkan"); }}>
        <h2 className="font-display text-2xl font-semibold" data-testid="student-create-title">Tambah mahasiswa</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="student-nim" label="NIM"><Input id="student-nim" data-testid="student-nim-input" value={forms.student.nim} onChange={(e) => setForms({ ...forms, student: { ...forms.student, nim: e.target.value } })} /></Field>
          <Field id="student-name" label="Nama"><Input id="student-name" data-testid="student-name-input" value={forms.student.name} onChange={(e) => setForms({ ...forms, student: { ...forms.student, name: e.target.value } })} /></Field>
          <Field id="student-email" label="Email"><Input id="student-email" data-testid="student-email-input" value={forms.student.email} onChange={(e) => setForms({ ...forms, student: { ...forms.student, email: e.target.value } })} /></Field>
          <Field id="student-whatsapp" label="WhatsApp"><Input id="student-whatsapp" data-testid="student-whatsapp-input" value={forms.student.whatsapp} onChange={(e) => setForms({ ...forms, student: { ...forms.student, whatsapp: e.target.value } })} /></Field>
        </div>
        <Field id="student-class" label="Kelas"><select id="student-class" className="form-select" data-testid="student-class-select" value={forms.student.class_id} onChange={(e) => setForms({ ...forms, student: { ...forms.student, class_id: e.target.value } })}>{data.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Button data-testid="student-create-submit-button"><Plus /> Tambah mahasiswa</Button>
      </form>
      <form className="space-y-4 border bg-white p-5" data-testid="student-import-form" onSubmit={importStudents}>
        <h2 className="font-display text-2xl font-semibold" data-testid="student-import-title">Import Excel</h2>
        <p className="text-sm text-slate-500" data-testid="student-import-help">Header: nim, nama/name, email, whatsapp/wa, password. Kolom password opsional dan akan mengalahkan password default.</p>
        <Field id="student-import-file" label="File Excel"><Input id="student-import-file" type="file" accept=".xlsx" data-testid="student-import-file-input" onChange={(e) => setImportFile(e.target.files?.[0])} /></Field>
        <Field id="student-import-password" label="Password default import"><Input id="student-import-password" type="password" data-testid="student-import-password-input" value={forms.student.import_password || ""} onChange={(e) => setForms({ ...forms, student: { ...forms.student, import_password: e.target.value } })} placeholder="Kosongkan untuk pakai NIM" /></Field>
        <Field id="student-import-class" label="Kelas tujuan"><select id="student-import-class" className="form-select" data-testid="student-import-class-select" value={forms.student.class_id} onChange={(e) => setForms({ ...forms, student: { ...forms.student, class_id: e.target.value } })}>{data.classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
        <Button data-testid="student-import-submit-button"><Upload /> Import mahasiswa</Button>
      </form>
    </div>
    <Card className="rounded-md shadow-none" data-testid="enrollment-request-card">
      <CardHeader><CardTitle data-testid="enrollment-request-title">Permintaan masuk kelas</CardTitle></CardHeader>
      <CardContent className="space-y-3">{pending.length === 0 ? <p className="text-sm text-slate-500" data-testid="enrollment-request-empty">Tidak ada request pending.</p> : pending.map((r) => <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3" data-testid={`enrollment-request-row-${r.id}`}><div><p className="font-semibold" data-testid={`enrollment-request-student-${r.id}`}>{r.student_name} - {r.student_nim}</p><p className="text-sm text-slate-500" data-testid={`enrollment-request-class-${r.id}`}>{r.class_name} ({r.class_code})</p></div><div className="flex gap-2"><Button size="sm" data-testid={`enrollment-approve-${r.id}-button`} onClick={() => postJson(`/enrollment-requests/${r.id}/approve`, {}, "Mahasiswa disetujui")}>ACC</Button><Button size="sm" variant="outline" data-testid={`enrollment-reject-${r.id}-button`} onClick={() => postJson(`/enrollment-requests/${r.id}/reject`, {}, "Request ditolak")}>Tolak</Button></div></div>)}</CardContent>
    </Card>
    <Card className="rounded-md shadow-none" data-testid="class-user-management-card">
      <CardHeader><CardTitle data-testid="class-user-management-title">Manajemen user per kelas</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <Field id="class-user-management-select" label="Pilih kelas"><select id="class-user-management-select" className="form-select" data-testid="class-user-management-select" value={forms.student.class_id} onChange={(e) => setManagedClass(e.target.value)}>{data.classes.map((c) => <option key={c.id} value={c.id}>{`${c.name} - ${c.status === "ended" ? "Berakhir" : c.status}`}</option>)}</select></Field>
        {selectedClass && <div className="grid gap-2 border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 md:grid-cols-3" data-testid="selected-class-invite-info"><p data-testid="selected-class-code">Kode kelas: <span className="font-semibold">{selectedClass.class_code || "-"}</span></p><p data-testid="active-student-candidate-count">{activeCandidates.length} mahasiswa aktif belum masuk kelas ini</p><p data-testid="active-student-filter-count">{filteredCandidates.length} cocok dengan filter</p></div>}
        <div className="space-y-3 border border-slate-200 bg-slate-50 p-3" data-testid="active-student-enroll-panel">
          <div className="grid gap-3 md:grid-cols-[1fr_auto]">
            <Field id="active-student-search" label="Cari mahasiswa aktif"><Input id="active-student-search" data-testid="active-student-search-input" value={studentSearch} onChange={(e) => setStudentSearch(e.target.value)} placeholder="Cari nama, NIM, email, atau WhatsApp" /></Field>
            <label className="flex items-center gap-2 self-end border border-blue-200 bg-white p-3 text-sm font-semibold text-blue-800" data-testid="active-student-select-all-visible">
              <input type="checkbox" checked={allFilteredSelected} disabled={filteredCandidateIds.length === 0} onChange={(e) => toggleFilteredCandidates(e.target.checked)} />
              Pilih semua hasil
            </label>
          </div>
          <div className="max-h-[300px] overflow-y-auto border border-slate-200 bg-white" data-testid="active-student-option-list">
            {filteredCandidates.length === 0 ? <p className="p-3 text-sm text-slate-500" data-testid="active-student-empty">Tidak ada mahasiswa aktif yang cocok.</p> : filteredCandidates.map((s) => <label key={s.id} className="flex items-start gap-3 border-b border-slate-200 p-3 text-sm last:border-b-0" data-testid={`active-student-option-${s.id}`}>
              <input type="checkbox" className="mt-1" checked={selectedIds.includes(s.id)} onChange={(e) => toggleCandidate(s.id, e.target.checked)} data-testid={`active-student-checkbox-${s.id}`} />
              <span><span className="block font-semibold text-slate-900" data-testid={`active-student-name-${s.id}`}>{s.name} - {s.nim || "-"}</span><span className="block text-slate-500" data-testid={`active-student-meta-${s.id}`}>{s.email || "-"} · {s.whatsapp || "Tanpa WhatsApp"}</span></span>
            </label>)}
          </div>
          <div className="flex flex-wrap items-center gap-2" data-testid="active-student-bulk-actions">
            <Badge className="border-blue-200 bg-blue-50 text-blue-700" data-testid="active-student-selected-count">{selectedIds.length} dipilih</Badge>
            <Button type="button" variant="outline" data-testid="active-student-add-button" disabled={!selectedIds.length || !forms.student.class_id} onClick={() => runBulkStudentAction("bulk-add", selectedIds, `${selectedIds.length} mahasiswa dimasukkan ke kelas`)}><Plus /> Masukkan dipilih</Button>
            <Button type="button" data-testid="active-student-invite-button" disabled={!selectedIds.length || !forms.student.class_id} onClick={() => runBulkStudentAction("bulk-invite", selectedIds, `${selectedIds.length} invite dibuat`)}><Send /> Invite dipilih</Button>
            <Button type="button" variant="outline" data-testid="active-student-add-all-button" disabled={!filteredCandidateIds.length || !forms.student.class_id} onClick={() => runBulkStudentAction("bulk-add", filteredCandidateIds, `${filteredCandidateIds.length} mahasiswa dimasukkan ke kelas`)}><Plus /> Masukkan semua</Button>
            <Button type="button" variant="outline" data-testid="active-student-invite-all-button" disabled={!filteredCandidateIds.length || !forms.student.class_id} onClick={() => runBulkStudentAction("bulk-invite", filteredCandidateIds, `${filteredCandidateIds.length} invite dibuat`)}><Send /> Invite semua</Button>
          </div>
        </div>
        <div className="space-y-3" data-testid="class-member-list">{classMembers.length === 0 ? <p className="text-sm text-slate-500" data-testid="class-member-empty">Belum ada mahasiswa di kelas ini.</p> : classMembers.map((s) => <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3" data-testid={`class-member-row-${s.id}`}><div><p className="font-semibold" data-testid={`class-member-name-${s.id}`}>{s.name} - {s.nim}</p><p className="text-sm text-slate-500" data-testid={`class-member-email-${s.id}`}>{s.email} · {s.status}</p></div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" data-testid={`class-member-toggle-${s.id}-button`} onClick={() => postJson(`/students/${s.id}/status`, { status: s.status === "active" ? "inactive" : "active" }, "Status mahasiswa diubah")}>{s.status === "active" ? "Nonaktifkan" : "Aktifkan"}</Button><Button size="sm" variant="outline" data-testid={`class-member-remove-${s.id}-button`} onClick={() => postJson(`/classes/${forms.student.class_id}/students/${s.id}/remove`, {}, "Mahasiswa dilepas dari kelas")}>Lepas dari kelas</Button><Button size="sm" data-testid={`class-member-reset-${s.id}-button`} onClick={() => { const password = window.prompt("Password baru mahasiswa", s.nim || "Mahasiswa123!"); if (password) postJson(`/students/${s.id}/reset-password`, { password }, `Password ${s.name} direset`); }}>Reset password</Button></div></div>)}</div>
      </CardContent>
    </Card>
    <Card className="rounded-md shadow-none" data-testid="student-list-card">
      <CardHeader><CardTitle data-testid="student-list-title">Monitoring progres</CardTitle></CardHeader>
      <CardContent className="space-y-4"><Field id="student-progress-course" label="Filter mata kuliah"><select id="student-progress-course" className="form-select" data-testid="student-progress-course-select" value={progressCourseId} onChange={(e) => setProgressCourseId(e.target.value)}><option value="">Semua mata kuliah</option>{data.courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field><Table><TableHeader><TableRow><TableHead>NIM</TableHead><TableHead>Nama</TableHead><TableHead>Email</TableHead><TableHead>Submit</TableHead><TableHead>Belum</TableHead><TableHead>Nilai</TableHead><TableHead>Risiko</TableHead></TableRow></TableHeader><TableBody>{progressStudents.map((s) => <TableRow key={s.id} data-testid={`student-row-${s.id}`}><TableCell data-testid={`student-nim-${s.id}`}>{s.nim}</TableCell><TableCell data-testid={`student-name-${s.id}`}>{s.name}</TableCell><TableCell data-testid={`student-email-${s.id}`}>{s.email}</TableCell><TableCell data-testid={`student-submitted-${s.id}`}>{s.progress?.submitted}</TableCell><TableCell data-testid={`student-missing-${s.id}`}>{s.progress?.missing}</TableCell><TableCell data-testid={`student-grade-${s.id}`}>{s.progress?.avg_grade}</TableCell><TableCell><Badge className={statusClass(s.progress?.risk_label)} data-testid={`student-risk-${s.id}`}>{s.progress?.risk_label}</Badge></TableCell></TableRow>)}</TableBody></Table>{progressStudents.length === 0 && <p className="text-sm text-slate-500" data-testid="student-progress-empty">Tidak ada mahasiswa pada mata kuliah ini.</p>}</CardContent>
    </Card>
  </div>;
}

function DiscussionThread({ material, token }) {
  const [comments, setComments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [attachments, setAttachments] = useState({});
  const [replyTo, setReplyTo] = useState("");
  const [uploadVersion, setUploadVersion] = useState(0);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const progress = useActionProgress();

  async function loadComments() {
    try {
      const { data } = await axios.get(`${API}/materials/${material.id}/comments`, auth);
      setComments(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Diskusi gagal dimuat");
    }
  }

  useEffect(() => {
    axios.get(`${API}/materials/${material.id}/comments`, auth)
      .then(({ data }) => setComments(data))
      .catch((error) => toast.error(error.response?.data?.detail || "Diskusi gagal dimuat"));
  }, [material.id, auth]);

  async function submitComment(parentId = "") {
    const key = parentId || "root";
    const content = (drafts[key] || "").trim();
    const attachment = attachments[key];
    if (!content && !attachment) return toast.error("Isi komentar atau lampiran diperlukan");
    const form = new FormData();
    form.append("content", content);
    form.append("parent_id", parentId);
    if (attachment) form.append("attachment", attachment);
    const operation = progress.begin(parentId ? "Mengirim balasan" : "Mengirim komentar", attachment ? `Mengunggah ${attachment.name}...` : "Menyimpan diskusi...");
    try {
      await axios.post(`${API}/materials/${material.id}/comments`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (upload) => progress.update(operation, uploadProgressPercent(upload), "Mengunggah lampiran diskusi"),
      });
      setDrafts((items) => ({ ...items, [key]: "" }));
      setAttachments((items) => ({ ...items, [key]: null }));
      setReplyTo("");
      setUploadVersion((value) => value + 1);
      await loadComments();
      progress.finish(operation, parentId ? "Balasan dikirim" : "Komentar dikirim");
      toast.success(parentId ? "Balasan dikirim" : "Komentar dikirim");
    } catch (error) {
      const detail = formatApiError(error, "Komentar gagal dikirim");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }

  function attachmentView(comment) {
    const file = comment.attachment;
    if (!file) return null;
    const url = `${BACKEND_URL}${file.inline_url}?token=${encodeURIComponent(token)}`;
    const image = (file.mime_type || "").startsWith("image/");
    return <div className="discussion-attachment" data-testid={`discussion-attachment-${comment.id}`}>
      {image && <img src={url} alt={file.file_name || "Lampiran diskusi"} />}
      <a href={url} target="_blank" rel="noreferrer"><Paperclip /> {file.file_name || "Buka lampiran"}</a>
    </div>;
  }

  function composer(key, parentId = "") {
    return <div className={`discussion-composer ${parentId ? "reply" : ""}`} data-testid={`discussion-composer-${material.id}-${key}`}>
      <Textarea value={drafts[key] || ""} onChange={(event) => setDrafts((items) => ({ ...items, [key]: event.target.value }))} placeholder={parentId ? "Tulis balasan..." : "Tulis komentar untuk materi ini..."} data-testid={`discussion-text-${material.id}-${key}`} />
      <div className="discussion-actions">
        <Input key={`${key}-${uploadVersion}`} type="file" accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv" onChange={(event) => setAttachments((items) => ({ ...items, [key]: event.target.files?.[0] || null }))} data-testid={`discussion-file-${material.id}-${key}`} />
        {parentId && <Button type="button" size="sm" variant="ghost" onClick={() => setReplyTo("")}>Batal</Button>}
        <Button type="button" size="sm" onClick={() => submitComment(parentId)} data-testid={`discussion-submit-${material.id}-${key}`}><Send /> Kirim</Button>
      </div>
    </div>;
  }

  function renderComment(comment, depth = 0) {
    const children = comments.filter((item) => item.parent_id === comment.id);
    return <div key={comment.id} className={`discussion-comment ${depth ? "nested" : ""}`} data-testid={`discussion-comment-${comment.id}`}>
      <div className="discussion-comment-header">
        <strong>{comment.author_name}</strong>
        <Badge variant="outline">{comment.author_role === "admin" ? "Dosen" : "Mahasiswa"}</Badge>
        <time>{fmtDate(comment.created_at)}</time>
      </div>
      {comment.content && <p>{comment.content}</p>}
      {attachmentView(comment)}
      <Button type="button" size="sm" variant="ghost" className="discussion-reply-button" onClick={() => setReplyTo(replyTo === comment.id ? "" : comment.id)} data-testid={`discussion-reply-${comment.id}-button`}><Reply /> Balas</Button>
      {replyTo === comment.id && composer(comment.id, comment.id)}
      {children.map((child) => renderComment(child, depth + 1))}
    </div>;
  }

  const rootComments = comments.filter((item) => !item.parent_id);
  return <section className="discussion-thread" data-testid={`discussion-thread-${material.id}`}>
    <h4 className="font-display font-semibold"><MessageSquare /> Diskusi kelas</h4>
    {rootComments.length === 0 ? <p className="discussion-empty">Belum ada komentar. Mulai diskusi materi ini.</p> : rootComments.map((comment) => renderComment(comment))}
    {composer("root")}
  </section>;
}

function materialClassLabel(material) {
  return [material.course_name, material.class_name].filter(Boolean).join(" · ") || "Kelas tidak tersedia";
}

function MaterialsPage({ data, forms, setForms, saveMaterial, deleteMaterial, materialFile, setMaterialFile, materialFileInputKey, setMaterialFileInputKey, token }) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const editingMaterial = data.materials.find((material) => material.id === forms.material.id);
  const classGroups = useMemo(() => data.classes.map((classItem) => {
    const groupMaterials = data.materials
      .filter((material) => material.class_id === classItem.id)
      .sort((left, right) => materialMeetingNumber(left) - materialMeetingNumber(right));
    const materialIds = new Set(groupMaterials.map((material) => material.id));
    const linkedAssignments = data.assignments.filter((assignment) => materialIds.has(assignment.material_id));
    const classAssignments = data.assignments.filter((assignment) => assignment.class_id === classItem.id);
    return {
      id: classItem.id,
      className: classItem.name || "Kelas",
      courseName: classItem.course_name || "Mata kuliah",
      period: [classItem.academic_year, classItem.semester].filter(Boolean).join(" · "),
      classCode: classItem.class_code || "",
      status: classItem.status || "",
      materials: groupMaterials,
      assignments: classAssignments,
      linkedAssignments,
      latestMaterial: groupMaterials[groupMaterials.length - 1],
    };
  }), [data.classes, data.materials, data.assignments]);
  const selectedGroup = classGroups.find((group) => group.id === selectedClassId);
  const totalLinkedAssignments = classGroups.reduce((total, group) => total + group.linkedAssignments.length, 0);

  useEffect(() => {
    if (selectedClassId && !classGroups.some((group) => group.id === selectedClassId)) {
      setSelectedClassId("");
    }
  }, [classGroups, selectedClassId]);

  function openMaterialGroup(classId) {
    setSelectedClassId(classId);
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms((prev) => ({
      ...prev,
      material: { class_id: classId, title: "", description: "", file_url: "", video_url: "", is_active: true, locked_until: "" },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToMaterialGroups() {
    setSelectedClassId("");
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms((prev) => ({
      ...prev,
      material: { class_id: prev.material.class_id, title: "", description: "", file_url: "", video_url: "", is_active: true, locked_until: "" },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const resetMaterial = () => {
    const classId = selectedGroup?.id || forms.material.class_id;
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms({ ...forms, material: { class_id: classId, title: "", description: "", file_url: "", video_url: "", is_active: true, locked_until: "" } });
  };
  const editMaterial = (material) => {
    setSelectedClassId(material.class_id || selectedClassId);
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms({ ...forms, material: { id: material.id, class_id: material.class_id || "", title: material.title || "", description: material.description || "", file_url: material.file_url || "", video_url: material.video_url || "", is_active: material.is_active !== false, locked_until: material.locked_until || "" } });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!selectedGroup) {
    return <div className="space-y-5" data-testid="materials-page">
      <section className="meeting-hero" data-testid="admin-material-hero">
        <div>
          <p className="meeting-overline">Materi admin</p>
          <h2 className="font-display text-2xl font-semibold" data-testid="admin-material-title">Materi per mata kuliah</h2>
          <p className="meeting-description">Pilih mata kuliah untuk mengelola pertemuan, lampiran, tugas terkait, dan diskusi kelas.</p>
        </div>
        <div className="meeting-summary" data-testid="admin-material-summary">
          <div><strong>{classGroups.length}</strong><span>Mata kuliah</span></div>
          <div><strong>{data.materials.length}</strong><span>Pertemuan</span></div>
          <div><strong>{totalLinkedAssignments}</strong><span>Tugas terkait</span></div>
        </div>
      </section>
      {classGroups.length === 0 ? <EmptyState title="Belum ada kelas" description="Buat kelas terlebih dahulu sebelum menambahkan materi." /> : <div className="course-card-grid" data-testid="admin-material-course-grid">
        {classGroups.map((group) => <Card key={group.id} className="course-material-card rounded-md shadow-none" data-testid={`admin-material-course-card-${group.id}`}>
          <CardContent className="course-material-card-content">
            <div className="course-material-card-main">
              <span className="course-material-card-icon"><BookOpen /></span>
              <div className="course-material-card-header">
                <div>
                  <h3 data-testid={`admin-material-course-title-${group.id}`}>{group.courseName}</h3>
                  <p data-testid={`admin-material-course-period-${group.id}`}>{group.className}{group.period ? ` · ${group.period}` : ""}</p>
                  {group.classCode && <p>Kode kelas: {group.classCode}</p>}
                </div>
                {group.status === "ended" && <Badge className="border-slate-200 bg-white text-slate-700">Berakhir</Badge>}
              </div>
            </div>
            <div className="course-material-stats">
              <div><strong>{group.materials.length}</strong><span>Pertemuan</span></div>
              <div><strong>{group.assignments.length}</strong><span>Tugas kelas</span></div>
              <div><strong>{group.linkedAssignments.length}</strong><span>Terkait materi</span></div>
            </div>
            <div className="course-material-footer">
              <p className="course-material-latest">{group.latestMaterial?.title || "Belum ada materi"}</p>
              <Button type="button" onClick={() => openMaterialGroup(group.id)} data-testid={`admin-material-course-open-${group.id}-button`}><Eye /> Buka materi</Button>
            </div>
          </CardContent>
        </Card>)}
      </div>}
    </div>;
  }

  return <div className="space-y-5" data-testid="materials-page">
    <section className="meeting-hero" data-testid="admin-material-detail-hero">
      <div>
        <Button type="button" variant="outline" className="mb-3" onClick={backToMaterialGroups} data-testid="admin-material-back-button"><ArrowLeft /> Kembali</Button>
        <p className="meeting-overline">Detail mata kuliah</p>
        <h2 className="font-display text-2xl font-semibold" data-testid="admin-material-detail-title">{selectedGroup.courseName}</h2>
        <p className="meeting-description">{selectedGroup.className}{selectedGroup.period ? ` · ${selectedGroup.period}` : ""}{selectedGroup.classCode ? ` · Kode ${selectedGroup.classCode}` : ""}</p>
      </div>
      <div className="meeting-summary" data-testid="admin-material-detail-summary">
        <div><strong>{selectedGroup.materials.length}</strong><span>Pertemuan</span></div>
        <div><strong>{selectedGroup.assignments.length}</strong><span>Tugas kelas</span></div>
        <div><strong>{selectedGroup.linkedAssignments.length}</strong><span>Terkait materi</span></div>
      </div>
    </section>
    <div className="admin-material-detail-layout" data-testid="admin-material-detail-page">
      <form className="admin-material-form space-y-4 border bg-white p-5" data-testid="material-create-form" onSubmit={saveMaterial}>
      <h2 className="font-display text-2xl font-semibold" data-testid="material-create-title">{forms.material.id ? "Edit pertemuan" : "Materi pertemuan"}</h2>
      <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800" data-testid="material-selected-class-panel">
        <p className="font-semibold">Kelas: {selectedGroup.courseName} · {selectedGroup.className}</p>
        <p>{selectedGroup.period || "Periode belum diisi"}{selectedGroup.classCode ? ` · Kode ${selectedGroup.classCode}` : ""}</p>
      </div>
      <Field id="material-title" label="Judul"><Input id="material-title" data-testid="material-title-input" value={forms.material.title} onChange={(e) => setForms({ ...forms, material: { ...forms.material, title: e.target.value } })} /></Field>
      <Field id="material-description" label="Deskripsi"><Textarea id="material-description" data-testid="material-description-input" value={forms.material.description} onChange={(e) => setForms({ ...forms, material: { ...forms.material, description: e.target.value } })} /></Field>
      <div className="assignment-file-zone" data-testid="material-upload-panel">
        <Field id="material-attachment-upload" label="Upload file materi">
          <Input key={materialFileInputKey} id="material-attachment-upload" type="file" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.png,.jpg,.jpeg,.webp" data-testid="material-attachment-input" onChange={(e) => setMaterialFile(e.target.files?.[0] || null)} />
        </Field>
        <p className="text-sm text-slate-500">Dokumen, gambar, atau ZIP maksimal 25 MB. File yang dipilih akan menggantikan link materi.</p>
        {materialFile && <div className="assignment-selected-files" data-testid="material-selected-file"><span><Paperclip /> {materialFile.name}</span></div>}
        {!materialFile && editingMaterial?.attachment?.file_name && <a href={authenticatedFileLink(editingMaterial.file_url, token)} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-blue-700 underline" data-testid="material-current-file-link"><Paperclip className="mr-1 inline h-4 w-4" />File saat ini: {editingMaterial.attachment.file_name}</a>}
      </div>
      <Field id="material-file-url" label="Link materi (opsional)"><Input id="material-file-url" data-testid="material-file-url-input" value={forms.material.file_url} onChange={(e) => setForms({ ...forms, material: { ...forms.material, file_url: e.target.value } })} placeholder="https://... atau kosongkan jika mengunggah file" /></Field>
      <div className="flex flex-wrap gap-2">
        <Button data-testid="material-create-submit-button">{forms.material.id ? <Pencil /> : <Plus />} {forms.material.id ? "Simpan perubahan" : "Publikasikan materi"}</Button>
        {forms.material.id && <Button type="button" variant="outline" data-testid="material-cancel-edit-button" onClick={resetMaterial}>Batal</Button>}
      </div>
    </form>
    <div className="space-y-4" data-testid="material-list">
      {selectedGroup.materials.length === 0 ? <EmptyState title="Belum ada materi" description="Tambahkan materi pertama untuk mata kuliah ini." /> : selectedGroup.materials.map((material) => {
        const relatedAssignments = data.assignments.filter((assignment) => assignment.material_id === material.id);
        return <Card key={material.id} className="rounded-md shadow-none" data-testid={`material-card-${material.id}`}><CardContent className="p-5">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-blue-50 text-blue-700" data-testid={`material-meeting-${material.id}`}>{material.meeting}</Badge>
              <Badge variant="outline" data-testid={`material-class-${material.id}`}>Kelas: {materialClassLabel(material)}</Badge>
            </div>
            <div className="flex flex-wrap gap-2" data-testid={`material-actions-${material.id}`}>
              <Button type="button" size="sm" variant="outline" data-testid={`material-edit-${material.id}-button`} onClick={() => editMaterial(material)}><Pencil /> Edit</Button>
              <Button type="button" size="sm" variant="outline" data-testid={`material-delete-${material.id}-button`} onClick={() => deleteMaterial(material)}><Trash2 /> Hapus</Button>
            </div>
          </div>
          <h3 className="font-display text-xl font-semibold" data-testid={`material-title-${material.id}`}>{material.title}</h3>
          <p className="mt-1 text-sm font-medium text-blue-700" data-testid={`material-period-${material.id}`}>{[material.academic_year, material.semester, material.class_code ? `Kode ${material.class_code}` : ""].filter(Boolean).join(" · ")}</p>
          <p className="mt-2 text-sm text-slate-600" data-testid={`material-description-${material.id}`}>{material.description}</p>
          {material.file_url && <a href={authenticatedFileLink(material.file_url, token)} target="_blank" rel="noreferrer" className="mt-3 block text-sm font-semibold text-blue-700 underline" data-testid={`material-file-${material.id}-link`}><Paperclip className="mr-1 inline h-4 w-4" />{material.attachment?.file_name || "Buka lampiran materi"}</a>}
          {relatedAssignments.length > 0 && <div className="mt-4 space-y-2 border border-slate-200 bg-slate-50 p-3" data-testid={`material-linked-assignments-${material.id}`}><p className="text-sm font-semibold" data-testid={`material-linked-title-${material.id}`}>Tugas terkait materi ini</p>{relatedAssignments.map((assignment) => <div key={assignment.id} className="flex flex-wrap items-center justify-between gap-2 text-sm" data-testid={`material-linked-assignment-${assignment.id}`}><span data-testid={`material-linked-assignment-title-${assignment.id}`}>{assignment.title}</span><Badge variant="outline" data-testid={`material-linked-assignment-deadline-${assignment.id}`}>{fmtDate(assignment.deadline)}</Badge></div>)}</div>}
          <DiscussionThread material={material} token={token} />
        </CardContent></Card>;
      })}
    </div>
    </div>
  </div>;
}

function materialMeetingNumber(material) {
  const match = String(material.meeting || "").match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function StudentMaterialsPage({ materials, assignments, token, renderAssignmentCard }) {
  const orderedMaterials = useMemo(() => [...materials].sort((left, right) => {
    const classComparison = materialClassLabel(left).localeCompare(materialClassLabel(right), "id");
    if (classComparison) return classComparison;
    return materialMeetingNumber(left) - materialMeetingNumber(right);
  }), [materials]);
  const meetingMaterialIds = useMemo(() => new Set(materials.map((material) => material.id)), [materials]);
  const meetingAssignments = assignments.filter((assignment) => meetingMaterialIds.has(assignment.material_id));
  const assignmentsNeedingAction = meetingAssignments.filter((assignment) => !assignment.my_submission || assignment.my_submission?.review_status === "revision_requested").length;
  const groups = useMemo(() => {
    const itemsByClass = new Map();
    orderedMaterials.forEach((material) => {
      const key = material.class_id || material.course_id || material.course_name || "tanpa-kelas";
      const existing = itemsByClass.get(key);
      if (existing) {
        existing.materials.push(material);
        return;
      }
      itemsByClass.set(key, {
        id: key,
        className: material.class_name || "Kelas",
        courseName: material.course_name || "Mata kuliah",
        period: [material.academic_year, material.semester].filter(Boolean).join(" · "),
        materials: [material],
      });
    });
    return Array.from(itemsByClass.values()).map((group) => {
      const materialIds = new Set(group.materials.map((material) => material.id));
      const linkedAssignments = assignments.filter((assignment) => materialIds.has(assignment.material_id));
      return {
        ...group,
        assignments: linkedAssignments,
        assignmentsNeedingAction: linkedAssignments.filter((assignment) => !assignment.my_submission || assignment.my_submission?.review_status === "revision_requested").length,
        latestMaterial: group.materials[group.materials.length - 1],
      };
    });
  }, [orderedMaterials, assignments]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedMaterial = selectedGroup?.materials.find((material) => material.id === selectedMaterialId) || selectedGroup?.materials[0];
  const selectedMaterialIdentifier = selectedMaterial?.id || "";
  const relatedAssignments = useMemo(() => selectedMaterialIdentifier
    ? assignments.filter((assignment) => assignment.material_id === selectedMaterialIdentifier)
    : [], [selectedMaterialIdentifier, assignments]);
  const selectedAssignment = relatedAssignments.find((assignment) => assignment.id === selectedAssignmentId);

  useEffect(() => {
    if (selectedGroupId && !groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId("");
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) {
      if (selectedMaterialId) setSelectedMaterialId("");
      return;
    }
    if (!selectedGroup.materials.some((material) => material.id === selectedMaterialId)) {
      setSelectedMaterialId(selectedGroup.materials[0]?.id || "");
    }
  }, [selectedGroup, selectedMaterialId]);

  useEffect(() => {
    const selectedExists = relatedAssignments.some((assignment) => assignment.id === selectedAssignmentId);
    if (selectedExists) return;
    const actionable = relatedAssignments.find((assignment) => !assignment.my_submission || assignment.my_submission?.review_status === "revision_requested");
    setSelectedAssignmentId(actionable?.id || relatedAssignments[0]?.id || "");
  }, [selectedMaterialIdentifier, assignments, selectedAssignmentId, relatedAssignments]);

  function openCourse(groupId) {
    setSelectedGroupId(groupId);
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToCourses() {
    setSelectedGroupId("");
    setSelectedMaterialId("");
    setSelectedAssignmentId("");
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedGroup) {
    return <div className="space-y-5" data-testid="student-material-page">
      <section className="meeting-hero" data-testid="student-meeting-hero">
        <div>
          <p className="meeting-overline">Materi mahasiswa</p>
          <h2 className="font-display text-2xl font-semibold" data-testid="student-material-title">Materi per mata kuliah</h2>
          <p className="meeting-description">Materi aktif dikelompokkan per mata kuliah agar daftar utama tetap ringkas.</p>
        </div>
        <div className="meeting-summary" data-testid="student-meeting-summary">
          <div><strong>{groups.length}</strong><span>Mata kuliah</span></div>
          <div><strong>{materials.length}</strong><span>Pertemuan</span></div>
          <div className={assignmentsNeedingAction ? "attention" : ""}><strong>{assignmentsNeedingAction}</strong><span>Perlu dikerjakan</span></div>
        </div>
      </section>
      {groups.length === 0 ? <EmptyState title="Belum ada materi" description="Materi mata kuliah akan muncul di sini." /> : <div className="course-card-grid" data-testid="student-course-card-grid">
        {groups.map((group) => <Card key={group.id} className="course-material-card rounded-md shadow-none" data-testid={`student-course-card-${group.id}`}>
          <CardContent className="course-material-card-content">
            <div className="course-material-card-main">
              <span className="course-material-card-icon"><BookOpen /></span>
              <div className="course-material-card-header">
                <div>
                  <h3 data-testid={`student-material-class-title-${group.id}`}>{group.courseName}</h3>
                  <p data-testid={`student-material-class-period-${group.id}`}>{group.className}{group.period ? ` · ${group.period}` : ""}</p>
                </div>
                {group.assignmentsNeedingAction > 0 && <Badge className="border-amber-200 bg-amber-50 text-amber-700">{group.assignmentsNeedingAction} perlu dikerjakan</Badge>}
              </div>
            </div>
            <div className="course-material-stats">
              <div><strong>{group.materials.length}</strong><span>Pertemuan</span></div>
              <div><strong>{group.assignments.length}</strong><span>Tugas terkait</span></div>
              <div><strong>{group.latestMaterial && materialMeetingNumber(group.latestMaterial) !== Number.MAX_SAFE_INTEGER ? materialMeetingNumber(group.latestMaterial) : "-"}</strong><span>Terakhir</span></div>
            </div>
            <div className="course-material-footer">
              <p className="course-material-latest">{group.latestMaterial?.title || "Belum ada materi"}</p>
              <Button type="button" onClick={() => openCourse(group.id)} data-testid={`student-course-open-${group.id}-button`}><Eye /> Buka materi</Button>
            </div>
          </CardContent>
        </Card>)}
      </div>}
    </div>;
  }

  return <div className="space-y-5" data-testid="student-material-page">
    <section className="meeting-hero" data-testid="student-meeting-hero">
      <div>
        <Button type="button" variant="outline" className="mb-3" onClick={backToCourses} data-testid="student-course-back-button"><ArrowLeft /> Kembali</Button>
        <p className="meeting-overline">Detail mata kuliah</p>
        <h2 className="font-display text-2xl font-semibold" data-testid="student-material-title">{selectedGroup.courseName}</h2>
        <p className="meeting-description">{selectedGroup.className}{selectedGroup.period ? ` · ${selectedGroup.period}` : ""}</p>
      </div>
      <div className="meeting-summary" data-testid="student-meeting-summary">
        <div><strong>{selectedGroup.materials.length}</strong><span>Pertemuan</span></div>
        <div><strong>{selectedGroup.assignments.length}</strong><span>Tugas terkait</span></div>
        <div className={selectedGroup.assignmentsNeedingAction ? "attention" : ""}><strong>{selectedGroup.assignmentsNeedingAction}</strong><span>Perlu dikerjakan</span></div>
      </div>
    </section>
    <div className="meeting-layout course-detail-layout" data-testid="student-course-detail-page">
      <aside className="meeting-index" data-testid="student-meeting-index">
        <p className="meeting-index-title">Daftar pertemuan</p>
        <section className="meeting-course" data-testid={`student-material-class-${selectedGroup.id}`}>
          <h3 data-testid={`student-material-class-title-${selectedGroup.id}`}>{selectedGroup.courseName}</h3>
          <p data-testid={`student-material-class-period-${selectedGroup.id}`}>{selectedGroup.className}{selectedGroup.period ? ` · ${selectedGroup.period}` : ""}</p>
          {selectedGroup.materials.map((material) => {
            const related = assignments.filter((assignment) => assignment.material_id === material.id);
            const needsAction = related.some((assignment) => !assignment.my_submission || assignment.my_submission?.review_status === "revision_requested");
            return <div key={material.id} className="meeting-index-item">
              <button type="button" className={`meeting-selector ${selectedMaterial?.id === material.id ? "active" : ""}`} onClick={() => setSelectedMaterialId(material.id)} data-testid={`student-meeting-select-${material.id}-button`}>
                <span>{material.meeting}</span>
                <strong>{material.title}</strong>
                <small>{related.length ? `${related.length} tugas terlampir` : "Materi saja"}</small>
                {needsAction && <Badge className="border-amber-200 bg-amber-50 text-amber-700">Perlu dikerjakan</Badge>}
              </button>
            </div>;
          })}
        </section>
      </aside>
      {selectedMaterial && <article className="meeting-detail-panel" data-testid={`student-material-item-${selectedMaterial.id}`}>
        <header className="meeting-detail-header">
          <div>
            <Badge className="mb-3 bg-blue-50 text-blue-700" data-testid={`student-material-meeting-${selectedMaterial.id}`}>{selectedMaterial.meeting}</Badge>
            <h3 className="font-display text-2xl font-semibold" data-testid={`student-material-name-${selectedMaterial.id}`}>{selectedMaterial.title}</h3>
            <p className="mt-1 text-sm font-medium text-blue-700">{materialClassLabel(selectedMaterial)}</p>
          </div>
          <Badge variant="outline">{relatedAssignments.length} tugas</Badge>
        </header>
        <p className="meeting-material-description">{selectedMaterial.description || "Tidak ada deskripsi materi."}</p>
        <div className="meeting-resource-grid">
          <section className="meeting-resource-panel" data-testid={`student-material-resources-${selectedMaterial.id}`}>
            <h4><BookOpen /> Materi dilampirkan</h4>
            {selectedMaterial.file_url && <a className="meeting-resource-link" href={authenticatedFileLink(selectedMaterial.file_url, token)} target="_blank" rel="noreferrer" data-testid={`student-material-file-${selectedMaterial.id}-link`}><FileText /> {selectedMaterial.attachment?.file_name || "Buka materi pembelajaran"}</a>}
            {selectedMaterial.video_url && <a className="meeting-resource-link" href={selectedMaterial.video_url} target="_blank" rel="noreferrer" data-testid={`student-material-video-${selectedMaterial.id}-link`}><Eye /> Tonton video materi</a>}
            {!selectedMaterial.file_url && !selectedMaterial.video_url && <p>Belum ada file atau video materi yang dilampirkan.</p>}
          </section>
          <section className="meeting-resource-panel task" data-testid={`student-material-tasks-${selectedMaterial.id}`}>
            <h4><ClipboardList /> Tugas dilampirkan</h4>
            {relatedAssignments.length === 0 ? <p>Belum ada tugas untuk pertemuan ini.</p> : <p>{relatedAssignments.length} tugas tersedia. Instruksi dan tempat pengumpulan ditampilkan di bawah.</p>}
          </section>
        </div>
        {relatedAssignments.length > 0 && <section className="meeting-assignment-stack" data-testid={`student-material-linked-assignments-${selectedMaterial.id}`}>
          <h4 className="font-display text-xl font-semibold">Pengerjaan tugas pertemuan ini</h4>
          <div className="meeting-assignment-choices" data-testid={`student-material-assignment-list-${selectedMaterial.id}`}>
            {relatedAssignments.map((assignment) => <button type="button" key={assignment.id} className={selectedAssignment?.id === assignment.id ? "active" : ""} onClick={() => setSelectedAssignmentId(assignment.id)} data-testid={`student-material-assignment-${assignment.id}-link`}>
              <strong>{assignment.title}</strong>
              <span className="meeting-assignment-deadline">{fmtDate(assignment.deadline)}</span>
              <Badge className={statusClass(assignment.my_submission?.status || "Belum Submit")}>{submissionStatusLabel(assignment.my_submission?.status)}</Badge>
            </button>)}
          </div>
          {selectedAssignment && renderAssignmentCard(selectedAssignment)}
        </section>}
        <DiscussionThread material={selectedMaterial} token={token} />
      </article>}
    </div>
  </div>;
}

function AssignmentScheduleField({ id, label, value, onChange, description, emptyLabel, required = false, quickActions }) {
  return <section className="assignment-schedule-card" data-testid={`${id}-panel`}>
    <div className="assignment-schedule-heading">
      <CalendarDays />
      <Label htmlFor={id} data-testid={`${id}-label`}>{label}</Label>
    </div>
    <p className={`assignment-schedule-status ${value ? "selected" : ""}`} data-testid={`${id}-summary`}>{value ? fmtDate(value) : emptyLabel}</p>
    <Input id={id} type="datetime-local" required={required} data-testid={`${id}-input`} value={value} onChange={(event) => onChange(event.target.value)} />
    <p className="assignment-schedule-help">{description}</p>
    <div className="assignment-schedule-actions">
      {quickActions.map((action) => <Button key={action.label} size="sm" variant="outline" type="button" onClick={() => onChange(action.value())} data-testid={`${id}-${action.testid}-button`}>{action.label}</Button>)}
    </div>
  </section>;
}

function AssignmentsPage({ data, forms, setForms, createAssignment, sendReminder, assignmentFiles, setAssignmentFiles, assignmentFileInputKey, setAssignmentFileInputKey, token }) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const assignment = forms.assignment;
  const classGroups = useMemo(() => data.classes.map((classItem) => {
    const groupAssignments = data.assignments.filter((item) => item.class_id === classItem.id);
    return {
      id: classItem.id,
      className: classItem.name || "Kelas",
      courseName: classItem.course_name || "Mata kuliah",
      period: [classItem.academic_year, classItem.semester].filter(Boolean).join(" · "),
      classCode: classItem.class_code || "",
      assignments: groupAssignments,
      scheduled: groupAssignments.filter((item) => isFutureDate(item.published_at)).length,
      linkedMaterials: groupAssignments.filter((item) => item.material_id).length,
      latestAssignment: groupAssignments[groupAssignments.length - 1],
    };
  }), [data.classes, data.assignments]);
  const selectedGroup = classGroups.find((group) => group.id === selectedClassId);
  const selectedMaterials = data.materials.filter((material) => material.class_id === selectedGroup?.id);
  const scheduledAssignments = data.assignments.filter((item) => isFutureDate(item.published_at)).length;
  const linkedAssignments = data.assignments.filter((item) => item.material_id).length;
  const updateAssignment = (changes) => setForms({ ...forms, assignment: { ...assignment, ...changes } });
  const editingAssignment = selectedGroup?.assignments.find((item) => item.id === assignment.id);

  useEffect(() => {
    if (selectedClassId && !classGroups.some((group) => group.id === selectedClassId)) {
      setSelectedClassId("");
    }
  }, [classGroups, selectedClassId]);

  function resetAssignmentForm(classId) {
    setAssignmentFiles([]);
    setAssignmentFileInputKey((key) => key + 1);
    setForms((prev) => ({
      ...prev,
      assignment: {
        ...prev.assignment,
        id: "",
        class_id: classId,
        title: "",
        description: "",
        attachment_link: "",
        deadline: "",
        published_at: "",
        tolerance_hours: 6,
        allowed_formats: "pdf,docx,zip,png,jpg",
        max_file_size_mb: DEFAULT_SUBMISSION_MAX_FILE_MB,
        assignment_type: "individu",
        allow_revision: true,
        material_id: "",
        is_practicum: false,
        practicum_goal: "",
        practicum_tools: "",
        practicum_steps: "",
        required_screenshot: false,
        late_penalty_per_day: 5,
        close_after_deadline: false,
        rubric: defaultAssignmentRubric(),
      },
    }));
  }

  function editAssignment(item) {
    setSelectedClassId(item.class_id || selectedClassId);
    setAssignmentFiles([]);
    setAssignmentFileInputKey((key) => key + 1);
    setForms((prev) => ({
      ...prev,
      assignment: {
        ...prev.assignment,
        id: item.id,
        class_id: item.class_id || selectedClassId,
        title: item.title || "",
        description: item.description || "",
        attachment_link: item.attachment_link || "",
        deadline: toDateTimeInputValue(item.deadline),
        published_at: toDateTimeInputValue(item.published_at),
        tolerance_hours: item.tolerance_hours ?? prev.assignment.tolerance_hours ?? 0,
        allowed_formats: assignmentAllowedFormats(item).join(","),
        max_file_size_mb: assignmentMaxSubmissionMb(item),
        rubric: Array.isArray(item.rubric) && item.rubric.length ? item.rubric : defaultAssignmentRubric(),
        assignment_type: item.assignment_type || "individu",
        allow_revision: item.allow_revision !== false,
        is_practicum: Boolean(item.is_practicum),
        practicum_goal: item.practicum_goal || "",
        practicum_tools: item.practicum_tools || "",
        practicum_steps: Array.isArray(item.practicum_steps) ? item.practicum_steps.join("\n") : item.practicum_steps || "",
        required_screenshot: Boolean(item.required_screenshot),
        late_penalty_per_day: item.late_penalty_per_day ?? prev.assignment.late_penalty_per_day ?? 0,
        close_after_deadline: Boolean(item.close_after_deadline),
        material_id: item.material_id || "",
      },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function openAssignmentGroup(classId) {
    setSelectedClassId(classId);
    resetAssignmentForm(classId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToAssignmentGroups() {
    setSelectedClassId("");
    resetAssignmentForm(forms.assignment.class_id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedGroup) {
    return <div className="space-y-5" data-testid="assignments-page">
      <section className="meeting-hero" data-testid="admin-assignment-hero">
        <div>
          <p className="meeting-overline">Tugas admin</p>
          <h2 className="font-display text-2xl font-semibold" data-testid="admin-assignment-title">Tugas per mata kuliah</h2>
          <p className="meeting-description">Pilih mata kuliah untuk membuat tugas dan melihat daftar tugas pada kelas tersebut.</p>
        </div>
        <div className="meeting-summary" data-testid="admin-assignment-summary">
          <div><strong>{classGroups.length}</strong><span>Mata kuliah</span></div>
          <div><strong>{data.assignments.length}</strong><span>Tugas</span></div>
          <div><strong>{scheduledAssignments}</strong><span>Terjadwal</span></div>
        </div>
      </section>
      {classGroups.length === 0 ? <EmptyState title="Belum ada kelas" description="Buat kelas terlebih dahulu sebelum membuat tugas." /> : <div className="course-card-grid" data-testid="admin-assignment-course-grid">
        {classGroups.map((group) => <Card key={group.id} className="course-material-card rounded-md shadow-none" data-testid={`admin-assignment-course-card-${group.id}`}>
          <CardContent className="course-material-card-content">
            <div className="course-material-card-main">
              <span className="course-material-card-icon"><ClipboardList /></span>
              <div className="course-material-card-header">
                <div>
                  <h3 data-testid={`admin-assignment-course-title-${group.id}`}>{group.courseName}</h3>
                  <p data-testid={`admin-assignment-course-period-${group.id}`}>{group.className}{group.period ? ` · ${group.period}` : ""}</p>
                  {group.classCode && <p>Kode kelas: {group.classCode}</p>}
                </div>
                {group.scheduled > 0 && <Badge className="border-amber-200 bg-amber-50 text-amber-700">{group.scheduled} terjadwal</Badge>}
              </div>
            </div>
            <div className="course-material-stats">
              <div><strong>{group.assignments.length}</strong><span>Tugas</span></div>
              <div><strong>{group.linkedMaterials}</strong><span>Terkait materi</span></div>
              <div><strong>{group.scheduled}</strong><span>Terjadwal</span></div>
            </div>
            <div className="course-material-footer">
              <p className="course-material-latest">{group.latestAssignment?.title || "Belum ada tugas"}</p>
              <Button type="button" onClick={() => openAssignmentGroup(group.id)} data-testid={`admin-assignment-course-open-${group.id}-button`}><Eye /> Buka tugas</Button>
            </div>
          </CardContent>
        </Card>)}
      </div>}
    </div>;
  }

  return <div className="space-y-5" data-testid="assignments-page">
    <section className="meeting-hero" data-testid="admin-assignment-detail-hero">
      <div>
        <Button type="button" variant="outline" className="mb-3" onClick={backToAssignmentGroups} data-testid="admin-assignment-back-button"><ArrowLeft /> Kembali</Button>
        <p className="meeting-overline">Detail mata kuliah</p>
        <h2 className="font-display text-2xl font-semibold" data-testid="admin-assignment-detail-title">{selectedGroup.courseName}</h2>
        <p className="meeting-description">{selectedGroup.className}{selectedGroup.period ? ` · ${selectedGroup.period}` : ""}{selectedGroup.classCode ? ` · Kode ${selectedGroup.classCode}` : ""}</p>
      </div>
      <div className="meeting-summary" data-testid="admin-assignment-detail-summary">
        <div><strong>{selectedGroup.assignments.length}</strong><span>Tugas</span></div>
        <div><strong>{selectedGroup.linkedMaterials}</strong><span>Terkait materi</span></div>
        <div><strong>{selectedGroup.scheduled}</strong><span>Terjadwal</span></div>
      </div>
    </section>
    <div className="admin-material-detail-layout" data-testid="admin-assignment-detail-page">
      <form className="admin-material-form space-y-4 border bg-white p-5" data-testid="assignment-create-form" onSubmit={createAssignment}>
        <div>
          <h2 className="font-display text-2xl font-semibold" data-testid="assignment-create-title">{assignment.id ? "Edit tugas" : "Buat tugas"}</h2>
          <p className="mt-1 text-sm text-slate-500">{assignment.id ? "Perubahan hanya memperbarui informasi tugas. Submission mahasiswa yang sudah masuk tetap tersimpan." : "Tugas akan masuk ke kelas yang sedang dibuka."}</p>
        </div>
        <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800" data-testid="assignment-selected-class-panel">
          <p className="font-semibold">Kelas: {selectedGroup.courseName} · {selectedGroup.className}</p>
          <p>{selectedGroup.period || "Periode belum diisi"}{selectedGroup.classCode ? ` · Kode ${selectedGroup.classCode}` : ""}</p>
        </div>
        <Field id="assignment-title" label="Judul"><Input id="assignment-title" required placeholder="Masukkan judul tugas" data-testid="assignment-title-input" value={assignment.title} onChange={(e) => updateAssignment({ title: e.target.value })} /></Field>
        <Field id="assignment-description" label="Instruksi"><Textarea id="assignment-description" required placeholder="Tuliskan instruksi pengerjaan" data-testid="assignment-description-input" value={assignment.description} onChange={(e) => updateAssignment({ description: e.target.value })} /></Field>
        <Field id="assignment-attachment-link" label="Lampiran link"><Input id="assignment-attachment-link" type="url" placeholder="https://drive.google.com/..." data-testid="assignment-attachment-link-input" value={assignment.attachment_link || ""} onChange={(e) => updateAssignment({ attachment_link: e.target.value })} /></Field>
        <div className="grid gap-4 lg:grid-cols-2">
          <AssignmentScheduleField id="assignment-published-at" label="Tanggal tayang" value={assignment.published_at} onChange={(value) => updateAssignment({ published_at: value })} emptyLabel="Langsung tayang setelah disimpan" description="Kosongkan bila tugas dapat langsung dilihat mahasiswa." quickActions={[{ label: "Langsung tayang", testid: "now", value: () => "" }, { label: "1 jam lagi", testid: "hour", value: () => toLocalDateTimeValue(Date.now() + 3600000) }]} />
          <AssignmentScheduleField id="assignment-deadline" label="Deadline pengumpulan" value={assignment.deadline} onChange={(value) => updateAssignment({ deadline: value })} emptyLabel="Pilih batas pengumpulan" description="Deadline wajib ditentukan sebelum tugas dibuat." required quickActions={[{ label: "Besok", testid: "tomorrow", value: () => toLocalDateTimeValue(Date.now() + 86400000) }, { label: "7 hari lagi", testid: "week", value: () => toLocalDateTimeValue(Date.now() + (7 * 86400000)) }]} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Field id="assignment-formats" label="Format jawaban mahasiswa"><Input id="assignment-formats" data-testid="assignment-formats-input" value={assignment.allowed_formats} onChange={(e) => updateAssignment({ allowed_formats: e.target.value })} /></Field>
          <Field id="assignment-max-file-size" label="Maksimal upload per file (MB)"><Input id="assignment-max-file-size" type="number" min="1" step="0.5" data-testid="assignment-max-file-size-input" value={assignment.max_file_size_mb || DEFAULT_SUBMISSION_MAX_FILE_MB} onChange={(e) => updateAssignment({ max_file_size_mb: e.target.value })} /></Field>
        </div>
        <Field id="assignment-material-link" label="Kaitkan dengan materi"><select id="assignment-material-link" className="form-select" data-testid="assignment-material-link-select" value={assignment.material_id} onChange={(e) => updateAssignment({ material_id: e.target.value })}><option value="">Tanpa materi terkait</option>{selectedMaterials.map((m) => <option key={m.id} value={m.id}>{m.meeting} · {m.title}</option>)}</select></Field>
        <label className="flex items-center gap-2 text-sm" data-testid="assignment-close-deadline-label"><input type="checkbox" data-testid="assignment-close-deadline-checkbox" checked={assignment.close_after_deadline} onChange={(e) => updateAssignment({ close_after_deadline: e.target.checked })} /> Tutup pengiriman setelah deadline</label>
        <label className="flex items-center gap-2 text-sm" data-testid="assignment-practicum-toggle-label"><input type="checkbox" data-testid="assignment-practicum-checkbox" checked={assignment.is_practicum} onChange={(e) => updateAssignment({ is_practicum: e.target.checked })} /> Mode praktikum</label>
        {assignment.is_practicum && <div className="space-y-3 border border-slate-200 bg-slate-50 p-4" data-testid="assignment-practicum-fields"><Field id="assignment-practicum-goal" label="Tujuan praktikum"><Input id="assignment-practicum-goal" data-testid="assignment-practicum-goal-input" value={assignment.practicum_goal} onChange={(e) => updateAssignment({ practicum_goal: e.target.value })} /></Field><Field id="assignment-practicum-tools" label="Alat dan bahan"><Input id="assignment-practicum-tools" data-testid="assignment-practicum-tools-input" value={assignment.practicum_tools} onChange={(e) => updateAssignment({ practicum_tools: e.target.value })} /></Field></div>}
        <div className="assignment-file-zone" data-testid="assignment-files-panel">
          <Field id="assignment-attachments" label={assignment.id ? "Tambah lampiran soal" : "Lampiran soal"}><Input key={assignmentFileInputKey} id="assignment-attachments" type="file" multiple accept=".pdf,.doc,.docx" data-testid="assignment-attachments-input" onChange={(e) => setAssignmentFiles(Array.from(e.target.files || []))} /></Field>
          <p className="text-sm text-slate-500">{assignment.id ? "File baru akan ditambahkan ke lampiran tugas. Lampiran lama tetap tersedia." : "Pilih beberapa file PDF atau Word sekaligus. Semua file akan tampil pada tugas mahasiswa."}</p>
          {assignment.id && editingAssignment?.attachments?.length > 0 && <div className="assignment-selected-files" data-testid="assignment-current-attachments"><p className="font-semibold">Lampiran saat ini</p>{editingAssignment.attachments.map((file) => <a key={file.file_id} href={authenticatedFileLink(file.file_url, token)} target="_blank" rel="noreferrer"><Paperclip /> {file.file_name}</a>)}</div>}
          {assignmentFiles.length > 0 && <div className="assignment-selected-files" data-testid="assignment-selected-files"><p className="font-semibold">{assignmentFiles.length} file dipilih</p>{assignmentFiles.map((file) => <span key={`${file.name}-${file.size}`}><Paperclip /> {file.name}</span>)}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="assignment-create-submit-button">{assignment.id ? <Pencil /> : <Plus />} {assignment.id ? "Simpan perubahan" : "Buat tugas"}</Button>
          {assignment.id && <Button type="button" variant="outline" data-testid="assignment-cancel-edit-button" onClick={() => resetAssignmentForm(selectedGroup.id)}>Batal</Button>}
        </div>
      </form>
      <div className="space-y-4" data-testid="assignment-list">
        {selectedGroup.assignments.length === 0 ? <EmptyState title="Belum ada tugas" description="Tambahkan tugas pertama untuk mata kuliah ini." /> : selectedGroup.assignments.map((item) => <Card key={item.id} className="overflow-hidden rounded-md shadow-none" data-testid={`assignment-card-${item.id}`}>
          {item.is_practicum && <img src={practicumCover} alt="Mode praktikum" className="h-36 w-full object-cover" data-testid={`assignment-practicum-image-${item.id}`} />}
          <CardContent className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Badge className="bg-slate-100 text-slate-700" data-testid={`assignment-class-name-${item.id}`}>{item.class_name}</Badge>
                <Badge className={isFutureDate(item.published_at) ? "ml-2 bg-amber-50 text-amber-700 border-amber-200" : "ml-2 bg-emerald-50 text-emerald-700 border-emerald-200"} data-testid={`assignment-publish-status-${item.id}`}>{isFutureDate(item.published_at) ? `Tayang ${fmtDate(item.published_at)}` : "Sudah tayang"}</Badge>
                <h3 className="mt-3 font-display text-xl font-semibold" data-testid={`assignment-title-${item.id}`}>{item.title}</h3>
                <p className="text-sm text-slate-600" data-testid={`assignment-deadline-${item.id}`}>{fmtDate(item.deadline)} · {item.close_after_deadline ? "Tutup setelah deadline" : "Boleh terlambat"}</p>
                {!isFutureDate(item.published_at) && <DeadlineCountdown deadline={item.deadline} testid={`assignment-deadline-countdown-${item.id}`} />}
              </div>
              <div className="flex flex-wrap gap-2" data-testid={`assignment-actions-${item.id}`}>
                <Button type="button" size="sm" variant="outline" data-testid={`assignment-edit-${item.id}-button`} onClick={() => editAssignment(item)}><Pencil /> Edit</Button>
                <Button size="sm" variant="outline" data-testid={`assignment-send-reminder-${item.id}-button`} onClick={() => sendReminder(item.id)}><Bell /> Reminder</Button>
              </div>
            </div>
            <p className="mt-3 text-sm" data-testid={`assignment-description-${item.id}`}>{item.description}</p>
            {item.attachment_link && <a href={normalizedExternalLink(item.attachment_link)} target="_blank" rel="noreferrer" className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-700 underline" data-testid={`assignment-attachment-link-${item.id}`}><Paperclip className="h-4 w-4" />Lampiran link tugas</a>}
            <div className="mt-4 flex flex-wrap gap-2">{item.rubric?.map((rubric) => <Badge key={rubric.criterion} variant="outline" data-testid={`assignment-rubric-${item.id}-${rubric.criterion}`}>{rubric.criterion}: {rubric.weight}%</Badge>)}</div>
            {item.attachments?.length > 0 && <div className="mt-4 space-y-2" data-testid={`assignment-attachments-${item.id}`}><p className="text-sm font-semibold">Lampiran soal ({item.attachments.length})</p>{item.attachments.map((file) => <a key={file.file_id} href={authenticatedFileLink(file.file_url, token)} target="_blank" rel="noreferrer" className="block text-sm font-semibold text-blue-700 underline" data-testid={`assignment-attachment-${file.file_id}-link`}>{file.file_name}</a>)}</div>}
          </CardContent>
        </Card>)}
      </div>
    </div>
  </div>;
}

function FilePreviewPanel({ previewTarget, previewDoc, previewError, previewBusy, token, onClose }) {
  const id = fileId(previewTarget?.file);
  const encodedToken = encodeURIComponent(token);
  const inlineSrc = id ? `${API}/files/${id}/inline?token=${encodeURIComponent(token)}` : "";
  const downloadSrc = id ? `${API}/files/${id}/download?token=${encodedToken}` : "";
  const openInline = () => { if (inlineSrc) window.open(inlineSrc, "_blank", "noopener,noreferrer"); };
  const openDownload = () => { if (downloadSrc) window.open(downloadSrc, "_blank", "noopener,noreferrer"); };
  return <Card className="rounded-md shadow-none" data-testid="submission-preview-card"><CardHeader><div className="flex flex-wrap items-center justify-between gap-3"><div><CardTitle data-testid="submission-preview-title">Preview tugas</CardTitle><p className="mt-1 text-sm text-slate-500" data-testid="submission-preview-file-name">{previewTarget?.file?.file_name || previewDoc?.file_name || "File submission"}</p></div><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" size="sm" data-testid="submission-preview-open-tab-button" disabled={!id} onClick={openInline}><Eye /> Tab baru</Button><Button type="button" variant="outline" size="sm" data-testid="submission-preview-download-button" disabled={!id} onClick={openDownload}><Download /> Download</Button><Button type="button" variant="outline" size="sm" data-testid="submission-preview-close-button" onClick={onClose}>Tutup</Button></div></div></CardHeader><CardContent>{previewBusy && <p className="text-sm text-slate-500" data-testid="submission-preview-loading">Memuat preview...</p>}{previewError && <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700" data-testid="submission-preview-error">{previewError}</p>}{!previewBusy && !previewError && previewDoc?.render === "inline" && previewDoc.kind === "image" && <img src={inlineSrc} alt={previewDoc.file_name} className="max-h-[72vh] w-full object-contain" data-testid="submission-preview-image" />}{!previewBusy && !previewError && previewDoc?.render === "inline" && previewDoc.kind === "pdf" && <iframe title={previewDoc.file_name} src={inlineSrc} className="h-[72vh] w-full border border-slate-200 bg-white" data-testid="submission-preview-frame" />}{!previewBusy && !previewError && previewDoc?.render === "html" && <div className="document-preview max-h-[72vh] overflow-auto border border-slate-200 bg-white p-5 text-slate-900" data-testid="submission-preview-html" dangerouslySetInnerHTML={{ __html: previewDoc.html || "" }} />}{!previewBusy && !previewError && previewDoc?.render === "unsupported" && <div className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800" data-testid="submission-preview-unsupported"><FileText className="mb-2 h-5 w-5" /><p>{previewDoc.message}</p></div>}</CardContent></Card>;
}

function GradingPage({ data, forms, setForms, gradeSubmission, bulkGradeSubmissions, markReviewed, requestRevision, token }) {
  const progress = useActionProgress();
  const [gradeRows, setGradeRows] = useState({});
  const [filter, setFilter] = useState({ class_id: "", assignment_id: "" });
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const classOptions = data.classes || [];
  const visibleAssignments = data.assignments.filter((a) => !filter.class_id || a.class_id === filter.class_id);
  const ready = data.submissions.filter((s) => {
    const assignment = data.assignments.find((a) => a.id === s.assignment_id);
    return ["Sudah Submit", "Terlambat", "Direvisi", "Dinilai"].includes(s.status)
      && (!filter.class_id || s.class_id === filter.class_id)
      && (!filter.assignment_id || s.assignment_id === filter.assignment_id)
      && assignment;
  });
  const grouped = visibleAssignments
    .filter((a) => !filter.assignment_id || a.id === filter.assignment_id)
    .map((a) => ({ assignment: a, rows: ready.filter((s) => s.assignment_id === a.id) }))
    .filter((group) => group.rows.length > 0);
  const updateRow = (id, patch) => setGradeRows({ ...gradeRows, [id]: { score: gradeRows[id]?.score ?? "", feedback: gradeRows[id]?.feedback ?? "", revision_note: gradeRows[id]?.revision_note ?? "", ...patch } });
  const submitRows = () => {
    const grades = ready
      .filter((s) => gradeRows[s.id]?.score !== undefined && gradeRows[s.id]?.score !== "")
      .map((s) => ({ submission_id: s.id, score: Number(clampScoreInput(gradeRows[s.id].score)), feedback: gradeRows[s.id]?.feedback || "", revision_note: gradeRows[s.id]?.revision_note || "" }));
    bulkGradeSubmissions(grades);
  };
  useEffect(() => {
    const id = fileId(previewTarget?.file);
    if (!id) return;
    let cancelled = false;
    const operation = progress.begin("Memuat preview tugas", previewTarget?.file?.file_name || "Mengambil lampiran...");
    setPreviewBusy(true);
    setPreviewError("");
    setPreviewDoc(null);
    axios.get(`${API}/files/${id}/preview`, { headers: { Authorization: `Bearer ${token}` } })
      .then(({ data: preview }) => { if (!cancelled) { setPreviewDoc(preview); progress.finish(operation, "Preview tugas siap"); } })
      .catch((error) => { if (!cancelled) { const detail = error.response?.data?.detail || "Preview file gagal dimuat"; setPreviewError(detail); progress.fail(operation, detail); } })
      .finally(() => { if (!cancelled) setPreviewBusy(false); });
    return () => { cancelled = true; };
    // Preview changes only when the selected file or authenticated user changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewTarget, token]);
  return <div className="space-y-6" data-testid="grading-page">
    <Card className="rounded-md shadow-none" data-testid="grading-filter-card"><CardContent className="grid gap-3 p-4 md:grid-cols-2">
      <Field id="grading-filter-class" label="Filter kelas / mapel"><select id="grading-filter-class" className="form-select" data-testid="grading-filter-class-select" value={filter.class_id} onChange={(e) => setFilter({ class_id: e.target.value, assignment_id: "" })}><option value="">Semua kelas/mapel</option>{classOptions.map((c) => <option key={c.id} value={c.id}>{`${c.course_name || "Mapel"} - ${c.name}`}</option>)}</select></Field>
      <Field id="grading-filter-assignment" label="Filter tugas"><select id="grading-filter-assignment" className="form-select" data-testid="grading-filter-assignment-select" value={filter.assignment_id} onChange={(e) => setFilter({ ...filter, assignment_id: e.target.value })}><option value="">Semua tugas</option>{visibleAssignments.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}</select></Field>
    </CardContent></Card>
    <form className="grid gap-6 xl:grid-cols-[0.7fr_1.3fr]" data-testid="grading-form" onSubmit={gradeSubmission}>
      <div className="space-y-4 border bg-white p-5"><h2 className="font-display text-2xl font-semibold" data-testid="grading-form-title">Nilai satu submission</h2><Field id="grading-submission" label="Submission"><select id="grading-submission" className="form-select" data-testid="grading-submission-select" value={forms.grade.submission_id} onChange={(e) => setForms({ ...forms, grade: { ...forms.grade, submission_id: e.target.value } })}>{ready.map((s) => <option key={s.id} value={s.id}>{`${s.student_name} - ${s.assignment_title}`}</option>)}</select></Field><Field id="grading-score" label="Skor rubric"><Input id="grading-score" type="number" min="0" max="100" step="0.01" data-testid="grading-score-input" value={forms.grade.score} onChange={(e) => setForms({ ...forms, grade: { ...forms.grade, score: clampScoreInput(e.target.value) } })} /></Field><Field id="grading-feedback" label="Feedback"><Textarea id="grading-feedback" data-testid="grading-feedback-input" value={forms.grade.feedback} onChange={(e) => setForms({ ...forms, grade: { ...forms.grade, feedback: e.target.value } })} /></Field><Button data-testid="grading-submit-button"><CheckCircle2 /> Simpan nilai</Button></div>
      <Card className="rounded-md shadow-none" data-testid="bulk-grading-card"><CardHeader><CardTitle data-testid="bulk-grading-title">Isi nilai per tugas dan kelas</CardTitle></CardHeader><CardContent className="space-y-4">{grouped.length === 0 && <p className="text-sm text-slate-500" data-testid="bulk-grading-empty">Belum ada submission pada filter ini.</p>}{grouped.map((group) => <div key={group.assignment.id} className="space-y-3 border border-blue-100 bg-blue-50/40 p-3" data-testid={`bulk-grade-group-${group.assignment.id}`}><div><p className="font-display text-lg font-semibold text-blue-950" data-testid={`bulk-grade-group-title-${group.assignment.id}`}>{group.assignment.title}</p><p className="text-sm text-blue-700" data-testid={`bulk-grade-group-class-${group.assignment.id}`}>{group.assignment.course_name} · {group.assignment.class_name}</p></div>{group.rows.map((s) => <div key={s.id} className="grid gap-2 border border-slate-200 bg-white p-3 md:grid-cols-[1fr_90px_1fr]" data-testid={`bulk-grade-row-${s.id}`}><div><p className="font-semibold" data-testid={`bulk-grade-student-${s.id}`}>{s.student_name}</p><p className="text-sm text-slate-500" data-testid={`bulk-grade-assignment-${s.id}`}>{s.status}</p></div><Input type="number" min="0" max="100" step="0.01" placeholder="Nilai" data-testid={`bulk-grade-score-${s.id}-input`} value={gradeRows[s.id]?.score ?? s.grade ?? ""} onChange={(e) => updateRow(s.id, { score: clampScoreInput(e.target.value) })} /><Input placeholder="Feedback" data-testid={`bulk-grade-feedback-${s.id}-input`} value={gradeRows[s.id]?.feedback ?? s.feedback ?? ""} onChange={(e) => updateRow(s.id, { feedback: e.target.value })} /></div>)}</div>)}<Button type="button" variant="outline" data-testid="bulk-grading-submit-button" onClick={submitRows}><Users /> Simpan nilai yang terisi</Button></CardContent></Card>
    </form>
    {previewTarget && <FilePreviewPanel previewTarget={previewTarget} previewDoc={previewDoc} previewBusy={previewBusy} previewError={previewError} token={token} onClose={() => setPreviewTarget(null)} />}
    <Card className="rounded-md shadow-none" data-testid="submission-list-card"><CardHeader><CardTitle data-testid="submission-list-title">Submission mahasiswa</CardTitle></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Mahasiswa</TableHead><TableHead>Tugas</TableHead><TableHead>Status</TableHead><TableHead>Review</TableHead><TableHead>File</TableHead><TableHead>Nilai</TableHead><TableHead>Predikat</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader><TableBody>{ready.map((s) => { const files = submissionFiles(s); return <TableRow key={s.id} data-testid={`submission-row-${s.id}`}><TableCell data-testid={`submission-student-${s.id}`}>{s.student_name}</TableCell><TableCell data-testid={`submission-assignment-${s.id}`}>{s.assignment_title}</TableCell><TableCell><Badge className={statusClass(s.status)} data-testid={`submission-status-${s.id}`}>{submissionStatusLabel(s.status)}</Badge></TableCell><TableCell data-testid={`submission-review-status-${s.id}`}>{s.review_status || "submitted"}</TableCell><TableCell data-testid={`submission-file-${s.id}`}>{files.length ? <div className="flex flex-wrap gap-2">{files.map((file) => <div key={fileId(file)} className="flex flex-wrap items-center gap-2"><Button type="button" size="sm" variant="outline" data-testid={`submission-file-preview-${fileId(file)}-button`} onClick={() => setPreviewTarget({ submission: s, file })}><Eye /> {file.file_name || "Preview"}</Button><Badge className={statusClass(file.drive_sync_status)}>{driveSyncLabel(file.drive_sync_status)}</Badge></div>)}</div> : fileStatusLabel(s.file?.upload_status)}</TableCell><TableCell data-testid={`submission-grade-${s.id}`}>{s.grade ?? "-"}</TableCell><TableCell data-testid={`submission-predicate-${s.id}`}>{s.grade_predicate || "-"}</TableCell><TableCell><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" data-testid={`submission-review-${s.id}-button`} onClick={() => markReviewed(s.id)}>Dilihat</Button><Button size="sm" variant="outline" data-testid={`submission-revision-${s.id}-button`} onClick={() => requestRevision(s.id)}>Revisi</Button></div></TableCell></TableRow>; })}</TableBody></Table></CardContent></Card>
  </div>;
}

function CalendarPage({ events }) { return <Card className="rounded-md shadow-none" data-testid="calendar-page"><CardHeader><CardTitle data-testid="calendar-title">Kalender akademik & deadline</CardTitle></CardHeader><CardContent className="space-y-3">{events.length === 0 ? <EmptyState title="Kalender kosong" description="Deadline dan jadwal materi akan muncul di sini." /> : events.map((event) => <div key={`${event.type}-${event.id}`} className="grid gap-2 border border-slate-200 p-4 md:grid-cols-[160px_1fr_140px]" data-testid={`calendar-event-${event.id}`}><p className="font-mono text-sm text-slate-600" data-testid={`calendar-event-date-${event.id}`}>{fmtDate(event.date)}</p><p className="font-semibold" data-testid={`calendar-event-title-${event.id}`}>{event.title}</p><Badge className={event.type === "deadline" ? "bg-red-50 text-red-700" : "bg-blue-50 text-blue-700"} data-testid={`calendar-event-type-${event.id}`}>{event.type}</Badge></div>)}</CardContent></Card>; }

function ReportsPage({ data, exportGrades }) { return <div className="space-y-6" data-testid="reports-page"><div className="grid gap-4 md:grid-cols-4"><StatCard icon={Users} label="Mahasiswa" value={data.report?.total_students || 0} hint="Total terdaftar" testid="report-total-students" /><StatCard icon={ClipboardList} label="Tugas" value={data.report?.total_assignments || 0} hint="Aktif dan arsip" testid="report-total-assignments" /><StatCard icon={Upload} label="Submission" value={data.report?.total_submissions || 0} hint="Masuk ke sistem" testid="report-total-submissions" /><StatCard icon={CheckCircle2} label="Dinilai" value={data.report?.graded_submissions || 0} hint="Siap direkap" testid="report-graded-submissions" /></div><Card className="rounded-md shadow-none" data-testid="report-export-card"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-6"><div><h2 className="font-display text-2xl font-semibold" data-testid="report-export-title">Rekap dan laporan</h2><p className="text-sm text-slate-500" data-testid="report-export-description">Unduh rekap nilai Excel untuk dokumentasi semester.</p></div><Button data-testid="report-export-grades-button" onClick={exportGrades}><Download /> Export nilai Excel</Button></CardContent></Card></div>; }

function SettingsPage({ forms, setForms, saveSettings }) { const s = forms.settings; return <form onSubmit={saveSettings} className="space-y-6" data-testid="settings-page"><Card className="rounded-md shadow-none" data-testid="settings-card"><CardHeader><CardTitle data-testid="settings-title">Settings aplikasi</CardTitle></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><Field id="settings-app-name" label="Nama aplikasi"><Input id="settings-app-name" data-testid="settings-app-name-input" value={s.app_name || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, app_name: e.target.value } })} /></Field><Field id="settings-campus-name" label="Nama kampus"><Input id="settings-campus-name" data-testid="settings-campus-name-input" value={s.campus_name || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, campus_name: e.target.value } })} /></Field><Field id="settings-program-name" label="Mapel / Prodi"><Input id="settings-program-name" data-testid="settings-program-name-input" value={s.program_name || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, program_name: e.target.value } })} /></Field><Field id="settings-lecturer-name" label="Nama dosen"><Input id="settings-lecturer-name" data-testid="settings-lecturer-name-input" value={s.lecturer_name || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, lecturer_name: e.target.value } })} /></Field><Field id="settings-lecturer-email" label="Email dosen"><Input id="settings-lecturer-email" data-testid="settings-lecturer-email-input" value={s.lecturer_email || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, lecturer_email: e.target.value } })} /></Field><Field id="settings-logo-url" label="Logo kampus URL"><Input id="settings-logo-url" data-testid="settings-logo-url-input" value={s.campus_logo_url || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, campus_logo_url: e.target.value } })} /></Field><Field id="settings-year" label="Tahun ajaran aktif"><Input id="settings-year" data-testid="settings-year-input" value={s.active_academic_year || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, active_academic_year: e.target.value } })} /></Field><Field id="settings-semester" label="Semester aktif"><Input id="settings-semester" data-testid="settings-semester-input" value={s.active_semester || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, active_semester: e.target.value } })} /></Field><Field id="settings-address" label="Alamat kampus"><Textarea id="settings-address" data-testid="settings-address-input" value={s.campus_address || ""} onChange={(e) => setForms({ ...forms, settings: { ...s, campus_address: e.target.value } })} /></Field></CardContent></Card><Card className="rounded-md shadow-none" data-testid="academic-rollover-card"><CardContent className="p-5"><h3 className="font-display text-xl font-semibold" data-testid="academic-rollover-title">Alur ganti tahun ajaran</h3><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600" data-testid="academic-rollover-list"><li>Export rekap nilai dan arsip kelas semester lama.</li><li>Ubah tahun ajaran dan semester aktif di settings ini.</li><li>Buat/duplikasi kelas baru sehingga kode kelas baru terbentuk.</li><li>Mahasiswa masuk memakai kode kelas baru dan menunggu ACC dosen.</li><li>Materi/tugas lama tetap menjadi arsip; submission baru mengikuti deadline kelas baru.</li></ol></CardContent></Card><Button data-testid="settings-save-button"><Settings /> Simpan settings</Button></form>; }

function buildAssignmentCourseGroups(assignments) {
  const ordered = [...assignments].sort((left, right) => {
    const classComparison = [left.course_name, left.class_name].filter(Boolean).join(" · ").localeCompare([right.course_name, right.class_name].filter(Boolean).join(" · "), "id");
    if (classComparison) return classComparison;
    return new Date(left.deadline || 0).getTime() - new Date(right.deadline || 0).getTime();
  });
  return ordered.reduce((items, assignment) => {
    const key = assignment.class_id || [assignment.course_name, assignment.class_name].filter(Boolean).join("-") || "tanpa-kelas";
    let group = items.find((item) => item.id === key);
    if (!group) {
      group = {
        id: key,
        courseName: assignment.course_name || "Mata kuliah",
        className: assignment.class_name || "Kelas",
        assignments: [],
      };
      items.push(group);
    }
    group.assignments.push(assignment);
    return items;
  }, []).map((group) => ({
    ...group,
    pending: group.assignments.filter((assignment) => !assignment.my_submission).length,
    revision: group.assignments.filter((assignment) => assignment.my_submission?.status === "Direvisi" || assignment.my_submission?.review_status === "revision_requested").length,
    graded: group.assignments.filter((assignment) => assignment.my_submission?.grade !== undefined && assignment.my_submission?.grade !== null).length,
    latestAssignment: group.assignments[group.assignments.length - 1],
  }));
}

function StudentAssignmentsPage({ assignments, renderAssignmentCard }) {
  const groups = useMemo(() => buildAssignmentCourseGroups(assignments), [assignments]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const pendingAssignments = assignments.filter((assignment) => !assignment.my_submission).length;
  const revisionAssignments = assignments.filter((assignment) => assignment.my_submission?.status === "Direvisi" || assignment.my_submission?.review_status === "revision_requested").length;

  useEffect(() => {
    if (selectedGroupId && !groups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId("");
    }
  }, [groups, selectedGroupId]);

  function openGroup(groupId) {
    setSelectedGroupId(groupId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToGroups() {
    setSelectedGroupId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedGroup) {
    return <div className="space-y-5" data-testid="student-assignment-page">
      <section className="meeting-hero" data-testid="student-assignment-hero">
        <div>
          <p className="meeting-overline">Tugas mahasiswa</p>
          <h2 className="font-display text-2xl font-semibold" data-testid="student-assignment-title">Tugas per mata kuliah</h2>
          <p className="meeting-description">Buka mata kuliah untuk melihat instruksi, lampiran, dan tempat pengumpulan tugas.</p>
        </div>
        <div className="meeting-summary" data-testid="student-assignment-summary">
          <div><strong>{groups.length}</strong><span>Mata kuliah</span></div>
          <div><strong>{assignments.length}</strong><span>Tugas</span></div>
          <div className={pendingAssignments + revisionAssignments ? "attention" : ""}><strong>{pendingAssignments + revisionAssignments}</strong><span>Perlu aksi</span></div>
        </div>
      </section>
      {groups.length === 0 ? <EmptyState title="Belum ada tugas" description="Tugas aktif akan muncul di sini." /> : <div className="course-card-grid" data-testid="student-assignment-course-grid">
        {groups.map((group) => <Card key={group.id} className="course-material-card rounded-md shadow-none" data-testid={`student-assignment-course-card-${group.id}`}>
          <CardContent className="course-material-card-content">
            <div className="course-material-card-main">
              <span className="course-material-card-icon"><ClipboardList /></span>
              <div className="course-material-card-header">
                <div>
                  <h3 data-testid={`student-assignment-course-title-${group.id}`}>{group.courseName}</h3>
                  <p data-testid={`student-assignment-course-class-${group.id}`}>{group.className}</p>
                </div>
                {(group.pending + group.revision) > 0 && <Badge className="border-red-200 bg-red-50 text-red-700">{group.pending + group.revision} perlu aksi</Badge>}
              </div>
            </div>
            <div className="course-material-stats">
              <div><strong>{group.assignments.length}</strong><span>Tugas</span></div>
              <div><strong>{group.pending}</strong><span>Belum submit</span></div>
              <div><strong>{group.graded}</strong><span>Dinilai</span></div>
            </div>
            <div className="course-material-footer">
              <p className="course-material-latest">{group.latestAssignment?.title || "Belum ada tugas"}</p>
              <Button type="button" onClick={() => openGroup(group.id)} data-testid={`student-assignment-course-open-${group.id}-button`}><Eye /> Buka tugas</Button>
            </div>
          </CardContent>
        </Card>)}
      </div>}
    </div>;
  }

  return <div className="space-y-5" data-testid="student-assignment-page">
    <section className="meeting-hero" data-testid="student-assignment-detail-hero">
      <div>
        <Button type="button" variant="outline" className="mb-3" onClick={backToGroups} data-testid="student-assignment-back-button"><ArrowLeft /> Kembali</Button>
        <p className="meeting-overline">Detail tugas</p>
        <h2 className="font-display text-2xl font-semibold" data-testid="student-assignment-detail-title">{selectedGroup.courseName}</h2>
        <p className="meeting-description">{selectedGroup.className}</p>
      </div>
      <div className="meeting-summary" data-testid="student-assignment-detail-summary">
        <div><strong>{selectedGroup.assignments.length}</strong><span>Tugas</span></div>
        <div><strong>{selectedGroup.pending}</strong><span>Belum submit</span></div>
        <div><strong>{selectedGroup.graded}</strong><span>Dinilai</span></div>
      </div>
    </section>
    <div className="space-y-4" data-testid="student-assignment-list">
      {selectedGroup.assignments.map((assignment) => renderAssignmentCard(assignment))}
    </div>
  </div>;
}

function StudentGradesPage({ assignments, avgGrade, gradedAssignments }) {
  const groups = useMemo(() => buildAssignmentCourseGroups(assignments).filter((group) => group.graded > 0), [assignments]);
  return <div className="space-y-5" data-testid="student-grade-page">
    <section className="meeting-hero" data-testid="student-grade-hero">
      <div>
        <p className="meeting-overline">Nilai mahasiswa</p>
        <h2 className="font-display text-2xl font-semibold" data-testid="student-grade-title">Nilai per mata kuliah</h2>
        <p className="meeting-description">Setiap mata kuliah menampilkan rata-rata nilai dari tugas yang sudah dinilai.</p>
      </div>
      <div className="meeting-summary" data-testid="student-grade-summary">
        <div><strong>{groups.length}</strong><span>Mata kuliah</span></div>
        <div><strong>{gradedAssignments}</strong><span>Sudah dinilai</span></div>
        <div><strong>{avgGrade || 0}</strong><span>Rata-rata</span></div>
      </div>
    </section>
    {groups.length === 0 ? <EmptyState title="Belum ada nilai" description="Nilai tugas yang telah diperiksa dosen akan muncul di sini." /> : <div className="space-y-4" data-testid="student-grade-course-list">
      {groups.map((group) => {
        const gradedInCourse = group.assignments.filter((assignment) => assignment.my_submission?.grade !== undefined && assignment.my_submission?.grade !== null);
        const scores = gradedInCourse.map((assignment) => Number(assignment.my_submission?.grade)).filter((score) => !Number.isNaN(score));
        const average = scores.length ? Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 10) / 10 : 0;
        const averageLabel = Number.isInteger(average) ? String(average) : average.toFixed(1);
        const ungradedCount = group.assignments.length - gradedInCourse.length;
        return <section key={group.id} className="grade-course-panel" data-testid={`student-grade-course-${group.id}`}>
          <header className="grade-course-header">
            <div>
              <h3>{group.courseName}</h3>
              <p>{group.className}</p>
            </div>
            <div className="grade-course-summary" data-testid={`student-grade-average-${group.id}`}>
              <span>Rata-rata MK</span>
              <strong>{averageLabel}</strong>
            </div>
          </header>
          <div className="grade-course-meta" data-testid={`student-grade-meta-${group.id}`}>
            <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">{gradedInCourse.length} dari {group.assignments.length} tugas dinilai</Badge>
            {ungradedCount > 0 && <Badge className="border-amber-200 bg-amber-50 text-amber-700">{ungradedCount} belum dinilai</Badge>}
          </div>
          <div className="grade-course-list">
            {group.assignments.map((assignment) => {
              const hasGrade = assignment.my_submission?.grade !== undefined && assignment.my_submission?.grade !== null;
              const statusLabel = hasGrade ? (assignment.my_submission?.grade_predicate || "Dinilai") : "Belum dinilai";
              const feedback = hasGrade
                ? (assignment.my_submission?.feedback || "Belum ada feedback.")
                : (assignment.my_submission ? "Menunggu penilaian dosen." : "Belum submit tugas ini.");
              return <div key={assignment.id} className={`grade-course-row ${hasGrade ? "" : "pending"}`} data-testid={`student-grade-card-${assignment.id}`}>
                <div>
                <h4>{assignment.title}</h4>
                  <p className="grade-course-feedback">{feedback}</p>
              </div>
                <div className={`grade-course-score ${hasGrade ? "" : "muted"}`}>
                  <strong>{hasGrade ? assignment.my_submission.grade : "-"}</strong>
                  <Badge className={hasGrade ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"}>{statusLabel}</Badge>
              </div>
              </div>;
            })}
          </div>
        </section>;
      })}
    </div>}
  </div>;
}

function StudentApp({ token, user, onLogout, branding, onUserUpdate }) {
  const [data, setData] = useState({ assignments: [], materials: [], submissions: [], calendar: [], reminders: [], enrollments: [], progress: null });
  const [fileMap, setFileMap] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const [uploadMap, setUploadMap] = useState({});
  const [classCode, setClassCode] = useState("");
  const [studentPage, setStudentPage] = useState("home");
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const progress = useActionProgress();
  async function loadStudent() {
    const [assignments, materials, submissions, calendar, reminders, progress, enrollments] = await Promise.all([axios.get(`${API}/assignments`, auth), axios.get(`${API}/materials`, auth), axios.get(`${API}/submissions`, auth), axios.get(`${API}/calendar`, auth), axios.get(`${API}/reminders`, auth), axios.get(`${API}/progress`, auth), axios.get(`${API}/enrollment-requests`, auth)]);
    setData({ assignments: assignments.data, materials: materials.data, submissions: submissions.data, calendar: calendar.data, reminders: reminders.data, progress: progress.data, enrollments: enrollments.data });
  }
  useEffect(() => {
    loadStudent().catch(() => toast.error("Gagal memuat ruang mahasiswa"));
    // The authenticated student shell owns one initial aggregate fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function requestJoinClass(event) { event.preventDefault(); const operation = progress.begin("Mengirim permintaan kelas"); try { await axios.post(`${API}/classes/join-request`, { class_code: classCode }, auth); await loadStudent(); progress.finish(operation, "Permintaan kelas dikirim"); toast.success("Request kelas dikirim, menunggu ACC dosen"); } catch (error) { const detail = error.response?.data?.detail || "Request kelas gagal"; progress.fail(operation, detail); toast.error(detail); } }
  function fileSizeLabel(bytes) {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  function updateUploadState(assignmentId, patch) {
    setUploadMap((items) => ({ ...items, [assignmentId]: { ...(items[assignmentId] || {}), ...patch } }));
  }
  async function submitAssignment(assignmentId) {
    const assignment = data.assignments.find((item) => item.id === assignmentId);
    if (assignment && !canSubmitAssignment(assignment)) return toast.error("Tugas sudah dikumpulkan. Pengiriman ulang hanya bisa setelah dosen meminta revisi.");
    const selectedFiles = Array.from(fileMap[assignmentId] || []);
    if (!selectedFiles.length) return toast.error("Pilih minimal satu file tugas");
    const totalSize = selectedFiles.reduce((sum, item) => sum + (item.size || 0), 0);
    const maxFileSizeMb = assignmentMaxSubmissionMb(assignment);
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const oversizedFile = selectedFiles.find((file) => (file.size || 0) > maxBytes);
    if (oversizedFile) return toast.error(`Ukuran file ${oversizedFile.name} maksimal ${maxFileSizeMb} MB`);
    const allowedFormats = assignmentAllowedFormats(assignment);
    const invalidFile = selectedFiles.find((file) => {
      const extension = file.name?.includes(".") ? file.name.split(".").pop().toLowerCase() : "";
      return extension && !allowedFormats.includes(extension);
    });
    if (invalidFile) return toast.error(`Format file ${invalidFile.name} tidak sesuai. Gunakan: ${assignmentFormatLabel(assignment)}`);
    const fd = new FormData();
    selectedFiles.forEach((item) => fd.append("files", item));
    fd.append("note", noteMap[assignmentId] || "");
    const operation = progress.begin("Mengunggah tugas", `${selectedFiles.length} file (${fileSizeLabel(totalSize)}) siap dikirim.`);
    if (typeof window !== "undefined") window.__elearn_upload_active = true;
    updateUploadState(assignmentId, {
      busy: true,
      done: false,
      error: false,
      percent: 0,
      message: "Menyiapkan upload tugas...",
      detail: `${selectedFiles.length} file (${fileSizeLabel(totalSize)}) siap dikirim.`,
    });
    try {
      await axios.post(`${API}/assignments/${assignmentId}/submit`, fd, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (event) => {
          const total = event.total || totalSize || 0;
          const rawPercent = total ? Math.round((event.loaded / total) * 100) : 0;
          const percent = rawPercent >= 100 ? 95 : Math.max(1, Math.min(90, rawPercent));
          updateUploadState(assignmentId, {
            busy: true,
            percent,
            message: rawPercent >= 100 ? "File sudah sampai server. Menyimpan submission..." : "Mengunggah file ke server...",
            detail: total ? `${fileSizeLabel(event.loaded)} dari ${fileSizeLabel(total)} terkirim.` : "Mengirim file...",
          });
          progress.update(operation, percent, rawPercent >= 100 ? "Menyimpan submission" : "Mengunggah tugas", total ? `${fileSizeLabel(event.loaded)} dari ${fileSizeLabel(total)} terkirim.` : "Mengirim file...");
        },
      });
      updateUploadState(assignmentId, {
        busy: false,
        done: true,
        error: false,
        percent: 100,
        message: "Upload selesai",
        detail: "Tugas tersimpan. Jika Google Drive aktif, sinkronisasi berjalan di background.",
      });
      setFileMap((items) => ({ ...items, [assignmentId]: [] }));
      progress.finish(operation, "Upload tugas selesai", "File tersimpan di server; sinkron Drive diproses di latar.");
      toast.success("Tugas berhasil dikumpulkan");
      await loadStudent();
      setTimeout(() => {
        setUploadMap((items) => {
          const next = { ...items };
          delete next[assignmentId];
          return next;
        });
      }, 5000);
    } catch (error) {
      const detail = formatApiError(error, "Submit gagal. Periksa ukuran file, koneksi, atau konfigurasi Google Drive.");
      updateUploadState(assignmentId, {
        busy: false,
        done: false,
        error: true,
        percent: 0,
        message: "Upload gagal",
        detail,
      });
      progress.fail(operation, detail);
      toast.error(detail);
    } finally {
      if (typeof window !== "undefined") {
        window.__elearn_upload_active = false;
        window.dispatchEvent(new Event("elearn-upload-idle"));
      }
    }
  }
  const canSubmitAssignment = (assignment) => !assignment.my_submission || assignment.my_submission?.status === "Direvisi" || assignment.my_submission?.review_status === "revision_requested";
  const assignmentMeta = (assignment) => [assignment.course_name || "Mata kuliah", assignment.lecturer_name ? `Dosen: ${assignment.lecturer_name}` : "Dosen"].filter(Boolean).join(" · ");
  const pendingAssignments = (data.assignments || []).filter((item) => !item.my_submission).length;
  const revisionAssignments = (data.assignments || []).filter((item) => item.my_submission?.status === "Direvisi" || item.my_submission?.review_status === "revision_requested").length;
  const gradedAssignments = (data.assignments || []).filter((item) => item.my_submission?.grade !== undefined && item.my_submission?.grade !== null).length;
  const studentActivityCount = pendingAssignments + revisionAssignments + gradedAssignments + (data.reminders || []).length;
  const nav = [["home", LayoutDashboard, "Home"], ["courses", BookOpen, "Materi"], ["grades", CheckCircle2, "Nilai"], ["assignments", ClipboardList, "Tugas"], ["profile", Users, "Profil"]];
  const pageTitle = nav.find(([key]) => key === studentPage)?.[2] || "Home";
  const renderAssignmentCard = (a) => {
    const uploadState = uploadMap[a.id] || {};
    const canSubmit = canSubmitAssignment(a);
    const submittedFiles = submissionFiles(a.my_submission);
    const submitLabel = a.my_submission ? "Kirim revisi" : "Submit";
    const allowedFormats = assignmentAllowedFormats(a);
    const maxSubmissionMb = assignmentMaxSubmissionMb(a);
    return <Card id={`assignment-${a.id}`} key={a.id} className="rounded-md shadow-none scroll-mt-24" data-testid={`student-assignment-card-${a.id}`}>
      <CardContent className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-semibold" data-testid={`student-assignment-title-${a.id}`}>{a.title}</h3>
            <p className="text-sm font-medium text-blue-700" data-testid={`student-assignment-meta-${a.id}`}>{assignmentMeta(a)}</p>
            <p className="text-sm text-slate-500" data-testid={`student-assignment-deadline-${a.id}`}>{fmtDate(a.deadline)} · {a.close_after_deadline ? "Tutup setelah deadline" : "Boleh terlambat"}</p>
            <DeadlineCountdown deadline={a.deadline} testid={`student-assignment-deadline-countdown-${a.id}`} />
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Badge className={statusClass(a.my_submission?.status || "Belum Submit")} data-testid={`student-assignment-status-${a.id}`}>{submissionStatusLabel(a.my_submission?.status)}</Badge>
            {!a.my_submission && <Badge className="border-red-200 bg-red-50 text-red-700">Perlu submit</Badge>}
            {a.my_submission?.review_status === "revision_requested" && <Badge className="border-amber-200 bg-amber-50 text-amber-700">Revisi dibuka</Badge>}
            {a.my_submission?.grade != null && <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Nilai tersedia</Badge>}
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-700">{a.description}</p>
        <section className="assignment-resource-panel" data-testid={`student-assignment-format-${a.id}`}>
          <p className="assignment-resource-heading"><FileText /> Format jawaban mahasiswa</p>
          <p className="assignment-resource-note" data-testid={`student-assignment-format-text-${a.id}`}>Format: {assignmentFormatLabel(a)}. Ukuran maksimal: {maxSubmissionMb} MB per file.</p>
        </section>
        {(a.attachment_link || a.attachments?.length > 0) && <section className="assignment-resource-panel" data-testid={`student-assignment-attachments-${a.id}`}>
          <p className="assignment-resource-heading"><Paperclip /> Lampiran tugas dari dosen</p>
          {a.attachment_link && <a href={normalizedExternalLink(a.attachment_link)} target="_blank" rel="noreferrer" className="assignment-resource-link" data-testid={`student-assignment-attachment-link-${a.id}`}><Paperclip /> Lampiran link tugas</a>}
          {(a.attachments || []).map((file) => <a key={file.file_id} href={authenticatedFileLink(file.file_url, token)} target="_blank" rel="noreferrer" className="assignment-resource-link" data-testid={`student-assignment-attachment-${file.file_id}-link`}><FileText /> {file.file_name}</a>)}
        </section>}
        {submittedFiles.length > 0 && <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3" data-testid={`student-submitted-files-${a.id}`}>
          <p className="text-sm font-semibold text-slate-800">File yang sudah dikumpulkan</p>
          <div className="mt-2 space-y-2">{submittedFiles.map((file) => <div key={fileId(file)} className="flex flex-wrap items-center gap-2 text-sm">
            <a href={authenticatedFileLink(file.file_url, token)} target="_blank" rel="noreferrer" className="font-semibold text-blue-700 underline">{file.file_name || "File tugas"}</a>
            <Badge className={statusClass(file.drive_sync_status)}>{driveSyncLabel(file.drive_sync_status)}</Badge>
            {file.drive_sync_status === "failed" && <span className="text-xs text-red-700">File tetap aman di server lokal, Drive akan dicek dosen.</span>}
          </div>)}</div>
        </div>}
        {a.my_submission?.grade != null && <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3">
          <p className="font-semibold text-emerald-800">Nilai: {a.my_submission.grade} ({a.my_submission.grade_predicate || "-"})</p>
          <p className="text-sm text-emerald-700">{a.my_submission.feedback}</p>
        </div>}
        {canSubmit ? <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <Input type="file" multiple accept={fileAcceptFromFormats(allowedFormats)} disabled={uploadState.busy} data-testid={`student-submit-file-${a.id}-input`} onChange={(e) => setFileMap({ ...fileMap, [a.id]: e.target.files })} />
          <Input placeholder="Catatan singkat" value={noteMap[a.id] || ""} disabled={uploadState.busy} onChange={(e) => setNoteMap({ ...noteMap, [a.id]: e.target.value })} />
          <Button onClick={() => submitAssignment(a.id)} disabled={uploadState.busy}><Send /> {uploadState.busy ? "Mengupload..." : submitLabel}</Button>
        </div> : <div className="mt-4 rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800" data-testid={`student-submit-locked-${a.id}`}>Tugas sudah berstatus submit. Pengiriman ulang akan dibuka jika dosen mengembalikan tugas sebagai revisi.</div>}
        {(uploadState.busy || uploadState.done || uploadState.error) && <div className={`student-upload-status ${uploadState.done ? "done" : ""} ${uploadState.error ? "error" : ""}`} data-testid={`student-upload-status-${a.id}`}>
          <div className="student-upload-topline"><strong>{uploadState.message}</strong><span>{uploadState.percent || 0}%</span></div>
          <div className="student-upload-bar" aria-hidden="true"><span style={{ width: `${uploadState.percent || 0}%` }} /></div>
          <p>{uploadState.detail}</p>
          {uploadState.busy && <small>Jangan tutup halaman sampai proses selesai. Jika Google Drive aktif, tahap akhir bisa sedikit lebih lama.</small>}
        </div>}
      </CardContent>
    </Card>;
  };
  return <div className="min-h-screen bg-slate-50 text-slate-900" data-testid="student-app-shell">
    <aside className="student-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 bg-slate-950 p-5 text-white lg:block" data-testid="student-sidebar">
      <div className="mb-8 flex items-center gap-3"><img src={brandingLogo(branding)} alt="Logo" className="h-10 w-10" /><div><p className="font-display text-lg font-bold" data-testid="student-sidebar-title">{brandingName(branding)}</p><p className="text-xs text-slate-400">Ruang Mahasiswa</p></div></div>
      <nav className="space-y-1" data-testid="student-desktop-navigation">{nav.map(([key, Icon, label]) => <Button key={key} variant={studentPage === key ? "secondary" : "ghost"} className="w-full justify-start text-white hover:bg-white/10 hover:text-white data-[active=true]:text-slate-950" data-active={studentPage === key} data-testid={`student-nav-${key}-button`} onClick={() => setStudentPage(key)}><Icon /><span>{label}</span></Button>)}</nav>
    </aside>
    <main className="student-main-content lg:pl-72">
      <header className="sticky top-0 z-20 border-b bg-white/95 px-5 py-4 backdrop-blur md:px-8" data-testid="student-topbar"><div className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500" data-testid="student-role-label">Mahasiswa</p><h1 className="font-display text-3xl font-bold" data-testid="student-page-title">{pageTitle}</h1></div><div className="flex flex-wrap items-center gap-2">{studentActivityCount > 0 && <Badge className="border-red-200 bg-red-50 text-red-700" data-testid="student-topbar-activity-badge">{studentActivityCount} aktivitas</Badge>}<Badge className="border-slate-200 bg-white text-slate-700" data-testid="student-name-title">{user.name}</Badge><Button variant="outline" data-testid="student-profile-button" onClick={() => setStudentPage("profile")}>Profil</Button><Button variant="outline" data-testid="student-logout-button" onClick={onLogout}><LogOut /> Keluar</Button></div></div></header>
      <section className="student-page-content space-y-6 p-5 md:p-8" data-testid="student-dashboard-section">
        {studentPage === "home" && <>
          <Card className="rounded-md shadow-none" data-testid="student-join-class-card"><CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_auto]"><form onSubmit={requestJoinClass} className="flex flex-wrap gap-3" data-testid="student-request-class-form"><Input className="max-w-xs" data-testid="student-request-class-code-input" value={classCode} onChange={(e) => setClassCode(e.target.value)} placeholder="Kode kelas" /><Button data-testid="student-request-class-submit-button"><Send /> Minta masuk kelas</Button></form><div className="flex flex-wrap gap-2" data-testid="student-enrollment-status-list">{data.enrollments.map((r) => <Badge key={r.id} className={statusClass(r.status === "approved" ? "Aman" : "Risiko Rendah")} data-testid={`student-enrollment-status-${r.id}`}>{r.class_name}: {r.status}</Badge>)}</div></CardContent></Card>
          {studentActivityCount > 0 && <Card className="rounded-md border-red-200 bg-red-50 shadow-none" data-testid="student-activity-card"><CardContent className="flex flex-wrap items-center justify-between gap-4 p-5"><div><p className="font-display text-xl font-semibold text-red-800" data-testid="student-activity-title">Aktivitas tugas</p><p className="text-sm text-red-700" data-testid="student-activity-summary">Ada tugas atau notifikasi yang perlu diperiksa.</p></div><div className="flex flex-wrap gap-2"><Badge className="border-red-200 bg-white text-red-700" data-testid="student-activity-pending">{pendingAssignments} belum submit</Badge><Badge className="border-amber-200 bg-white text-amber-700" data-testid="student-activity-revision">{revisionAssignments} revisi</Badge><Badge className="border-emerald-200 bg-white text-emerald-700" data-testid="student-activity-graded">{gradedAssignments} nilai</Badge><Badge className="border-blue-200 bg-white text-blue-700" data-testid="student-activity-reminders">{data.reminders.length} reminder</Badge></div></CardContent></Card>}
          <div className="grid gap-4 md:grid-cols-4"><StatCard icon={ClipboardList} label="Sudah submit" value={data.progress?.progress?.submitted || 0} hint="Submission terkirim" testid="student-stat-submitted" /><StatCard icon={AlertTriangle} label="Belum submit" value={data.progress?.progress?.missing || 0} hint="Segera kerjakan" testid="student-stat-missing" /><StatCard icon={CheckCircle2} label="Rata-rata" value={data.progress?.progress?.avg_grade || 0} hint="Nilai terkini" testid="student-stat-grade" /><StatCard icon={Bell} label="Reminder" value={data.reminders.length} hint="Notifikasi aplikasi" testid="student-stat-reminders" /></div>
          <Card className="rounded-md shadow-none" data-testid="student-calendar-card"><CardHeader><CardTitle>Deadline terdekat</CardTitle></CardHeader><CardContent className="space-y-3">{data.calendar.length === 0 ? <p className="text-sm text-slate-500">Belum ada deadline.</p> : data.calendar.slice(0, 5).map((e) => <div className="text-sm" key={e.id}><p className="font-semibold">{e.title}</p><p className="text-slate-500">{fmtDate(e.date)}</p></div>)}</CardContent></Card>
        </>}
        {studentPage === "courses" && <StudentMaterialsPage materials={data.materials} assignments={data.assignments} token={token} renderAssignmentCard={renderAssignmentCard} />}
        {studentPage === "grades" && <StudentGradesPage assignments={data.assignments} avgGrade={data.progress?.progress?.avg_grade || 0} gradedAssignments={gradedAssignments} />}
        {studentPage === "assignments" && <StudentAssignmentsPage assignments={data.assignments} renderAssignmentCard={renderAssignmentCard} />}
        {studentPage === "profile" && <ProfilePage token={token} user={user} onUserUpdate={onUserUpdate} enrollments={data.enrollments} />}
      </section>
    </main>
    <nav className="student-mobile-navigation lg:hidden" data-testid="student-mobile-navigation">{nav.map(([key, Icon, label]) => <button key={key} type="button" className={studentPage === key ? "active" : ""} data-testid={`student-mobile-nav-${key}-button`} onClick={() => setStudentPage(key)}><Icon /><span>{label}</span></button>)}</nav>
  </div>;
}

function ChatWidget({ token, user }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [contacts, setContacts] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [photo, setPhoto] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [onlineIds, setOnlineIds] = useState([]);
  const [viewingIds, setViewingIds] = useState([]);
  const [unread, setUnread] = useState(0);
  const socketRef = useRef(null);
  const selectedRef = useRef(null);
  const openRef = useRef(false);
  const queryRef = useRef("");
  const photoRef = useRef(null);
  const endRef = useRef(null);
  const auth = useMemo(() => ({ headers: { Authorization: `Bearer ${token}` } }), [token]);
  const progress = useActionProgress();
  const emoji = ["😀", "😂", "😊", "👍", "🙏", "🎉", "❤️", "📚"];

  useEffect(() => { selectedRef.current = selected; }, [selected]);
  useEffect(() => { openRef.current = open; }, [open]);
  useEffect(() => { queryRef.current = query; }, [query]);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadContacts(search = "") {
    try {
      const { data } = await axios.get(`${API}/chat/contacts`, { ...auth, params: { q: search } });
      setContacts(data);
    } catch {
      toast.error("Daftar chat gagal dimuat");
    }
  }

  async function loadLecturers() {
    if (user.role !== "student") return;
    try {
      const { data } = await axios.get(`${API}/chat/lecturers`, auth);
      setLecturers(data);
    } catch {
      toast.error("Kontak dosen gagal dimuat");
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => loadContacts(query), 250);
    return () => clearTimeout(timer);
    // Token changes recreate the whole authenticated app shell.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    loadLecturers();
    // This list is scoped to the authenticated session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.id]);

  useEffect(() => {
    const socketUrl = `${BACKEND_URL.replace(/^http/, "ws")}/api/chat/ws?token=${encodeURIComponent(token)}`;
    let disposed = false;
    let retryTimer;
    function connect() {
      const socket = new WebSocket(socketUrl);
      socketRef.current = socket;
      socket.onopen = () => {
        const active = selectedRef.current;
        socket.send(JSON.stringify({ type: "viewing", user_id: openRef.current && active ? active.id : "" }));
      };
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "presence_snapshot") {
          setOnlineIds(payload.online_user_ids || []);
        } else if (payload.type === "presence") {
          setOnlineIds((items) => payload.online ? [...new Set([...items, payload.user_id])] : items.filter((id) => id !== payload.user_id));
        } else if (payload.type === "chat_focus") {
          setViewingIds((items) => payload.viewing ? [...new Set([...items, payload.user_id])] : items.filter((id) => id !== payload.user_id));
        } else if (payload.type === "message") {
          const message = payload.message;
          const active = selectedRef.current;
          if (active && message.participant_ids.includes(active.id)) {
            setMessages((items) => items.some((item) => item.id === message.id) ? items : [...items, message]);
          }
          if (message.sender_id !== user.id && (!openRef.current || !active || active.id !== message.sender_id)) {
            setUnread((count) => count + 1);
          }
          loadContacts(queryRef.current);
          loadLecturers();
        }
      };
      socket.onerror = () => {};
      socket.onclose = () => {
        if (!disposed) retryTimer = window.setTimeout(connect, 1500);
      };
    }
    connect();
    return () => {
      disposed = true;
      window.clearTimeout(retryTimer);
      socketRef.current?.close();
    };
    // WebSocket is scoped to this authenticated user session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, user.id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN) return;
    socket.send(JSON.stringify({ type: "viewing", user_id: open && selected ? selected.id : "" }));
  }, [open, selected]);

  async function chooseContact(contact) {
    const operation = progress.begin("Memuat percakapan", contact.name);
    setSelected(contact);
    setOpen(true);
    setUnread(0);
    try {
      const { data } = await axios.get(`${API}/chat/users/${contact.id}/messages`, auth);
      setSelected(data.contact);
      setMessages(data.messages || []);
      setViewingIds((items) => data.contact.viewing_chat ? [...new Set([...items, data.contact.id])] : items.filter((id) => id !== data.contact.id));
      progress.finish(operation, "Percakapan dimuat");
    } catch {
      progress.fail(operation, "Pesan gagal dimuat");
      toast.error("Pesan gagal dimuat");
    }
  }

  async function submitMessage(event) {
    event.preventDefault();
    if (!selected || (!content.trim() && !photo)) return;
    const form = new FormData();
    form.append("recipient_id", selected.id);
    form.append("content", content);
    if (photo) form.append("attachment", photo);
    const operation = progress.begin("Mengirim pesan", photo ? `Mengunggah ${photo.name}...` : "Menyimpan pesan...");
    try {
      const { data } = await axios.post(`${API}/chat/messages`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (upload) => progress.update(operation, uploadProgressPercent(upload), "Mengirim pesan"),
      });
      setMessages((items) => items.some((item) => item.id === data.id) ? items : [...items, data]);
      setContent("");
      setPhoto(null);
      setShowEmoji(false);
      if (photoRef.current) photoRef.current.value = "";
      await loadContacts(query);
      progress.finish(operation, "Pesan terkirim");
    } catch (error) {
      const detail = formatApiError(error, "Pesan gagal dikirim");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }

  function statusLabel() {
    if (!selected) return "";
    if (viewingIds.includes(selected.id)) return "Sedang membuka chat ini";
    if (onlineIds.includes(selected.id)) return "Sedang membuka aplikasi";
    return "Offline";
  }

  if (!open) {
    return <button type="button" className="chat-launcher" data-testid="chat-launcher-button" onClick={() => setOpen(true)} aria-label="Buka chat"><MessageSquare />{unread > 0 && <span data-testid="chat-unread-badge">{unread > 99 ? "99+" : unread}</span>}</button>;
  }

  return <section className="chat-widget" data-testid="chat-widget">
    <header className="chat-widget-header">
      <div><p className="font-display font-semibold">Chat</p><p className="text-xs">{selected ? `${selected.name} · ${statusLabel()}` : "Cari username atau email lengkap"}</p></div>
      <button type="button" data-testid="chat-minimize-button" onClick={() => setOpen(false)} aria-label="Sembunyikan chat"><Minus /></button>
    </header>
    {!selected && <div className="chat-contacts">
      {user.role === "student" && lecturers.length > 0 && <div className="chat-quick-lecturer" data-testid="chat-quick-lecturer-list">
        <p className="chat-hint">Pesan cepat ke dosen</p>
        {lecturers.map((lecturer) => <button type="button" className="chat-lecturer-button" key={lecturer.id} onClick={() => chooseContact(lecturer)} data-testid={`chat-quick-lecturer-${lecturer.id}-button`}>
          <span className={`chat-dot ${onlineIds.includes(lecturer.id) ? "online" : ""}`} />
          <span><strong>{lecturer.name}</strong><small>{onlineIds.includes(lecturer.id) ? "Sedang membuka aplikasi" : "Offline"}</small></span>
          <Send />
        </button>)}
      </div>}
      <label className="chat-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Username atau email lengkap" data-testid="chat-search-input" /></label>
      <p className="chat-hint">{query ? "Hasil pencarian" : "Percakapan terbaru"}</p>
      {contacts.length === 0 && <p className="chat-empty">Belum ada pengguna ditemukan.</p>}
      {contacts.map((contact) => <button type="button" className="chat-contact" key={contact.id} onClick={() => chooseContact(contact)} data-testid={`chat-contact-${contact.id}`}>
        <span className={`chat-dot ${onlineIds.includes(contact.id) ? "online" : ""}`} />
        <span><strong>{contact.name}</strong><small>@{contact.username || contact.email} · {contact.role === "admin" ? "Dosen" : "Mahasiswa"}</small></span>
      </button>)}
    </div>}
    {selected && <div className="chat-conversation">
      <button type="button" className="chat-back" data-testid="chat-back-button" onClick={() => { setSelected(null); setMessages([]); loadContacts(query); }}><X /> Kembali dan cari pengguna</button>
      <div className="chat-messages" data-testid="chat-message-list">
        {messages.length === 0 && <p className="chat-empty">Mulai percakapan dengan {selected.name}.</p>}
        {messages.map((message) => <article key={message.id} className={`chat-bubble ${message.sender_id === user.id ? "mine" : ""}`} data-testid={`chat-message-${message.id}`}>
          {message.attachment && <img src={`${BACKEND_URL}${message.attachment.inline_url}?token=${encodeURIComponent(token)}`} alt="Lampiran chat" />}
          {message.content && <p>{message.content}</p>}
          <time>{fmtDate(message.created_at)}</time>
        </article>)}
        <div ref={endRef} />
      </div>
      <form className="chat-compose" onSubmit={submitMessage}>
        {photo && <div className="chat-photo-selected"><ImagePlus /> {photo.name}<button type="button" onClick={() => { setPhoto(null); if (photoRef.current) photoRef.current.value = ""; }}><X /></button></div>}
        {showEmoji && <div className="chat-emoji-picker">{emoji.map((item) => <button type="button" key={item} onClick={() => setContent((value) => `${value}${item}`)}>{item}</button>)}</div>}
        <div className="chat-compose-row">
          <button type="button" onClick={() => setShowEmoji((value) => !value)} aria-label="Pilih emoticon" data-testid="chat-emoji-button"><Smile /></button>
          <label className="chat-file" aria-label="Lampirkan foto"><ImagePlus /><input ref={photoRef} type="file" accept="image/*" data-testid="chat-photo-input" onChange={(event) => setPhoto(event.target.files?.[0] || null)} /></label>
          <input value={content} onChange={(event) => setContent(event.target.value)} placeholder="Tulis pesan..." data-testid="chat-message-input" />
          <button className="chat-send" data-testid="chat-send-button" aria-label="Kirim pesan"><Send /></button>
        </div>
      </form>
    </div>}
  </section>;
}

function App() {
  const resetQuery = useMemo(() => getResetPasswordQuery(), []);
  const [token, setToken] = useState(localStorage.getItem("elearn_token") || "");
  const [user, setUser] = useState(JSON.parse(localStorage.getItem("elearn_user") || "null"));
  const [branding, setBranding] = useState(defaultBranding);
  useEffect(() => {
    axios.get(`${API}/settings/public`)
      .then(({ data }) => setBranding({ ...defaultBranding, ...data }))
      .catch(() => setBranding(defaultBranding));
  }, []);
  useEffect(() => {
    document.title = brandingName(branding);
  }, [branding]);
  useEffect(() => { if (resetQuery.active) { localStorage.removeItem("elearn_token"); localStorage.removeItem("elearn_user"); setToken(""); setUser(null); } }, [resetQuery.active]);
  function handleAuth(payload) { localStorage.setItem("elearn_token", payload.token); localStorage.setItem("elearn_user", JSON.stringify(payload.user)); setToken(payload.token); setUser(payload.user); }
  function handleUserUpdate(updated) { localStorage.setItem("elearn_user", JSON.stringify(updated)); setUser(updated); }
  function handleBrandingUpdate(updated) { setBranding((current) => ({ ...current, ...updated })); }
  function logout() { localStorage.removeItem("elearn_token"); localStorage.removeItem("elearn_user"); setToken(""); setUser(null); }
  return (
    <ActionProgressProvider><Toaster richColors position="bottom-center" />{!token || !user ? <LoginScreen onAuth={handleAuth} branding={branding} /> : <>{user.role === "admin" ? <AdminApp token={token} user={user} onLogout={logout} branding={branding} onBrandingUpdate={handleBrandingUpdate} onUserUpdate={handleUserUpdate} /> : <StudentApp token={token} user={user} onLogout={logout} branding={branding} onUserUpdate={handleUserUpdate} />}<ChatWidget token={token} user={user} /></>}</ActionProgressProvider>
  );
}

export default App;
