import {
  createContext,
  memo,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import axios from "axios";
import "@/App.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Toaster, toast } from "@/components/ui/sonner";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Eye,
  FileText,
  FileSpreadsheet,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  Send,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  Settings,
  Database,
  Cloud,
  Clock,
  ImagePlus,
  Minus,
  Paperclip,
  Printer,
  Reply,
  RotateCcw,
  Search,
  Smile,
  Video,
  X,
} from "lucide-react";

import {
  Area,
  AreaChart,
  BarChart,
  Bar,
  Pie,
  PieChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from "recharts";

function resolveBackendUrl() {
  const configuredUrl = String(
    process.env.REACT_APP_BACKEND_URL || ""
  ).trim().replace(/\/+$/, "");
  if (configuredUrl) return configuredUrl;
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return "";
}

const BACKEND_URL = resolveBackendUrl();
const API = `${BACKEND_URL}/api`;
const DEFAULT_SUBMISSION_MAX_FILE_MB = 5;
const DEFAULT_SUBMISSION_FORMATS = [
  "pdf",
  "doc",
  "docx",
  "xls",
  "xlsx",
  "zip",
  "png",
  "jpg",
  "jpeg",
  "webp",
];
const DEFAULT_GRADE_WEIGHTS = { tugas: 25, uts: 35, uas: 40 };
const GRADE_WEIGHT_COMPONENTS = [
  { key: "tugas", label: "Tugas", description: "Rata-rata seluruh tugas" },
  { key: "uts", label: "UTS", description: "Nilai ujian tengah semester" },
  { key: "uas", label: "UAS", description: "Nilai ujian akhir semester" },
];

const logoUrl = "/app-icon.svg";
const authBg =
  "https://images.unsplash.com/photo-1523580846011-d3a5bc25702b?crop=entropy&cs=srgb&fm=jpg&ixlib=rb-4.1.0&q=85";
const practicumCover =
  "https://images.unsplash.com/photo-1619410283995-43d9134e7656?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1MDZ8MHwxfHNlYXJjaHwxfHxjb21wdXRlciUyMHNjaWVuY2UlMjBwcm9ncmFtbWluZyUyMHNjcmVlbnxlbnwwfHx8fDE3Nzk1NTA1NDd8MA&ixlib=rb-4.1.0&q=85";
const defaultWhatsAppForm = {
  provider: "disabled",
  app_url: "",
  fonnte_token: "",
  fonnte_url: "https://api.fonnte.com/send",
  waha_base_url: "",
  waha_api_key: "",
  waha_session: "default",
  send_delay_seconds: 3,
  typing_simulation_seconds: 30,
  otp_template:
    "Kode OTP reset password Anda: {code}. Berlaku {minutes} menit. Link: {link}",
  assignment_template:
    "Halo {name}, ada tugas baru: {title}. Kelas: {class_name}. Deadline: {deadline}. Link: {link}",
  grade_template:
    "Halo {name}, tugas {title} sudah dinilai. Nilai: {grade} ({predicate}). Feedback: {feedback}. Link: {link}",
  revision_template:
    "Halo {name}, tugas {title} perlu revisi. Catatan: {revision_note}. Link: {link}",
};
const defaultDriveForm = {
  enabled: true,
  root_folder_id: "",
  root_folder_name: "E-Learning Dosen",
  require_upload: false,
  lecturer_folder_sharing_enabled: false,
  lecturer_folder_role: "reader",
  google_meet_enabled: false,
  google_workspace_delegated_user: "",
  service_account_json: "",
  clear_service_account: false,
};
const defaultEmailForm = {
  enabled: false,
  smtp_host: "",
  smtp_port: 587,
  smtp_user: "",
  smtp_password: "",
  smtp_use_tls: true,
  from_name: "E-Learning Dosen",
  from_email: "",
};
const defaultSsoForm = {
  enabled: true,
  discovery_url:
    "http://localhost:8081/realms/sci/.well-known/openid-configuration",
  issuer: "http://localhost:8081/realms/sci",
  client_id: "nugaslagi-local",
  client_secret: "",
  redirect_uri: `${BACKEND_URL}/api/auth/sso/callback`,
  frontend_url: BACKEND_URL,
  scopes: "openid profile email roles",
  local_login_enabled: true,
  clear_client_secret: false,
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

function VersionMeta({ version, className = "" }) {
  const label = version?.version ? `v${version.version}` : "Versi memuat...";
  const schema = version?.schema_version ? ` · DB ${version.schema_version}` : "";
  return (
    <p
      className={`text-[10px] font-medium tracking-wide text-slate-400 ${className}`}
      data-testid="app-version-meta"
      title={version?.git_commit && version.git_commit !== "unknown" ? `Commit ${version.git_commit}` : undefined}
    >
      {label}{schema}
    </p>
  );
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

function getSsoCallbackQuery() {
  if (typeof window === "undefined") return { ticket: "", error: "" };
  const params = new URLSearchParams(window.location.search);
  return {
    ticket: params.get("sso_ticket") || "",
    error: params.get("sso_error") || "",
  };
}

function fmtDate(value) {
  if (!value) return "-";
  try {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function formatApiError(error, fallback) {
  const status = error?.response?.status;
  if (status === 413)
    return "File terlalu besar untuk batas server/Nginx. Naikkan client_max_body_size lalu coba lagi.";
  const detail =
    error?.response?.data?.detail ||
    error?.response?.data?.message ||
    error?.message;
  if ([502, 503, 504].includes(status) && !detail)
    return "Server belum selesai memproses upload. Coba lagi atau periksa log backend/Nginx.";
  if (!detail) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => {
        if (typeof item === "string") return item;
        if (item?.msg) return item.msg;
        return "";
      })
      .filter(Boolean);
    return messages.length ? messages.join("; ") : fallback;
  }
  if (typeof detail === "object")
    return detail.message || JSON.stringify(detail);
  return String(detail);
}

function isFutureDate(value) {
  if (!value) return false;
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getTime() > Date.now();
}

function remainingDeadline(deadline, nowMs) {
  const date = new Date(deadline);
  if (!deadline || Number.isNaN(date.getTime()))
    return { label: "Deadline tidak valid", status: "neutral" };
  const diff = date.getTime() - nowMs;
  const abs = Math.abs(diff);
  const days = Math.floor(abs / 86400000);
  const hours = Math.floor((abs % 86400000) / 3600000);
  const minutes = Math.floor((abs % 3600000) / 60000);
  const parts =
    days > 0
      ? `${days} hari ${hours} jam`
      : hours > 0
        ? `${hours} jam ${minutes} menit`
        : `${Math.max(1, minutes)} menit`;
  if (diff <= 0) return { label: `Lewat ${parts}`, status: "overdue" };
  if (diff <= 86400000) return { label: `Sisa ${parts}`, status: "urgent" };
  return { label: `Sisa ${parts}`, status: "normal" };
}

const DeadlineCountdown = memo(function DeadlineCountdown({
  deadline,
  testid,
  compact = false,
}) {
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);
  const remaining = remainingDeadline(deadline, nowMs);
  const color =
    remaining.status === "overdue"
      ? "border-red-200 bg-red-50 text-red-700"
      : remaining.status === "urgent"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-blue-200 bg-blue-50 text-blue-700";
  return (
    <Badge className={`${color} ${compact ? "" : "mt-2"}`} data-testid={testid}>
      {remaining.label}
    </Badge>
  );
});

function statusClass(status) {
  if (
    [
      "Aman",
      "Dinilai",
      "Sudah Submit",
      "uploaded_to_drive",
      "stored_on_server",
      "synced",
    ].includes(status)
  )
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  if (
    [
      "Perlu Perhatian",
      "Risiko Rendah",
      "Terlambat",
      "Direvisi",
      "Belum Submit",
      "pending_drive_config",
      "pending",
      "not_configured",
    ].includes(status)
  )
    return "bg-amber-50 text-amber-700 border-amber-200";
  if (
    ["Risiko Tinggi", "Ditolak", "drive_upload_failed", "failed"].includes(
      status,
    )
  )
    return "bg-red-50 text-red-700 border-red-200";
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

function reviewStatusLabel(status) {
  if (status === "graded") return "Sudah dinilai";
  if (status === "reviewed") return "Sudah dilihat";
  if (status === "revision_requested") return "Menunggu revisi";
  return "Perlu ditinjau";
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);
  if (value >= 1024 * 1024) return `${(value / 1024 / 1024).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(value / 1024))} KB`;
}

function assignmentAllowedFormats(assignment) {
  const source = assignment?.allowed_formats;
  const values = Array.isArray(source)
    ? source
    : String(source || "").split(",");
  const cleaned = values
    .map((item) =>
      String(item || "")
        .trim()
        .replace(/^\./, "")
        .toLowerCase(),
    )
    .filter(Boolean);
  return cleaned.length
    ? Array.from(new Set(cleaned))
    : DEFAULT_SUBMISSION_FORMATS;
}

function assignmentFormatLabel(assignment) {
  return assignmentAllowedFormats(assignment)
    .map((item) => item.toUpperCase())
    .join(", ");
}

function fileAcceptFromFormats(formats) {
  return (formats || DEFAULT_SUBMISSION_FORMATS)
    .map((item) => `.${String(item).replace(/^\./, "")}`)
    .join(",");
}

function assignmentMaxSubmissionMb(assignment) {
  const value = Number(
    assignment?.max_file_size_mb ||
      assignment?.max_upload_mb ||
      assignment?.max_submission_size_mb ||
      DEFAULT_SUBMISSION_MAX_FILE_MB,
  );
  return Number.isFinite(value) && value > 0
    ? value
    : DEFAULT_SUBMISSION_MAX_FILE_MB;
}

function normalizedExternalLink(url) {
  const value = String(url || "").trim();
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function otpDeliveryClass(status) {
  if (status === "sent")
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  if (status === "failed") return "border-red-200 bg-red-50 text-red-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

function otpDeliveryText(delivery) {
  const provider =
    delivery?.provider && delivery.provider !== "disabled"
      ? ` via ${delivery.provider}`
      : "";
  if (delivery?.status === "sent")
    return `Pesan OTP sudah dikirim${provider}${delivery.sent_at ? ` pada ${fmtDate(delivery.sent_at)}` : ""}.`;
  if (delivery?.status === "pending")
    return `Pesan OTP sudah masuk antrian${provider} dan menunggu proses kirim.`;
  if (delivery?.status === "pending_config")
    return `Pesan OTP masuk antrian, tetapi gateway WhatsApp belum aktif.${delivery.error ? ` ${delivery.error}.` : ""}`;
  if (delivery?.status === "failed")
    return `Pesan OTP gagal dikirim${provider}.${delivery.error ? ` ${delivery.error}` : ""}`;
  if (delivery?.status === "no_whatsapp")
    return "OTP tidak masuk antrian WhatsApp karena nomor WhatsApp belum terdaftar pada akun.";
  return "Status antrian OTP belum tersedia.";
}

function submissionFiles(submission) {
  const files =
    Array.isArray(submission?.files) && submission.files.length
      ? submission.files
      : submission?.file
        ? [submission.file]
        : [];
  return files.filter((item) => item && (item.file_id || item.id));
}

function fileId(file) {
  return file?.file_id || file?.id || "";
}

function authenticatedFileLink(url, token) {
  if (!url) return "";
  const resolved = url.startsWith("/") ? `${BACKEND_URL}${url}` : url;
  const isProtectedFile =
    url.startsWith("/api/") || resolved.startsWith(`${BACKEND_URL}/api/`);
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

  useEffect(
    () => () => {
      window.clearInterval(motionTimer.current);
      window.clearTimeout(hideTimer.current);
    },
    [],
  );

  function begin(label, detail = "Memproses permintaan...") {
    stopTimers();
    const id = ++sequence.current;
    setAction({ id, label, detail, percent: 4, status: "busy" });
    motionTimer.current = window.setInterval(() => {
      setAction((current) => {
        if (
          !current ||
          current.id !== id ||
          current.status !== "busy" ||
          current.percent >= 90
        )
          return current;
        return {
          ...current,
          percent: Math.min(
            90,
            current.percent +
              Math.max(1, Math.ceil((92 - current.percent) / 7)),
          ),
        };
      });
    }, 320);
    return id;
  }

  function update(id, percent, label, detail) {
    setAction((current) =>
      current && current.id === id
        ? {
            ...current,
            percent: Math.max(
              current.percent,
              Math.min(96, Math.round(percent)),
            ),
            label: label || current.label,
            detail: detail || current.detail,
          }
        : current,
    );
  }

  function finish(
    id,
    label = "Selesai",
    detail = "Proses berhasil diselesaikan.",
  ) {
    window.clearInterval(motionTimer.current);
    setAction((current) =>
      current && current.id === id
        ? { ...current, percent: 100, status: "done", label, detail }
        : current,
    );
    hideTimer.current = window.setTimeout(
      () => setAction((current) => (current?.id === id ? null : current)),
      1100,
    );
  }

  function fail(id, detail = "Proses tidak berhasil. Silakan coba kembali.") {
    window.clearInterval(motionTimer.current);
    setAction((current) =>
      current && current.id === id
        ? { ...current, status: "error", label: "Proses gagal", detail }
        : current,
    );
    hideTimer.current = window.setTimeout(
      () => setAction((current) => (current?.id === id ? null : current)),
      3500,
    );
  }

  return (
    <ActionProgressContext.Provider value={{ begin, update, finish, fail }}>
      {children}
      {action && (
        <div
          className={`action-progress ${action.status}`}
          role="status"
          aria-live="polite"
          data-testid="action-progress-panel"
        >
          <div className="action-progress-topline">
            <strong>{action.label}</strong>
            <span data-testid="action-progress-percent">{action.percent}%</span>
          </div>
          <div className="action-progress-bar" aria-hidden="true">
            <span style={{ width: `${action.percent}%` }} />
          </div>
          <p>{action.detail}</p>
        </div>
      )}
    </ActionProgressContext.Provider>
  );
}

function useActionProgress() {
  return useContext(ActionProgressContext);
}

function uploadProgressPercent(event, start = 15, end = 94) {
  if (!event.total) return start;
  const ratio = Math.max(0, Math.min(1, event.loaded / event.total));
  return Math.round(start + (end - start) * ratio);
}

function clampScoreInput(value) {
  if (value === "") return "";
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return "";
  return Math.max(0, Math.min(100, numeric));
}

function needsSubmissionReview(submission) {
  return (
    ["Sudah Submit", "Terlambat", "Direvisi"].includes(submission?.status) &&
    !["reviewed", "graded"].includes(submission?.review_status)
  );
}

const NotificationBadge = memo(function NotificationBadge({ count, testid }) {
  if (!count) return null;
  return (
    <Badge
      className="ml-auto border-red-200 bg-red-50 text-red-700"
      data-testid={testid}
    >
      {count > 99 ? "99+" : count}
    </Badge>
  );
});

function attentionKey(item) {
  return [
    item?.id || item?.file_id || "",
    item?.updated_at ||
      item?.submitted_at ||
      item?.reviewed_at ||
      item?.graded_at ||
      item?.created_at ||
      item?.requested_at ||
      item?.status ||
      "",
  ].join(":");
}

function unseenCount(items, seenKeys = []) {
  const seen = new Set(seenKeys || []);
  return (items || []).filter((item) => !seen.has(attentionKey(item))).length;
}

const Field = memo(function Field({ id, label, children }) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} data-testid={`${id}-label`}>
        {label}
      </Label>
      {children}
    </div>
  );
});

const EmptyState = memo(function EmptyState({ title, description }) {
  return (
    <div
      className="border border-dashed border-slate-300 bg-white p-8 text-center"
      data-testid="empty-state-panel"
    >
      <p
        className="font-display text-lg font-semibold text-slate-900"
        data-testid="empty-state-title"
      >
        {title}
      </p>
      <p
        className="mt-2 text-sm text-slate-500"
        data-testid="empty-state-description"
      >
        {description}
      </p>
    </div>
  );
});

function LoginScreen({ onAuth, branding, ssoError = "", version }) {
  const resetQuery = useMemo(() => getResetPasswordQuery(), []);
  const [mode, setMode] = useState(resetQuery.active ? "forgot" : "login");
  const [login, setLogin] = useState({ identifier: "", password: "" });
  const [register, setRegister] = useState({
    username: "",
    nim: "",
    name: "",
    email: "",
    whatsapp: "",
    password: "",
  });
  const [forgot, setForgot] = useState({
    identifier: resetQuery.identifier,
    otp: "",
    new_password: "",
    sent: resetQuery.active,
    message: resetQuery.active
      ? "Masukkan OTP dari WhatsApp atau email dan password baru."
      : "",
    delivery: null,
    emailDelivery: null,
  });
  const [busy, setBusy] = useState(false);
  const [sso, setSso] = useState({
    enabled: false,
    provider: "SCI-ID",
    login_url: "",
    local_login_enabled: true,
  });
  const progress = useActionProgress();
  const otpMessageId = forgot.delivery?.message_id || "";
  const otpDeliveryStatus = forgot.delivery?.status || "";

  useEffect(() => {
    axios
      .get(`${API}/auth/sso/config`)
      .then(({ data }) => setSso(data))
      .catch(() => setSso((current) => ({ ...current, enabled: false })));
  }, []);

  useEffect(() => {
    if (ssoError) toast.error(ssoError);
  }, [ssoError]);

  useEffect(() => {
    if (!forgot.sent || !otpMessageId || otpDeliveryStatus !== "pending")
      return undefined;
    let cancelled = false;
    const refreshDelivery = async () => {
      try {
        const { data } = await axios.get(
          `${API}/auth/forgot-password/messages/${otpMessageId}`,
        );
        if (!cancelled) setForgot((prev) => ({ ...prev, delivery: data }));
      } catch {
        if (!cancelled)
          setForgot((prev) => ({
            ...prev,
            delivery: {
              ...prev.delivery,
              status: "failed",
              error: "Status antrian OTP gagal dimuat",
            },
          }));
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
    event.preventDefault();
    setBusy(true);
    const operation = progress.begin("Masuk ke aplikasi");
    try {
      const { data } = await axios.post(`${API}/auth/login`, login);
      progress.finish(operation, "Login berhasil");
      onAuth(data);
      toast.success("Login berhasil");
    } catch (error) {
      progress.fail(operation, error.response?.data?.detail || "Login gagal");
      toast.error(error.response?.data?.detail || "Login gagal");
    } finally {
      setBusy(false);
    }
  }

  async function submitRegister(event) {
    event.preventDefault();
    setBusy(true);
    const operation = progress.begin("Membuat akun mahasiswa");
    try {
      const { data } = await axios.post(
        `${API}/auth/register-student`,
        register,
      );
      progress.finish(operation, "Akun berhasil dibuat");
      onAuth(data);
      toast.success("Akun mahasiswa berhasil dibuat");
    } catch (error) {
      progress.fail(operation, error.response?.data?.detail || "Daftar gagal");
      toast.error(error.response?.data?.detail || "Daftar gagal");
    } finally {
      setBusy(false);
    }
  }

  async function submitForgot(event) {
    event.preventDefault();
    setBusy(true);
    const operation = progress.begin("Mengirim OTP");
    try {
      const { data } = await axios.post(`${API}/auth/forgot-password`, {
        identifier: forgot.identifier,
      });
      const delivery = data.otp_delivery || null;
      const emailDelivery = data.email_delivery || null;
      progress.finish(operation, "OTP diproses");
      toast.success(data.message || "OTP diproses");
      setForgot((prev) => ({
        ...prev,
        sent: true,
        otp: "",
        message: data.message || "",
        delivery,
        emailDelivery,
      }));
    } catch (error) {
      const detail = error.response?.data?.detail || "Permintaan reset gagal";
      progress.fail(operation, detail);
      toast.error(detail);
      setForgot((prev) => ({ ...prev, message: detail }));
    } finally {
      setBusy(false);
    }
  }

  async function submitResetOtp(event) {
    event.preventDefault();
    setBusy(true);
    const operation = progress.begin("Mereset password");
    try {
      await axios.post(`${API}/auth/reset-password-otp`, {
        identifier: forgot.identifier,
        otp: forgot.otp,
        new_password: forgot.new_password,
      });
      progress.finish(operation, "Password berhasil direset");
      if (typeof window !== "undefined")
        window.history.replaceState(null, "", window.location.pathname || "/");
      toast.success("Password berhasil direset, silakan login");
      setMode("login");
      setForgot({
        identifier: "",
        otp: "",
        new_password: "",
        sent: false,
        message: "",
        delivery: null,
        emailDelivery: null,
      });
    } catch (error) {
      progress.fail(
        operation,
        error.response?.data?.detail || "Reset password gagal",
      );
      toast.error(error.response?.data?.detail || "Reset password gagal");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main
      className="min-h-screen bg-slate-50 lg:grid lg:grid-cols-[1.05fr_0.95fr]"
      data-testid="login-screen"
    >
      <section
        className="relative hidden overflow-hidden bg-slate-950 lg:block"
        data-testid="login-visual-section"
      >
        <img
          src={authBg}
          alt="E-learning akademik"
          className="h-full w-full object-cover opacity-75"
          loading="lazy"
          data-testid="login-background-image"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/35 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 text-white">
          <img
            src={brandingLogo(branding)}
            alt={`Logo ${brandingName(branding)}`}
            className="mb-8 h-16 w-16"
            data-testid="login-logo-image"
          />
          <h1
            className="font-display text-5xl font-bold leading-tight"
            data-testid="login-hero-title"
          >
            Ruang kendali pembelajaran dosen.
          </h1>
          <p
            className="mt-5 max-w-xl text-lg text-slate-200"
            data-testid="login-hero-subtitle"
          >
            Kelola kelas, tugas, submission, rubrik, reminder, dan rekap nilai
            dari satu aplikasi PWA.
          </p>
        </div>
      </section>
      <section
        className="flex min-h-screen items-center px-5 py-10 md:px-12"
        data-testid="login-form-section"
      >
        <div className="mx-auto w-full max-w-xl animate-rise">
          <div className="mb-6 flex items-center gap-3">
            <img
              src={brandingLogo(branding)}
              alt="Logo"
              className="h-12 w-12"
              data-testid="login-mobile-logo-image"
            />
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                data-testid="login-overline"
              >
                {brandingName(branding)}
              </p>
              <h2
                className="font-display text-3xl font-bold text-slate-950"
                data-testid="login-title"
              >
                {mode === "login"
                  ? "Satu pintu login"
                  : mode === "register"
                    ? "Daftar mahasiswa"
                    : "Lupa password"}
              </h2>
            </div>
          </div>
          <div
            className="mb-5 grid grid-cols-3 gap-2 rounded-2xl border border-blue-200 bg-white p-1"
            data-testid="front-auth-tabs"
          >
            <Button
              type="button"
              variant={mode === "login" ? "default" : "ghost"}
              data-testid="front-login-tab-button"
              onClick={() => setMode("login")}
            >
              Masuk
            </Button>
            <Button
              type="button"
              variant={mode === "register" ? "default" : "ghost"}
              data-testid="front-register-tab-button"
              onClick={() => setMode("register")}
            >
              Daftar
            </Button>
            <Button
              type="button"
              variant={mode === "forgot" ? "default" : "ghost"}
              data-testid="front-forgot-tab-button"
              onClick={() => setMode("forgot")}
            >
              Lupa
            </Button>
          </div>
          {mode === "login" && (
            <div
              className="space-y-4 border border-slate-200 bg-white p-6"
              data-testid="unified-login-panel"
            >
              {sso.enabled && sso.login_url && (
                <div className="space-y-3" data-testid="sso-login-section">
                  <Button
                    asChild
                    className="w-full"
                    data-testid="sso-login-button"
                  >
                    <a href={sso.login_url}>
                      <GraduationCap /> Masuk dengan {sso.provider || "SCI-ID"}
                    </a>
                  </Button>
                  <p className="text-center text-sm text-slate-500">
                    Gunakan akun kampus. Password hanya dimasukkan pada halaman
                    SCI-ID.
                  </p>
                </div>
              )}
              {sso.local_login_enabled && (
                <>
                  {sso.enabled && (
                    <div className="flex items-center gap-3 text-xs uppercase tracking-widest text-slate-400">
                      <span className="h-px flex-1 bg-slate-200" />
                      <span>Login lokal sementara</span>
                      <span className="h-px flex-1 bg-slate-200" />
                    </div>
                  )}
                  <form
                    onSubmit={submitLogin}
                    className="space-y-5"
                    data-testid="unified-login-form"
                  >
                    <Field
                      id="login-identifier"
                      label="Username / NIM / Nomor HP / Email"
                    >
                      <Input
                        id="login-identifier"
                        data-testid="unified-login-identifier-input"
                        value={login.identifier}
                        onChange={(e) =>
                          setLogin({ ...login, identifier: e.target.value })
                        }
                      />
                    </Field>
                    <Field id="login-password" label="Password">
                      <Input
                        id="login-password"
                        type="password"
                        data-testid="unified-login-password-input"
                        value={login.password}
                        onChange={(e) =>
                          setLogin({ ...login, password: e.target.value })
                        }
                      />
                    </Field>
                    <Button
                      className="w-full"
                      disabled={busy}
                      data-testid="unified-login-submit-button"
                    >
                      <GraduationCap /> Masuk lokal
                    </Button>
                    <div className="flex flex-wrap justify-between gap-2 text-sm">
                      <button
                        type="button"
                        className="font-semibold text-blue-700"
                        data-testid="front-register-inline-button"
                        onClick={() => setMode("register")}
                      >
                        Belum punya akun? Daftar
                      </button>
                      <button
                        type="button"
                        className="font-semibold text-blue-700"
                        data-testid="front-forgot-inline-button"
                        onClick={() => setMode("forgot")}
                      >
                        Lupa password?
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          )}
          {mode === "register" && (
            <form
              onSubmit={submitRegister}
              className="space-y-4 border border-slate-200 bg-white p-6"
              data-testid="student-register-form"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="register-nim" label="NIM">
                  <Input
                    id="register-nim"
                    data-testid="student-register-nim-input"
                    value={register.nim}
                    onChange={(e) =>
                      setRegister({ ...register, nim: e.target.value })
                    }
                  />
                </Field>
                <Field id="register-username" label="Username">
                  <Input
                    id="register-username"
                    data-testid="student-register-username-input"
                    value={register.username}
                    onChange={(e) =>
                      setRegister({ ...register, username: e.target.value })
                    }
                    placeholder="Opsional, default NIM"
                  />
                </Field>
                <Field id="register-name" label="Nama lengkap">
                  <Input
                    id="register-name"
                    data-testid="student-register-name-input"
                    value={register.name}
                    onChange={(e) =>
                      setRegister({ ...register, name: e.target.value })
                    }
                  />
                </Field>
                <Field id="register-email" label="Email">
                  <Input
                    id="register-email"
                    data-testid="student-register-email-input"
                    value={register.email}
                    onChange={(e) =>
                      setRegister({ ...register, email: e.target.value })
                    }
                  />
                </Field>
                <Field id="register-whatsapp" label="Nomor HP / WhatsApp">
                  <Input
                    id="register-whatsapp"
                    data-testid="student-register-whatsapp-input"
                    value={register.whatsapp}
                    onChange={(e) =>
                      setRegister({ ...register, whatsapp: e.target.value })
                    }
                  />
                </Field>
                <Field id="register-password" label="Password">
                  <Input
                    id="register-password"
                    type="password"
                    data-testid="student-register-password-input"
                    value={register.password}
                    onChange={(e) =>
                      setRegister({ ...register, password: e.target.value })
                    }
                  />
                </Field>
              </div>
              <Button
                className="w-full"
                disabled={busy}
                data-testid="student-register-submit-button"
              >
                <Users /> Buat akun mahasiswa
              </Button>
              <p
                className="text-sm text-slate-500"
                data-testid="student-register-help"
              >
                Setelah daftar, masukkan kode kelas di dashboard mahasiswa dan
                tunggu ACC dosen.
              </p>
            </form>
          )}
          {mode === "forgot" && (
            <form
              onSubmit={forgot.sent ? submitResetOtp : submitForgot}
              className="space-y-5 border border-slate-200 bg-white p-6"
              data-testid="forgot-password-form"
            >
              <Field
                id="forgot-identifier"
                label="Username / NIM / Nomor HP / Email"
              >
                <Input
                  id="forgot-identifier"
                  data-testid="forgot-password-identifier-input"
                  value={forgot.identifier}
                  onChange={(e) =>
                    setForgot({ ...forgot, identifier: e.target.value })
                  }
                />
              </Field>
              {forgot.message && (
                <p
                  className={`rounded-md border p-3 text-sm ${forgot.sent ? "border-blue-200 bg-blue-50 text-blue-800" : "border-red-200 bg-red-50 text-red-800"}`}
                  data-testid="forgot-password-message"
                >
                  {forgot.message}
                </p>
              )}
              {forgot.delivery && (
                <div
                  className={`rounded-md border p-3 text-sm ${otpDeliveryClass(forgot.delivery.status)}`}
                  data-testid="forgot-password-otp-queue-status"
                >
                  <p className="font-semibold">Antrian pesan WhatsApp</p>
                  <p className="mt-1">{otpDeliveryText(forgot.delivery)}</p>
                </div>
              )}
              {forgot.emailDelivery && (
                <div
                  className={`rounded-md border p-3 text-sm ${forgot.emailDelivery.status === "sent" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : forgot.emailDelivery.status === "failed" ? "border-red-200 bg-red-50 text-red-800" : "border-slate-200 bg-slate-50 text-slate-600"}`}
                  data-testid="forgot-password-email-status"
                >
                  <p className="font-semibold">Email OTP</p>
                  <p className="mt-1">
                    {forgot.emailDelivery.status === "sent"
                      ? "OTP sudah dikirim ke email Anda."
                      : forgot.emailDelivery.status === "failed"
                        ? `Gagal mengirim email: ${forgot.emailDelivery.error || "Error tidak diketahui"}`
                        : forgot.emailDelivery.status === "no_email"
                          ? "Email tidak terdaftar pada akun ini."
                          : "Status email tidak diketahui."}
                  </p>
                </div>
              )}
              {forgot.sent && (
                <>
                  <Field id="forgot-otp" label="OTP">
                    <Input
                      id="forgot-otp"
                      data-testid="forgot-password-otp-input"
                      value={forgot.otp}
                      onChange={(e) =>
                        setForgot({ ...forgot, otp: e.target.value })
                      }
                    />
                  </Field>
                  <Field id="forgot-new-password" label="Password baru">
                    <Input
                      id="forgot-new-password"
                      type="password"
                      data-testid="forgot-password-new-input"
                      value={forgot.new_password}
                      onChange={(e) =>
                        setForgot({ ...forgot, new_password: e.target.value })
                      }
                    />
                  </Field>
                </>
              )}
              <Button
                className="w-full"
                disabled={busy}
                data-testid="forgot-password-submit-button"
              >
                <Send /> {forgot.sent ? "Reset password" : "Kirim OTP"}
              </Button>
              <p
                className="text-sm text-slate-500"
                data-testid="forgot-password-help"
              >
                OTP dikirim via WhatsApp dan/atau email tergantung konfigurasi
                gateway.
              </p>
            </form>
          )}
          <VersionMeta version={version} className="mt-5 text-center" />
        </div>
      </section>
    </main>
  );
}

const StatCard = memo(function StatCard({
  icon: Icon,
  label,
  value,
  hint,
  testid,
}) {
  return (
    <Card
      className="rounded-md border-slate-200 shadow-none transition-transform hover:-translate-y-1"
      data-testid={testid}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className="text-sm text-slate-500"
              data-testid={`${testid}-label`}
            >
              {label}
            </p>
            <p
              className="mt-2 font-display text-3xl font-bold text-slate-950"
              data-testid={`${testid}-value`}
            >
              {value}
            </p>
          </div>
          <div className="border border-slate-200 p-2 text-slate-700">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p
          className="mt-4 text-xs text-slate-500"
          data-testid={`${testid}-hint`}
        >
          {hint}
        </p>
      </CardContent>
    </Card>
  );
});

const ChangePasswordPanel = memo(function ChangePasswordPanel({ token }) {
  const [form, setForm] = useState({ current_password: "", new_password: "" });
  const progress = useActionProgress();
  async function submit(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan password baru");
    try {
      await axios.post(`${API}/auth/change-password`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      progress.finish(operation, "Password diperbarui");
      toast.success("Password berhasil diganti");
      setForm({ current_password: "", new_password: "" });
    } catch (error) {
      progress.fail(
        operation,
        error.response?.data?.detail || "Ganti password gagal",
      );
      toast.error(error.response?.data?.detail || "Ganti password gagal");
    }
  }
  return (
    <Card className="rounded-md shadow-none" data-testid="change-password-card">
      <CardHeader>
        <CardTitle data-testid="change-password-title">
          Ganti password
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={submit}
          className="grid gap-3 md:grid-cols-[1fr_1fr_auto]"
          data-testid="change-password-form"
        >
          <Input
            type="password"
            placeholder="Password lama"
            data-testid="change-password-current-input"
            value={form.current_password}
            onChange={(e) =>
              setForm({ ...form, current_password: e.target.value })
            }
          />
          <Input
            type="password"
            placeholder="Password baru"
            data-testid="change-password-new-input"
            value={form.new_password}
            onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          />
          <Button data-testid="change-password-submit-button">Simpan</Button>
        </form>
      </CardContent>
    </Card>
  );
});

function ProfilePage({ token, user, onUserUpdate, enrollments = [] }) {
  const [form, setForm] = useState({
    name: user.name || "",
    username: user.username || "",
    email: user.email || "",
    whatsapp: user.whatsapp || "",
  });
  const progress = useActionProgress();
  useEffect(() => {
    setForm({
      name: user.name || "",
      username: user.username || "",
      email: user.email || "",
      whatsapp: user.whatsapp || "",
    });
  }, [user]);
  async function saveProfile(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan profil");
    try {
      const { data: updated } = await axios.put(`${API}/auth/me`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onUserUpdate(updated);
      progress.finish(operation, "Profil disimpan");
      toast.success("Profil berhasil disimpan");
    } catch (error) {
      progress.fail(
        operation,
        error.response?.data?.detail || "Profil gagal disimpan",
      );
      toast.error(error.response?.data?.detail || "Profil gagal disimpan");
    }
  }
  const isStudent = user.role === "student";
  return (
    <div
      className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]"
      data-testid={`${isStudent ? "student" : "admin"}-profile-page`}
    >
      <Card
        className="rounded-md shadow-none"
        data-testid="profile-editor-card"
      >
        <CardHeader>
          <CardTitle data-testid="profile-editor-title">
            Profil {isStudent ? "mahasiswa" : "admin"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={saveProfile}
            data-testid="profile-editor-form"
          >
            {isStudent && (
              <Field id="profile-nim" label="NIM">
                <Input
                  id="profile-nim"
                  value={user.nim || ""}
                  disabled
                  data-testid="profile-nim-input"
                />
              </Field>
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="profile-name" label="Nama lengkap">
                <Input
                  id="profile-name"
                  required
                  value={form.name}
                  data-testid="profile-name-input"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </Field>
              <Field id="profile-username" label="Username">
                <Input
                  id="profile-username"
                  required
                  value={form.username}
                  data-testid="profile-username-input"
                  onChange={(e) =>
                    setForm({ ...form, username: e.target.value })
                  }
                />
              </Field>
              <Field id="profile-email" label="Email">
                <Input
                  id="profile-email"
                  type="email"
                  required
                  value={form.email}
                  data-testid="profile-email-input"
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </Field>
              <Field id="profile-whatsapp" label="WhatsApp">
                <Input
                  id="profile-whatsapp"
                  value={form.whatsapp}
                  data-testid="profile-whatsapp-input"
                  onChange={(e) =>
                    setForm({ ...form, whatsapp: e.target.value })
                  }
                />
              </Field>
            </div>
            {isStudent && (
              <div
                className="border border-slate-200 bg-slate-50 p-3 text-sm"
                data-testid="profile-enrollments"
              >
                <p className="mb-2 font-semibold text-slate-700">Kelas</p>
                <div className="flex flex-wrap gap-2">
                  {enrollments.length === 0 ? (
                    <Badge variant="outline">Belum ada pengajuan kelas</Badge>
                  ) : (
                    enrollments.map((item) => (
                      <Badge
                        key={item.id}
                        className={statusClass(
                          item.status === "approved" ? "Aman" : "Risiko Rendah",
                        )}
                      >
                        {item.class_name}: {item.status}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}
            <Button data-testid="profile-save-button">
              <CheckCircle2 /> Simpan profil
            </Button>
          </form>
        </CardContent>
      </Card>
      <ChangePasswordPanel token={token} />
    </div>
  );
}

function WhatsAppPage({
  forms,
  setForms,
  saveWhatsApp,
  messages,
  retryMessage,
}) {
  const w = { ...defaultWhatsAppForm, ...(forms.whatsapp || {}) };
  const updateWhatsApp = (changes) =>
    setForms({ ...forms, whatsapp: { ...w, ...changes } });
  return (
    <div className="space-y-6" data-testid="whatsapp-page">
      <form
        onSubmit={saveWhatsApp}
        className="space-y-4 border bg-white p-5"
        data-testid="whatsapp-settings-form"
      >
        <h2
          className="font-display text-2xl font-semibold"
          data-testid="whatsapp-settings-title"
        >
          Konfigurasi WhatsApp Gateway
        </h2>
        <div className="grid gap-4 md:grid-cols-4">
          <Field id="whatsapp-provider" label="Provider">
            <select
              id="whatsapp-provider"
              className="form-select"
              data-testid="whatsapp-provider-select"
              value={w.provider || "disabled"}
              onChange={(e) => updateWhatsApp({ provider: e.target.value })}
            >
              <option value="disabled">Nonaktif</option>
              <option value="fonnte">Fonnte</option>
              <option value="waha">WAHA</option>
            </select>
          </Field>
          <Field id="whatsapp-app-url" label="Link reset/aplikasi">
            <Input
              id="whatsapp-app-url"
              data-testid="whatsapp-app-url-input"
              value={w.app_url || ""}
              onChange={(e) => updateWhatsApp({ app_url: e.target.value })}
              placeholder="https://domain-aplikasi"
            />
          </Field>
          <Field id="whatsapp-send-delay" label="Delay kirim (detik)">
            <Input
              id="whatsapp-send-delay"
              type="number"
              min="0"
              max="300"
              data-testid="whatsapp-send-delay-input"
              value={w.send_delay_seconds ?? 3}
              onChange={(e) =>
                updateWhatsApp({ send_delay_seconds: Number(e.target.value) })
              }
            />
          </Field>
          <Field id="whatsapp-typing-sim" label="Simulasi mengetik (detik)">
            <Input
              id="whatsapp-typing-sim"
              type="number"
              min="0"
              max="120"
              data-testid="whatsapp-typing-sim-input"
              value={w.typing_simulation_seconds ?? 30}
              onChange={(e) =>
                updateWhatsApp({
                  typing_simulation_seconds: Number(e.target.value),
                })
              }
            />
          </Field>
        </div>
        {w.provider === "fonnte" && (
          <div
            className="grid gap-4 md:grid-cols-2"
            data-testid="fonnte-config-fields"
          >
            <Field id="fonnte-token" label="Token Fonnte">
              <Input
                id="fonnte-token"
                type="password"
                data-testid="fonnte-token-input"
                value={w.fonnte_token || ""}
                onChange={(e) =>
                  updateWhatsApp({ fonnte_token: e.target.value })
                }
                placeholder={w.fonnte_token_masked || "Token Fonnte"}
              />
            </Field>
            <Field id="fonnte-url" label="URL API Fonnte">
              <Input
                id="fonnte-url"
                data-testid="fonnte-url-input"
                value={w.fonnte_url || "https://api.fonnte.com/send"}
                onChange={(e) => updateWhatsApp({ fonnte_url: e.target.value })}
              />
            </Field>
          </div>
        )}
        {w.provider === "waha" && (
          <div
            className="grid gap-4 md:grid-cols-3"
            data-testid="waha-config-fields"
          >
            <Field id="waha-base-url" label="WAHA Base URL">
              <Input
                id="waha-base-url"
                data-testid="waha-base-url-input"
                value={w.waha_base_url || ""}
                onChange={(e) =>
                  updateWhatsApp({ waha_base_url: e.target.value })
                }
              />
            </Field>
            <Field id="waha-api-key" label="WAHA API Key">
              <Input
                id="waha-api-key"
                type="password"
                data-testid="waha-api-key-input"
                value={w.waha_api_key || ""}
                onChange={(e) =>
                  updateWhatsApp({ waha_api_key: e.target.value })
                }
                placeholder={w.waha_api_key_masked || "X-Api-Key"}
              />
            </Field>
            <Field id="waha-session" label="Session">
              <Input
                id="waha-session"
                data-testid="waha-session-input"
                value={w.waha_session || "default"}
                onChange={(e) =>
                  updateWhatsApp({ waha_session: e.target.value })
                }
              />
            </Field>
          </div>
        )}
        <div className="grid gap-4 xl:grid-cols-2">
          <Field id="whatsapp-template" label="Template OTP">
            <Textarea
              id="whatsapp-template"
              data-testid="whatsapp-template-input"
              value={w.otp_template || ""}
              onChange={(e) => updateWhatsApp({ otp_template: e.target.value })}
            />
          </Field>
          <Field id="whatsapp-assignment-template" label="Template tugas baru">
            <Textarea
              id="whatsapp-assignment-template"
              data-testid="whatsapp-assignment-template-input"
              value={w.assignment_template || ""}
              onChange={(e) =>
                updateWhatsApp({ assignment_template: e.target.value })
              }
            />
          </Field>
          <Field id="whatsapp-grade-template" label="Template nilai">
            <Textarea
              id="whatsapp-grade-template"
              data-testid="whatsapp-grade-template-input"
              value={w.grade_template || ""}
              onChange={(e) =>
                updateWhatsApp({ grade_template: e.target.value })
              }
            />
          </Field>
          <Field id="whatsapp-revision-template" label="Template revisi">
            <Textarea
              id="whatsapp-revision-template"
              data-testid="whatsapp-revision-template-input"
              value={w.revision_template || ""}
              onChange={(e) =>
                updateWhatsApp({ revision_template: e.target.value })
              }
            />
          </Field>
        </div>
        <p
          className="text-sm text-slate-500"
          data-testid="whatsapp-template-help"
        >
          Placeholder: {"{code}"}, {"{minutes}"}, {"{link}"}, {"{name}"},{" "}
          {"{title}"}, {"{class_name}"}, {"{deadline}"}, {"{grade}"},{" "}
          {"{predicate}"}, {"{feedback}"}, {"{revision_note}"}
        </p>
        <Button data-testid="whatsapp-save-button">
          Simpan Konfigurasi WhatsApp
        </Button>
      </form>
      {messages && messages.length > 0 && (
        <Card
          className="rounded-md shadow-none"
          data-testid="whatsapp-message-log"
        >
          <CardHeader>
            <CardTitle data-testid="whatsapp-message-log-title">
              Log pesan gagal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {messages
              .filter((m) => ["failed", "pending_config"].includes(m.status))
              .map((m) => (
                <div
                  key={m.id}
                  className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3"
                  data-testid={`whatsapp-message-row-${m.id}`}
                >
                  <div>
                    <p
                      className="font-semibold"
                      data-testid={`whatsapp-message-to-${m.id}`}
                    >
                      {m.to}
                    </p>
                    <p
                      className="text-sm text-slate-500"
                      data-testid={`whatsapp-message-error-${m.id}`}
                    >
                      {m.error || m.status}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    data-testid={`whatsapp-message-retry-${m.id}-button`}
                    onClick={() => retryMessage(m.id)}
                  >
                    Kirim ulang
                  </Button>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function EmailPage({ forms, setForms, saveEmail, testEmail }) {
  const e = { ...defaultEmailForm, ...(forms.email || {}) };
  const updateEmail = (changes) =>
    setForms({ ...forms, email: { ...e, ...changes } });
  return (
    <div className="space-y-6" data-testid="email-page">
      <form
        onSubmit={saveEmail}
        className="space-y-4 border bg-white p-5"
        data-testid="email-settings-form"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="email-settings-title"
            >
              Konfigurasi Email (SMTP)
            </h2>
            <p
              className="mt-1 text-sm text-slate-500"
              data-testid="email-settings-subtitle"
            >
              Kirim OTP reset password dan notifikasi via email.
            </p>
          </div>
          <Badge
            className={
              e.enabled
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-slate-200 bg-slate-100 text-slate-600"
            }
            data-testid="email-status-badge"
          >
            {e.enabled ? "Email aktif" : "Email nonaktif"}
          </Badge>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="peer sr-only"
                data-testid="email-enabled-toggle"
                checked={e.enabled}
                onChange={(ev) => updateEmail({ enabled: ev.target.checked })}
              />
              <span className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span
              className="text-sm font-medium"
              data-testid="email-enabled-label"
            >
              {e.enabled ? "Aktif" : "Nonaktif"}
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="email-smtp-host" label="SMTP Host">
            <Input
              id="email-smtp-host"
              data-testid="email-smtp-host-input"
              value={e.smtp_host || ""}
              onChange={(ev) => updateEmail({ smtp_host: ev.target.value })}
              placeholder="smtp.gmail.com"
            />
          </Field>
          <Field id="email-smtp-port" label="SMTP Port">
            <Input
              id="email-smtp-port"
              type="number"
              min="1"
              max="65535"
              data-testid="email-smtp-port-input"
              value={e.smtp_port || 587}
              onChange={(ev) =>
                updateEmail({ smtp_port: Number(ev.target.value) })
              }
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="email-smtp-user" label="SMTP Username">
            <Input
              id="email-smtp-user"
              data-testid="email-smtp-user-input"
              value={e.smtp_user || ""}
              onChange={(ev) => updateEmail({ smtp_user: ev.target.value })}
              placeholder="user@gmail.com"
            />
          </Field>
          <Field id="email-smtp-password" label="SMTP Password">
            <Input
              id="email-smtp-password"
              type="password"
              data-testid="email-smtp-password-input"
              value={e.smtp_password || ""}
              onChange={(ev) => updateEmail({ smtp_password: ev.target.value })}
              placeholder={e.smtp_password_masked || "Password SMTP"}
            />
          </Field>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <label className="relative inline-flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                className="peer sr-only"
                data-testid="email-tls-toggle"
                checked={e.smtp_use_tls}
                onChange={(ev) =>
                  updateEmail({ smtp_use_tls: ev.target.checked })
                }
              />
              <span className="h-6 w-11 rounded-full bg-slate-200 peer-checked:bg-blue-600 after:absolute after:top-[2px] after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:after:translate-x-full" />
            </label>
            <span className="text-sm font-medium" data-testid="email-tls-label">
              Gunakan TLS
            </span>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="email-from-name" label="Nama Pengirim">
            <Input
              id="email-from-name"
              data-testid="email-from-name-input"
              value={e.from_name || ""}
              onChange={(ev) => updateEmail({ from_name: ev.target.value })}
              placeholder="E-Learning Dosen"
            />
          </Field>
          <Field id="email-from-email" label="Email Pengirim">
            <Input
              id="email-from-email"
              data-testid="email-from-email-input"
              value={e.from_email || ""}
              onChange={(ev) => updateEmail({ from_email: ev.target.value })}
              placeholder="noreply@domain.com"
            />
          </Field>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="email-save-button">
            Simpan Konfigurasi Email
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="email-test-button"
            onClick={testEmail}
          >
            Kirim Email Tes
          </Button>
        </div>
      </form>
    </div>
  );
}

function SsoSettingsPage({ forms, setForms, saveSso, testSso, settings }) {
  const s = { ...defaultSsoForm, ...(forms.sso || {}) };
  const updateSso = (changes) =>
    setForms({ ...forms, sso: { ...s, ...changes } });
  return (
    <div className="space-y-6" data-testid="sso-settings-page">
      <form
        onSubmit={saveSso}
        className="space-y-5 border bg-white p-5"
        data-testid="sso-settings-form"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-2xl font-semibold">
              Konfigurasi Login SCI-ID
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Hubungkan Nugas Lagi ke client OIDC yang dibuat melalui portal
              SCI-ID.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                s.enabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-slate-100 text-slate-600"
              }
            >
              {s.enabled ? "SSO aktif" : "SSO nonaktif"}
            </Badge>
            <Badge
              className={
                settings?.client_secret_configured
                  ? "border-blue-200 bg-blue-50 text-blue-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }
            >
              {settings?.client_secret_configured
                ? "Secret tersimpan"
                : "Secret belum diisi"}
            </Badge>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              data-testid="sso-enabled-toggle"
              checked={!!s.enabled}
              onChange={(e) => updateSso({ enabled: e.target.checked })}
            />{" "}
            Aktifkan login SCI-ID
          </label>
          <label className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm">
            <input
              type="checkbox"
              data-testid="sso-local-login-toggle"
              checked={!!s.local_login_enabled}
              onChange={(e) =>
                updateSso({ local_login_enabled: e.target.checked })
              }
            />{" "}
            Tetap izinkan login lokal
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="sso-client-id" label="Client ID">
            <Input
              id="sso-client-id"
              required={s.enabled}
              data-testid="sso-client-id-input"
              value={s.client_id || ""}
              onChange={(e) => updateSso({ client_id: e.target.value })}
              placeholder="nugaslagi-local"
            />
          </Field>
          <Field id="sso-client-secret" label="Client Secret">
            <Input
              id="sso-client-secret"
              type="password"
              data-testid="sso-client-secret-input"
              value={s.client_secret || ""}
              onChange={(e) =>
                updateSso({
                  client_secret: e.target.value,
                  clear_client_secret: false,
                })
              }
              placeholder={
                settings?.client_secret_configured
                  ? "Secret sudah tersimpan; isi hanya untuk mengganti"
                  : "Paste secret dari portal SCI-ID"
              }
            />
          </Field>
        </div>
        <Field id="sso-discovery-url" label="OIDC Discovery URL">
          <Input
            id="sso-discovery-url"
            required={s.enabled}
            data-testid="sso-discovery-url-input"
            value={s.discovery_url || ""}
            onChange={(e) => updateSso({ discovery_url: e.target.value })}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field id="sso-issuer" label="Issuer">
            <Input
              id="sso-issuer"
              data-testid="sso-issuer-input"
              value={s.issuer || ""}
              onChange={(e) => updateSso({ issuer: e.target.value })}
              placeholder="Kosongkan untuk mengikuti discovery"
            />
          </Field>
          <Field id="sso-scopes" label="Scopes">
            <Input
              id="sso-scopes"
              data-testid="sso-scopes-input"
              value={s.scopes || ""}
              onChange={(e) => updateSso({ scopes: e.target.value })}
            />
          </Field>
        </div>
        <Field id="sso-redirect-uri" label="Redirect URI">
          <Input
            id="sso-redirect-uri"
            required={s.enabled}
            data-testid="sso-redirect-uri-input"
            value={s.redirect_uri || ""}
            onChange={(e) => updateSso({ redirect_uri: e.target.value })}
          />
        </Field>
        <Field id="sso-frontend-url" label="Frontend URL setelah login">
          <Input
            id="sso-frontend-url"
            required={s.enabled}
            data-testid="sso-frontend-url-input"
            value={s.frontend_url || ""}
            onChange={(e) => updateSso({ frontend_url: e.target.value })}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm text-red-700">
          <input
            type="checkbox"
            data-testid="sso-clear-secret-toggle"
            checked={!!s.clear_client_secret}
            onChange={(e) =>
              updateSso({
                clear_client_secret: e.target.checked,
                client_secret: "",
              })
            }
          />{" "}
          Hapus client secret yang tersimpan
        </label>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="sso-save-button">
            <ShieldCheck /> Simpan Konfigurasi SSO
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="sso-test-button"
            onClick={testSso}
          >
            Tes koneksi SCI-ID
          </Button>
        </div>
        <p className="text-sm text-slate-500">
          Client secret dienkripsi di backend dan tidak pernah dikirim kembali
          ke browser. Redirect URI pada portal SCI-ID harus sama persis dengan
          nilai di atas.
        </p>
      </form>
    </div>
  );
}

function DrivePage({
  forms,
  setForms,
  saveDrive,
  testDrive,
  driveSettings,
  retryDriveSync,
  retryFailedDriveSync,
  refreshDriveStatus,
}) {
  const d = { ...defaultDriveForm, ...(forms.drive || {}) };
  const updateDrive = (changes) =>
    setForms({ ...forms, drive: { ...d, ...changes } });
  const summary = driveSettings?.summary || {};
  const items = driveSettings?.items || [];
  return (
    <div className="space-y-6" data-testid="drive-page">
      <form
        onSubmit={saveDrive}
        className="space-y-4 border bg-white p-5"
        data-testid="drive-settings-form"
      >
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="drive-settings-title"
            >
              Konfigurasi Google Drive
            </h2>
            <p
              className="mt-1 text-sm text-slate-500"
              data-testid="drive-settings-subtitle"
            >
              File disimpan lokal dulu, lalu disinkronkan ke folder terpisah
              untuk setiap dosen.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={statusClass(
                driveSettings?.drive_enabled ? "Aman" : "Risiko Rendah",
              )}
              data-testid="drive-status-badge"
            >
              {driveSettings?.drive_enabled
                ? "Drive aktif"
                : "Drive belum aktif"}
            </Badge>
            {driveSettings?.service_account_email && (
              <Badge
                className="border-slate-200 bg-white text-slate-700"
                data-testid="drive-account-badge"
              >
                {driveSettings.service_account_email}
              </Badge>
            )}
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            id="drive-root-folder-id"
            label="ID Shared Drive / folder root"
          >
            <Input
              id="drive-root-folder-id"
              data-testid="drive-root-folder-id-input"
              value={d.root_folder_id || ""}
              onChange={(e) => updateDrive({ root_folder_id: e.target.value })}
              placeholder="Contoh: 1AbCDEF..."
            />
          </Field>
          <Field id="drive-root-folder-name" label="Nama folder root">
            <Input
              id="drive-root-folder-name"
              data-testid="drive-root-folder-name-input"
              value={d.root_folder_name || ""}
              onChange={(e) =>
                updateDrive({ root_folder_name: e.target.value })
              }
            />
          </Field>
        </div>
        <Field id="drive-service-account-json" label="Service account JSON">
          <Textarea
            id="drive-service-account-json"
            data-testid="drive-service-account-json-input"
            value={d.service_account_json || ""}
            onChange={(e) =>
              updateDrive({ service_account_json: e.target.value })
            }
            placeholder={
              driveSettings?.service_account_configured
                ? "Credential sudah tersimpan. Isi hanya jika ingin mengganti."
                : "Paste isi file JSON service account dari Google Cloud"
            }
          />
        </Field>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <label
            className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm"
            data-testid="drive-enabled-toggle"
          >
            <input
              type="checkbox"
              checked={!!d.enabled}
              onChange={(e) => updateDrive({ enabled: e.target.checked })}
            />{" "}
            Aktifkan upload Drive
          </label>
          <label
            className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm"
            data-testid="drive-require-toggle"
          >
            <input
              type="checkbox"
              checked={!!d.require_upload}
              onChange={(e) =>
                updateDrive({ require_upload: e.target.checked })
              }
            />{" "}
            Wajib Drive terkonfigurasi
          </label>
          <label
            className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm"
            data-testid="drive-lecturer-sharing-toggle"
          >
            <input
              type="checkbox"
              checked={!!d.lecturer_folder_sharing_enabled}
              onChange={(e) =>
                updateDrive({
                  lecturer_folder_sharing_enabled: e.target.checked,
                })
              }
            />{" "}
            Bagikan folder ke email dosen
          </label>
          <label
            className="flex items-center gap-2 border border-slate-200 bg-slate-50 p-3 text-sm"
            data-testid="drive-clear-toggle"
          >
            <input
              type="checkbox"
              checked={!!d.clear_service_account}
              onChange={(e) =>
                updateDrive({ clear_service_account: e.target.checked })
              }
            />{" "}
            Hapus credential tersimpan
          </label>
        </div>
        {d.lecturer_folder_sharing_enabled && (
          <Field id="drive-lecturer-role" label="Hak akses langsung dosen">
            <select
              id="drive-lecturer-role"
              className="form-select"
              data-testid="drive-lecturer-role-select"
              value={d.lecturer_folder_role || "reader"}
              onChange={(e) =>
                updateDrive({ lecturer_folder_role: e.target.value })
              }
            >
              <option value="reader">Pembaca — hanya melihat/download</option>
              <option value="writer">
                Editor — dapat mengelola isi foldernya
              </option>
            </select>
          </Field>
        )}
        <div
          className="border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
          data-testid="drive-access-note"
        >
          Mode aman: dosen bukan anggota seluruh Shared Drive. Jika pembagian
          langsung dimatikan, semua file tetap tersedia melalui aplikasi. Jika
          dinyalakan, hanya folder milik dosen yang dibagikan ke email akun
          tersebut.
        </div>
        <Card
          className="rounded-md border-emerald-200 bg-emerald-50 shadow-none"
          data-testid="google-meet-settings-card"
        >
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>Konfigurasi Google Meet REST API</CardTitle>
                <p className="mt-1 text-sm text-emerald-800">
                  Menggunakan Service Account JSON yang sama dengan Google
                  Drive.
                </p>
              </div>
              <Badge
                className={
                  driveSettings?.google_meet_ready
                    ? "border-emerald-300 bg-white text-emerald-700"
                    : "border-amber-300 bg-white text-amber-700"
                }
              >
                {driveSettings?.google_meet_ready
                  ? "Konfigurasi terisi"
                  : "Belum siap"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <label
              className="flex items-center gap-2 border border-emerald-200 bg-white p-3 text-sm"
              data-testid="google-meet-enabled-toggle"
            >
              <input
                type="checkbox"
                checked={!!d.google_meet_enabled}
                onChange={(e) =>
                  updateDrive({ google_meet_enabled: e.target.checked })
                }
              />{" "}
              Aktifkan generate Google Meet
            </label>
            <Field
              id="google-workspace-delegated-user"
              label="Akun Google Workspace untuk tes/default"
            >
              <Input
                id="google-workspace-delegated-user"
                type="email"
                data-testid="google-workspace-delegated-user-input"
                value={d.google_workspace_delegated_user || ""}
                onChange={(e) =>
                  updateDrive({
                    google_workspace_delegated_user: e.target.value,
                  })
                }
                placeholder="admin@kampus.ac.id"
              />
            </Field>
            <div className="space-y-1 text-sm text-emerald-900">
              <p>
                Di Google Cloud: aktifkan Google Meet REST API dan Domain-wide
                Delegation pada service account.
              </p>
              <p>
                Di Google Admin: daftarkan Client ID service account dengan
                scope{" "}
                <code className="rounded bg-white px-1">
                  https://www.googleapis.com/auth/meetings.space.created
                </code>
                .
              </p>
              <p>
                Saat dosen generate link, aplikasi memakai email Google
                Workspace dosen tersebut sebagai penyelenggara.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              data-testid="google-meet-test-button"
              disabled={!driveSettings?.google_meet_ready}
              onClick={() => testDrive("meet")}
            >
              <Video /> Tes & buat ruang Meet uji
            </Button>
            {d.google_meet_enabled && !driveSettings?.google_meet_ready && (
              <p className="text-xs text-amber-700">
                Simpan konfigurasi terlebih dahulu. Tombol tes aktif setelah
                credential, toggle Meet, dan akun Workspace terisi.
              </p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-wrap gap-2">
          <Button data-testid="drive-settings-save-button">
            <Settings /> Simpan Google Drive
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="drive-settings-test-button"
            onClick={testDrive}
          >
            Tes koneksi
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="drive-sync-refresh-button"
            onClick={refreshDriveStatus}
          >
            Refresh antrian
          </Button>
        </div>
      </form>
      <Card className="rounded-md shadow-none" data-testid="drive-sync-card">
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle data-testid="drive-sync-title">
                Monitor sinkron Google Drive
              </CardTitle>
              <p className="mt-1 text-sm text-slate-500">
                Status ini menjelaskan apakah file sudah ada di Drive atau masih
                tersimpan lokal.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              data-testid="drive-sync-retry-failed-button"
              disabled={!summary.failed}
              onClick={retryFailedDriveSync}
            >
              Retry semua gagal
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <StatCard
              icon={Upload}
              label="Menunggu"
              value={summary.pending || 0}
              hint="Antrian background"
              testid="drive-sync-pending"
            />
            <StatCard
              icon={CheckCircle2}
              label="Tersinkron"
              value={summary.synced || 0}
              hint="File sudah di Drive"
              testid="drive-sync-synced"
            />
            <StatCard
              icon={AlertTriangle}
              label="Gagal"
              value={summary.failed || 0}
              hint="Perlu retry/perbaiki Drive"
              testid="drive-sync-failed"
            />
            <StatCard
              icon={FileText}
              label="Lokal"
              value={summary.not_configured || 0}
              hint="Drive belum aktif saat upload"
              testid="drive-sync-local"
            />
          </div>
          {items.length === 0 ? (
            <EmptyState
              title="Belum ada file tugas"
              description="File tugas, materi, dan lampiran soal akan muncul di sini setelah upload."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>File</TableHead>
                  <TableHead>Tugas</TableHead>
                  <TableHead>Mahasiswa</TableHead>
                  <TableHead>Status Drive</TableHead>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow
                    key={item.id}
                    data-testid={`drive-sync-row-${item.id}`}
                  >
                    <TableCell>
                      <div>
                        <p
                          className="font-semibold"
                          data-testid={`drive-sync-file-${item.id}`}
                        >
                          {item.file_name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(item.size)} ·{" "}
                          {fileStatusLabel(item.upload_status)}
                        </p>
                        {item.drive_error && (
                          <p
                            className="mt-1 max-w-md text-xs text-red-700"
                            data-testid={`drive-sync-error-${item.id}`}
                          >
                            {item.drive_error}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {item.assignment_title || item.lecturer_name || "-"}
                        </p>
                        <p className="text-xs text-slate-500">
                          {[item.course_name, item.class_name]
                            .filter(Boolean)
                            .join(" · ")}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {item.student_name
                        ? `${item.student_name} (${item.student_nim || "-"})`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={statusClass(item.drive_sync_status)}
                        data-testid={`drive-sync-status-${item.id}`}
                      >
                        {driveSyncLabel(item.drive_sync_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {fmtDate(item.updated_at || item.uploaded_at)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        {item.drive_file_url && (
                          <a
                            href={item.drive_file_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm font-semibold text-blue-700 underline"
                            data-testid={`drive-sync-open-${item.id}-link`}
                          >
                            Buka Drive
                          </a>
                        )}
                        {["failed", "pending", "not_configured"].includes(
                          item.drive_sync_status,
                        ) && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            data-testid={`drive-sync-retry-${item.id}-button`}
                            onClick={() => retryDriveSync(item.id)}
                          >
                            Retry
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Card className="rounded-md shadow-none" data-testid="drive-help-card">
        <CardContent className="space-y-2 p-5 text-sm text-slate-600">
          <p data-testid="drive-help-folder">
            Struktur: {d.root_folder_name || "E-Learning Dosen"} / Dosen /
            NIP-Nama / Tahun Akademik / Semester / Mata Kuliah / Kelas / Tugas /
            NIM-Nama Mahasiswa.
          </p>
          <p data-testid="drive-help-security">
            Credential disimpan terenkripsi di backend dan tidak ditampilkan
            lagi setelah tersimpan. Mahasiswa tidak mendapat akses langsung ke
            Drive.
          </p>
          <p className="text-amber-700">
            Gunakan Shared Drive dan tambahkan service account sebagai Content
            manager. Jangan masukkan seluruh dosen sebagai anggota Shared Drive;
            gunakan opsi pembagian folder di atas bila akses langsung
            diperlukan.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function GradePredicatePage({
  classes,
  forms,
  setForms,
  token,
  saveGradePredicates,
}) {
  const rows = forms.gradePredicates || [];
  const progress = useActionProgress();
  async function loadByClass(classId) {
    setForms({ ...forms, gradePredicateClassId: classId });
    const operation = progress.begin("Memuat range predikat");
    try {
      const { data } = await axios.get(
        `${API}/grade-predicates?class_id=${classId}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setForms((prev) => ({
        ...prev,
        gradePredicateClassId: classId,
        gradePredicates: data.predicates || [],
      }));
      progress.finish(operation, "Range predikat dimuat");
    } catch (error) {
      const detail = error.response?.data?.detail || "Gagal memuat predikat";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  function updateRow(index, patch) {
    const next = rows.map((item, idx) =>
      idx === index ? { ...item, ...patch } : item,
    );
    setForms({ ...forms, gradePredicates: next });
  }
  function addRow() {
    setForms({
      ...forms,
      gradePredicates: [...rows, { label: "", min_score: 0, max_score: 0 }],
    });
  }
  function removeRow(index) {
    setForms({
      ...forms,
      gradePredicates: rows.filter((_, idx) => idx !== index),
    });
  }
  async function submit(event) {
    event.preventDefault();
    await saveGradePredicates({
      class_id: forms.gradePredicateClassId || "",
      predicates: rows.map((item) => ({
        ...item,
        min_score: Number(item.min_score),
        max_score: Number(item.max_score),
      })),
    });
  }
  return (
    <form
      onSubmit={submit}
      className="space-y-6"
      data-testid="grade-predicate-page"
    >
      <Card
        className="rounded-md shadow-none"
        data-testid="grade-predicate-card"
      >
        <CardHeader>
          <CardTitle data-testid="grade-predicate-title">
            Range predikat nilai otomatis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field id="grade-predicate-class" label="Terapkan untuk kelas">
            <select
              id="grade-predicate-class"
              className="form-select"
              data-testid="grade-predicate-class-select"
              value={forms.gradePredicateClassId || ""}
              onChange={(e) => loadByClass(e.target.value)}
            >
              <option value="">Default semua kelas</option>
              {classes.map((c) => (
                <option
                  key={c.id}
                  value={c.id}
                >{`${c.course_name || "Mapel"} - ${c.name}`}</option>
              ))}
            </select>
          </Field>
          <div className="space-y-3" data-testid="grade-predicate-row-list">
            {rows.map((item, index) => (
              <div
                key={`${item.label}-${index}`}
                className="grid gap-3 rounded-2xl border border-blue-200 bg-blue-50 p-3 md:grid-cols-[1fr_1fr_1fr_auto]"
                data-testid={`grade-predicate-row-${index}`}
              >
                <Field id={`predicate-label-${index}`} label="Predikat">
                  <Input
                    id={`predicate-label-${index}`}
                    data-testid={`predicate-label-${index}-input`}
                    value={item.label}
                    onChange={(e) =>
                      updateRow(index, { label: e.target.value.toUpperCase() })
                    }
                  />
                </Field>
                <Field id={`predicate-min-${index}`} label="Nilai minimum">
                  <Input
                    id={`predicate-min-${index}`}
                    type="number"
                    step="0.01"
                    data-testid={`predicate-min-${index}-input`}
                    value={item.min_score}
                    onChange={(e) =>
                      updateRow(index, { min_score: e.target.value })
                    }
                  />
                </Field>
                <Field id={`predicate-max-${index}`} label="Nilai maksimum">
                  <Input
                    id={`predicate-max-${index}`}
                    type="number"
                    step="0.01"
                    data-testid={`predicate-max-${index}-input`}
                    value={item.max_score}
                    onChange={(e) =>
                      updateRow(index, { max_score: e.target.value })
                    }
                  />
                </Field>
                <Button
                  type="button"
                  variant="outline"
                  data-testid={`predicate-remove-${index}-button`}
                  onClick={() => removeRow(index)}
                >
                  Hapus
                </Button>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              data-testid="predicate-add-row-button"
              onClick={addRow}
            >
              Tambah predikat
            </Button>
            <Button data-testid="predicate-save-button">
              <CheckCircle2 /> Simpan range
            </Button>
          </div>
          <p
            className="text-sm text-slate-500"
            data-testid="grade-predicate-help"
          >
            Range bersifat inklusif. Contoh: nilai 85-100 menjadi A. Sistem
            otomatis menulis predikat saat dosen menyimpan nilai.
          </p>
        </CardContent>
      </Card>
    </form>
  );
}

const GradeWeightsPage = memo(function GradeWeightsPage({
  courses,
  classes,
  isCampusAdmin,
  saveGradeWeights,
  resetGradeWeights,
}) {
  const manageableCourseIds = useMemo(
    () =>
      isCampusAdmin
        ? new Set((courses || []).map((course) => course.id))
        : new Set((classes || []).map((classItem) => classItem.course_id).filter(Boolean)),
    [classes, courses, isCampusAdmin],
  );
  const manageableCourses = useMemo(
    () => (courses || []).filter((course) => manageableCourseIds.has(course.id)),
    [courses, manageableCourseIds],
  );
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [weights, setWeights] = useState(DEFAULT_GRADE_WEIGHTS);

  useEffect(() => {
    if (!manageableCourses.length) {
      setSelectedCourseId("");
      return;
    }
    const selected = manageableCourses.find((course) => course.id === selectedCourseId) || manageableCourses[0];
    if (selected.id !== selectedCourseId) setSelectedCourseId(selected.id);
    setWeights({ ...DEFAULT_GRADE_WEIGHTS, ...(selected.grade_weights || {}) });
  }, [manageableCourses, selectedCourseId]);

  const selectedCourse = manageableCourses.find((course) => course.id === selectedCourseId);
  const total = GRADE_WEIGHT_COMPONENTS.reduce((sum, component) => sum + Number(weights[component.key] || 0), 0);
  const totalIsValid = Math.abs(total - 100) < 0.01;

  function selectCourse(course) {
    setSelectedCourseId(course.id);
    setWeights({ ...DEFAULT_GRADE_WEIGHTS, ...(course.grade_weights || {}) });
  }

  async function submit(event) {
    event.preventDefault();
    if (!selectedCourse || !totalIsValid) return;
    await saveGradeWeights(selectedCourse.id, weights);
  }

  return (
    <div className="space-y-6" data-testid="grade-weights-page">
      <section className="meeting-hero" data-testid="grade-weights-hero">
        <div>
          <p className="meeting-overline">Evaluasi</p>
          <h2 className="font-display text-2xl font-semibold" data-testid="grade-weights-title">
            Porsi bobot nilai per mata kuliah
          </h2>
          <p className="meeting-description">
            Atur kontribusi Tugas, UTS, dan UAS. Jika tidak diubah, sistem memakai default 25% · 35% · 40%.
          </p>
        </div>
        <div className="meeting-summary" data-testid="grade-weights-summary">
          <div><strong>{manageableCourses.length}</strong><span>Mata kuliah</span></div>
          <div><strong>100%</strong><span>Total wajib</span></div>
        </div>
      </section>
      {!manageableCourses.length ? (
        <EmptyState title="Belum ada mata kuliah" description="Buat atau hubungkan kelas ke mata kuliah terlebih dahulu." />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
          <Card className="rounded-md shadow-none" data-testid="grade-weights-course-list-card">
            <CardHeader>
              <CardTitle>Pilih mata kuliah</CardTitle>
              <p className="text-sm text-slate-500">Bobot berlaku untuk semua kelas dari mata kuliah yang dipilih.</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {manageableCourses.map((course) => {
                const courseWeights = course.grade_weights || DEFAULT_GRADE_WEIGHTS;
                const active = course.id === selectedCourseId;
                return (
                  <button
                    type="button"
                    key={course.id}
                    className={`grade-weights-course-row ${active ? "active" : ""}`}
                    data-testid={`grade-weights-course-${course.id}-button`}
                    onClick={() => selectCourse(course)}
                  >
                    <span>
                      <strong>{course.code ? `${course.code} · ` : ""}{course.name}</strong>
                      <small>{course.program_name || "Mata kuliah"}</small>
                    </span>
                    <span className="grade-weights-course-meta">
                      <Badge className={course.grade_weights_customized ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"}>
                        {course.grade_weights_customized ? "Custom" : "Default"}
                      </Badge>
                      <small>{courseWeights.tugas}% · {courseWeights.uts}% · {courseWeights.uas}%</small>
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>
          <form onSubmit={submit}>
            <Card className="rounded-md shadow-none" data-testid="grade-weights-editor-card">
              <CardHeader>
                <CardTitle>{selectedCourse?.name || "Atur bobot"}</CardTitle>
                <p className="text-sm text-slate-500">Total bobot harus tepat 100%.</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {GRADE_WEIGHT_COMPONENTS.map((component) => (
                  <Field key={component.key} id={`grade-weight-${component.key}`} label={`${component.label} (%)`}>
                    <div className="grade-weight-input-wrap">
                      <Input
                        id={`grade-weight-${component.key}`}
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        data-testid={`grade-weight-${component.key}-input`}
                        value={weights[component.key]}
                        onChange={(event) => setWeights((current) => ({ ...current, [component.key]: event.target.value }))}
                      />
                      <span>%</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{component.description}</p>
                  </Field>
                ))}
                <div className={`grade-weight-total ${totalIsValid ? "valid" : "invalid"}`} data-testid="grade-weights-total">
                  <span>Total bobot</span><strong>{Number(total.toFixed(2))}%</strong>
                </div>
                {!totalIsValid && <p className="text-sm text-red-700">Atur angka hingga total tepat 100%.</p>}
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" disabled={!totalIsValid} data-testid="grade-weights-save-button"><CheckCircle2 /> Simpan bobot</Button>
                  <Button type="button" variant="outline" data-testid="grade-weights-reset-button" onClick={() => selectedCourse && resetGradeWeights(selectedCourse.id)}><RotateCcw /> Gunakan default</Button>
                </div>
                <p className="text-xs text-slate-500">Default sistem: 25% Tugas, 35% UTS, 40% UAS.</p>
              </CardContent>
            </Card>
          </form>
        </div>
      )}
    </div>
  );
});

function AdminApp({
  token,
  user,
  onLogout,
  branding,
  onBrandingUpdate,
  onUserUpdate,
  version,
}) {
  const [page, setPage] = useState("dashboard");
  const isCampusAdmin = user.role === "admin";
  const emptyLecturerForm = {
    employee_id: "",
    username: "",
    name: "",
    email: "",
    whatsapp: "",
    password: "Dosen123!",
    status: "active",
  };
  const [data, setData] = useState({
    lecturers: [],
    programs: [],
    courses: [],
    classes: [],
    students: [],
    assignments: [],
    materials: [],
    submissions: [],
    progress: [],
    reminders: [],
    calendar: [],
    enrollments: [],
    dashboard: null,
    report: null,
    settings: null,
    whatsappSettings: null,
    whatsappMessages: [],
    emailSettings: null,
    ssoSettings: null,
    driveSettings: null,
    gradePredicates: [],
    cleanData: [],
    gradeRecap: [],
  });
  const [forms, setForms] = useState({
    lecturer: emptyLecturerForm,
    program: { code: "", name: "", description: "" },
    course: { program_id: "", code: "", name: "", credits: 3, description: "" },
    class: {
      academic_year: "2025/2026",
      semester: "Ganjil",
      course_id: "",
      name: "",
      schedule: "",
    },
    student: {
      nim: "230001099",
      name: "Nama Mahasiswa",
      email: "student99@demo.id",
      whatsapp: "628123",
      class_id: "",
      password: "Mahasiswa123!",
      import_password: "Mahasiswa123!",
    },
    material: {
      class_id: "",
      title: "",
      description: "",
      file_url: "",
      video_url: "",
      meeting_type: "offline",
      meeting_url: "",
      is_active: true,
      locked_until: "",
    },
    assignment: {
      class_id: "",
      title: "",
      description: "",
      attachment_link: "",
      deadline: "",
      published_at: "",
      tolerance_hours: 6,
      allowed_formats: "pdf,docx,zip,png,jpg",
      max_file_size_mb: 5,
      assignment_type: "individu",
      assessment_category: "tugas",
      allow_revision: true,
      is_practicum: false,
      practicum_goal: "",
      practicum_tools: "",
      practicum_steps: "",
      required_screenshot: false,
      late_penalty_per_day: 5,
      close_after_deadline: false,
      material_id: "",
    },
    grade: {
      submission_id: "",
      score: 85,
      feedback: "Pekerjaan sudah baik.",
      revision_note: "",
    },
    settings: {
      app_name: "E-Learning Dosen",
      campus_name: "",
      campus_address: "",
      program_name: "",
      lecturer_name: "",
      lecturer_email: "",
      campus_logo_url: "",
      active_academic_year: "2025/2026",
      active_semester: "Ganjil",
    },
    whatsapp: defaultWhatsAppForm,
    drive: defaultDriveForm,
    email: defaultEmailForm,
    sso: defaultSsoForm,
    gradePredicateClassId: "",
    gradePredicates: [
      { label: "A", min_score: 85, max_score: 100 },
      { label: "B", min_score: 70, max_score: 84.99 },
      { label: "C", min_score: 60, max_score: 69.99 },
      { label: "D", min_score: 50, max_score: 59.99 },
      { label: "E", min_score: 0, max_score: 49.99 },
    ],
  });
  const [importFile, setImportFile] = useState(null);
  const [materialFile, setMaterialFile] = useState(null);
  const [materialFileInputKey, setMaterialFileInputKey] = useState(0);
  const [assignmentFiles, setAssignmentFiles] = useState([]);
  const [assignmentFileInputKey, setAssignmentFileInputKey] = useState(0);
  const seenStorageKey = `elearn_admin_seen_${user.id}`;
  const [seenBadges, setSeenBadges] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(`elearn_admin_seen_${user.id}`) || "{}",
      );
    } catch {
      return {};
    }
  });
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );
  const progress = useActionProgress();

  async function loadAll(event) {
    const operation =
      event?.type === "click"
        ? progress.begin(
            "Memuat ulang data",
            "Mengambil data terbaru dari server...",
          )
        : null;
    try {
      const campusGet = (path, fallback) =>
        isCampusAdmin
          ? axios.get(`${API}${path}`, auth)
          : Promise.resolve({ data: fallback });
      const [
        dashboard,
        programs,
        courses,
        classes,
        students,
        assignments,
        materials,
        submissions,
        studentProgress,
        reminders,
        calendar,
        report,
        enrollments,
        settings,
        whatsappSettings,
        whatsappMessages,
        gradePredicates,
        driveSettings,
        cleanData,
        emailSettings,
        ssoSettings,
        gradeRecap,
        lecturers,
      ] = await Promise.all([
        axios.get(`${API}/dashboard`, auth),
        axios.get(`${API}/programs`, auth),
        axios.get(`${API}/courses`, auth),
        axios.get(`${API}/classes`, auth),
        axios.get(`${API}/students`, auth),
        axios.get(`${API}/assignments`, auth),
        axios.get(`${API}/materials`, auth),
        axios.get(`${API}/submissions`, auth),
        axios.get(`${API}/progress`, auth),
        axios.get(`${API}/reminders`, auth),
        axios.get(`${API}/calendar`, auth),
        axios.get(`${API}/reports/summary`, auth),
        axios.get(`${API}/enrollment-requests`, auth),
        axios.get(`${API}/settings`, auth),
        campusGet("/whatsapp/settings", defaultWhatsAppForm),
        campusGet("/whatsapp/messages", []),
        axios.get(`${API}/grade-predicates`, auth),
        campusGet("/drive/settings", defaultDriveForm),
        campusGet("/clean-data/summary", []),
        campusGet("/email/settings", defaultEmailForm),
        campusGet("/sso/settings", defaultSsoForm),
        axios.get(`${API}/reports/grade-recap`, auth),
        campusGet("/lecturers", []),
      ]);
      const programsData = programs.data;
      const coursesData = courses.data;
      const classesData = classes.data;
      setData({
        dashboard: dashboard.data,
        lecturers: lecturers.data || [],
        programs: programsData,
        courses: coursesData,
        classes: classesData,
        students: students.data,
        assignments: assignments.data,
        materials: materials.data,
        submissions: submissions.data,
        progress: studentProgress.data,
        reminders: reminders.data,
        calendar: calendar.data,
        report: report.data,
        enrollments: enrollments.data,
        settings: settings.data,
        whatsappSettings: whatsappSettings.data,
        whatsappMessages: whatsappMessages.data,
        emailSettings: emailSettings.data,
        ssoSettings: ssoSettings.data,
        driveSettings: driveSettings.data,
        gradePredicates: gradePredicates.data.predicates || [],
        cleanData: cleanData.data || [],
        gradeRecap: gradeRecap.data || [],
      });
      setForms((prev) => ({
        ...prev,
        course: {
          ...prev.course,
          program_id: prev.course.program_id || programsData[0]?.id || "",
        },
        class: {
          ...prev.class,
          course_id: prev.class.course_id || coursesData[0]?.id || "",
        },
        student: {
          ...prev.student,
          class_id: prev.student.class_id || classesData[0]?.id || "",
        },
        material: {
          ...prev.material,
          class_id: prev.material.class_id || classesData[0]?.id || "",
        },
        assignment: {
          ...prev.assignment,
          class_id: prev.assignment.class_id || classesData[0]?.id || "",
        },
        grade: {
          ...prev.grade,
          submission_id:
            prev.grade.submission_id || submissions.data[0]?.id || "",
        },
        settings: settings.data || prev.settings,
        whatsapp: {
          ...prev.whatsapp,
          ...whatsappSettings.data,
          fonnte_token: "",
          waha_api_key: "",
        },
        drive: {
          ...defaultDriveForm,
          ...driveSettings.data,
          service_account_json: "",
          clear_service_account: false,
        },
        email: {
          ...defaultEmailForm,
          ...emailSettings.data,
          smtp_password: "",
        },
        sso: {
          ...defaultSsoForm,
          ...ssoSettings.data,
          client_secret: "",
          clear_client_secret: false,
        },
        gradePredicates:
          gradePredicates.data.predicates || prev.gradePredicates,
      }));
      if (operation) progress.finish(operation, "Data terbaru dimuat");
    } catch (error) {
      if (operation)
        progress.fail(
          operation,
          error.response?.data?.detail || "Gagal memuat data",
        );
      toast.error(error.response?.data?.detail || "Gagal memuat data");
    }
  }
  useEffect(() => {
    loadAll();
    // The authenticated admin shell owns one initial aggregate fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function postJson(path, payload, success) {
    const operation = progress.begin(
      success,
      "Mengirim perubahan ke server...",
    );
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
    const targetClass = data.classes.find((item) => item.id === forms.material.class_id);
    if (targetClass && targetClass.status !== "active") return toast.error("Materi hanya dapat diubah pada kelas Aktif");
    const { id, ...payload } = forms.material;
    if (!window.confirm(id ? "Simpan perubahan materi ini?" : "Publikasikan materi ini ke kelas aktif?")) return;
    let saved = null;
    const operation = progress.begin(
      id ? "Menyimpan perubahan pertemuan" : "Membuat pertemuan",
      materialFile
        ? "Menyiapkan data dan file materi..."
        : "Mengirim data materi...",
    );
    try {
      const response = await axios[id ? "put" : "post"](
        `${API}/materials${id ? `/${id}` : ""}`,
        payload,
        auth,
      );
      saved = response.data;
      if (materialFile) {
        const fd = new FormData();
        fd.append("attachment", materialFile);
        await axios.post(`${API}/materials/${saved.id}/attachment`, fd, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (upload) =>
            progress.update(
              operation,
              uploadProgressPercent(upload, 22, 91),
              "Mengunggah file materi",
              materialFile.name,
            ),
        });
      }
      progress.update(
        operation,
        94,
        "Menyimpan materi",
        "Memperbarui daftar pertemuan...",
      );
      toast.success(id ? "Pertemuan diperbarui" : "Pertemuan dibuat");
      setMaterialFile(null);
      setMaterialFileInputKey((key) => key + 1);
      setForms((prev) => ({
        ...prev,
        material: {
          class_id: prev.material.class_id,
          title: "",
          description: "",
          file_url: "",
          video_url: "",
          meeting_type: "offline",
          meeting_url: "",
          is_active: true,
          locked_until: "",
        },
      }));
      await loadAll();
      progress.finish(
        operation,
        id ? "Pertemuan diperbarui" : "Pertemuan dibuat",
      );
    } catch (error) {
      const detail = formatApiError(
        error,
        saved
          ? "Pertemuan tersimpan, tetapi upload file gagal"
          : "Pertemuan gagal disimpan",
      );
      progress.fail(operation, detail);
      toast.error(detail);
      if (saved) await loadAll();
    }
  }
  async function deleteMaterial(material) {
    if (
      !window.confirm(
        `Hapus ${material.meeting}: ${material.title}? Materi dan diskusinya akan dihapus, sedangkan tugas terkait tetap tersedia tanpa pertemuan.`,
      )
    )
      return;
    const operation = progress.begin("Menghapus pertemuan", material.title);
    try {
      const { data: result } = await axios.delete(
        `${API}/materials/${material.id}`,
        auth,
      );
      const taskInfo = result.assignments_unlinked
        ? ` ${result.assignments_unlinked} tugas dilepas dari pertemuan.`
        : "";
      toast.success(`Pertemuan dihapus.${taskInfo}`);
      if (forms.material.id === material.id) {
        setMaterialFile(null);
        setMaterialFileInputKey((key) => key + 1);
      }
      setForms((prev) =>
        prev.material.id === material.id
          ? {
              ...prev,
              material: {
                class_id: prev.material.class_id,
                title: "",
                description: "",
                file_url: "",
                video_url: "",
                meeting_type: "offline",
                meeting_url: "",
                is_active: true,
                locked_until: "",
              },
            }
          : prev,
      );
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
    const targetClass = data.classes.find((item) => item.id === forms.assignment.class_id);
    if (targetClass && targetClass.status !== "active") return toast.error("Tugas hanya dapat diubah pada kelas Aktif");
    const { id, ...assignmentForm } = forms.assignment;
    const allowedFormats = Array.isArray(assignmentForm.allowed_formats)
      ? assignmentForm.allowed_formats
      : String(assignmentForm.allowed_formats || "").split(",");
    const practicumSteps = Array.isArray(assignmentForm.practicum_steps)
      ? assignmentForm.practicum_steps
      : String(assignmentForm.practicum_steps || "").split("\n");
    const payload = {
      ...assignmentForm,
      allowed_formats: allowedFormats
        .map((x) => String(x).trim())
        .filter(Boolean),
      max_file_size_mb: Number(
        assignmentForm.max_file_size_mb || DEFAULT_SUBMISSION_MAX_FILE_MB,
      ),
      deadline: assignmentForm.deadline
        ? new Date(assignmentForm.deadline).toISOString()
        : "",
      published_at: assignmentForm.published_at
        ? new Date(assignmentForm.published_at).toISOString()
        : "",
      rubric:
        Array.isArray(assignmentForm.rubric) && assignmentForm.rubric.length
          ? assignmentForm.rubric
          : defaultAssignmentRubric(),
      practicum_steps: practicumSteps
        .map((item) => String(item).trim())
        .filter(Boolean),
    };
    const editing = Boolean(id);
    if (!window.confirm(
      editing
        ? `Simpan perubahan tugas ${assignmentForm.title || "ini"}?`
        : `Buat tugas ${assignmentForm.title || "ini"} dengan deadline ${fmtDate(payload.deadline)}?`,
    )) return;
    const operation = progress.begin(
      editing ? "Menyimpan perubahan tugas" : "Membuat tugas",
      assignmentFiles.length
        ? `Menyiapkan ${assignmentFiles.length} lampiran soal...`
        : "Menyimpan detail tugas...",
    );
    let saved = null;
    try {
      const response = await axios[editing ? "put" : "post"](
        `${API}/assignments${editing ? `/${id}` : ""}`,
        payload,
        auth,
      );
      saved = response.data;
      progress.update(
        operation,
        24,
        editing ? "Tugas diperbarui" : "Tugas dibuat",
        assignmentFiles.length
          ? "Mengunggah lampiran soal..."
          : "Memperbarui daftar tugas...",
      );
      if (assignmentFiles.length) {
        const fd = new FormData();
        assignmentFiles.forEach((item) => fd.append("files", item));
        await axios.post(`${API}/assignments/${saved.id}/attachments`, fd, {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (upload) =>
            progress.update(
              operation,
              uploadProgressPercent(upload, 25, 93),
              "Mengunggah lampiran tugas",
              `${assignmentFiles.length} file dikirim ke server.`,
            ),
        });
      }
      await loadAll();
      progress.finish(
        operation,
        editing ? "Tugas berhasil diperbarui" : "Tugas berhasil dibuat",
        assignmentFiles.length
          ? "Lampiran tersimpan di server; sinkron Drive diproses di latar."
          : "Tugas tersimpan.",
      );
      toast.success(
        editing ? "Tugas berhasil diperbarui" : "Tugas berhasil dibuat",
      );
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
          assessment_category: "tugas",
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
      const detail = formatApiError(
        error,
        saved
          ? "Tugas tersimpan, tetapi lampiran gagal diunggah"
          : "Tugas gagal disimpan",
      );
      progress.fail(operation, detail);
      toast.error(detail);
      if (saved) await loadAll();
    }
  }
  async function importStudents(event) {
    event.preventDefault();
    if (!importFile || !forms.student.class_id)
      return toast.error("Pilih file Excel dan kelas");
    if (!window.confirm("Import akan membuat atau menambahkan banyak akun mahasiswa ke kelas aktif. Lanjutkan?")) return;
    const operation = progress.begin("Mengimpor mahasiswa", importFile.name);
    const fd = new FormData();
    fd.append("file", importFile);
    fd.append("default_password", forms.student.import_password || "");
    try {
      const { data: result } = await axios.post(
        `${API}/classes/${forms.student.class_id}/students/import`,
        fd,
        {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: (upload) =>
            progress.update(
              operation,
              uploadProgressPercent(upload),
              "Mengunggah file mahasiswa",
            ),
        },
      );
      await loadAll();
      progress.finish(operation, "Import mahasiswa selesai");
      toast.success(
        `Import selesai: ${result.created} dibuat, ${result.skipped} dilewati`,
      );
    } catch (error) {
      const detail = formatApiError(error, "Import gagal");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function gradeSubmission(event) {
    event.preventDefault();
    const selected = data.submissions.find(
      (item) => item.id === forms.grade.submission_id,
    );
    const assignment = data.assignments.find(
      (item) => item.id === selected?.assignment_id,
    );
    const score = clampScoreInput(forms.grade.score);
    if (score === "") return toast.error("Nilai wajib diisi");
    if (!window.confirm("Simpan nilai dan feedback untuk submission ini?")) return;
    const rubric = assignment?.rubric?.length
      ? assignment.rubric
      : [{ criterion: "Nilai total", weight: 100 }];
    const payload = {
      rubric_scores: rubric.map((item) => ({ ...item, score: Number(score) })),
      feedback: forms.grade.feedback,
      revision_note: forms.grade.revision_note,
      status: "Dinilai",
    };
    await postJson(
      `/submissions/${forms.grade.submission_id}/grade`,
      payload,
      "Nilai berhasil disimpan",
    );
  }
  async function bulkGradeSubmissions(grades) {
    const targets = grades?.length
      ? grades
      : data.submissions
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
    if (!cleanTargets.length)
      return toast.info("Tidak ada submission yang siap dinilai");
    if (!window.confirm(`Simpan nilai untuk ${cleanTargets.length} submission?`)) return;
    await postJson(
      "/submissions/bulk-grade",
      { grades: cleanTargets },
      "Nilai banyak mahasiswa berhasil disimpan",
    );
  }
  async function exportGradeRecap(format = "xlsx", classId = "") {
    const operation = progress.begin("Menyiapkan export nilai");
    try {
      const suffix = format === "pdf" ? "pdf" : "xlsx";
      const response = await axios.get(`${API}/reports/grades.${suffix}`, {
        ...auth,
        params: classId ? { class_id: classId } : undefined,
        responseType: "blob",
        onDownloadProgress: (download) =>
          progress.update(
            operation,
            uploadProgressPercent(download),
            "Mengunduh rekap nilai",
          ),
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `rekap-nilai${classId ? `-${classId}` : ""}.${suffix}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      progress.finish(operation, `Rekap nilai ${suffix.toUpperCase()} diunduh`);
      toast.success(`Rekap nilai ${suffix.toUpperCase()} diunduh`);
    } catch (error) {
      progress.fail(operation, "Export gagal");
      toast.error("Export gagal");
    }
  }
  async function exportGrades() {
    return exportGradeRecap("xlsx");
  }
  async function sendReminder(assignmentId, studentId = "") {
    await postJson(
      "/reminders/send",
      {
        assignment_id: assignmentId,
        student_id: studentId,
        reminder_type: "manual",
        message: "Reminder deadline tugas",
      },
      "Reminder in-app tersimpan",
    );
  }
  async function saveSettings(event) {
    event.preventDefault();
    const previous = data.settings || {};
    const periodChanged =
      previous.active_academic_year !== forms.settings.active_academic_year ||
      previous.active_semester !== forms.settings.active_semester;
    if (periodChanged && !window.confirm("Ubah tahun ajaran/semester aktif? Kelas lama tidak berubah; buat kelas baru untuk periode berikutnya.")) return;
    const operation = progress.begin("Menyimpan settings");
    try {
      const { data: saved } = await axios.put(
        `${API}/settings`,
        forms.settings,
        auth,
      );
      onBrandingUpdate(saved);
      await loadAll();
      progress.finish(operation, "Settings aplikasi disimpan");
      toast.success("Settings aplikasi disimpan");
    } catch (error) {
      const detail = error.response?.data?.detail || "Settings gagal disimpan";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveWhatsApp(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan WhatsApp gateway");
    try {
      await axios.put(`${API}/whatsapp/settings`, forms.whatsapp, auth);
      await loadAll();
      progress.finish(operation, "Konfigurasi WhatsApp disimpan");
      toast.success("Konfigurasi WhatsApp disimpan");
    } catch (error) {
      const detail =
        error.response?.data?.detail || "Konfigurasi WhatsApp gagal";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveEmail(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan konfigurasi email");
    try {
      await axios.put(`${API}/email/settings`, forms.email, auth);
      await loadAll();
      progress.finish(operation, "Konfigurasi email disimpan");
      toast.success("Konfigurasi email disimpan");
    } catch (error) {
      const detail = error.response?.data?.detail || "Konfigurasi email gagal";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function testEmail() {
    const operation = progress.begin("Mengirim email tes");
    try {
      const { data: result } = await axios.post(
        `${API}/email/settings/test`,
        {},
        auth,
      );
      progress.finish(
        operation,
        result.message || "Email tes berhasil dikirim",
      );
      toast.success(result.message || "Email tes berhasil dikirim");
    } catch (error) {
      const detail = error.response?.data?.detail || "Email tes gagal dikirim";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveSso(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan konfigurasi SCI-ID");
    try {
      await axios.put(`${API}/sso/settings`, forms.sso, auth);
      setForms((prev) => ({
        ...prev,
        sso: { ...prev.sso, client_secret: "", clear_client_secret: false },
      }));
      await loadAll();
      progress.finish(operation, "Konfigurasi SCI-ID disimpan");
      toast.success("Konfigurasi SCI-ID disimpan");
    } catch (error) {
      const detail =
        error.response?.data?.detail || "Konfigurasi SCI-ID gagal disimpan";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function testSso() {
    const operation = progress.begin("Menguji koneksi SCI-ID");
    try {
      const { data: result } = await axios.post(
        `${API}/sso/settings/test`,
        {},
        auth,
      );
      progress.finish(operation, result.message || "Koneksi SCI-ID berhasil");
      toast.success(
        `${result.message || "Koneksi SCI-ID berhasil"}: ${result.issuer || "issuer terdeteksi"}`,
      );
    } catch (error) {
      const detail = error.response?.data?.detail || "Tes koneksi SCI-ID gagal";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveDrive(event) {
    event.preventDefault();
    const operation = progress.begin("Menyimpan Google Drive");
    try {
      await axios.put(`${API}/drive/settings`, forms.drive, auth);
      setForms((prev) => ({
        ...prev,
        drive: {
          ...prev.drive,
          service_account_json: "",
          clear_service_account: false,
        },
      }));
      await loadAll();
      progress.finish(operation, "Konfigurasi Google Drive disimpan");
      toast.success("Konfigurasi Google Drive disimpan");
    } catch (error) {
      const detail = error.response?.data?.detail || "Konfigurasi Drive gagal";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function testDrive(mode = "drive") {
    const meetMode = mode === "meet";
    const operation = progress.begin(
      meetMode
        ? "Menguji Google Meet REST API"
        : "Menguji koneksi Google Drive",
      meetMode
        ? "Membuat satu ruang Meet uji..."
        : "Mengunggah file tes ke Drive...",
    );
    try {
      const { data: result } = await axios.post(
        `${API}/drive/settings/${meetMode ? "test-meet" : "test"}`,
        {},
        auth,
      );
      await loadAll();
      progress.finish(
        operation,
        meetMode
          ? "Koneksi Google Meet berhasil"
          : "Koneksi Google Drive berhasil",
      );
      toast.success(
        meetMode
          ? result.message || "Koneksi Google Meet berhasil"
          : result.folder_name
            ? `Koneksi Drive OK: ${result.folder_name}`
            : "Koneksi Drive OK",
      );
    } catch (error) {
      const detail =
        error.response?.data?.detail ||
        (meetMode
          ? "Tes koneksi Google Meet gagal"
          : "Tes koneksi Drive gagal");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function refreshDriveStatus() {
    const operation = progress.begin("Memuat status sinkron Drive");
    try {
      await loadAll();
      progress.finish(operation, "Status sinkron diperbarui");
      toast.info("Status sinkron Drive diperbarui");
    } catch (error) {
      progress.fail(operation, "Status sinkron gagal dimuat");
    }
  }
  async function retryDriveSync(fileId) {
    const operation = progress.begin("Mengantre ulang sinkron file");
    try {
      await axios.post(`${API}/drive/sync/${fileId}/retry`, {}, auth);
      await loadAll();
      progress.finish(operation, "File masuk antrean sinkron ulang");
      toast.success("File masuk antrean sinkron ulang");
    } catch (error) {
      const detail = formatApiError(error, "Retry sinkron Drive gagal");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function retryFailedDriveSync() {
    const operation = progress.begin("Mengantre ulang file gagal");
    try {
      const { data: result } = await axios.post(
        `${API}/drive/sync/retry-failed`,
        {},
        auth,
      );
      await loadAll();
      progress.finish(
        operation,
        `${result.queued || 0} file masuk antrean ulang`,
      );
      toast.success(`${result.queued || 0} file gagal masuk antrean ulang`);
    } catch (error) {
      const detail = formatApiError(
        error,
        "Retry semua file gagal tidak berhasil",
      );
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function retryWhatsAppMessage(id) {
    await postJson(
      `/whatsapp/messages/${id}/retry`,
      {},
      "Pesan masuk antrean ulang",
    );
  }
  async function saveGradePredicates(payload) {
    if (!window.confirm("Simpan range predikat nilai ini? Perubahan akan dipakai pada penilaian kelas aktif.")) return false;
    const operation = progress.begin("Menyimpan range predikat");
    try {
      const { data: saved } = await axios.put(
        `${API}/grade-predicates`,
        payload,
        auth,
      );
      setForms((prev) => ({
        ...prev,
        gradePredicates: saved.predicates,
        gradePredicateClassId: saved.class_id,
      }));
      await loadAll();
      progress.finish(operation, "Range predikat disimpan");
      toast.success("Range predikat disimpan");
      return true;
    } catch (error) {
      const detail =
        error.response?.data?.detail || "Range predikat gagal disimpan";
      progress.fail(operation, detail);
      toast.error(detail);
      return false;
    }
  }
  async function cleanDataModule(moduleKey, label) {
    const ok = window.confirm(
      `Hapus data percobaan modul ${label}? Aksi ini tidak bisa dibatalkan.`,
    );
    if (!ok) return;
    const operation = progress.begin(`Membersihkan ${label}`);
    try {
      await axios.post(
        `${API}/clean-data/${moduleKey}`,
        { confirmation: "HAPUS" },
        auth,
      );
      await loadAll();
      progress.finish(operation, `Data ${label} dibersihkan`);
      toast.success(`Data ${label} dibersihkan`);
    } catch (error) {
      const detail = error.response?.data?.detail || "Clean data gagal";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function markReviewed(id) {
    await postJson(
      `/submissions/${id}/review`,
      {},
      "Submission ditandai sudah dilihat",
    );
  }
  async function requestRevision(id, noteOverride) {
    const note =
      typeof noteOverride === "string"
        ? noteOverride.trim()
        : window.prompt("Catatan revisi", "Silakan revisi jawaban");
    if (note === null) return;
    if (!note) return toast.error("Catatan revisi wajib diisi");
    if (!window.confirm("Kirim permintaan revisi kepada mahasiswa?")) return;
    await postJson(
      `/submissions/${id}/request-revision`,
      { revision_note: note },
      "Permintaan revisi dikirim",
    );
  }
  async function saveProgram(event) {
    event.preventDefault();
    const { id, ...payload } = forms.program;
    const operation = progress.begin(
      id ? "Memperbarui prodi" : "Membuat prodi",
    );
    try {
      await axios[id ? "put" : "post"](
        `${API}/programs${id ? `/${id}` : ""}`,
        payload,
        auth,
      );
      setForms((prev) => ({
        ...prev,
        program: { code: "", name: "", description: "" },
      }));
      await loadAll();
      progress.finish(operation, id ? "Prodi diperbarui" : "Prodi dibuat");
      toast.success(id ? "Prodi diperbarui" : "Prodi dibuat");
    } catch (error) {
      const detail = error.response?.data?.detail || "Prodi gagal disimpan";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveCourse(event) {
    event.preventDefault();
    const { id, ...payload } = forms.course;
    const operation = progress.begin(
      id ? "Memperbarui mata kuliah" : "Membuat mata kuliah",
    );
    try {
      await axios[id ? "put" : "post"](
        `${API}/courses${id ? `/${id}` : ""}`,
        { ...payload, credits: Number(payload.credits || 0) },
        auth,
      );
      setForms((prev) => ({
        ...prev,
        course: {
          program_id: prev.course.program_id,
          code: "",
          name: "",
          credits: 3,
          description: "",
        },
      }));
      await loadAll();
      progress.finish(
        operation,
        id ? "Mata kuliah diperbarui" : "Mata kuliah dibuat",
      );
      toast.success(id ? "Mata kuliah diperbarui" : "Mata kuliah dibuat");
    } catch (error) {
      const detail =
        error.response?.data?.detail || "Mata kuliah gagal disimpan";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function saveGradeWeights(courseId, weights) {
    if (!window.confirm("Simpan bobot ini? Bobot akan dipakai untuk kelas aktif; kelas yang sudah diakhiri memakai snapshot bobotnya.")) return false;
    const operation = progress.begin("Menyimpan bobot nilai", "Memvalidasi total bobot...");
    try {
      const payload = {
        tugas: Number(weights.tugas || 0),
        uts: Number(weights.uts || 0),
        uas: Number(weights.uas || 0),
      };
      await axios.put(`${API}/courses/${courseId}/grade-weights`, payload, auth);
      await loadAll();
      progress.finish(operation, "Bobot nilai tersimpan");
      toast.success("Bobot nilai tersimpan");
      return true;
    } catch (error) {
      const detail = formatApiError(error, "Bobot nilai gagal disimpan");
      progress.fail(operation, detail);
      toast.error(detail);
      return false;
    }
  }
  async function resetGradeWeights(courseId) {
    if (!window.confirm("Kembalikan bobot mata kuliah ke default 25% Tugas, 35% UTS, 40% UAS?")) return false;
    const operation = progress.begin("Mengembalikan bobot default");
    try {
      await axios.delete(`${API}/courses/${courseId}/grade-weights`, auth);
      await loadAll();
      progress.finish(operation, "Bobot default 25/35/40 diterapkan");
      toast.success("Bobot default 25% Tugas, 35% UTS, 40% UAS diterapkan");
      return true;
    } catch (error) {
      const detail = formatApiError(error, "Bobot default gagal diterapkan");
      progress.fail(operation, detail);
      toast.error(detail);
      return false;
    }
  }
  async function saveClass(event) {
    event.preventDefault();
    const { id, ...payload } = forms.class;
    if (!window.confirm(
      id
        ? `Simpan perubahan konfigurasi kelas ${forms.class.name || "ini"}?`
        : `Buat kelas ${forms.class.name || "baru"} untuk ${forms.class.semester || "semester terpilih"} ${forms.class.academic_year || ""}?`,
    )) return;
    const operation = progress.begin(
      id ? "Memperbarui kelas" : "Membuat kelas",
    );
    try {
      await axios[id ? "put" : "post"](
        `${API}/classes${id ? `/${id}` : ""}`,
        payload,
        auth,
      );
      setForms((prev) => ({
        ...prev,
        class: {
          academic_year: prev.class.academic_year,
          semester: prev.class.semester,
          course_id: prev.class.course_id,
          name: "",
          schedule: "",
        },
      }));
      await loadAll();
      progress.finish(operation, id ? "Kelas diperbarui" : "Kelas dibuat");
      toast.success(id ? "Kelas diperbarui" : "Kelas dibuat");
    } catch (error) {
      const detail = error.response?.data?.detail || "Kelas gagal disimpan";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function deleteCatalog(type, id, label) {
    if (!window.confirm(`Hapus ${label}?`)) return;
    const operation = progress.begin(`Menghapus ${label}`);
    try {
      await axios.delete(`${API}/${type}/${id}`, auth);
      await loadAll();
      progress.finish(operation, `${label} dihapus`);
      toast.success(`${label} dihapus`);
    } catch (error) {
      const detail = error.response?.data?.detail || `${label} gagal dihapus`;
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function endClass(id) {
    if (!window.confirm("Akhiri kelas ini? Mahasiswa baru, materi baru, tugas baru, dan submission baru akan ditutup. Penilaian masih dapat dilanjutkan.")) return;
    await postJson(
      `/classes/${id}/end`,
      {},
      "Kelas diakhiri dan masuk riwayat",
    );
  }
  async function finalizeClass(classItem) {
    const confirmation = window.prompt(
      `Finalisasi nilai kelas ${classItem.name}? Ketik FINALISASI untuk mengunci rekap.`,
      "",
    );
    if (confirmation === null) return;
    await postJson(
      `/classes/${classItem.id}/finalize`,
      { confirmation },
      "Nilai kelas difinalisasi dan dikunci",
    );
  }
  async function archiveClass(classItem) {
    if (!window.confirm(`Arsipkan kelas ${classItem.name}? Data akan menjadi read-only.`)) return;
    await postJson(`/classes/${classItem.id}/archive`, {}, "Kelas diarsipkan");
  }
  async function duplicateClass(classItem) {
    const academicYear = window.prompt(
      "Tahun akademik kelas baru",
      forms.settings.active_academic_year || "",
    );
    if (academicYear === null) return;
    const semester = window.prompt(
      "Semester kelas baru",
      forms.settings.active_semester || "",
    );
    if (semester === null) return;
    const name = window.prompt("Nama kelas baru", classItem.name || "");
    if (name === null) return;
    if (!academicYear.trim() || !semester.trim() || !name.trim())
      return toast.error("Tahun akademik, semester, dan nama kelas wajib diisi");
    const confirmation = window.prompt(
      "Kelas baru akan kosong tanpa mahasiswa, materi, tugas, dan submission. Ketik DUPLIKASI untuk melanjutkan.",
      "",
    );
    if (confirmation === null) return;
    await postJson(
      `/classes/${classItem.id}/duplicate`,
      {
        academic_year: academicYear.trim(),
        semester: semester.trim(),
        name: name.trim(),
        schedule: classItem.schedule || "",
        confirmation,
      },
      "Kelas periode baru dibuat dengan kode baru",
    );
  }
  async function saveLecturer(event) {
    event.preventDefault();
    const { id, ...payload } = forms.lecturer;
    const operation = progress.begin(
      id ? "Memperbarui akun dosen" : "Membuat akun dosen",
    );
    try {
      if (id) {
        const { password, ...updatePayload } = payload;
        await axios.put(`${API}/lecturers/${id}`, updatePayload, auth);
      } else {
        await axios.post(`${API}/lecturers`, payload, auth);
      }
      setForms((prev) => ({ ...prev, lecturer: emptyLecturerForm }));
      await loadAll();
      progress.finish(
        operation,
        id ? "Akun dosen diperbarui" : "Akun dosen dibuat",
      );
      toast.success(id ? "Akun dosen diperbarui" : "Akun dosen dibuat");
    } catch (error) {
      const detail = formatApiError(error, "Akun dosen gagal disimpan");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  async function resetLecturerPassword(lecturer) {
    const password = window.prompt(
      `Password sementara untuk ${lecturer.name}`,
      "Dosen123!",
    );
    if (!password) return;
    await postJson(
      `/lecturers/${lecturer.id}/reset-password`,
      { password },
      `Password ${lecturer.name} direset`,
    );
  }
  async function deleteLecturer(lecturer) {
    if (!window.confirm(`Nonaktifkan dan hapus akun ${lecturer.name}?`)) return;
    const operation = progress.begin("Menghapus akun dosen");
    try {
      await axios.delete(`${API}/lecturers/${lecturer.id}`, auth);
      await loadAll();
      progress.finish(operation, "Akun dosen dihapus");
      toast.success("Akun dosen dihapus");
    } catch (error) {
      const detail = formatApiError(error, "Akun dosen gagal dihapus");
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  const submissionReviewItems = (data.submissions || []).filter(
    needsSubmissionReview,
  );
  const enrollmentItems = (data.enrollments || []).filter(
    (item) => item.status === "pending",
  );
  const whatsappItems = (data.whatsappMessages || []).filter((item) =>
    ["failed", "pending_config"].includes(item.status),
  );
  const materialCommentItems = data.dashboard?.latest_comments || [];
  const unseenSubmissions = unseenCount(
    submissionReviewItems,
    seenBadges.submissionReviews,
  );
  const unseenEnrollments = unseenCount(enrollmentItems, seenBadges.students);
  const unseenWhatsapp = unseenCount(whatsappItems, seenBadges.whatsapp);
  const unseenMaterials = unseenCount(
    materialCommentItems,
    seenBadges.materials,
  );
  const adminBadges = {
    dashboard:
      unseenSubmissions + unseenEnrollments + unseenWhatsapp + unseenMaterials,
    assignments: unseenSubmissions,
    grading: unseenSubmissions,
    students: unseenEnrollments,
    materials: unseenMaterials,
    whatsapp: unseenWhatsapp,
  };
  function saveSeenBadges(next) {
    setSeenBadges(next);
    localStorage.setItem(seenStorageKey, JSON.stringify(next));
  }
  function rememberCategorySeen(items) {
    return (items || []).map(attentionKey);
  }
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
  function openAdminPage(targetPage) {
    markAdminPageSeen(targetPage);
    setPage(targetPage);
  }
  const navGroups = [
    {
      label: "Utama",
      items: [["dashboard", LayoutDashboard, "Dashboard"]],
    },
    {
      label: "Akademik",
      items: [
        ...(isCampusAdmin ? [["lecturers", Users, "Dosen"]] : []),
        ["classes", BookOpen, "Prodi, MK & Kelas"],
        ["students", Users, "Mahasiswa"],
      ],
    },
    {
      label: "Pembelajaran",
      items: [
        ["materials", MessageSquare, "Materi & Diskusi"],
        ["assignments", ClipboardList, "Tugas"],
        ["calendar", CalendarDays, "Kalender"],
      ],
    },
    {
      label: "Evaluasi",
      items: [
        ["grading", CheckCircle2, "Penilaian"],
        ["weights", BarChart3, "Bobot Nilai"],
        ["rekap", BarChart3, "Rekap Nilai"],
        ["predicates", CheckCircle2, "Predikat"],
        ["reports", FileSpreadsheet, "Laporan"],
      ],
    },
    {
      label: "Akun",
      items: [["profile", Users, "Profil"]],
    },
    {
      label: "Bantuan",
      items: [["guide", BookOpen, "Panduan LMS"]],
    },
    ...(isCampusAdmin
      ? [
          {
            label: "Sistem & Integrasi",
            items: [
              ["settings", Settings, "Pengaturan Kampus"],
              ["sso", ShieldCheck, "Login SSO"],
              ["drive", Upload, "Google Drive"],
              ["whatsapp", Bell, "WhatsApp"],
              ["email", Mail, "Email"],
            ],
          },
          {
            label: "Pemeliharaan",
            items: [
              ["backups", Database, "Backup Database"],
              ["clean", Trash2, "Bersihkan Data"],
            ],
          },
        ]
      : []),
  ];
  const nav = navGroups.flatMap((group) => group.items);
  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      data-testid="admin-app-shell"
    >
      <aside
        className="admin-sidebar-shell fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-slate-950 text-white lg:flex"
        data-testid="admin-sidebar"
      >
        <div className="admin-sidebar-brand flex items-center gap-3">
          <div className="admin-sidebar-logo">
            <img
              src={brandingLogo(data.settings || branding)}
              alt="Logo"
              className="h-9 w-9 object-contain"
              data-testid="admin-sidebar-logo-image"
            />
          </div>
          <div className="min-w-0">
            <p
              className="truncate font-display text-lg font-bold"
              data-testid="admin-sidebar-title"
            >
              {brandingName(data.settings || branding)}
            </p>
            <p
              className="mt-0.5 text-xs font-medium text-sky-100/70"
              data-testid="admin-sidebar-subtitle"
            >
              {isCampusAdmin ? "Admin Kampus" : "Ruang Dosen"}
            </p>
          </div>
        </div>
        <nav className="admin-sidebar-nav" data-testid="admin-navigation">
          {navGroups.map((group) => (
            <section className="admin-nav-group" key={group.label}>
              <p className="admin-nav-group-label">{group.label}</p>
              <div className="space-y-1">
                {group.items.map(([key, Icon, label]) => {
                  const count = adminBadges[key] || 0;
                  const isActive = page === key;
                  return (
                    <Button
                      key={key}
                      variant="ghost"
                      className="admin-nav-item w-full justify-start"
                      data-active={isActive}
                      aria-current={isActive ? "page" : undefined}
                      data-testid={`admin-nav-${key}-button`}
                      onClick={() => openAdminPage(key)}
                    >
                      <Icon className="admin-nav-icon" />
                      <span className="flex-1 truncate text-left">{label}</span>
                      <NotificationBadge
                        count={count}
                        testid={`admin-nav-${key}-badge`}
                      />
                    </Button>
                  );
                })}
              </div>
            </section>
          ))}
        </nav>
        <VersionMeta version={version} className="mt-auto px-5 pb-5" />
      </aside>
      <main className="lg:pl-72" data-testid="admin-main-content">
        <header
          className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 px-5 py-4 backdrop-blur md:px-8"
          data-testid="admin-topbar"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                data-testid="admin-role-label"
              >
                {isCampusAdmin ? "Admin Kampus" : "Dosen"}
              </p>
              <h1
                className="font-display text-3xl font-bold text-slate-950"
                data-testid="admin-page-title"
              >
                {nav.find((item) => item[0] === page)?.[2]}
              </h1>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className="border-slate-200 bg-white text-slate-700"
                data-testid="admin-user-badge"
              >
                {user.name}
              </Badge>
              <Button
                variant="outline"
                data-testid="admin-profile-button"
                onClick={() => setPage("profile")}
              >
                Profil
              </Button>
              <Button
                variant="outline"
                data-testid="admin-refresh-button"
                onClick={loadAll}
              >
                Refresh
              </Button>
              <Button
                variant="outline"
                data-testid="admin-logout-button"
                onClick={onLogout}
              >
                <LogOut /> Keluar
              </Button>
            </div>
          </div>
          <div
            className="mt-4 flex gap-2 overflow-x-auto lg:hidden"
            data-testid="admin-mobile-navigation"
          >
            {nav.map(([key, Icon, label]) => {
              const count = adminBadges[key] || 0;
              return (
                <Button
                  key={key}
                  size="sm"
                  variant={page === key ? "default" : "outline"}
                  data-testid={`admin-mobile-nav-${key}-button`}
                  onClick={() => openAdminPage(key)}
                >
                  <Icon />
                  <span>{label}</span>
                  <NotificationBadge
                    count={count}
                    testid={`admin-mobile-nav-${key}-badge`}
                  />
                </Button>
              );
            })}
          </div>
        </header>
        <section className="p-5 md:p-8" data-testid="admin-page-section">
          {page === "dashboard" && (
            <DashboardPage
              data={data}
              sendReminder={sendReminder}
              user={user}
              isCampusAdmin={isCampusAdmin}
              onNavigate={openAdminPage}
            />
          )}
          {page === "lecturers" && isCampusAdmin && (
            <LecturersPage
              lecturers={data.lecturers}
              forms={forms}
              setForms={setForms}
              saveLecturer={saveLecturer}
              resetLecturerPassword={resetLecturerPassword}
              deleteLecturer={deleteLecturer}
            />
          )}
          {page === "classes" && (
            <ClassesPage
              data={data}
              forms={forms}
              setForms={setForms}
              saveProgram={saveProgram}
              saveCourse={saveCourse}
              saveClass={saveClass}
              deleteCatalog={deleteCatalog}
              endClass={endClass}
              finalizeClass={finalizeClass}
              archiveClass={archiveClass}
              duplicateClass={duplicateClass}
            />
          )}
          {page === "students" && (
            <StudentsPage
              data={data}
              forms={forms}
              setForms={setForms}
              postJson={postJson}
              importStudents={importStudents}
              setImportFile={setImportFile}
              isCampusAdmin={isCampusAdmin}
            />
          )}
          {page === "materials" && (
            <MaterialsPage
              data={data}
              forms={forms}
              setForms={setForms}
              saveMaterial={saveMaterial}
              deleteMaterial={deleteMaterial}
              materialFile={materialFile}
              setMaterialFile={setMaterialFile}
              materialFileInputKey={materialFileInputKey}
              setMaterialFileInputKey={setMaterialFileInputKey}
              token={token}
            />
          )}
          {page === "assignments" && (
            <AssignmentsPage
              data={data}
              forms={forms}
              setForms={setForms}
              createAssignment={createAssignment}
              sendReminder={sendReminder}
              assignmentFiles={assignmentFiles}
              setAssignmentFiles={setAssignmentFiles}
              assignmentFileInputKey={assignmentFileInputKey}
              setAssignmentFileInputKey={setAssignmentFileInputKey}
              token={token}
            />
          )}
          {page === "grading" && (
            <GradingPage
              data={data}
              forms={forms}
              setForms={setForms}
              gradeSubmission={gradeSubmission}
              bulkGradeSubmissions={bulkGradeSubmissions}
              markReviewed={markReviewed}
              requestRevision={requestRevision}
              token={token}
            />
          )}
          {page === "weights" && (
            <GradeWeightsPage
              courses={data.courses}
              classes={data.classes}
              isCampusAdmin={isCampusAdmin}
              saveGradeWeights={saveGradeWeights}
              resetGradeWeights={resetGradeWeights}
            />
          )}
          {page === "rekap" && (
            <GradeRecapPage
              data={data}
              exportGradeRecap={exportGradeRecap}
            />
          )}
          {page === "calendar" && <CalendarPage events={data.calendar} />}
          {page === "reports" && (
            <ReportsPage
              data={data}
              exportGrades={exportGrades}
              exportGradeRecap={exportGradeRecap}
            />
          )}
          {page === "profile" && (
            <ProfilePage
              token={token}
              user={user}
              onUserUpdate={onUserUpdate}
            />
          )}
          {page === "guide" && (
            <GuidePage role={isCampusAdmin ? "admin" : "lecturer"} classes={data.classes} onNavigate={openAdminPage} />
          )}
          {page === "settings" && isCampusAdmin && (
            <SettingsPage
              forms={forms}
              setForms={setForms}
              saveSettings={saveSettings}
            />
          )}
          {page === "sso" && isCampusAdmin && (
            <SsoSettingsPage
              forms={forms}
              setForms={setForms}
              saveSso={saveSso}
              testSso={testSso}
              settings={data.ssoSettings}
            />
          )}
          {page === "drive" && isCampusAdmin && (
            <DrivePage
              forms={forms}
              setForms={setForms}
              saveDrive={saveDrive}
              testDrive={testDrive}
              driveSettings={data.driveSettings}
              retryDriveSync={retryDriveSync}
              retryFailedDriveSync={retryFailedDriveSync}
              refreshDriveStatus={refreshDriveStatus}
            />
          )}
          {page === "whatsapp" && isCampusAdmin && (
            <WhatsAppPage
              forms={forms}
              setForms={setForms}
              saveWhatsApp={saveWhatsApp}
              messages={data.whatsappMessages}
              retryMessage={retryWhatsAppMessage}
            />
          )}
          {page === "email" && isCampusAdmin && (
            <EmailPage
              forms={forms}
              setForms={setForms}
              saveEmail={saveEmail}
              testEmail={testEmail}
            />
          )}
          {page === "predicates" && (
            <GradePredicatePage
              classes={data.classes}
              forms={forms}
              setForms={setForms}
              token={token}
              saveGradePredicates={saveGradePredicates}
            />
          )}
          {page === "clean" && isCampusAdmin && (
            <CleanDataPage
              modules={data.cleanData}
              cleanDataModule={cleanDataModule}
            />
          )}
          {page === "backups" && isCampusAdmin && (
            <DatabaseBackupPage token={token} />
          )}
        </section>
      </main>
    </div>
  );
}

function LecturersPage({
  lecturers,
  forms,
  setForms,
  saveLecturer,
  resetLecturerPassword,
  deleteLecturer,
}) {
  const lecturer = forms.lecturer;
  const editing = Boolean(lecturer.id);
  function edit(item) {
    setForms({
      ...forms,
      lecturer: {
        id: item.id,
        employee_id: item.employee_id || "",
        username: item.username || "",
        name: item.name || "",
        email: item.email || "",
        whatsapp: item.whatsapp || "",
        password: "",
        status: item.status || "active",
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function resetForm() {
    setForms({
      ...forms,
      lecturer: {
        employee_id: "",
        username: "",
        name: "",
        email: "",
        whatsapp: "",
        password: "Dosen123!",
        status: "active",
      },
    });
  }
  return (
    <div className="space-y-6" data-testid="lecturers-page">
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Users}
          label="Total dosen"
          value={lecturers.length}
          hint="Akun dosen terdaftar"
          testid="lecturer-total"
        />
        <StatCard
          icon={CheckCircle2}
          label="Dosen aktif"
          value={lecturers.filter((item) => item.status === "active").length}
          hint="Dapat login dan mengajar"
          testid="lecturer-active"
        />
        <StatCard
          icon={BookOpen}
          label="Kelas diampu"
          value={lecturers.reduce(
            (total, item) => total + Number(item.class_count || 0),
            0,
          )}
          hint="Seluruh kelas milik dosen"
          testid="lecturer-classes"
        />
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <form
          onSubmit={saveLecturer}
          className="space-y-4 border bg-white p-5"
          data-testid="lecturer-form"
        >
          <div>
            <h2 className="font-display text-2xl font-semibold">
              {editing ? "Edit dosen" : "Tambah dosen"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Setiap dosen hanya dapat melihat kelas dan data pembelajaran yang
              ia kelola.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="lecturer-employee-id" label="NIP / NIDN">
              <Input
                id="lecturer-employee-id"
                value={lecturer.employee_id || ""}
                onChange={(event) =>
                  setForms({
                    ...forms,
                    lecturer: { ...lecturer, employee_id: event.target.value },
                  })
                }
              />
            </Field>
            <Field id="lecturer-username" label="Username">
              <Input
                id="lecturer-username"
                required
                value={lecturer.username || ""}
                onChange={(event) =>
                  setForms({
                    ...forms,
                    lecturer: { ...lecturer, username: event.target.value },
                  })
                }
              />
            </Field>
          </div>
          <Field id="lecturer-name" label="Nama lengkap">
            <Input
              id="lecturer-name"
              required
              value={lecturer.name || ""}
              onChange={(event) =>
                setForms({
                  ...forms,
                  lecturer: { ...lecturer, name: event.target.value },
                })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="lecturer-email" label="Email">
              <Input
                id="lecturer-email"
                type="email"
                required
                value={lecturer.email || ""}
                onChange={(event) =>
                  setForms({
                    ...forms,
                    lecturer: { ...lecturer, email: event.target.value },
                  })
                }
              />
            </Field>
            <Field id="lecturer-whatsapp" label="WhatsApp">
              <Input
                id="lecturer-whatsapp"
                value={lecturer.whatsapp || ""}
                onChange={(event) =>
                  setForms({
                    ...forms,
                    lecturer: { ...lecturer, whatsapp: event.target.value },
                  })
                }
              />
            </Field>
          </div>
          {!editing && (
            <Field id="lecturer-password" label="Password sementara">
              <Input
                id="lecturer-password"
                type="password"
                required
                minLength={6}
                value={lecturer.password || ""}
                onChange={(event) =>
                  setForms({
                    ...forms,
                    lecturer: { ...lecturer, password: event.target.value },
                  })
                }
              />
            </Field>
          )}
          <Field id="lecturer-status" label="Status">
            <select
              id="lecturer-status"
              className="form-select"
              value={lecturer.status || "active"}
              onChange={(event) =>
                setForms({
                  ...forms,
                  lecturer: { ...lecturer, status: event.target.value },
                })
              }
            >
              <option value="active">Aktif</option>
              <option value="inactive">Nonaktif</option>
            </select>
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button>
              <Plus /> {editing ? "Simpan dosen" : "Tambah dosen"}
            </Button>
            {editing && (
              <Button type="button" variant="outline" onClick={resetForm}>
                Batal
              </Button>
            )}
          </div>
        </form>
        <Card className="rounded-md shadow-none">
          <CardHeader>
            <CardTitle>Daftar dosen kampus</CardTitle>
          </CardHeader>
          <CardContent>
            {lecturers.length === 0 ? (
              <EmptyState
                title="Belum ada akun dosen"
                description="Tambahkan dosen pertama melalui formulir di samping."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Dosen</TableHead>
                    <TableHead>NIP/NIDN</TableHead>
                    <TableHead>Kelas</TableHead>
                    <TableHead>Storage</TableHead>
                    <TableHead>Drive</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturers.map((item) => (
                    <TableRow
                      key={item.id}
                      data-testid={`lecturer-row-${item.id}`}
                    >
                      <TableCell>
                        <p className="font-semibold">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          @{item.username} · {item.email}
                        </p>
                      </TableCell>
                      <TableCell>{item.employee_id || "-"}</TableCell>
                      <TableCell>{item.class_count || 0}</TableCell>
                      <TableCell>
                        <p>{item.storage_file_count || 0} file</p>
                        <p className="text-xs text-slate-500">
                          {formatBytes(item.storage_bytes || 0)}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.drive_access_status === "shared"
                              ? "border-blue-200 bg-blue-50 text-blue-700"
                              : item.drive_access_status === "share_failed" ||
                                  item.drive_access_status ===
                                    "provision_failed"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-slate-200 bg-slate-100 text-slate-600"
                          }
                        >
                          {item.drive_access_status === "shared"
                            ? "Folder dibagi"
                            : item.drive_access_status === "share_failed" ||
                                item.drive_access_status === "provision_failed"
                              ? "Perlu perhatian"
                              : "Lewat aplikasi"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            item.status === "active"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200 bg-slate-100 text-slate-600"
                          }
                        >
                          {item.status === "active" ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => edit(item)}
                          >
                            <Pencil /> Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => resetLecturerPassword(item)}
                          >
                            Reset password
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => deleteLecturer(item)}
                          >
                            <Trash2 /> Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DatabaseBackupPage({ token }) {
  const [backupData, setBackupData] = useState({
    settings: {
      enabled: false,
      frequency: "daily",
      run_time: "02:00",
      weekly_day: 0,
      retention_count: 14,
      upload_to_drive: true,
      keep_local: true,
    },
    backups: [],
    drive_ready: false,
    drive_account: "",
    drive_folder: "",
  });
  const [busy, setBusy] = useState(false);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );

  const loadBackups = useCallback(async () => {
    const response = await axios.get(`${API}/database-backups`, auth);
    setBackupData(response.data);
  }, [auth]);

  useEffect(() => {
    loadBackups().catch((error) =>
      toast.error(formatApiError(error, "Riwayat backup gagal dimuat")),
    );
  }, [loadBackups]);

  function updateSettings(patch) {
    setBackupData((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  }

  async function saveBackupSettings(event) {
    event.preventDefault();
    setBusy(true);
    try {
      await axios.put(
        `${API}/database-backups/settings`,
        backupData.settings,
        auth,
      );
      await loadBackups();
      toast.success("Jadwal backup database disimpan");
    } catch (error) {
      toast.error(formatApiError(error, "Pengaturan backup gagal disimpan"));
    } finally {
      setBusy(false);
    }
  }

  async function runBackup() {
    setBusy(true);
    try {
      const response = await axios.post(
        `${API}/database-backups/run`,
        {},
        auth,
      );
      await loadBackups();
      if (response.data.status === "completed_with_warning") {
        toast.warning(
          response.data.error || "Backup selesai dengan peringatan",
        );
      } else if (response.data.status === "failed") {
        toast.error(response.data.error || "Backup database gagal");
      } else {
        toast.success("Backup database berhasil dibuat");
      }
    } catch (error) {
      toast.error(formatApiError(error, "Backup database gagal dijalankan"));
    } finally {
      setBusy(false);
    }
  }

  async function downloadBackup(item) {
    try {
      const response = await axios.get(
        `${API}/database-backups/${item.id}/download`,
        { ...auth, responseType: "blob" },
      );
      const href = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = href;
      link.download = item.file_name;
      link.click();
      URL.revokeObjectURL(href);
    } catch (error) {
      toast.error(formatApiError(error, "File backup gagal diunduh"));
    }
  }

  const settings = backupData.settings || {};
  const successfulBackups = backupData.backups.filter((item) =>
    ["completed", "completed_with_warning"].includes(item.status),
  );
  const latestBackup = successfulBackups[0];
  const statusLabel = {
    completed: "Berhasil",
    completed_with_warning: "Ada peringatan",
    failed: "Gagal",
    running: "Diproses",
  };
  const statusStyle = {
    completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
    completed_with_warning: "border-amber-200 bg-amber-50 text-amber-700",
    failed: "border-red-200 bg-red-50 text-red-700",
    running: "border-blue-200 bg-blue-50 text-blue-700",
  };

  return (
    <div className="space-y-6" data-testid="database-backup-page">
      <section className="backup-hero">
        <div>
          <p className="meeting-overline">Keamanan data</p>
          <h2>Backup database</h2>
          <p>
            Buat salinan database secara manual atau jadwalkan backup otomatis
            ke Google Drive.
          </p>
        </div>
        <Button onClick={runBackup} disabled={busy || settings.running}>
          <Database />{" "}
          {busy || settings.running ? "Memproses..." : "Backup sekarang"}
        </Button>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={Database}
          label="Backup tersimpan"
          value={successfulBackups.length}
          hint={
            latestBackup
              ? `Terakhir ${fmtDate(latestBackup.created_at)}`
              : "Belum ada backup"
          }
          testid="database-backup-total"
        />
        <StatCard
          icon={Cloud}
          label="Google Drive"
          value={backupData.drive_ready ? "Siap" : "Belum siap"}
          hint={backupData.drive_account || "Konfigurasi Drive diperlukan"}
          testid="database-backup-drive-status"
        />
        <StatCard
          icon={Clock}
          label="Backup otomatis"
          value={settings.enabled ? "Aktif" : "Nonaktif"}
          hint={
            settings.next_run_at
              ? `Berikutnya ${fmtDate(settings.next_run_at)}`
              : "Jadwal belum aktif"
          }
          testid="database-backup-auto-status"
        />
      </div>

      <form
        onSubmit={saveBackupSettings}
        className="backup-settings-card"
        data-testid="database-backup-settings-form"
      >
        <div className="backup-section-heading">
          <div>
            <h3>Backup otomatis</h3>
            <p>Waktu mengikuti zona {settings.timezone || "Asia/Jakarta"}.</p>
          </div>
          <label className="backup-toggle">
            <input
              type="checkbox"
              checked={!!settings.enabled}
              onChange={(event) =>
                updateSettings({ enabled: event.target.checked })
              }
            />
            <span>{settings.enabled ? "Aktif" : "Nonaktif"}</span>
          </label>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field id="backup-frequency" label="Frekuensi">
            <select
              id="backup-frequency"
              className="form-select"
              value={settings.frequency || "daily"}
              onChange={(event) =>
                updateSettings({ frequency: event.target.value })
              }
            >
              <option value="daily">Setiap hari</option>
              <option value="weekly">Setiap minggu</option>
            </select>
          </Field>
          {settings.frequency === "weekly" && (
            <Field id="backup-weekday" label="Hari">
              <select
                id="backup-weekday"
                className="form-select"
                value={settings.weekly_day ?? 0}
                onChange={(event) =>
                  updateSettings({ weekly_day: Number(event.target.value) })
                }
              >
                {[
                  "Senin",
                  "Selasa",
                  "Rabu",
                  "Kamis",
                  "Jumat",
                  "Sabtu",
                  "Minggu",
                ].map((day, index) => (
                  <option value={index} key={day}>
                    {day}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field id="backup-time" label="Waktu">
            <Input
              id="backup-time"
              type="time"
              value={settings.run_time || "02:00"}
              onChange={(event) =>
                updateSettings({ run_time: event.target.value })
              }
            />
          </Field>
          <Field id="backup-retention" label="Jumlah backup disimpan">
            <Input
              id="backup-retention"
              type="number"
              min="1"
              max="90"
              value={settings.retention_count || 14}
              onChange={(event) =>
                updateSettings({ retention_count: Number(event.target.value) })
              }
            />
          </Field>
        </div>
        <div className="backup-options">
          <label>
            <input
              type="checkbox"
              checked={!!settings.upload_to_drive}
              onChange={(event) =>
                updateSettings({ upload_to_drive: event.target.checked })
              }
            />
            <Cloud /> Upload otomatis ke Google Drive
          </label>
          <label>
            <input
              type="checkbox"
              checked={!!settings.keep_local}
              onChange={(event) =>
                updateSettings({ keep_local: event.target.checked })
              }
            />
            <Database /> Simpan salinan di server
          </label>
        </div>
        {settings.upload_to_drive && (
          <div
            className={`backup-drive-note ${backupData.drive_ready ? "ready" : "warning"}`}
          >
            <Cloud />
            <span>
              {backupData.drive_ready
                ? `Backup akan disimpan ke ${backupData.drive_folder}.`
                : "Google Drive belum siap. Buka menu Google Drive dan simpan credential terlebih dahulu."}
            </span>
          </div>
        )}
        <Button disabled={busy}>Simpan jadwal backup</Button>
      </form>

      <Card
        className="rounded-md shadow-none"
        data-testid="database-backup-history-card"
      >
        <CardHeader>
          <CardTitle>Riwayat backup</CardTitle>
          <p className="text-sm text-slate-500">
            Backup berformat JSON MongoDB terkompresi (.json.gz).
          </p>
        </CardHeader>
        <CardContent>
          {backupData.backups.length === 0 ? (
            <EmptyState
              title="Belum ada backup"
              description="Klik Backup sekarang atau aktifkan jadwal otomatis."
            />
          ) : (
            <div className="backup-history-list">
              {backupData.backups.map((item) => (
                <article key={item.id} className="backup-history-item">
                  <span className="backup-file-icon">
                    <Database />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">
                      {item.file_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {fmtDate(item.created_at)} · {formatBytes(item.size || 0)}{" "}
                      · {item.trigger === "automatic" ? "Otomatis" : "Manual"}
                    </p>
                    {item.error && (
                      <p className="mt-1 text-xs text-amber-700">
                        {item.error}
                      </p>
                    )}
                  </div>
                  <Badge
                    className={statusStyle[item.status] || statusStyle.running}
                  >
                    {statusLabel[item.status] || item.status}
                  </Badge>
                  <div className="flex flex-wrap gap-2">
                    {item.local_available && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => downloadBackup(item)}
                      >
                        <Download /> Unduh
                      </Button>
                    )}
                    {item.drive_file_url && (
                      <a
                        href={item.drive_file_url}
                        target="_blank"
                        rel="noreferrer"
                        className="backup-drive-link"
                      >
                        <Cloud /> Buka Drive
                      </a>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const CleanDataPage = memo(function CleanDataPage({
  modules,
  cleanDataModule,
}) {
  return (
    <div className="space-y-6" data-testid="clean-data-page">
      <Card
        className="rounded-md border-red-200 bg-red-50 shadow-none"
        data-testid="clean-data-warning-card"
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-1 h-5 w-5 text-red-700" />
            <div>
              <h2
                className="font-display text-2xl font-semibold text-red-800"
                data-testid="clean-data-title"
              >
                Clean data percobaan
              </h2>
              <p
                className="mt-2 text-sm text-red-700"
                data-testid="clean-data-warning"
              >
                Gunakan halaman ini hanya untuk menghapus data testing. Akun
                dosen/admin, settings aplikasi, konfigurasi WhatsApp,
                konfigurasi Google Drive, file .env, dan credential Drive tidak
                ikut dihapus.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      <div
        className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        data-testid="clean-data-module-list"
      >
        {(modules || []).map((item) => (
          <Card
            key={item.key}
            className={`rounded-md shadow-none ${item.key === "all" ? "border-red-300" : ""}`}
            data-testid={`clean-data-card-${item.key}`}
          >
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <CardTitle data-testid={`clean-data-label-${item.key}`}>
                  {item.label}
                </CardTitle>
                <Badge
                  className={
                    item.count
                      ? "border-amber-200 bg-amber-50 text-amber-700"
                      : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  }
                  data-testid={`clean-data-count-${item.key}`}
                >
                  {item.count || 0} data
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p
                className="text-sm text-slate-600"
                data-testid={`clean-data-description-${item.key}`}
              >
                {item.description}
              </p>
              <Button
                type="button"
                variant={item.key === "all" ? "destructive" : "outline"}
                data-testid={`clean-data-run-${item.key}-button`}
                onClick={() => cleanDataModule(item.key, item.label)}
              >
                <Trash2 /> Bersihkan
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
});

const DashboardPage = memo(function DashboardPage({
  data,
  sendReminder,
  user,
  isCampusAdmin,
  onNavigate,
}) {
  const s = data.dashboard?.summary || {};
  const submissions = data.submissions || [];
  const totalSubmissions = submissions.length;
  const gradedSubmissions = submissions.filter(isGradedSubmission).length;
  const gradingCompletion = totalSubmissions
    ? Math.round((gradedSubmissions / totalSubmissions) * 100)
    : 0;
  const pendingEnrollments = (data.enrollments || []).filter(
    (item) => item.status === "pending",
  ).length;
  const riskOrder = {
    "Risiko Tinggi": 4,
    "Perlu Perhatian": 3,
    "Risiko Rendah": 2,
    Aman: 1,
  };
  const progressRows = [...(data.progress || [])].sort(
    (left, right) =>
      (riskOrder[right.progress?.risk_label] || 0) -
        (riskOrder[left.progress?.risk_label] || 0) ||
      (right.progress?.missing || 0) - (left.progress?.missing || 0),
  );
  const attentionStudents = progressRows.filter((student) =>
    ["Risiko Tinggi", "Perlu Perhatian"].includes(
      student.progress?.risk_label,
    ),
  ).length;
  const upcomingAssignments = useMemo(
    () =>
      [...(data.assignments || [])]
        .filter((item) => {
          const deadline = new Date(item.deadline).getTime();
          return Number.isFinite(deadline) && deadline >= Date.now() - 3600000;
        })
        .sort(
          (left, right) =>
            new Date(left.deadline).getTime() -
            new Date(right.deadline).getTime(),
        )
        .slice(0, 5),
    [data.assignments],
  );
  const recentSubmissions = useMemo(
    () =>
      [...submissions]
        .sort(
          (left, right) =>
            new Date(right.submitted_at || 0).getTime() -
            new Date(left.submitted_at || 0).getTime(),
        )
        .slice(0, 4),
    [submissions],
  );
  const dashboardTrend = useMemo(() => {
    const totals = new Map();
    submissions.forEach((submission) => {
      const key = reportDateKey(submission.submitted_at);
      if (!key) return;
      const current = totals.get(key) || { masuk: 0, dinilai: 0 };
      current.masuk += 1;
      if (isGradedSubmission(submission)) current.dinilai += 1;
      totals.set(key, current);
    });
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - index));
      return {
        tanggal: reportShortDate(date),
        ...(totals.get(reportDateKey(date)) || { masuk: 0, dinilai: 0 }),
      };
    });
  }, [submissions]);
  const latestComments = data.dashboard?.latest_comments || [];
  const activeLecturers = (data.lecturers || []).filter(
    (lecturer) => lecturer.status === "active",
  ).length;
  const greetingName = user?.name?.split(" ")?.[0] || "Pengguna";
  const dashboardMessage =
    Number(s.ungraded_submissions || 0) +
    Number(s.missing_submissions || 0) +
    attentionStudents +
    pendingEnrollments;

  return (
    <div className="dashboard-overview-page animate-rise" data-testid="dashboard-page">
      <section className="dashboard-command-hero" data-testid="dashboard-command-hero">
        <div className="dashboard-command-copy">
          <p className="dashboard-command-overline">
            {isCampusAdmin ? "Kendali akademik kampus" : "Ruang kerja dosen"}
          </p>
          <h2 data-testid="dashboard-welcome-title">Halo, {greetingName}</h2>
          <p data-testid="dashboard-welcome-description">
            {dashboardMessage > 0
              ? `${dashboardMessage} hal perlu perhatian agar kegiatan belajar tetap berjalan lancar.`
              : "Tidak ada antrean mendesak. Seluruh aktivitas pembelajaran dalam kondisi terkendali."}
          </p>
          <div className="dashboard-command-actions">
            <Button type="button" onClick={() => onNavigate("grading")}>
              <CheckCircle2 /> Buka penilaian
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onNavigate("assignments")}
            >
              <ClipboardList /> Kelola tugas
            </Button>
            {isCampusAdmin && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onNavigate("reports")}
              >
                <BarChart3 /> Lihat laporan
              </Button>
            )}
          </div>
        </div>
        <div className="dashboard-command-summary">
          <div
            className="dashboard-completion-ring"
            style={{ "--dashboard-progress": `${gradingCompletion * 3.6}deg` }}
            data-testid="dashboard-grading-completion"
          >
            <div>
              <strong>{gradingCompletion}%</strong>
              <span>dinilai</span>
            </div>
          </div>
          <div className="dashboard-command-facts">
            <div>
              <strong>{s.near_deadline || 0}</strong>
              <span>Deadline ≤ 3 hari</span>
            </div>
            <div>
              <strong>{attentionStudents}</strong>
              <span>Mahasiswa perlu perhatian</span>
            </div>
            <div
              className={
                s.storage_mode === "google_drive" ? "is-ready" : "is-warning"
              }
              data-testid="storage-mode-info"
            >
              <CheckCircle2 />
              <span data-testid="storage-mode-info-text">
                {s.storage_mode === "google_drive"
                  ? "Google Drive tersambung"
                  : "Penyimpanan lokal aktif"}
              </span>
            </div>
          </div>
        </div>
      </section>

      <div className="dashboard-metric-grid" data-testid="dashboard-stat-grid">
        {isCampusAdmin ? (
          <StatCard
            icon={Users}
            label="Dosen aktif"
            value={activeLecturers}
            hint="Akun pengajar kampus"
            testid="stat-active-lecturers"
          />
        ) : (
          <StatCard
            icon={BookOpen}
            label="Mata kuliah"
            value={s.active_courses || 0}
            hint="Dalam tanggung jawab Anda"
            testid="stat-active-courses"
          />
        )}
        <StatCard
          icon={BookOpen}
          label="Kelas aktif"
          value={s.active_classes || 0}
          hint={`${s.active_courses || 0} mata kuliah berjalan`}
          testid="stat-active-classes"
        />
        <StatCard
          icon={Users}
          label="Mahasiswa"
          value={progressRows.length}
          hint="Terdaftar pada kelas aktif"
          testid="stat-dashboard-students"
        />
        <StatCard
          icon={ClipboardList}
          label="Tugas aktif"
          value={s.active_assignments || 0}
          hint={`${s.near_deadline || 0} mendekati deadline`}
          testid="stat-active-assignments"
        />
        <StatCard
          icon={BarChart3}
          label="Rata-rata nilai"
          value={s.avg_grade || 0}
          hint={`${gradedSubmissions} submission sudah dinilai`}
          testid="stat-dashboard-average"
        />
      </div>

      <section className="dashboard-attention-section" data-testid="dashboard-attention-section">
        <div className="dashboard-section-heading">
          <div>
            <p>Prioritas operasional</p>
            <h3>Yang perlu ditindaklanjuti</h3>
          </div>
          <span>Angka diperbarui dari data kelas yang Anda kelola.</span>
        </div>
        <div className="dashboard-attention-grid">
          <button type="button" onClick={() => onNavigate("grading")}>
            <span className="dashboard-attention-icon amber"><Clock /></span>
            <div><small>Antrean nilai</small><strong>{s.ungraded_submissions || 0}</strong><p>Submission menunggu pemeriksaan</p></div>
            <ArrowLeft className="dashboard-attention-arrow" />
          </button>
          <button type="button" onClick={() => onNavigate("assignments")}>
            <span className="dashboard-attention-icon red"><AlertTriangle /></span>
            <div><small>Belum dikumpulkan</small><strong>{s.missing_submissions || 0}</strong><p>Tugas mahasiswa masih kosong</p></div>
            <ArrowLeft className="dashboard-attention-arrow" />
          </button>
          <button type="button" onClick={() => onNavigate("students")}>
            <span className="dashboard-attention-icon blue"><Users /></span>
            <div><small>Permintaan kelas</small><strong>{pendingEnrollments}</strong><p>Menunggu persetujuan dosen</p></div>
            <ArrowLeft className="dashboard-attention-arrow" />
          </button>
          <button type="button" onClick={() => onNavigate("students")}>
            <span className="dashboard-attention-icon violet"><ShieldCheck /></span>
            <div><small>Perlu perhatian</small><strong>{attentionStudents}</strong><p>Mahasiswa dengan risiko belajar</p></div>
            <ArrowLeft className="dashboard-attention-arrow" />
          </button>
        </div>
      </section>

      <div className="dashboard-analytics-grid">
        <Card className="dashboard-panel-card" data-testid="dashboard-trend-card">
          <CardHeader className="dashboard-panel-header">
            <div>
              <p>7 hari terakhir</p>
              <CardTitle>Aktivitas submission</CardTitle>
            </div>
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
              {totalSubmissions} total
            </Badge>
          </CardHeader>
          <CardContent className="dashboard-chart-content">
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dashboardTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="dashboardSubmissionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="masuk" name="Submission masuk" stroke="#2563eb" strokeWidth={3} fill="url(#dashboardSubmissionGradient)" />
                <Area type="monotone" dataKey="dinilai" name="Sudah dinilai" stroke="#10b981" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card
          className="dashboard-panel-card"
          data-testid="dashboard-reminder-card"
        >
          <CardHeader className="dashboard-panel-header">
            <div>
              <p>Agenda terdekat</p>
              <CardTitle data-testid="dashboard-reminder-title">Deadline tugas</CardTitle>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("calendar")}>
              Kalender
            </Button>
          </CardHeader>
          <CardContent className="dashboard-deadline-list">
            {upcomingAssignments.length === 0 ? (
              <div className="dashboard-empty-panel"><CalendarDays /><strong>Agenda aman</strong><p>Tidak ada deadline tugas mendatang.</p></div>
            ) : upcomingAssignments.map((item) => (
              <article key={item.id} data-testid={`dashboard-deadline-item-${item.id}`}>
                <span><CalendarDays /></span>
                <div>
                  <strong data-testid={`dashboard-deadline-title-${item.id}`}>{item.title}</strong>
                  <p>{[item.course_name, item.class_name].filter(Boolean).join(" · ")}</p>
                  <div>
                    <small data-testid={`dashboard-deadline-date-${item.id}`}>{fmtDate(item.deadline)}</small>
                    <DeadlineCountdown deadline={item.deadline} compact />
                  </div>
                </div>
                <Button size="icon" variant="outline" title="Simpan reminder" aria-label={`Simpan reminder ${item.title}`} data-testid={`dashboard-send-reminder-${item.id}-button`} onClick={() => sendReminder(item.id)}>
                  <Bell />
                </Button>
              </article>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="dashboard-lower-grid">
        <Card
          className="dashboard-panel-card"
          data-testid="dashboard-progress-card"
        >
          <CardHeader className="dashboard-panel-header">
            <div>
              <p>Pemantauan mahasiswa</p>
              <CardTitle data-testid="dashboard-progress-title">Progres dan risiko belajar</CardTitle>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={() => onNavigate("students")}>Lihat mahasiswa</Button>
          </CardHeader>
          <CardContent className="dashboard-progress-content">
            {progressRows.length === 0 ? (
              <div className="dashboard-empty-panel"><Users /><strong>Belum ada mahasiswa</strong><p>Progres akan muncul setelah mahasiswa masuk ke kelas.</p></div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Mahasiswa</TableHead><TableHead>Progres tugas</TableHead><TableHead>Rata-rata</TableHead><TableHead>Risiko</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {progressRows.slice(0, 8).map((student) => {
                      const submitted = student.progress?.submitted || 0;
                      const missing = student.progress?.missing || 0;
                      const completion = submitted + missing ? Math.round((submitted / (submitted + missing)) * 100) : 0;
                      return (
                        <TableRow key={student.id} data-testid={`dashboard-progress-row-${student.id}`}>
                          <TableCell><strong data-testid={`dashboard-progress-name-${student.id}`}>{student.name}</strong><small>{student.nim || student.email || "Mahasiswa"}</small></TableCell>
                          <TableCell><div className="dashboard-student-progress"><div><span style={{ width: `${completion}%` }} /></div><p><strong>{completion}%</strong> · {submitted} selesai · {missing} belum</p></div></TableCell>
                          <TableCell data-testid={`dashboard-progress-grade-${student.id}`}><strong>{student.progress?.avg_grade || 0}</strong></TableCell>
                          <TableCell><Badge className={statusClass(student.progress?.risk_label)} data-testid={`dashboard-progress-risk-${student.id}`}>{student.progress?.risk_label}</Badge></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="dashboard-panel-card" data-testid="dashboard-latest-activity-card">
          <CardHeader className="dashboard-panel-header"><div><p>Baru terjadi</p><CardTitle>Aktivitas terbaru</CardTitle></div></CardHeader>
          <CardContent className="dashboard-activity-feed">
            {recentSubmissions.length === 0 && latestComments.length === 0 ? (
              <div className="dashboard-empty-panel"><Clock /><strong>Belum ada aktivitas</strong><p>Submission dan diskusi terbaru akan tampil di sini.</p></div>
            ) : (
              <>
                {recentSubmissions.map((submission) => (
                  <article key={submission.id}>
                    <span className="submission"><Upload /></span>
                    <div><strong>{submission.student_name || "Mahasiswa"}</strong><p>Mengumpulkan {submission.assignment_title || "tugas"}</p><small>{fmtDate(submission.submitted_at)}</small></div>
                    <Badge className={statusClass(submission.status)}>{isGradedSubmission(submission) ? `Nilai ${submission.grade}` : submissionStatusLabel(submission.status)}</Badge>
                  </article>
                ))}
                {latestComments.slice(0, 3).map((comment) => (
                  <article key={comment.id}>
                    <span className="comment"><MessageSquare /></span>
                    <div><strong>{comment.author_name || "Pengguna"}</strong><p>{comment.content || "Mengirim lampiran diskusi"}</p><small>{fmtDate(comment.created_at)}</small></div>
                  </article>
                ))}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

function ClassesPage({
  data,
  forms,
  setForms,
  saveProgram,
  saveCourse,
  saveClass,
  deleteCatalog,
  endClass,
  finalizeClass,
  archiveClass,
  duplicateClass,
}) {
  const programOptions = data.programs || [];
  const courseOptions = data.courses || [];
  const classOptions = data.classes || [];
  const activeClassCount = classOptions.filter((item) => item.status === "active").length;
  const [activeStep, setActiveStep] = useState("program");

  function jumpToStep(step) {
    setActiveStep(step);
    window.requestAnimationFrame(() => {
      document
        .getElementById(`academic-config-${step}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  const steps = [
    {
      id: "program",
      number: "1",
      label: "Program studi",
      count: programOptions.length,
      description: "Identitas prodi",
    },
    {
      id: "course",
      number: "2",
      label: "Mata kuliah",
      count: courseOptions.length,
      description: "Katalog pembelajaran",
    },
    {
      id: "class",
      number: "3",
      label: "Kelas semester",
      count: activeClassCount,
      description: "Kelas aktif",
    },
  ];

  return (
    <div className="academic-config-page" data-testid="classes-page">
      <section className="academic-config-hero" data-testid="classes-hero">
        <div>
          <p className="meeting-overline">Konfigurasi akademik</p>
          <h2>Susun struktur akademik secara berurutan</h2>
          <p>
            Mulai dari program studi, lanjutkan ke mata kuliah, lalu buat kelas
            untuk semester berjalan. Data di setiap langkah akan menjadi pilihan
            pada langkah berikutnya.
          </p>
        </div>
        <div className="academic-config-summary" data-testid="classes-summary">
          <div>
            <strong>{programOptions.length}</strong>
            <span>Prodi</span>
          </div>
          <div>
            <strong>{courseOptions.length}</strong>
            <span>Mata kuliah</span>
          </div>
          <div>
            <strong>{activeClassCount}</strong>
            <span>Kelas aktif</span>
          </div>
        </div>
      </section>

      <nav className="academic-config-step-nav" aria-label="Langkah konfigurasi akademik">
        {steps.map((step) => (
          <button
            type="button"
            key={step.id}
            className={activeStep === step.id ? "active" : ""}
            aria-current={activeStep === step.id ? "step" : undefined}
            onClick={() => jumpToStep(step.id)}
          >
            <span>{step.number}</span>
            <span>
              <strong>{step.label}</strong>
              <small>{step.count} · {step.description}</small>
            </span>
          </button>
        ))}
      </nav>

      <div className="academic-config-note">
        <BookOpen />
        <p>
          Urutan yang disarankan: <strong>Prodi → Mata kuliah → Kelas semester</strong>.
          Anda tetap dapat mengedit data kapan saja tanpa mengulang langkah sebelumnya.
        </p>
      </div>

      <section
        id="academic-config-program"
        className="academic-config-section"
        data-testid="academic-program-section"
      >
        <header className="academic-section-heading">
          <span className="academic-section-number">1</span>
          <div>
            <p>Langkah pertama</p>
            <h2>Program studi</h2>
            <span>Tambahkan identitas program studi yang menaungi mata kuliah.</span>
          </div>
        </header>
        <div className="academic-step-layout">
        <form
          className="academic-form-card space-y-4"
          data-testid="program-create-form"
          onSubmit={saveProgram}
        >
          <div className="academic-form-heading">
            <div className="academic-form-icon"><GraduationCap /></div>
            <div>
              <h2
            className="font-display text-2xl font-semibold"
            data-testid="program-create-title"
          >
            {forms.program.id ? "Edit program studi" : "Program studi"}
              </h2>
              <p>{forms.program.id ? "Perbarui informasi prodi." : "Isi kode dan nama prodi baru."}</p>
            </div>
          </div>
          <Field id="program-code" label="Kode prodi">
            <Input
              id="program-code"
              data-testid="program-code-input"
              value={forms.program.code}
              onChange={(e) =>
                setForms({
                  ...forms,
                  program: { ...forms.program, code: e.target.value },
                })
              }
            />
          </Field>
          <Field id="program-name" label="Nama prodi">
            <Input
              id="program-name"
              data-testid="program-name-input"
              value={forms.program.name}
              onChange={(e) =>
                setForms({
                  ...forms,
                  program: { ...forms.program, name: e.target.value },
                })
              }
            />
          </Field>
          <Field id="program-description" label="Deskripsi">
            <Textarea
              id="program-description"
              data-testid="program-description-input"
              value={forms.program.description}
              onChange={(e) =>
                setForms({
                  ...forms,
                  program: { ...forms.program, description: e.target.value },
                })
              }
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="program-create-submit-button">
              <Plus /> {forms.program.id ? "Simpan prodi" : "Tambah prodi"}
            </Button>
            {forms.program.id && (
              <Button
                type="button"
                variant="outline"
                data-testid="program-cancel-edit-button"
                onClick={() =>
                  setForms({
                    ...forms,
                    program: { code: "", name: "", description: "" },
                  })
                }
              >
                Batal
              </Button>
            )}
          </div>
        </form>
        <Card
          className="academic-list-card rounded-md shadow-none"
          data-testid="program-list-card"
        >
          <CardHeader className="academic-list-header">
            <div>
              <CardTitle data-testid="program-list-title">Daftar prodi</CardTitle>
              <p>Prodi yang tersedia untuk dipilih pada katalog mata kuliah.</p>
            </div>
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">{programOptions.length}</Badge>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Kode</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programOptions.length === 0 && (
                  <TableRow><TableCell colSpan={3}><div className="academic-empty-row"><GraduationCap /><strong>Belum ada prodi</strong><span>Tambahkan prodi dari formulir di sebelah kiri.</span></div></TableCell></TableRow>
                )}
                {programOptions.map((item) => (
                  <TableRow
                    key={item.id}
                    data-testid={`program-row-${item.id}`}
                  >
                    <TableCell data-testid={`program-code-${item.id}`}>
                      {item.code}
                    </TableCell>
                    <TableCell data-testid={`program-name-${item.id}`}>
                      {item.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`program-edit-${item.id}-button`}
                          onClick={() =>
                            setForms({
                              ...forms,
                              program: {
                                id: item.id,
                                code: item.code || "",
                                name: item.name || "",
                                description: item.description || "",
                              },
                            })
                          }
                        >
                          <Pencil /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`program-delete-${item.id}-button`}
                          onClick={() =>
                            deleteCatalog("programs", item.id, "Prodi")
                          }
                        >
                          <Trash2 /> Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        </div>
      </section>

      <section
        id="academic-config-course"
        className="academic-config-section"
        data-testid="academic-course-section"
      >
        <header className="academic-section-heading">
          <span className="academic-section-number">2</span>
          <div>
            <p>Langkah kedua</p>
            <h2>Mata kuliah</h2>
            <span>Hubungkan setiap mata kuliah ke program studi yang sesuai.</span>
          </div>
        </header>
        <div className="academic-step-layout">
          <form
            className="academic-form-card space-y-4"
            data-testid="course-create-form"
            onSubmit={saveCourse}
          >
            <div className="academic-form-heading">
              <div className="academic-form-icon"><BookOpen /></div>
              <div>
                <h2 className="font-display text-2xl font-semibold" data-testid="course-create-title">
                  {forms.course.id ? "Edit mata kuliah" : "Mata kuliah"}
                </h2>
                <p>{forms.course.id ? "Perbarui informasi mata kuliah." : "Isi kode, nama, dan SKS mata kuliah."}</p>
              </div>
            </div>
            {programOptions.length === 0 && <div className="academic-prerequisite"><AlertTriangle /><span>Buat minimal satu prodi terlebih dahulu.</span></div>}
            <Field id="course-program" label="Prodi">
              <select
                id="course-program"
                className="form-select"
                data-testid="course-program-select"
                value={forms.course.program_id}
                onChange={(e) => setForms({ ...forms, course: { ...forms.course, program_id: e.target.value } })}
              >
                {programOptions.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <div className="academic-inline-fields">
              <Field id="course-code" label="Kode">
                <Input id="course-code" data-testid="course-code-input" value={forms.course.code} onChange={(e) => setForms({ ...forms, course: { ...forms.course, code: e.target.value } })} />
              </Field>
              <Field id="course-credits" label="SKS">
                <Input id="course-credits" type="number" min="1" max="8" data-testid="course-credits-input" value={forms.course.credits} onChange={(e) => setForms({ ...forms, course: { ...forms.course, credits: e.target.value } })} />
              </Field>
            </div>
            <Field id="course-name" label="Nama">
              <Input id="course-name" data-testid="course-name-input" value={forms.course.name} onChange={(e) => setForms({ ...forms, course: { ...forms.course, name: e.target.value } })} />
            </Field>
            <Field id="course-description" label="Deskripsi">
              <Textarea id="course-description" data-testid="course-description-input" value={forms.course.description} onChange={(e) => setForms({ ...forms, course: { ...forms.course, description: e.target.value } })} />
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button data-testid="course-create-submit-button" disabled={!programOptions.length}><Plus /> {forms.course.id ? "Simpan mata kuliah" : "Tambah mata kuliah"}</Button>
              {forms.course.id && <Button type="button" variant="outline" data-testid="course-cancel-edit-button" onClick={() => setForms({ ...forms, course: { program_id: forms.course.program_id, code: "", name: "", credits: 3, description: "" } })}>Batal</Button>}
            </div>
          </form>
          <Card className="academic-list-card rounded-md shadow-none" data-testid="course-list-card">
            <CardHeader className="academic-list-header">
              <div><CardTitle data-testid="course-list-title">Daftar mata kuliah</CardTitle><p>Mata kuliah siap dipakai untuk membuat kelas semester.</p></div>
              <Badge className="border-blue-200 bg-blue-50 text-blue-700">{courseOptions.length}</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Kode</TableHead><TableHead>Nama</TableHead><TableHead>Prodi</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {courseOptions.length === 0 && <TableRow><TableCell colSpan={4}><div className="academic-empty-row"><BookOpen /><strong>Belum ada mata kuliah</strong><span>Tambahkan mata kuliah setelah membuat prodi.</span></div></TableCell></TableRow>}
                  {courseOptions.map((item) => (
                  <TableRow key={item.id} data-testid={`course-row-${item.id}`}>
                    <TableCell data-testid={`course-code-${item.id}`}>
                      {item.code}
                    </TableCell>
                    <TableCell data-testid={`course-name-${item.id}`}>
                      {item.name}
                    </TableCell>
                    <TableCell data-testid={`course-program-${item.id}`}>
                      {item.program_name || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`course-edit-${item.id}-button`}
                          onClick={() =>
                            setForms({
                              ...forms,
                              course: {
                                id: item.id,
                                program_id: item.program_id || "",
                                code: item.code || "",
                                name: item.name || "",
                                credits: item.credits || 3,
                                description: item.description || "",
                              },
                            })
                          }
                        >
                          <Pencil /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`course-delete-${item.id}-button`}
                          onClick={() =>
                            deleteCatalog("courses", item.id, "Mata kuliah")
                          }
                        >
                          <Trash2 /> Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>

      <section
        id="academic-config-class"
        className="academic-config-section"
        data-testid="academic-class-section"
      >
        <header className="academic-section-heading">
          <span className="academic-section-number">3</span>
          <div>
            <p>Langkah ketiga</p>
            <h2>Kelas semester</h2>
            <span>Buat ruang kelas, pilih periode, lalu kelola anggotanya dari menu Mahasiswa.</span>
          </div>
        </header>
        <div className="academic-step-layout">
          <form className="academic-form-card space-y-4" data-testid="class-create-form" onSubmit={saveClass}>
            <div className="academic-form-heading">
              <div className="academic-form-icon"><CalendarDays /></div>
              <div>
                <h2 className="font-display text-2xl font-semibold" data-testid="class-create-title">
                  {forms.class.id ? "Edit kelas semester" : "Kelas semester"}
                </h2>
                <p>{forms.class.id ? "Perbarui detail kelas." : "Buat kelas untuk periode akademik aktif."}</p>
              </div>
            </div>
            {courseOptions.length === 0 && <div className="academic-prerequisite"><AlertTriangle /><span>Buat minimal satu mata kuliah terlebih dahulu.</span></div>}
            <Field id="class-course" label="Mata kuliah">
              <select id="class-course" className="form-select" data-testid="class-course-select" value={forms.class.course_id} onChange={(e) => setForms({ ...forms, class: { ...forms.class, course_id: e.target.value } })}>
                {courseOptions.map((c) => <option key={c.id} value={c.id}>{`${c.program_name ? `${c.program_name} - ` : ""}${c.name}`}</option>)}
              </select>
            </Field>
            <div className="academic-inline-fields">
              <Field id="class-year" label="Tahun akademik">
                <Input id="class-year" data-testid="class-year-input" value={forms.class.academic_year} onChange={(e) => setForms({ ...forms, class: { ...forms.class, academic_year: e.target.value } })} />
              </Field>
              <Field id="class-semester" label="Semester">
                <Input id="class-semester" data-testid="class-semester-input" value={forms.class.semester} onChange={(e) => setForms({ ...forms, class: { ...forms.class, semester: e.target.value } })} />
              </Field>
            </div>
            <Field id="class-name" label="Nama kelas">
              <Input id="class-name" placeholder="Contoh: IF-4A" data-testid="class-name-input" value={forms.class.name} onChange={(e) => setForms({ ...forms, class: { ...forms.class, name: e.target.value } })} />
            </Field>
            <Field id="class-schedule" label="Jadwal">
              <Input id="class-schedule" placeholder="Contoh: Senin, 08.00–09.40" data-testid="class-schedule-input" value={forms.class.schedule} onChange={(e) => setForms({ ...forms, class: { ...forms.class, schedule: e.target.value } })} />
            </Field>
            <div className="academic-form-hint"><ShieldCheck /><span>Kode kelas akan dibuat otomatis dan dapat dibagikan kepada mahasiswa.</span></div>
            <div className="flex flex-wrap gap-2">
              <Button data-testid="class-create-submit-button" disabled={!courseOptions.length}><Plus /> {forms.class.id ? "Simpan kelas" : "Tambah kelas"}</Button>
              {forms.class.id && <Button type="button" variant="outline" data-testid="class-cancel-edit-button" onClick={() => setForms({ ...forms, class: { academic_year: forms.class.academic_year, semester: forms.class.semester, course_id: forms.class.course_id, name: "", schedule: "" } })}>Batal</Button>}
            </div>
          </form>
          <Card className="academic-list-card rounded-md shadow-none" data-testid="class-list-card">
            <CardHeader className="academic-list-header">
              <div><CardTitle data-testid="class-list-title">Daftar kelas & riwayat</CardTitle><p>Kelas aktif dan kelas yang sudah berakhir tetap tercatat di sini.</p></div>
              <Badge className="border-blue-200 bg-blue-50 text-blue-700">{classOptions.length}</Badge>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Kelas</TableHead><TableHead>Prodi</TableHead><TableHead>Mata kuliah</TableHead><TableHead>Kode</TableHead><TableHead>Mahasiswa</TableHead><TableHead>Status</TableHead><TableHead>Aksi</TableHead></TableRow></TableHeader>
                <TableBody>
                  {classOptions.length === 0 && <TableRow><TableCell colSpan={7}><div className="academic-empty-row"><CalendarDays /><strong>Belum ada kelas</strong><span>Buat kelas semester dari formulir di sebelah kiri.</span></div></TableCell></TableRow>}
                  {classOptions.map((item) => (
                  <TableRow key={item.id} data-testid={`class-row-${item.id}`}>
                    <TableCell data-testid={`class-name-${item.id}`}>
                      <strong>{item.name}</strong>
                      <small>{item.academic_year || "-"} · {item.semester || "-"}</small>
                    </TableCell>
                    <TableCell data-testid={`class-program-${item.id}`}>
                      {item.program_name || "-"}
                    </TableCell>
                    <TableCell data-testid={`class-course-${item.id}`}>
                      {item.course_name}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className="bg-slate-950 text-white"
                        data-testid={`class-code-${item.id}`}
                      >
                        {item.class_code}
                      </Badge>
                    </TableCell>
                    <TableCell data-testid={`class-student-count-${item.id}`}>
                      {item.student_count}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={statusClass(item.status)}
                        data-testid={`class-status-${item.id}`}
                      >
                        {item.status_label || (item.status === "ended" ? "Berakhir" : item.status === "finalized" ? "Nilai difinalisasi" : item.status === "archived" ? "Arsip" : "Aktif")}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={item.status !== "active"}
                          data-testid={`class-edit-${item.id}-button`}
                          onClick={() =>
                            setForms({
                              ...forms,
                              class: {
                                id: item.id,
                                academic_year: item.academic_year || "",
                                semester: item.semester || "",
                                course_id: item.course_id || "",
                                name: item.name || "",
                                schedule: item.schedule || "",
                              },
                            })
                          }
                        >
                          <Pencil /> Edit
                        </Button>
                        {item.status === "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`class-end-${item.id}-button`}
                            onClick={() => endClass(item.id)}
                          >
                            Akhiri
                          </Button>
                        )}
                        {item.status === "ended" && (
                          <Button
                            size="sm"
                            data-testid={`class-finalize-${item.id}-button`}
                            onClick={() => finalizeClass(item)}
                          >
                            <CheckCircle2 /> Finalisasi nilai
                          </Button>
                        )}
                        {item.status === "finalized" && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`class-archive-${item.id}-button`}
                            onClick={() => archiveClass(item)}
                          >
                            <Database /> Arsipkan
                          </Button>
                        )}
                        {item.status !== "active" && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`class-duplicate-${item.id}-button`}
                            onClick={() => duplicateClass(item)}
                          >
                            <RotateCcw /> Periode baru
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`class-delete-${item.id}-button`}
                          disabled={item.status !== "active"}
                          onClick={() => deleteCatalog("classes", item.id, "Kelas")}
                        >
                          <Trash2 /> Hapus
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}

function StudentsPage({
  data,
  forms,
  setForms,
  postJson,
  importStudents,
  setImportFile,
  isCampusAdmin,
}) {
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [progressCourseId, setProgressCourseId] = useState("");
  const [studentSection, setStudentSection] = useState(
    isCampusAdmin ? "data" : "classes",
  );
  const pending = data.enrollments?.filter((r) => r.status === "pending") || [];
  const classById = useMemo(() => new Map(data.classes.map((item) => [item.id, item])), [data.classes]);
  const activeClasses = data.classes.filter((item) => item.status === "active");
  const selectedClass = data.classes.find(
    (c) => c.id === forms.student.class_id,
  );
  const classMembers = data.students.filter((s) =>
    s.class_ids?.includes(forms.student.class_id),
  );
  const activeCandidates = data.students.filter(
    (s) =>
      (s.status || "active") === "active" &&
      !s.class_ids?.includes(forms.student.class_id),
  );
  const searchText = studentSearch.trim().toLowerCase();
  const filteredCandidates = activeCandidates.filter((s) => {
    const haystack =
      `${s.name || ""} ${s.nim || ""} ${s.email || ""} ${s.whatsapp || ""}`.toLowerCase();
    return !searchText || haystack.includes(searchText);
  });
  const activeCandidateIds = new Set(activeCandidates.map((s) => s.id));
  const selectedIds = selectedStudentIds.filter((id) =>
    activeCandidateIds.has(id),
  );
  const selectedClassAllowsLearning = selectedClass?.status === "active";
  const filteredCandidateIds = filteredCandidates.map((s) => s.id);
  const allFilteredSelected =
    filteredCandidateIds.length > 0 &&
    filteredCandidateIds.every((id) => selectedIds.includes(id));
  const progressClassIds = data.classes
    .filter((c) => !progressCourseId || c.course_id === progressCourseId)
    .map((c) => c.id);
  const progressStudents = data.students.filter(
    (s) =>
      !progressCourseId ||
      s.class_ids?.some((id) => progressClassIds.includes(id)),
  );
  const setManagedClass = (classId) => {
    setSelectedStudentIds([]);
    setForms({
      ...forms,
      student: { ...forms.student, class_id: classId, existing_student_id: "" },
    });
  };
  const toggleCandidate = (studentId, checked) =>
    setSelectedStudentIds((prev) =>
      checked
        ? Array.from(new Set([...prev, studentId]))
        : prev.filter((id) => id !== studentId),
    );
  const toggleFilteredCandidates = (checked) =>
    setSelectedStudentIds((prev) =>
      checked
        ? Array.from(new Set([...prev, ...filteredCandidateIds]))
        : prev.filter((id) => !filteredCandidateIds.includes(id)),
    );
  async function runBulkStudentAction(endpoint, ids, success) {
    const cleanIds = Array.from(new Set(ids.filter(Boolean)));
    if (!cleanIds.length) return toast.error("Pilih minimal satu mahasiswa");
    if (!selectedClassAllowsLearning) return toast.error("Keanggotaan hanya dapat diubah pada kelas Aktif");
    if (!window.confirm(`Konfirmasi tindakan untuk ${cleanIds.length} mahasiswa pada kelas ${selectedClass?.name || "ini"}?`)) return;
    await postJson(
      `/classes/${forms.student.class_id}/students/${endpoint}`,
      { student_ids: cleanIds },
      success,
    );
    setSelectedStudentIds((prev) =>
      prev.filter((id) => !cleanIds.includes(id)),
    );
  }
  return (
    <div className="space-y-6" data-testid="students-page">
      <section className="student-admin-hero">
        <div>
          <p className="meeting-overline">Administrasi akademik</p>
          <h2>Kelola mahasiswa</h2>
          <p>
            {isCampusAdmin
              ? "Tambahkan akun, atur keanggotaan kelas, dan pantau progres belajar dari satu tempat."
              : "Lihat mahasiswa aktif yang terdaftar di sistem dan masukkan ke kelas Anda."}
          </p>
        </div>
        <div className="student-admin-summary">
          <div>
            <strong>{data.students.length}</strong>
            <span>Total mahasiswa</span>
          </div>
          <div>
            <strong>{data.classes.length}</strong>
            <span>Kelas tersedia</span>
          </div>
          <div className={pending.length ? "attention" : ""}>
            <strong>{pending.length}</strong>
            <span>Menunggu persetujuan</span>
          </div>
        </div>
      </section>
      <nav
        className="student-admin-tabs"
        aria-label="Bagian manajemen mahasiswa"
        data-testid="student-management-tabs"
      >
        {[
          ...(isCampusAdmin
            ? [["data", Users, "Data mahasiswa", "Tambah atau impor akun"]]
            : []),
          ["classes", BookOpen, "Keanggotaan kelas", "Kelola akses kelas"],
          ["progress", BarChart3, "Monitoring progres", "Pantau hasil belajar"],
        ].map(([key, Icon, label, description]) => (
          <button
            key={key}
            type="button"
            className={studentSection === key ? "active" : ""}
            aria-current={studentSection === key ? "page" : undefined}
            onClick={() => setStudentSection(key)}
            data-testid={`student-management-${key}-tab`}
          >
            <Icon />
            <span>
              <strong>{label}</strong>
              <small>{description}</small>
            </span>
            {key === "classes" && pending.length > 0 && (
              <Badge className="border-red-200 bg-red-50 text-red-700">
                {pending.length}
              </Badge>
            )}
          </button>
        ))}
      </nav>
      {isCampusAdmin && studentSection === "data" && (
        <div className="grid gap-6 xl:grid-cols-2">
          <form
            className="student-admin-form space-y-4 border bg-white p-5"
            data-testid="student-create-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (!window.confirm("Buat akun mahasiswa dan langsung masukkan ke kelas aktif?")) return;
              postJson("/students", forms.student, "Mahasiswa ditambahkan");
            }}
          >
            <div className="student-admin-form-heading">
              <span>
                <Plus />
              </span>
              <div>
                <h2 data-testid="student-create-title">Tambah mahasiswa</h2>
                <p>Buat satu akun dan langsung masukkan ke kelas.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="student-nim" label="NIM">
                <Input
                  id="student-nim"
                  data-testid="student-nim-input"
                  value={forms.student.nim}
                  onChange={(e) =>
                    setForms({
                      ...forms,
                      student: { ...forms.student, nim: e.target.value },
                    })
                  }
                />
              </Field>
              <Field id="student-name" label="Nama">
                <Input
                  id="student-name"
                  data-testid="student-name-input"
                  value={forms.student.name}
                  onChange={(e) =>
                    setForms({
                      ...forms,
                      student: { ...forms.student, name: e.target.value },
                    })
                  }
                />
              </Field>
              <Field id="student-email" label="Email">
                <Input
                  id="student-email"
                  data-testid="student-email-input"
                  value={forms.student.email}
                  onChange={(e) =>
                    setForms({
                      ...forms,
                      student: { ...forms.student, email: e.target.value },
                    })
                  }
                />
              </Field>
              <Field id="student-whatsapp" label="WhatsApp">
                <Input
                  id="student-whatsapp"
                  data-testid="student-whatsapp-input"
                  value={forms.student.whatsapp}
                  onChange={(e) =>
                    setForms({
                      ...forms,
                      student: { ...forms.student, whatsapp: e.target.value },
                    })
                  }
                />
              </Field>
            </div>
            <Field id="student-class" label="Kelas">
              <select
                id="student-class"
                className="form-select"
                data-testid="student-class-select"
                value={forms.student.class_id}
                onChange={(e) =>
                  setForms({
                    ...forms,
                    student: { ...forms.student, class_id: e.target.value },
                  })
                }
              >
                {activeClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button data-testid="student-create-submit-button">
              <Plus /> Tambah mahasiswa
            </Button>
          </form>
          <form
            className="student-admin-form space-y-4 border bg-white p-5"
            data-testid="student-import-form"
            onSubmit={importStudents}
          >
            <div className="student-admin-form-heading">
              <span>
                <Upload />
              </span>
              <div>
                <h2 data-testid="student-import-title">Impor dari Excel</h2>
                <p>Tambahkan banyak mahasiswa sekaligus ke kelas tujuan.</p>
              </div>
            </div>
            <p
              className="text-sm text-slate-500"
              data-testid="student-import-help"
            >
              Header: nim, nama/name, email, whatsapp/wa, password. Kolom
              password opsional dan akan mengalahkan password default.
            </p>
            <Field id="student-import-file" label="File Excel">
              <Input
                id="student-import-file"
                type="file"
                accept=".xlsx"
                data-testid="student-import-file-input"
                onChange={(e) => setImportFile(e.target.files?.[0])}
              />
            </Field>
            <Field id="student-import-password" label="Password default import">
              <Input
                id="student-import-password"
                type="password"
                data-testid="student-import-password-input"
                value={forms.student.import_password || ""}
                onChange={(e) =>
                  setForms({
                    ...forms,
                    student: {
                      ...forms.student,
                      import_password: e.target.value,
                    },
                  })
                }
                placeholder="Kosongkan untuk pakai NIM"
              />
            </Field>
            <Field id="student-import-class" label="Kelas tujuan">
              <select
                id="student-import-class"
                className="form-select"
                data-testid="student-import-class-select"
                value={forms.student.class_id}
                onChange={(e) =>
                  setForms({
                    ...forms,
                    student: { ...forms.student, class_id: e.target.value },
                  })
                }
              >
                {activeClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Button data-testid="student-import-submit-button">
              <Upload /> Import mahasiswa
            </Button>
          </form>
        </div>
      )}
      {studentSection === "classes" && (
        <>
          <Card
            className="rounded-md shadow-none"
            data-testid="enrollment-request-card"
          >
            <CardHeader>
              <CardTitle data-testid="enrollment-request-title">
                Permintaan masuk kelas
              </CardTitle>
              <p className="text-sm text-slate-500">
                Tinjau mahasiswa yang mendaftar menggunakan kode kelas.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {pending.length === 0 ? (
                <p
                  className="text-sm text-slate-500"
                  data-testid="enrollment-request-empty"
                >
                  Tidak ada request pending.
                </p>
              ) : (
                pending.map((r) => (
                  <div
                    key={r.id}
                    className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3"
                    data-testid={`enrollment-request-row-${r.id}`}
                  >
                    <div>
                      <p
                        className="font-semibold"
                        data-testid={`enrollment-request-student-${r.id}`}
                      >
                        {r.student_name} - {r.student_nim}
                      </p>
                      <p
                        className="text-sm text-slate-500"
                        data-testid={`enrollment-request-class-${r.id}`}
                      >
                        {r.class_name} ({r.class_code})
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        data-testid={`enrollment-approve-${r.id}-button`}
                        disabled={classById.get(r.class_id)?.status !== "active"}
                        onClick={() =>
                          window.confirm("Setujui mahasiswa masuk ke kelas ini?") && postJson(
                              `/enrollment-requests/${r.id}/approve`,
                              {},
                              "Mahasiswa disetujui",
                            )
                        }
                      >
                        ACC
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`enrollment-reject-${r.id}-button`}
                        disabled={classById.get(r.class_id)?.status !== "active"}
                        onClick={() =>
                          window.confirm("Tolak request mahasiswa ini?") && postJson(
                              `/enrollment-requests/${r.id}/reject`,
                              {},
                              "Request ditolak",
                            )
                        }
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
          <Card
            className="rounded-md shadow-none"
            data-testid="class-user-management-card"
          >
            <CardHeader>
              <CardTitle data-testid="class-user-management-title">
                Keanggotaan mahasiswa per kelas
              </CardTitle>
              <p className="text-sm text-slate-500">
                Pilih kelas, masukkan mahasiswa aktif, atau kelola anggota yang
                sudah terdaftar.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Field id="class-user-management-select" label="Pilih kelas">
                <select
                  id="class-user-management-select"
                  className="form-select"
                  data-testid="class-user-management-select"
                  value={forms.student.class_id}
                  onChange={(e) => setManagedClass(e.target.value)}
                >
                  {data.classes.map((c) => (
                    <option
                      key={c.id}
                      value={c.id}
                    >{`${c.name} - ${c.status_label || c.status}`}</option>
                  ))}
                </select>
              </Field>
              {selectedClass && (
                <div
                  className="grid gap-2 border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 md:grid-cols-3"
                  data-testid="selected-class-invite-info"
                >
                  <p data-testid="selected-class-code">
                    Kode kelas:{" "}
                    <span className="font-semibold">
                      {selectedClass.class_code || "-"}
                    </span>
                  </p>
                  <p data-testid="active-student-candidate-count">
                    {activeCandidates.length} mahasiswa aktif belum masuk kelas
                    ini
                  </p>
                  <p data-testid="active-student-filter-count">
                    {filteredCandidates.length} cocok dengan filter
                  </p>
                </div>
              )}
              {selectedClass && !selectedClassAllowsLearning && (
                <div className="flex gap-2 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900" data-testid="class-membership-read-only-notice">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>Kelas ini sudah {selectedClass.status_label || "berakhir"}. Keanggotaan tidak dapat diubah.</span>
                </div>
              )}
              <div
                className="space-y-3 border border-slate-200 bg-slate-50 p-3"
                data-testid="active-student-enroll-panel"
              >
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <Field
                    id="active-student-search"
                    label="Cari mahasiswa aktif"
                  >
                    <Input
                      id="active-student-search"
                      data-testid="active-student-search-input"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="Cari nama, NIM, email, atau WhatsApp"
                    />
                  </Field>
                  <label
                    className="flex items-center gap-2 self-end border border-blue-200 bg-white p-3 text-sm font-semibold text-blue-800"
                    data-testid="active-student-select-all-visible"
                  >
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      disabled={filteredCandidateIds.length === 0}
                      onChange={(e) =>
                        toggleFilteredCandidates(e.target.checked)
                      }
                    />
                    Pilih semua hasil
                  </label>
                </div>
                <div
                  className="max-h-[300px] overflow-y-auto border border-slate-200 bg-white"
                  data-testid="active-student-option-list"
                >
                  {filteredCandidates.length === 0 ? (
                    <p
                      className="p-3 text-sm text-slate-500"
                      data-testid="active-student-empty"
                    >
                      Tidak ada mahasiswa aktif yang cocok.
                    </p>
                  ) : (
                    filteredCandidates.map((s) => (
                      <label
                        key={s.id}
                        className="flex items-start gap-3 border-b border-slate-200 p-3 text-sm last:border-b-0"
                        data-testid={`active-student-option-${s.id}`}
                      >
                        <input
                          type="checkbox"
                          className="mt-1"
                          checked={selectedIds.includes(s.id)}
                          disabled={!selectedClassAllowsLearning}
                          onChange={(e) =>
                            toggleCandidate(s.id, e.target.checked)
                          }
                          data-testid={`active-student-checkbox-${s.id}`}
                        />
                        <span>
                          <span
                            className="block font-semibold text-slate-900"
                            data-testid={`active-student-name-${s.id}`}
                          >
                            {s.name} - {s.nim || "-"}
                          </span>
                          <span
                            className="block text-slate-500"
                            data-testid={`active-student-meta-${s.id}`}
                          >
                            {s.email || "-"} · {s.whatsapp || "Tanpa WhatsApp"}
                          </span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
                <div
                  className="flex flex-wrap items-center gap-2"
                  data-testid="active-student-bulk-actions"
                >
                  <Badge
                    className="border-blue-200 bg-blue-50 text-blue-700"
                    data-testid="active-student-selected-count"
                  >
                    {selectedIds.length} dipilih
                  </Badge>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="active-student-add-button"
                    disabled={!selectedIds.length || !forms.student.class_id || !selectedClassAllowsLearning}
                    onClick={() =>
                      runBulkStudentAction(
                        "bulk-add",
                        selectedIds,
                        `${selectedIds.length} mahasiswa dimasukkan ke kelas`,
                      )
                    }
                  >
                    <Plus /> Masukkan dipilih
                  </Button>
                  <Button
                    type="button"
                    data-testid="active-student-invite-button"
                    disabled={!selectedIds.length || !forms.student.class_id || !selectedClassAllowsLearning}
                    onClick={() =>
                      runBulkStudentAction(
                        "bulk-invite",
                        selectedIds,
                        `${selectedIds.length} invite dibuat`,
                      )
                    }
                  >
                    <Send /> Invite dipilih
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="active-student-add-all-button"
                    disabled={
                      !filteredCandidateIds.length || !forms.student.class_id || !selectedClassAllowsLearning
                    }
                    onClick={() =>
                      runBulkStudentAction(
                        "bulk-add",
                        filteredCandidateIds,
                        `${filteredCandidateIds.length} mahasiswa dimasukkan ke kelas`,
                      )
                    }
                  >
                    <Plus /> Masukkan semua
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="active-student-invite-all-button"
                    disabled={
                      !filteredCandidateIds.length || !forms.student.class_id || !selectedClassAllowsLearning
                    }
                    onClick={() =>
                      runBulkStudentAction(
                        "bulk-invite",
                        filteredCandidateIds,
                        `${filteredCandidateIds.length} invite dibuat`,
                      )
                    }
                  >
                    <Send /> Invite semua
                  </Button>
                </div>
              </div>
              <div className="space-y-3" data-testid="class-member-list">
                {classMembers.length === 0 ? (
                  <p
                    className="text-sm text-slate-500"
                    data-testid="class-member-empty"
                  >
                    Belum ada mahasiswa di kelas ini.
                  </p>
                ) : (
                  classMembers.map((s) => (
                    <div
                      key={s.id}
                      className="flex flex-wrap items-center justify-between gap-3 border border-slate-200 p-3"
                      data-testid={`class-member-row-${s.id}`}
                    >
                      <div>
                        <p
                          className="font-semibold"
                          data-testid={`class-member-name-${s.id}`}
                        >
                          {s.name} - {s.nim}
                        </p>
                        <p
                          className="text-sm text-slate-500"
                          data-testid={`class-member-email-${s.id}`}
                        >
                          {s.email} · {s.status}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {isCampusAdmin && (
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`class-member-toggle-${s.id}-button`}
                            onClick={() =>
                              window.confirm("Ubah status mahasiswa ini?") && postJson(
                                  `/students/${s.id}/status`,
                                  {
                                    status:
                                      s.status === "active"
                                        ? "inactive"
                                        : "active",
                                  },
                                  "Status mahasiswa diubah",
                                )
                            }
                          >
                            {s.status === "active"
                              ? "Nonaktifkan"
                              : "Aktifkan"}
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`class-member-remove-${s.id}-button`}
                          onClick={() =>
                            window.confirm("Lepaskan mahasiswa dari kelas ini?") && postJson(
                                `/classes/${forms.student.class_id}/students/${s.id}/remove`,
                                {},
                                "Mahasiswa dilepas dari kelas",
                              )
                          }
                        >
                          Lepas dari kelas
                        </Button>
                        {isCampusAdmin && (
                          <Button
                            size="sm"
                            data-testid={`class-member-reset-${s.id}-button`}
                            onClick={() => {
                              const password = window.prompt(
                                "Password baru mahasiswa",
                                s.nim || "Mahasiswa123!",
                              );
                              if (password && window.confirm(`Reset password ${s.name}?`))
                                postJson(
                                  `/students/${s.id}/reset-password`,
                                  { password },
                                  `Password ${s.name} direset`,
                                );
                            }}
                          >
                            Reset password
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
      {studentSection === "progress" && (
        <Card
          className="rounded-md shadow-none"
          data-testid="student-list-card"
        >
          <CardHeader>
            <CardTitle data-testid="student-list-title">
              Monitoring progres
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Field id="student-progress-course" label="Filter mata kuliah">
              <select
                id="student-progress-course"
                className="form-select"
                data-testid="student-progress-course-select"
                value={progressCourseId}
                onChange={(e) => setProgressCourseId(e.target.value)}
              >
                <option value="">Semua mata kuliah</option>
                {data.courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Submit</TableHead>
                  <TableHead>Belum</TableHead>
                  <TableHead>Nilai</TableHead>
                  <TableHead>Risiko</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {progressStudents.map((s) => (
                  <TableRow key={s.id} data-testid={`student-row-${s.id}`}>
                    <TableCell data-testid={`student-nim-${s.id}`}>
                      {s.nim}
                    </TableCell>
                    <TableCell data-testid={`student-name-${s.id}`}>
                      {s.name}
                    </TableCell>
                    <TableCell data-testid={`student-email-${s.id}`}>
                      {s.email}
                    </TableCell>
                    <TableCell data-testid={`student-submitted-${s.id}`}>
                      {s.progress?.submitted}
                    </TableCell>
                    <TableCell data-testid={`student-missing-${s.id}`}>
                      {s.progress?.missing}
                    </TableCell>
                    <TableCell data-testid={`student-grade-${s.id}`}>
                      {s.progress?.avg_grade}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={statusClass(s.progress?.risk_label)}
                        data-testid={`student-risk-${s.id}`}
                      >
                        {s.progress?.risk_label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {progressStudents.length === 0 && (
              <p
                className="text-sm text-slate-500"
                data-testid="student-progress-empty"
              >
                Tidak ada mahasiswa pada mata kuliah ini.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function DiscussionThread({ material, token }) {
  const discussionReadOnly = material.class_allows_learning === false;
  const [comments, setComments] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [attachments, setAttachments] = useState({});
  const [replyTo, setReplyTo] = useState("");
  const [uploadVersion, setUploadVersion] = useState(0);
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );
  const progress = useActionProgress();

  async function loadComments() {
    try {
      const { data } = await axios.get(
        `${API}/materials/${material.id}/comments`,
        auth,
      );
      setComments(data);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Diskusi gagal dimuat");
    }
  }

  useEffect(() => {
    axios
      .get(`${API}/materials/${material.id}/comments`, auth)
      .then(({ data }) => setComments(data))
      .catch((error) =>
        toast.error(error.response?.data?.detail || "Diskusi gagal dimuat"),
      );
  }, [material.id, auth]);

  async function submitComment(parentId = "") {
    const key = parentId || "root";
    const content = (drafts[key] || "").trim();
    const attachment = attachments[key];
    if (!content && !attachment)
      return toast.error("Isi komentar atau lampiran diperlukan");
    const form = new FormData();
    form.append("content", content);
    form.append("parent_id", parentId);
    if (attachment) form.append("attachment", attachment);
    const operation = progress.begin(
      parentId ? "Mengirim balasan" : "Mengirim komentar",
      attachment ? `Mengunggah ${attachment.name}...` : "Menyimpan diskusi...",
    );
    try {
      await axios.post(`${API}/materials/${material.id}/comments`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (upload) =>
          progress.update(
            operation,
            uploadProgressPercent(upload),
            "Mengunggah lampiran diskusi",
          ),
      });
      setDrafts((items) => ({ ...items, [key]: "" }));
      setAttachments((items) => ({ ...items, [key]: null }));
      setReplyTo("");
      setUploadVersion((value) => value + 1);
      await loadComments();
      progress.finish(
        operation,
        parentId ? "Balasan dikirim" : "Komentar dikirim",
      );
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
    return (
      <div
        className="discussion-attachment"
        data-testid={`discussion-attachment-${comment.id}`}
      >
        {image && (
          <img
            src={url}
            alt={file.file_name || "Lampiran diskusi"}
            loading="lazy"
          />
        )}
        <a href={url} target="_blank" rel="noreferrer">
          <Paperclip /> {file.file_name || "Buka lampiran"}
        </a>
      </div>
    );
  }

  function composer(key, parentId = "") {
    return (
      <div
        className={`discussion-composer ${parentId ? "reply" : ""}`}
        data-testid={`discussion-composer-${material.id}-${key}`}
      >
        <Textarea
          value={drafts[key] || ""}
          onChange={(event) =>
            setDrafts((items) => ({ ...items, [key]: event.target.value }))
          }
          placeholder={
            parentId ? "Tulis balasan..." : "Tulis komentar untuk materi ini..."
          }
          data-testid={`discussion-text-${material.id}-${key}`}
        />
        <div className="discussion-actions">
          <Input
            key={`${key}-${uploadVersion}`}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,.gif,.pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            onChange={(event) =>
              setAttachments((items) => ({
                ...items,
                [key]: event.target.files?.[0] || null,
              }))
            }
            data-testid={`discussion-file-${material.id}-${key}`}
          />
          {parentId && (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setReplyTo("")}
            >
              Batal
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            onClick={() => submitComment(parentId)}
            data-testid={`discussion-submit-${material.id}-${key}`}
          >
            <Send /> Kirim
          </Button>
        </div>
      </div>
    );
  }

  function renderComment(comment, depth = 0) {
    const children = comments.filter((item) => item.parent_id === comment.id);
    return (
      <div
        key={comment.id}
        className={`discussion-comment ${depth ? "nested" : ""}`}
        data-testid={`discussion-comment-${comment.id}`}
      >
        <div className="discussion-comment-header">
          <strong>{comment.author_name}</strong>
          <Badge variant="outline">
            {["admin", "lecturer"].includes(comment.author_role)
              ? "Dosen"
              : "Mahasiswa"}
          </Badge>
          <time>{fmtDate(comment.created_at)}</time>
        </div>
        {comment.content && <p>{comment.content}</p>}
        {attachmentView(comment)}
        {!discussionReadOnly && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="discussion-reply-button"
            onClick={() => setReplyTo(replyTo === comment.id ? "" : comment.id)}
            data-testid={`discussion-reply-${comment.id}-button`}
          >
            <Reply /> Balas
          </Button>
        )}
        {!discussionReadOnly && replyTo === comment.id && composer(comment.id, comment.id)}
        {children.map((child) => renderComment(child, depth + 1))}
      </div>
    );
  }

  const rootComments = comments.filter((item) => !item.parent_id);
  return (
    <section
      className="discussion-thread"
      data-testid={`discussion-thread-${material.id}`}
    >
      <h4 className="font-display font-semibold">
        <MessageSquare /> Diskusi kelas
      </h4>
      {rootComments.length === 0 ? (
        <p className="discussion-empty">
          Belum ada komentar. Mulai diskusi materi ini.
        </p>
      ) : (
        rootComments.map((comment) => renderComment(comment))
      )}
      {discussionReadOnly ? (
        <p className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
          Diskusi ditutup karena kelas sudah berakhir. Seluruh riwayat komentar tetap dapat dibaca.
        </p>
      ) : composer("root")}
    </section>
  );
}

function materialClassLabel(material) {
  return (
    [material.course_name, material.class_name].filter(Boolean).join(" · ") ||
    "Kelas tidak tersedia"
  );
}

function MaterialsPage({
  data,
  forms,
  setForms,
  saveMaterial,
  deleteMaterial,
  materialFile,
  setMaterialFile,
  materialFileInputKey,
  setMaterialFileInputKey,
  token,
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const editingMaterial = data.materials.find(
    (material) => material.id === forms.material.id,
  );
  const classGroups = useMemo(
    () =>
      data.classes.map((classItem) => {
        const groupMaterials = data.materials
          .filter((material) => material.class_id === classItem.id)
          .sort(
            (left, right) =>
              materialMeetingNumber(left) - materialMeetingNumber(right),
          );
        const materialIds = new Set(
          groupMaterials.map((material) => material.id),
        );
        const linkedAssignments = data.assignments.filter((assignment) =>
          materialIds.has(assignment.material_id),
        );
        const classAssignments = data.assignments.filter(
          (assignment) => assignment.class_id === classItem.id,
        );
        return {
          id: classItem.id,
          className: classItem.name || "Kelas",
          courseName: classItem.course_name || "Mata kuliah",
          period: [classItem.academic_year, classItem.semester]
            .filter(Boolean)
            .join(" · "),
          classCode: classItem.class_code || "",
          status: classItem.status || "",
          status_label: classItem.status_label || "",
          materials: groupMaterials,
          assignments: classAssignments,
          linkedAssignments,
          latestMaterial: groupMaterials[groupMaterials.length - 1],
        };
      }),
    [data.classes, data.materials, data.assignments],
  );
  const selectedGroup = classGroups.find(
    (group) => group.id === selectedClassId,
  );
  const selectedClassIsActive = selectedGroup?.status === "active";
  const totalLinkedAssignments = classGroups.reduce(
    (total, group) => total + group.linkedAssignments.length,
    0,
  );

  async function generateMaterialMeetLink() {
    if (!forms.material.class_id)
      return toast.error("Pilih kelas materi terlebih dahulu");
    try {
      const { data: result } = await axios.post(
        `${API}/materials/google-meet`,
        {
          class_id: forms.material.class_id,
          title: forms.material.title || "Pertemuan e-learning",
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      setForms((prev) => ({
        ...prev,
        material: {
          ...prev.material,
          meeting_type: "online",
          meeting_url: result.meeting_url,
        },
      }));
      toast.success("Link Google Meet berhasil dibuat");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Link Google Meet gagal dibuat",
      );
    }
  }

  useEffect(() => {
    if (
      selectedClassId &&
      !classGroups.some((group) => group.id === selectedClassId)
    ) {
      setSelectedClassId("");
    }
  }, [classGroups, selectedClassId]);

  function openMaterialGroup(classId) {
    setSelectedClassId(classId);
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms((prev) => ({
      ...prev,
      material: {
        class_id: classId,
        title: "",
        description: "",
        file_url: "",
        video_url: "",
        meeting_type: "offline",
        meeting_url: "",
        is_active: true,
        locked_until: "",
      },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToMaterialGroups() {
    setSelectedClassId("");
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms((prev) => ({
      ...prev,
      material: {
        class_id: prev.material.class_id,
        title: "",
        description: "",
        file_url: "",
        video_url: "",
        meeting_type: "offline",
        meeting_url: "",
        is_active: true,
        locked_until: "",
      },
    }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const resetMaterial = () => {
    const classId = selectedGroup?.id || forms.material.class_id;
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms({
      ...forms,
      material: {
        class_id: classId,
        title: "",
        description: "",
        file_url: "",
        video_url: "",
        meeting_type: "offline",
        meeting_url: "",
        is_active: true,
        locked_until: "",
      },
    });
  };
  const editMaterial = (material) => {
    setSelectedClassId(material.class_id || selectedClassId);
    setMaterialFile(null);
    setMaterialFileInputKey((key) => key + 1);
    setForms({
      ...forms,
      material: {
        id: material.id,
        class_id: material.class_id || "",
        title: material.title || "",
        description: material.description || "",
        file_url: material.file_url || "",
        video_url: material.video_url || "",
        meeting_type: material.meeting_type || "offline",
        meeting_url: material.meeting_url || "",
        is_active: material.is_active !== false,
        locked_until: material.locked_until || "",
      },
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!selectedGroup) {
    return (
      <div className="space-y-5" data-testid="materials-page">
        <section className="meeting-hero" data-testid="admin-material-hero">
          <div>
            <p className="meeting-overline">Materi admin</p>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="admin-material-title"
            >
              Materi per mata kuliah
            </h2>
            <p className="meeting-description">
              Pilih mata kuliah untuk mengelola pertemuan, lampiran, tugas
              terkait, dan diskusi kelas.
            </p>
          </div>
          <div className="meeting-summary" data-testid="admin-material-summary">
            <div>
              <strong>{classGroups.length}</strong>
              <span>Mata kuliah</span>
            </div>
            <div>
              <strong>{data.materials.length}</strong>
              <span>Pertemuan</span>
            </div>
            <div>
              <strong>{totalLinkedAssignments}</strong>
              <span>Tugas terkait</span>
            </div>
          </div>
        </section>
        {classGroups.length === 0 ? (
          <EmptyState
            title="Belum ada kelas"
            description="Buat kelas terlebih dahulu sebelum menambahkan materi."
          />
        ) : (
          <div
            className="course-card-grid"
            data-testid="admin-material-course-grid"
          >
            {classGroups.map((group) => (
              <Card
                key={group.id}
                className="course-material-card rounded-md shadow-none"
                data-testid={`admin-material-course-card-${group.id}`}
              >
                <CardContent className="course-material-card-content">
                  <div className="course-material-card-main">
                    <span className="course-material-card-icon">
                      <BookOpen />
                    </span>
                    <div className="course-material-card-header">
                      <div>
                        <h3
                          data-testid={`admin-material-course-title-${group.id}`}
                        >
                          {group.courseName}
                        </h3>
                        <p
                          data-testid={`admin-material-course-period-${group.id}`}
                        >
                          {group.className}
                          {group.period ? ` · ${group.period}` : ""}
                        </p>
                        {group.classCode && (
                          <p>Kode kelas: {group.classCode}</p>
                        )}
                      </div>
                      {group.status !== "active" && (
                        <Badge className="border-slate-200 bg-white text-slate-700">
                          {group.status_label || (group.status === "ended" ? "Berakhir" : group.status === "finalized" ? "Nilai difinalisasi" : "Arsip")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="course-material-stats">
                    <div>
                      <strong>{group.materials.length}</strong>
                      <span>Pertemuan</span>
                    </div>
                    <div>
                      <strong>{group.assignments.length}</strong>
                      <span>Tugas kelas</span>
                    </div>
                    <div>
                      <strong>{group.linkedAssignments.length}</strong>
                      <span>Terkait materi</span>
                    </div>
                  </div>
                  <div className="course-material-footer">
                    <p className="course-material-latest">
                      {group.latestMaterial?.title || "Belum ada materi"}
                    </p>
                    <Button
                      type="button"
                      onClick={() => openMaterialGroup(group.id)}
                      data-testid={`admin-material-course-open-${group.id}-button`}
                    >
                      <Eye /> Buka materi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="materials-page">
      <section
        className="meeting-hero"
        data-testid="admin-material-detail-hero"
      >
        <div>
          <Button
            type="button"
            variant="outline"
            className="mb-3"
            onClick={backToMaterialGroups}
            data-testid="admin-material-back-button"
          >
            <ArrowLeft /> Kembali
          </Button>
          <p className="meeting-overline">Detail mata kuliah</p>
          <h2
            className="font-display text-2xl font-semibold"
            data-testid="admin-material-detail-title"
          >
            {selectedGroup.courseName}
          </h2>
          <p className="meeting-description">
            {selectedGroup.className}
            {selectedGroup.period ? ` · ${selectedGroup.period}` : ""}
            {selectedGroup.classCode
              ? ` · Kode ${selectedGroup.classCode}`
              : ""}
          </p>
          {!selectedClassIsActive && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Kelas {selectedGroup.status_label || "sudah berakhir"}. Materi hanya dapat dilihat; perubahan baru tidak diperbolehkan.
            </p>
          )}
        </div>
        <div
          className="meeting-summary"
          data-testid="admin-material-detail-summary"
        >
          <div>
            <strong>{selectedGroup.materials.length}</strong>
            <span>Pertemuan</span>
          </div>
          <div>
            <strong>{selectedGroup.assignments.length}</strong>
            <span>Tugas kelas</span>
          </div>
          <div>
            <strong>{selectedGroup.linkedAssignments.length}</strong>
            <span>Terkait materi</span>
          </div>
        </div>
      </section>
      <div
        className="admin-material-detail-layout"
        data-testid="admin-material-detail-page"
      >
        <form
          className={`admin-material-form space-y-4 border bg-white p-5 ${!selectedClassIsActive ? "pointer-events-none opacity-60" : ""}`}
          data-testid="material-create-form"
          onSubmit={(event) => {
            if (!selectedClassIsActive) {
              event.preventDefault();
              toast.error("Kelas sudah berakhir dan bersifat read-only");
              return;
            }
            saveMaterial(event);
          }}
        >
          <h2
            className="font-display text-2xl font-semibold"
            data-testid="material-create-title"
          >
            {forms.material.id ? "Edit pertemuan" : "Materi pertemuan"}
          </h2>
          <div
            className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
            data-testid="material-selected-class-panel"
          >
            <p className="font-semibold">
              Kelas: {selectedGroup.courseName} · {selectedGroup.className}
            </p>
            <p>
              {selectedGroup.period || "Periode belum diisi"}
              {selectedGroup.classCode
                ? ` · Kode ${selectedGroup.classCode}`
                : ""}
            </p>
          </div>
          <Field id="material-title" label="Judul">
            <Input
              id="material-title"
              data-testid="material-title-input"
              value={forms.material.title}
              onChange={(e) =>
                setForms({
                  ...forms,
                  material: { ...forms.material, title: e.target.value },
                })
              }
            />
          </Field>
          <Field id="material-description" label="Deskripsi">
            <Textarea
              id="material-description"
              data-testid="material-description-input"
              value={forms.material.description}
              onChange={(e) =>
                setForms({
                  ...forms,
                  material: { ...forms.material, description: e.target.value },
                })
              }
            />
          </Field>
          <div
            className="assignment-file-zone"
            data-testid="material-upload-panel"
          >
            <Field id="material-attachment-upload" label="Upload file materi">
              <Input
                key={materialFileInputKey}
                id="material-attachment-upload"
                type="file"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.txt,.zip,.png,.jpg,.jpeg,.webp"
                data-testid="material-attachment-input"
                onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
              />
            </Field>
            <p className="text-sm text-slate-500">
              Dokumen, gambar, atau ZIP maksimal 25 MB. File yang dipilih akan
              menggantikan link materi.
            </p>
            {materialFile && (
              <div
                className="assignment-selected-files"
                data-testid="material-selected-file"
              >
                <span>
                  <Paperclip /> {materialFile.name}
                </span>
              </div>
            )}
            {!materialFile && editingMaterial?.attachment?.file_name && (
              <a
                href={authenticatedFileLink(editingMaterial.file_url, token)}
                target="_blank"
                rel="noreferrer"
                className="block text-sm font-semibold text-blue-700 underline"
                data-testid="material-current-file-link"
              >
                <Paperclip className="mr-1 inline h-4 w-4" />
                File saat ini: {editingMaterial.attachment.file_name}
              </a>
            )}
          </div>
          <Field id="material-file-url" label="Link materi (opsional)">
            <Input
              id="material-file-url"
              data-testid="material-file-url-input"
              value={forms.material.file_url}
              onChange={(e) =>
                setForms({
                  ...forms,
                  material: { ...forms.material, file_url: e.target.value },
                })
              }
              placeholder="https://... atau kosongkan jika mengunggah file"
            />
          </Field>
          <div
            className="space-y-3 border border-emerald-200 bg-emerald-50 p-4"
            data-testid="material-online-meeting-panel"
          >
            <Field id="material-meeting-type" label="Metode pertemuan">
              <select
                id="material-meeting-type"
                className="form-select"
                data-testid="material-meeting-type-select"
                value={forms.material.meeting_type || "offline"}
                onChange={(e) =>
                  setForms({
                    ...forms,
                    material: {
                      ...forms.material,
                      meeting_type: e.target.value,
                      meeting_url:
                        e.target.value === "online"
                          ? forms.material.meeting_url || ""
                          : "",
                    },
                  })
                }
              >
                <option value="offline">Luring / tanpa video meeting</option>
                <option value="online">Daring dengan Google Meet</option>
              </select>
            </Field>
            {(forms.material.meeting_type || "offline") === "online" && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    data-testid="material-generate-meet-button"
                    onClick={generateMaterialMeetLink}
                  >
                    <Video /> Generate link Google Meet
                  </Button>
                  {forms.material.meeting_url && (
                    <a
                      href={forms.material.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center text-sm font-semibold text-emerald-700 underline"
                      data-testid="material-preview-meet-link"
                    >
                      Tes link Meet
                    </a>
                  )}
                </div>
                <Field id="material-meeting-url" label="Link Google Meet">
                  <Input
                    id="material-meeting-url"
                    type="url"
                    data-testid="material-meeting-url-input"
                    value={forms.material.meeting_url || ""}
                    onChange={(e) =>
                      setForms({
                        ...forms,
                        material: {
                          ...forms.material,
                          meeting_url: e.target.value,
                        },
                      })
                    }
                    placeholder="https://meet.google.com/abc-defg-hij"
                  />
                </Field>
                <p className="text-xs text-emerald-800">
                  Link dapat dibuat otomatis atau ditempel manual. Mahasiswa
                  hanya melihat link setelah materi dipublikasikan.
                </p>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="material-create-submit-button">
              {forms.material.id ? <Pencil /> : <Plus />}{" "}
              {forms.material.id ? "Simpan perubahan" : "Publikasikan materi"}
            </Button>
            {forms.material.id && (
              <Button
                type="button"
                variant="outline"
                data-testid="material-cancel-edit-button"
                onClick={resetMaterial}
              >
                Batal
              </Button>
            )}
          </div>
        </form>
        <div className="space-y-4" data-testid="material-list">
          {selectedGroup.materials.length === 0 ? (
            <EmptyState
              title="Belum ada materi"
              description="Tambahkan materi pertama untuk mata kuliah ini."
            />
          ) : (
            selectedGroup.materials.map((material) => {
              const relatedAssignments = data.assignments.filter(
                (assignment) => assignment.material_id === material.id,
              );
              return (
                <Card
                  key={material.id}
                  className="rounded-md shadow-none"
                  data-testid={`material-card-${material.id}`}
                >
                  <CardContent className="p-5">
                    <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className="bg-blue-50 text-blue-700"
                          data-testid={`material-meeting-${material.id}`}
                        >
                          {material.meeting}
                        </Badge>
                        <Badge
                          variant="outline"
                          data-testid={`material-class-${material.id}`}
                        >
                          Kelas: {materialClassLabel(material)}
                        </Badge>
                      </div>
                      <div
                        className="flex flex-wrap gap-2"
                        data-testid={`material-actions-${material.id}`}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!selectedClassIsActive}
                          data-testid={`material-edit-${material.id}-button`}
                          onClick={() => editMaterial(material)}
                        >
                          <Pencil /> Edit
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={!selectedClassIsActive}
                          data-testid={`material-delete-${material.id}-button`}
                          onClick={() => deleteMaterial(material)}
                        >
                          <Trash2 /> Hapus
                        </Button>
                      </div>
                    </div>
                    <h3
                      className="font-display text-xl font-semibold"
                      data-testid={`material-title-${material.id}`}
                    >
                      {material.title}
                    </h3>
                    <p
                      className="mt-1 text-sm font-medium text-blue-700"
                      data-testid={`material-period-${material.id}`}
                    >
                      {[
                        material.academic_year,
                        material.semester,
                        material.class_code
                          ? `Kode ${material.class_code}`
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p
                      className="mt-2 text-sm text-slate-600"
                      data-testid={`material-description-${material.id}`}
                    >
                      {material.description}
                    </p>
                    {material.file_url && (
                      <a
                        href={authenticatedFileLink(material.file_url, token)}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block text-sm font-semibold text-blue-700 underline"
                        data-testid={`material-file-${material.id}-link`}
                      >
                        <Paperclip className="mr-1 inline h-4 w-4" />
                        {material.attachment?.file_name ||
                          "Buka lampiran materi"}
                      </a>
                    )}
                    {material.meeting_type === "online" &&
                      material.meeting_url && (
                        <a
                          href={material.meeting_url}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white"
                          data-testid={`material-meet-${material.id}-link`}
                        >
                          <Video className="h-4 w-4" /> Mulai Google Meet
                        </a>
                      )}
                    {relatedAssignments.length > 0 && (
                      <div
                        className="mt-4 space-y-2 border border-slate-200 bg-slate-50 p-3"
                        data-testid={`material-linked-assignments-${material.id}`}
                      >
                        <p
                          className="text-sm font-semibold"
                          data-testid={`material-linked-title-${material.id}`}
                        >
                          Tugas terkait materi ini
                        </p>
                        {relatedAssignments.map((assignment) => (
                          <div
                            key={assignment.id}
                            className="flex flex-wrap items-center justify-between gap-2 text-sm"
                            data-testid={`material-linked-assignment-${assignment.id}`}
                          >
                            <span
                              data-testid={`material-linked-assignment-title-${assignment.id}`}
                            >
                              {assignment.title}
                            </span>
                            <Badge
                              variant="outline"
                              data-testid={`material-linked-assignment-deadline-${assignment.id}`}
                            >
                              {fmtDate(assignment.deadline)}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                    <DiscussionThread material={material} token={token} />
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function materialMeetingNumber(material) {
  const match = String(material.meeting || "").match(/\d+/);
  return match ? Number(match[0]) : Number.MAX_SAFE_INTEGER;
}

function StudentMaterialsPage({
  materials,
  assignments,
  token,
  renderAssignmentCard,
}) {
  const orderedMaterials = useMemo(
    () =>
      [...materials].sort((left, right) => {
        const classComparison = materialClassLabel(left).localeCompare(
          materialClassLabel(right),
          "id",
        );
        if (classComparison) return classComparison;
        return materialMeetingNumber(left) - materialMeetingNumber(right);
      }),
    [materials],
  );
  const meetingMaterialIds = useMemo(
    () => new Set(materials.map((material) => material.id)),
    [materials],
  );
  const meetingAssignments = assignments.filter((assignment) =>
    meetingMaterialIds.has(assignment.material_id),
  );
  const assignmentsNeedingAction = meetingAssignments.filter(
    (assignment) => assignmentNeedsStudentAction(assignment),
  ).length;
  const groups = useMemo(() => {
    const itemsByClass = new Map();
    orderedMaterials.forEach((material) => {
      const key =
        material.class_id ||
        material.course_id ||
        material.course_name ||
        "tanpa-kelas";
      const existing = itemsByClass.get(key);
      if (existing) {
        existing.materials.push(material);
        return;
      }
      itemsByClass.set(key, {
        id: key,
        className: material.class_name || "Kelas",
        courseName: material.course_name || "Mata kuliah",
        classStatus: material.class_status || "",
        classStatusLabel: material.class_status_label || "",
        period: [material.academic_year, material.semester]
          .filter(Boolean)
          .join(" · "),
        materials: [material],
      });
    });
    return Array.from(itemsByClass.values()).map((group) => {
      const materialIds = new Set(
        group.materials.map((material) => material.id),
      );
      const linkedAssignments = assignments.filter((assignment) =>
        materialIds.has(assignment.material_id),
      );
      return {
        ...group,
        classStatus: group.classStatus || group.materials[0]?.class_status || "",
        classStatusLabel: group.classStatusLabel || group.materials[0]?.class_status_label || "",
        assignments: linkedAssignments,
        assignmentsNeedingAction: linkedAssignments.filter(
          (assignment) => assignmentNeedsStudentAction(assignment),
        ).length,
        latestMaterial: group.materials[group.materials.length - 1],
      };
    });
  }, [orderedMaterials, assignments]);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedMaterialId, setSelectedMaterialId] = useState("");
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const selectedMaterial =
    selectedGroup?.materials.find(
      (material) => material.id === selectedMaterialId,
    ) || selectedGroup?.materials[0];
  const selectedMaterialIdentifier = selectedMaterial?.id || "";
  const relatedAssignments = useMemo(
    () =>
      selectedMaterialIdentifier
        ? assignments.filter(
            (assignment) =>
              assignment.material_id === selectedMaterialIdentifier,
          )
        : [],
    [selectedMaterialIdentifier, assignments],
  );
  const selectedAssignment = relatedAssignments.find(
    (assignment) => assignment.id === selectedAssignmentId,
  );

  useEffect(() => {
    if (
      selectedGroupId &&
      !groups.some((group) => group.id === selectedGroupId)
    ) {
      setSelectedGroupId("");
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroup) {
      if (selectedMaterialId) setSelectedMaterialId("");
      return;
    }
    if (
      !selectedGroup.materials.some(
        (material) => material.id === selectedMaterialId,
      )
    ) {
      setSelectedMaterialId(selectedGroup.materials[0]?.id || "");
    }
  }, [selectedGroup, selectedMaterialId]);

  useEffect(() => {
    const selectedExists = relatedAssignments.some(
      (assignment) => assignment.id === selectedAssignmentId,
    );
    if (selectedExists) return;
    const actionable = relatedAssignments.find(
      (assignment) => assignmentNeedsStudentAction(assignment),
    );
    setSelectedAssignmentId(actionable?.id || relatedAssignments[0]?.id || "");
  }, [
    selectedMaterialIdentifier,
    assignments,
    selectedAssignmentId,
    relatedAssignments,
  ]);

  function openCourse(groupId) {
    setSelectedGroupId(groupId);
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToCourses() {
    setSelectedGroupId("");
    setSelectedMaterialId("");
    setSelectedAssignmentId("");
    if (typeof window !== "undefined")
      window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedGroup) {
    return (
      <div className="space-y-5" data-testid="student-material-page">
        <section className="meeting-hero" data-testid="student-meeting-hero">
          <div>
            <p className="meeting-overline">Materi mahasiswa</p>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="student-material-title"
            >
              Materi per mata kuliah
            </h2>
            <p className="meeting-description">
              Materi aktif dikelompokkan per mata kuliah agar daftar utama tetap
              ringkas.
            </p>
          </div>
          <div
            className="meeting-summary"
            data-testid="student-meeting-summary"
          >
            <div>
              <strong>{groups.length}</strong>
              <span>Mata kuliah</span>
            </div>
            <div>
              <strong>{materials.length}</strong>
              <span>Pertemuan</span>
            </div>
            <div className={assignmentsNeedingAction ? "attention" : ""}>
              <strong>{assignmentsNeedingAction}</strong>
              <span>Perlu dikerjakan</span>
            </div>
          </div>
        </section>
        {groups.length === 0 ? (
          <EmptyState
            title="Belum ada materi"
            description="Materi mata kuliah akan muncul di sini."
          />
        ) : (
          <div
            className="course-card-grid"
            data-testid="student-course-card-grid"
          >
            {groups.map((group) => (
              <Card
                key={group.id}
                className="course-material-card rounded-md shadow-none"
                data-testid={`student-course-card-${group.id}`}
              >
                <CardContent className="course-material-card-content">
                  <div className="course-material-card-main">
                    <span className="course-material-card-icon">
                      <BookOpen />
                    </span>
                    <div className="course-material-card-header">
                      <div>
                        <h3
                          data-testid={`student-material-class-title-${group.id}`}
                        >
                          {group.courseName}
                        </h3>
                        <p
                          data-testid={`student-material-class-period-${group.id}`}
                        >
                          {group.className}
                          {group.period ? ` · ${group.period}` : ""}
                        </p>
                      </div>
                      {group.assignmentsNeedingAction > 0 && (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                          {group.assignmentsNeedingAction} perlu dikerjakan
                        </Badge>
                      )}
                      {group.classStatus && group.classStatus !== "active" && (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                          {group.classStatusLabel || group.classStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="course-material-stats">
                    <div>
                      <strong>{group.materials.length}</strong>
                      <span>Pertemuan</span>
                    </div>
                    <div>
                      <strong>{group.assignments.length}</strong>
                      <span>Tugas terkait</span>
                    </div>
                    <div>
                      <strong>
                        {group.latestMaterial &&
                        materialMeetingNumber(group.latestMaterial) !==
                          Number.MAX_SAFE_INTEGER
                          ? materialMeetingNumber(group.latestMaterial)
                          : "-"}
                      </strong>
                      <span>Terakhir</span>
                    </div>
                  </div>
                  <div className="course-material-footer">
                    <p className="course-material-latest">
                      {group.latestMaterial?.title || "Belum ada materi"}
                    </p>
                    <Button
                      type="button"
                      onClick={() => openCourse(group.id)}
                      data-testid={`student-course-open-${group.id}-button`}
                    >
                      <Eye /> Buka materi
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="student-material-page">
      <section className="meeting-hero" data-testid="student-meeting-hero">
        <div>
          <Button
            type="button"
            variant="outline"
            className="mb-3"
            onClick={backToCourses}
            data-testid="student-course-back-button"
          >
            <ArrowLeft /> Kembali
          </Button>
          <p className="meeting-overline">Detail mata kuliah</p>
          <h2
            className="font-display text-2xl font-semibold"
            data-testid="student-material-title"
          >
            {selectedGroup.courseName}
          </h2>
          <p className="meeting-description">
            {selectedGroup.className}
            {selectedGroup.period ? ` · ${selectedGroup.period}` : ""}
          </p>
          {selectedGroup.classStatus && selectedGroup.classStatus !== "active" && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Kelas {selectedGroup.classStatusLabel || "sudah berakhir"}. Materi dan riwayat tugas tetap dapat dilihat; pengumpulan baru ditutup.
            </p>
          )}
        </div>
        <div className="meeting-summary" data-testid="student-meeting-summary">
          <div>
            <strong>{selectedGroup.materials.length}</strong>
            <span>Pertemuan</span>
          </div>
          <div>
            <strong>{selectedGroup.assignments.length}</strong>
            <span>Tugas terkait</span>
          </div>
          <div
            className={
              selectedGroup.assignmentsNeedingAction ? "attention" : ""
            }
          >
            <strong>{selectedGroup.assignmentsNeedingAction}</strong>
            <span>Perlu dikerjakan</span>
          </div>
        </div>
      </section>
      <div
        className="meeting-layout course-detail-layout"
        data-testid="student-course-detail-page"
      >
        <aside className="meeting-index" data-testid="student-meeting-index">
          <p className="meeting-index-title">Daftar pertemuan</p>
          <section
            className="meeting-course"
            data-testid={`student-material-class-${selectedGroup.id}`}
          >
            <h3
              data-testid={`student-material-class-title-${selectedGroup.id}`}
            >
              {selectedGroup.courseName}
            </h3>
            <p
              data-testid={`student-material-class-period-${selectedGroup.id}`}
            >
              {selectedGroup.className}
              {selectedGroup.period ? ` · ${selectedGroup.period}` : ""}
            </p>
            {selectedGroup.materials.map((material) => {
              const related = assignments.filter(
                (assignment) => assignment.material_id === material.id,
              );
              const needsAction = related.some(
                (assignment) => assignmentNeedsStudentAction(assignment),
              );
              return (
                <div key={material.id} className="meeting-index-item">
                  <button
                    type="button"
                    className={`meeting-selector ${selectedMaterial?.id === material.id ? "active" : ""}`}
                    onClick={() => setSelectedMaterialId(material.id)}
                    data-testid={`student-meeting-select-${material.id}-button`}
                  >
                    <span>{material.meeting}</span>
                    <strong>{material.title}</strong>
                    <small>
                      {related.length
                        ? `${related.length} tugas terlampir`
                        : "Materi saja"}
                    </small>
                    {needsAction && (
                      <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                        Perlu dikerjakan
                      </Badge>
                    )}
                  </button>
                </div>
              );
            })}
          </section>
        </aside>
        {selectedMaterial && (
          <article
            className="meeting-detail-panel"
            data-testid={`student-material-item-${selectedMaterial.id}`}
          >
            <header className="meeting-detail-header">
              <div>
                <Badge
                  className="mb-3 bg-blue-50 text-blue-700"
                  data-testid={`student-material-meeting-${selectedMaterial.id}`}
                >
                  {selectedMaterial.meeting}
                </Badge>
                <h3
                  className="font-display text-2xl font-semibold"
                  data-testid={`student-material-name-${selectedMaterial.id}`}
                >
                  {selectedMaterial.title}
                </h3>
                <p className="mt-1 text-sm font-medium text-blue-700">
                  {materialClassLabel(selectedMaterial)}
                </p>
              </div>
              <Badge variant="outline">{relatedAssignments.length} tugas</Badge>
            </header>
            <p className="meeting-material-description">
              {selectedMaterial.description || "Tidak ada deskripsi materi."}
            </p>
            <div className="meeting-resource-grid">
              <section
                className="meeting-resource-panel"
                data-testid={`student-material-resources-${selectedMaterial.id}`}
              >
                <h4>
                  <BookOpen /> Materi dilampirkan
                </h4>
                {selectedMaterial.file_url && (
                  <a
                    className="meeting-resource-link"
                    href={authenticatedFileLink(
                      selectedMaterial.file_url,
                      token,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`student-material-file-${selectedMaterial.id}-link`}
                  >
                    <FileText />{" "}
                    {selectedMaterial.attachment?.file_name ||
                      "Buka materi pembelajaran"}
                  </a>
                )}
                {selectedMaterial.video_url && (
                  <a
                    className="meeting-resource-link"
                    href={selectedMaterial.video_url}
                    target="_blank"
                    rel="noreferrer"
                    data-testid={`student-material-video-${selectedMaterial.id}-link`}
                  >
                    <Eye /> Tonton video materi
                  </a>
                )}
                {selectedMaterial.meeting_type === "online" &&
                  selectedMaterial.meeting_url && (
                    <a
                      className="meeting-resource-link"
                      href={selectedMaterial.meeting_url}
                      target="_blank"
                      rel="noreferrer"
                      data-testid={`student-material-meet-${selectedMaterial.id}-link`}
                    >
                      <Video /> Gabung Google Meet
                    </a>
                  )}
                {!selectedMaterial.file_url &&
                  !selectedMaterial.video_url &&
                  !selectedMaterial.meeting_url && (
                    <p>
                      Belum ada file, video, atau ruang meeting yang
                      dilampirkan.
                    </p>
                  )}
              </section>
              <section
                className="meeting-resource-panel task"
                data-testid={`student-material-tasks-${selectedMaterial.id}`}
              >
                <h4>
                  <ClipboardList /> Tugas dilampirkan
                </h4>
                {relatedAssignments.length === 0 ? (
                  <p>Belum ada tugas untuk pertemuan ini.</p>
                ) : (
                  <p>
                    {relatedAssignments.length} tugas tersedia. Instruksi dan
                    tempat pengumpulan ditampilkan di bawah.
                  </p>
                )}
              </section>
            </div>
            {relatedAssignments.length > 0 && (
              <section
                className="meeting-assignment-stack"
                data-testid={`student-material-linked-assignments-${selectedMaterial.id}`}
              >
                <h4 className="font-display text-xl font-semibold">
                  Pengerjaan tugas pertemuan ini
                </h4>
                <div
                  className="meeting-assignment-choices"
                  data-testid={`student-material-assignment-list-${selectedMaterial.id}`}
                >
                  {relatedAssignments.map((assignment) => (
                    <button
                      type="button"
                      key={assignment.id}
                      className={
                        selectedAssignment?.id === assignment.id ? "active" : ""
                      }
                      onClick={() => setSelectedAssignmentId(assignment.id)}
                      data-testid={`student-material-assignment-${assignment.id}-link`}
                    >
                      <strong>{assignment.title}</strong>
                      <span className="meeting-assignment-deadline">
                        {fmtDate(assignment.deadline)}
                      </span>
                      <Badge
                        className={statusClass(
                          assignment.my_submission?.status || "Belum Submit",
                        )}
                      >
                        {submissionStatusLabel(
                          assignment.my_submission?.status,
                        )}
                      </Badge>
                    </button>
                  ))}
                </div>
                {selectedAssignment && renderAssignmentCard(selectedAssignment)}
              </section>
            )}
            <DiscussionThread material={selectedMaterial} token={token} />
          </article>
        )}
      </div>
    </div>
  );
}

const AssignmentScheduleField = memo(function AssignmentScheduleField({
  id,
  label,
  value,
  onChange,
  description,
  emptyLabel,
  required = false,
  quickActions,
}) {
  return (
    <section className="assignment-schedule-card" data-testid={`${id}-panel`}>
      <div className="assignment-schedule-heading">
        <CalendarDays />
        <Label htmlFor={id} data-testid={`${id}-label`}>
          {label}
        </Label>
      </div>
      <p
        className={`assignment-schedule-status ${value ? "selected" : ""}`}
        data-testid={`${id}-summary`}
      >
        {value ? fmtDate(value) : emptyLabel}
      </p>
      <Input
        id={id}
        type="datetime-local"
        required={required}
        data-testid={`${id}-input`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <p className="assignment-schedule-help">{description}</p>
      <div className="assignment-schedule-actions">
        {quickActions.map((action) => (
          <Button
            key={action.label}
            size="sm"
            variant="outline"
            type="button"
            onClick={() => onChange(action.value())}
            data-testid={`${id}-${action.testid}-button`}
          >
            {action.label}
          </Button>
        ))}
      </div>
    </section>
  );
});
function AssignmentsPage({
  data,
  forms,
  setForms,
  createAssignment,
  sendReminder,
  assignmentFiles,
  setAssignmentFiles,
  assignmentFileInputKey,
  setAssignmentFileInputKey,
  token,
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const assignment = forms.assignment;
  const classGroups = useMemo(
    () =>
      data.classes.map((classItem) => {
        const groupAssignments = data.assignments.filter(
          (item) => item.class_id === classItem.id,
        );
        return {
          id: classItem.id,
          className: classItem.name || "Kelas",
          courseName: classItem.course_name || "Mata kuliah",
          period: [classItem.academic_year, classItem.semester]
            .filter(Boolean)
            .join(" · "),
          classCode: classItem.class_code || "",
          status: classItem.status || "",
          status_label: classItem.status_label || "",
          assignments: groupAssignments,
          scheduled: groupAssignments.filter((item) =>
            isFutureDate(item.published_at),
          ).length,
          linkedMaterials: groupAssignments.filter((item) => item.material_id)
            .length,
          latestAssignment: groupAssignments[groupAssignments.length - 1],
        };
      }),
    [data.classes, data.assignments],
  );
  const selectedGroup = classGroups.find(
    (group) => group.id === selectedClassId,
  );
  const selectedClassIsActive = selectedGroup?.status === "active";
  const selectedMaterials = data.materials.filter(
    (material) => material.class_id === selectedGroup?.id,
  );
  const scheduledAssignments = data.assignments.filter((item) =>
    isFutureDate(item.published_at),
  ).length;
  const linkedAssignments = data.assignments.filter(
    (item) => item.material_id,
  ).length;
  const updateAssignment = (changes) =>
    setForms({ ...forms, assignment: { ...assignment, ...changes } });
  const editingAssignment = selectedGroup?.assignments.find(
    (item) => item.id === assignment.id,
  );

  useEffect(() => {
    if (
      selectedClassId &&
      !classGroups.some((group) => group.id === selectedClassId)
    ) {
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
        assessment_category: "tugas",
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
        tolerance_hours:
          item.tolerance_hours ?? prev.assignment.tolerance_hours ?? 0,
        allowed_formats: assignmentAllowedFormats(item).join(","),
        max_file_size_mb: assignmentMaxSubmissionMb(item),
        rubric:
          Array.isArray(item.rubric) && item.rubric.length
            ? item.rubric
            : defaultAssignmentRubric(),
        assignment_type: item.assignment_type || "individu",
        assessment_category: item.assessment_category || "tugas",
        allow_revision: item.allow_revision !== false,
        is_practicum: Boolean(item.is_practicum),
        practicum_goal: item.practicum_goal || "",
        practicum_tools: item.practicum_tools || "",
        practicum_steps: Array.isArray(item.practicum_steps)
          ? item.practicum_steps.join("\n")
          : item.practicum_steps || "",
        required_screenshot: Boolean(item.required_screenshot),
        late_penalty_per_day:
          item.late_penalty_per_day ??
          prev.assignment.late_penalty_per_day ??
          0,
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
    return (
      <div className="space-y-5" data-testid="assignments-page">
        <section className="meeting-hero" data-testid="admin-assignment-hero">
          <div>
            <p className="meeting-overline">Tugas admin</p>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="admin-assignment-title"
            >
              Tugas per mata kuliah
            </h2>
            <p className="meeting-description">
              Pilih mata kuliah untuk membuat tugas dan melihat daftar tugas
              pada kelas tersebut.
            </p>
          </div>
          <div
            className="meeting-summary"
            data-testid="admin-assignment-summary"
          >
            <div>
              <strong>{classGroups.length}</strong>
              <span>Mata kuliah</span>
            </div>
            <div>
              <strong>{data.assignments.length}</strong>
              <span>Tugas</span>
            </div>
            <div>
              <strong>{scheduledAssignments}</strong>
              <span>Terjadwal</span>
            </div>
          </div>
        </section>
        {classGroups.length === 0 ? (
          <EmptyState
            title="Belum ada kelas"
            description="Buat kelas terlebih dahulu sebelum membuat tugas."
          />
        ) : (
          <div
            className="course-card-grid"
            data-testid="admin-assignment-course-grid"
          >
            {classGroups.map((group) => (
              <Card
                key={group.id}
                className="course-material-card rounded-md shadow-none"
                data-testid={`admin-assignment-course-card-${group.id}`}
              >
                <CardContent className="course-material-card-content">
                  <div className="course-material-card-main">
                    <span className="course-material-card-icon">
                      <ClipboardList />
                    </span>
                    <div className="course-material-card-header">
                      <div>
                        <h3
                          data-testid={`admin-assignment-course-title-${group.id}`}
                        >
                          {group.courseName}
                        </h3>
                        <p
                          data-testid={`admin-assignment-course-period-${group.id}`}
                        >
                          {group.className}
                          {group.period ? ` · ${group.period}` : ""}
                        </p>
                        {group.classCode && (
                          <p>Kode kelas: {group.classCode}</p>
                        )}
                      </div>
                      {group.status !== "active" && (
                        <Badge className="border-slate-200 bg-white text-slate-700">
                          {group.status_label || (group.status === "ended" ? "Berakhir" : group.status === "finalized" ? "Nilai difinalisasi" : "Arsip")}
                        </Badge>
                      )}
                      {group.scheduled > 0 && (
                        <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                          {group.scheduled} terjadwal
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="course-material-stats">
                    <div>
                      <strong>{group.assignments.length}</strong>
                      <span>Tugas</span>
                    </div>
                    <div>
                      <strong>{group.linkedMaterials}</strong>
                      <span>Terkait materi</span>
                    </div>
                    <div>
                      <strong>{group.scheduled}</strong>
                      <span>Terjadwal</span>
                    </div>
                  </div>
                  <div className="course-material-footer">
                    <p className="course-material-latest">
                      {group.latestAssignment?.title || "Belum ada tugas"}
                    </p>
                    <Button
                      type="button"
                      onClick={() => openAssignmentGroup(group.id)}
                      data-testid={`admin-assignment-course-open-${group.id}-button`}
                    >
                      <Eye /> Buka tugas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="assignments-page">
      <section
        className="meeting-hero"
        data-testid="admin-assignment-detail-hero"
      >
        <div>
          <Button
            type="button"
            variant="outline"
            className="mb-3"
            onClick={backToAssignmentGroups}
            data-testid="admin-assignment-back-button"
          >
            <ArrowLeft /> Kembali
          </Button>
          <p className="meeting-overline">Detail mata kuliah</p>
          <h2
            className="font-display text-2xl font-semibold"
            data-testid="admin-assignment-detail-title"
          >
            {selectedGroup.courseName}
          </h2>
          <p className="meeting-description">
            {selectedGroup.className}
            {selectedGroup.period ? ` · ${selectedGroup.period}` : ""}
            {selectedGroup.classCode
              ? ` · Kode ${selectedGroup.classCode}`
              : ""}
          </p>
          {!selectedClassIsActive && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Kelas {selectedGroup.status_label || "sudah berakhir"}. Tugas hanya dapat dilihat; pembuatan dan perubahan tugas ditutup.
            </p>
          )}
        </div>
        <div
          className="meeting-summary"
          data-testid="admin-assignment-detail-summary"
        >
          <div>
            <strong>{selectedGroup.assignments.length}</strong>
            <span>Tugas</span>
          </div>
          <div>
            <strong>{selectedGroup.linkedMaterials}</strong>
            <span>Terkait materi</span>
          </div>
          <div>
            <strong>{selectedGroup.scheduled}</strong>
            <span>Terjadwal</span>
          </div>
        </div>
      </section>
      <div
        className="admin-material-detail-layout"
        data-testid="admin-assignment-detail-page"
      >
        <form
          className={`admin-material-form space-y-4 border bg-white p-5 ${!selectedClassIsActive ? "pointer-events-none opacity-60" : ""}`}
          data-testid="assignment-create-form"
          onSubmit={(event) => {
            if (!selectedClassIsActive) {
              event.preventDefault();
              toast.error("Kelas sudah berakhir dan bersifat read-only");
              return;
            }
            createAssignment(event);
          }}
        >
          <div>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="assignment-create-title"
            >
              {assignment.id ? "Edit tugas" : "Buat tugas"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {assignment.id
                ? "Perubahan hanya memperbarui informasi tugas. Submission mahasiswa yang sudah masuk tetap tersimpan."
                : "Tugas akan masuk ke kelas yang sedang dibuka."}
            </p>
          </div>
          <div
            className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800"
            data-testid="assignment-selected-class-panel"
          >
            <p className="font-semibold">
              Kelas: {selectedGroup.courseName} · {selectedGroup.className}
            </p>
            <p>
              {selectedGroup.period || "Periode belum diisi"}
              {selectedGroup.classCode
                ? ` · Kode ${selectedGroup.classCode}`
                : ""}
            </p>
          </div>
          <Field id="assignment-title" label="Judul">
            <Input
              id="assignment-title"
              required
              placeholder="Masukkan judul tugas"
              data-testid="assignment-title-input"
              value={assignment.title}
              onChange={(e) => updateAssignment({ title: e.target.value })}
            />
          </Field>
          <Field id="assignment-description" label="Instruksi">
            <Textarea
              id="assignment-description"
              required
              placeholder="Tuliskan instruksi pengerjaan"
              data-testid="assignment-description-input"
              value={assignment.description}
              onChange={(e) =>
                updateAssignment({ description: e.target.value })
              }
            />
          </Field>
          <Field id="assignment-assessment-category" label="Komponen nilai">
            <select
              id="assignment-assessment-category"
              className="form-select"
              data-testid="assignment-assessment-category-select"
              value={assignment.assessment_category || "tugas"}
              onChange={(e) =>
                updateAssignment({ assessment_category: e.target.value })
              }
            >
              <option value="tugas">Tugas — masuk ke bobot Tugas</option>
              <option value="uts">UTS — masuk ke bobot UTS</option>
              <option value="uas">UAS — masuk ke bobot UAS</option>
            </select>
          </Field>
          <Field id="assignment-attachment-link" label="Lampiran link">
            <Input
              id="assignment-attachment-link"
              type="url"
              placeholder="https://drive.google.com/..."
              data-testid="assignment-attachment-link-input"
              value={assignment.attachment_link || ""}
              onChange={(e) =>
                updateAssignment({ attachment_link: e.target.value })
              }
            />
          </Field>
          <div className="grid gap-4 lg:grid-cols-2">
            <AssignmentScheduleField
              id="assignment-published-at"
              label="Tanggal tayang"
              value={assignment.published_at}
              onChange={(value) => updateAssignment({ published_at: value })}
              emptyLabel="Langsung tayang setelah disimpan"
              description="Kosongkan bila tugas dapat langsung dilihat mahasiswa."
              quickActions={[
                { label: "Langsung tayang", testid: "now", value: () => "" },
                {
                  label: "1 jam lagi",
                  testid: "hour",
                  value: () => toLocalDateTimeValue(Date.now() + 3600000),
                },
              ]}
            />
            <AssignmentScheduleField
              id="assignment-deadline"
              label="Deadline pengumpulan"
              value={assignment.deadline}
              onChange={(value) => updateAssignment({ deadline: value })}
              emptyLabel="Pilih batas pengumpulan"
              description="Deadline wajib ditentukan sebelum tugas dibuat."
              required
              quickActions={[
                {
                  label: "Besok",
                  testid: "tomorrow",
                  value: () => toLocalDateTimeValue(Date.now() + 86400000),
                },
                {
                  label: "7 hari lagi",
                  testid: "week",
                  value: () => toLocalDateTimeValue(Date.now() + 7 * 86400000),
                },
              ]}
            />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Field id="assignment-formats" label="Format jawaban mahasiswa">
              <Input
                id="assignment-formats"
                data-testid="assignment-formats-input"
                value={assignment.allowed_formats}
                onChange={(e) =>
                  updateAssignment({ allowed_formats: e.target.value })
                }
              />
            </Field>
            <Field
              id="assignment-max-file-size"
              label="Maksimal upload per file (MB)"
            >
              <Input
                id="assignment-max-file-size"
                type="number"
                min="1"
                step="0.5"
                data-testid="assignment-max-file-size-input"
                value={
                  assignment.max_file_size_mb || DEFAULT_SUBMISSION_MAX_FILE_MB
                }
                onChange={(e) =>
                  updateAssignment({ max_file_size_mb: e.target.value })
                }
              />
            </Field>
          </div>
          <Field id="assignment-material-link" label="Kaitkan dengan materi">
            <select
              id="assignment-material-link"
              className="form-select"
              data-testid="assignment-material-link-select"
              value={assignment.material_id}
              onChange={(e) =>
                updateAssignment({ material_id: e.target.value })
              }
            >
              <option value="">Tanpa materi terkait</option>
              {selectedMaterials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.meeting} · {m.title}
                </option>
              ))}
            </select>
          </Field>
          <label
            className="flex items-center gap-2 text-sm"
            data-testid="assignment-close-deadline-label"
          >
            <input
              type="checkbox"
              data-testid="assignment-close-deadline-checkbox"
              checked={assignment.close_after_deadline}
              onChange={(e) =>
                updateAssignment({ close_after_deadline: e.target.checked })
              }
            />{" "}
            Tutup pengiriman setelah deadline
          </label>
          <label
            className="flex items-center gap-2 text-sm"
            data-testid="assignment-practicum-toggle-label"
          >
            <input
              type="checkbox"
              data-testid="assignment-practicum-checkbox"
              checked={assignment.is_practicum}
              onChange={(e) =>
                updateAssignment({ is_practicum: e.target.checked })
              }
            />{" "}
            Mode praktikum
          </label>
          {assignment.is_practicum && (
            <div
              className="space-y-3 border border-slate-200 bg-slate-50 p-4"
              data-testid="assignment-practicum-fields"
            >
              <Field id="assignment-practicum-goal" label="Tujuan praktikum">
                <Input
                  id="assignment-practicum-goal"
                  data-testid="assignment-practicum-goal-input"
                  value={assignment.practicum_goal}
                  onChange={(e) =>
                    updateAssignment({ practicum_goal: e.target.value })
                  }
                />
              </Field>
              <Field id="assignment-practicum-tools" label="Alat dan bahan">
                <Input
                  id="assignment-practicum-tools"
                  data-testid="assignment-practicum-tools-input"
                  value={assignment.practicum_tools}
                  onChange={(e) =>
                    updateAssignment({ practicum_tools: e.target.value })
                  }
                />
              </Field>
            </div>
          )}
          <div
            className="assignment-file-zone"
            data-testid="assignment-files-panel"
          >
            <Field
              id="assignment-attachments"
              label={assignment.id ? "Tambah lampiran soal" : "Lampiran soal"}
            >
              <Input
                key={assignmentFileInputKey}
                id="assignment-attachments"
                type="file"
                multiple
                accept=".pdf,.doc,.docx"
                data-testid="assignment-attachments-input"
                onChange={(e) =>
                  setAssignmentFiles(Array.from(e.target.files || []))
                }
              />
            </Field>
            <p className="text-sm text-slate-500">
              {assignment.id
                ? "File baru akan ditambahkan ke lampiran tugas. Lampiran lama tetap tersedia."
                : "Pilih beberapa file PDF atau Word sekaligus. Semua file akan tampil pada tugas mahasiswa."}
            </p>
            {assignment.id && editingAssignment?.attachments?.length > 0 && (
              <div
                className="assignment-selected-files"
                data-testid="assignment-current-attachments"
              >
                <p className="font-semibold">Lampiran saat ini</p>
                {editingAssignment.attachments.map((file) => (
                  <a
                    key={file.file_id}
                    href={authenticatedFileLink(file.file_url, token)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Paperclip /> {file.file_name}
                  </a>
                ))}
              </div>
            )}
            {assignmentFiles.length > 0 && (
              <div
                className="assignment-selected-files"
                data-testid="assignment-selected-files"
              >
                <p className="font-semibold">
                  {assignmentFiles.length} file dipilih
                </p>
                {assignmentFiles.map((file) => (
                  <span key={`${file.name}-${file.size}`}>
                    <Paperclip /> {file.name}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button data-testid="assignment-create-submit-button">
              {assignment.id ? <Pencil /> : <Plus />}{" "}
              {assignment.id ? "Simpan perubahan" : "Buat tugas"}
            </Button>
            {assignment.id && (
              <Button
                type="button"
                variant="outline"
                data-testid="assignment-cancel-edit-button"
                onClick={() => resetAssignmentForm(selectedGroup.id)}
              >
                Batal
              </Button>
            )}
          </div>
        </form>
        <div className="space-y-4" data-testid="assignment-list">
          {selectedGroup.assignments.length === 0 ? (
            <EmptyState
              title="Belum ada tugas"
              description="Tambahkan tugas pertama untuk mata kuliah ini."
            />
          ) : (
            selectedGroup.assignments.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden rounded-md shadow-none"
                data-testid={`assignment-card-${item.id}`}
              >
                {item.is_practicum && (
                  <img
                    src={practicumCover}
                    alt="Mode praktikum"
                    className="h-36 w-full object-cover"
                    loading="lazy"
                    data-testid={`assignment-practicum-image-${item.id}`}
                  />
                )}
                <CardContent className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <Badge
                        className="bg-slate-100 text-slate-700"
                        data-testid={`assignment-class-name-${item.id}`}
                      >
                        {item.class_name}
                      </Badge>
                      <Badge
                        className="ml-2 border-blue-200 bg-blue-50 text-blue-700"
                        data-testid={`assignment-assessment-category-${item.id}`}
                      >
                        {(item.assessment_category || "tugas").toUpperCase()}
                      </Badge>
                      <Badge
                        className={
                          isFutureDate(item.published_at)
                            ? "ml-2 bg-amber-50 text-amber-700 border-amber-200"
                            : "ml-2 bg-emerald-50 text-emerald-700 border-emerald-200"
                        }
                        data-testid={`assignment-publish-status-${item.id}`}
                      >
                        {isFutureDate(item.published_at)
                          ? `Tayang ${fmtDate(item.published_at)}`
                          : "Sudah tayang"}
                      </Badge>
                      <h3
                        className="mt-3 font-display text-xl font-semibold"
                        data-testid={`assignment-title-${item.id}`}
                      >
                        {item.title}
                      </h3>
                      <p
                        className="text-sm text-slate-600"
                        data-testid={`assignment-deadline-${item.id}`}
                      >
                        {fmtDate(item.deadline)} ·{" "}
                        {item.close_after_deadline
                          ? "Tutup setelah deadline"
                          : "Boleh terlambat"}
                      </p>
                      {!isFutureDate(item.published_at) && (
                        <DeadlineCountdown
                          deadline={item.deadline}
                          testid={`assignment-deadline-countdown-${item.id}`}
                        />
                      )}
                    </div>
                    <div
                      className="flex flex-wrap gap-2"
                      data-testid={`assignment-actions-${item.id}`}
                    >
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        data-testid={`assignment-edit-${item.id}-button`}
                        onClick={() => editAssignment(item)}
                      >
                        <Pencil /> Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        data-testid={`assignment-send-reminder-${item.id}-button`}
                        onClick={() => sendReminder(item.id)}
                      >
                        <Bell /> Reminder
                      </Button>
                    </div>
                  </div>
                  <p
                    className="mt-3 text-sm"
                    data-testid={`assignment-description-${item.id}`}
                  >
                    {item.description}
                  </p>
                  {item.attachment_link && (
                    <a
                      href={normalizedExternalLink(item.attachment_link)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center gap-2 text-sm font-semibold text-blue-700 underline"
                      data-testid={`assignment-attachment-link-${item.id}`}
                    >
                      <Paperclip className="h-4 w-4" />
                      Lampiran link tugas
                    </a>
                  )}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {item.rubric?.map((rubric) => (
                      <Badge
                        key={rubric.criterion}
                        variant="outline"
                        data-testid={`assignment-rubric-${item.id}-${rubric.criterion}`}
                      >
                        {rubric.criterion}: {rubric.weight}%
                      </Badge>
                    ))}
                  </div>
                  {item.attachments?.length > 0 && (
                    <div
                      className="mt-4 space-y-2"
                      data-testid={`assignment-attachments-${item.id}`}
                    >
                      <p className="text-sm font-semibold">
                        Lampiran soal ({item.attachments.length})
                      </p>
                      {item.attachments.map((file) => (
                        <a
                          key={file.file_id}
                          href={authenticatedFileLink(file.file_url, token)}
                          target="_blank"
                          rel="noreferrer"
                          className="block text-sm font-semibold text-blue-700 underline"
                          data-testid={`assignment-attachment-${file.file_id}-link`}
                        >
                          {file.file_name}
                        </a>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const FilePreviewPanel = memo(function FilePreviewPanel({
  previewTarget,
  previewDoc,
  previewError,
  previewBusy,
  token,
  onClose,
}) {
  const id = fileId(previewTarget?.file);
  const encodedToken = encodeURIComponent(token);
  const inlineSrc = id
    ? `${API}/files/${id}/inline?token=${encodeURIComponent(token)}`
    : "";
  const downloadSrc = id
    ? `${API}/files/${id}/download?token=${encodedToken}`
    : "";
  const openInline = () => {
    if (inlineSrc) window.open(inlineSrc, "_blank", "noopener,noreferrer");
  };
  const openDownload = () => {
    if (downloadSrc) window.open(downloadSrc, "_blank", "noopener,noreferrer");
  };
  return (
    <Card
      className="rounded-md shadow-none"
      data-testid="submission-preview-card"
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle data-testid="submission-preview-title">
              Preview tugas
            </CardTitle>
            <p
              className="mt-1 text-sm text-slate-500"
              data-testid="submission-preview-file-name"
            >
              {previewTarget?.file?.file_name ||
                previewDoc?.file_name ||
                "File submission"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="submission-preview-open-tab-button"
              disabled={!id}
              onClick={openInline}
            >
              <Eye /> Tab baru
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="submission-preview-download-button"
              disabled={!id}
              onClick={openDownload}
            >
              <Download /> Download
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              data-testid="submission-preview-close-button"
              onClick={onClose}
            >
              Tutup
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {previewBusy && (
          <p
            className="text-sm text-slate-500"
            data-testid="submission-preview-loading"
          >
            Memuat preview...
          </p>
        )}
        {previewError && (
          <p
            className="border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            data-testid="submission-preview-error"
          >
            {previewError}
          </p>
        )}
        {!previewBusy &&
          !previewError &&
          previewDoc?.render === "inline" &&
          previewDoc.kind === "image" && (
            <img
              src={inlineSrc}
              alt={previewDoc.file_name}
              className="max-h-[72vh] w-full object-contain"
              data-testid="submission-preview-image"
            />
          )}
        {!previewBusy &&
          !previewError &&
          previewDoc?.render === "inline" &&
          previewDoc.kind === "pdf" && (
            <iframe
              title={previewDoc.file_name}
              src={inlineSrc}
              className="h-[72vh] w-full border border-slate-200 bg-white"
              data-testid="submission-preview-frame"
            />
          )}
        {!previewBusy && !previewError && previewDoc?.render === "html" && (
          <div
            className="document-preview max-h-[72vh] overflow-auto border border-slate-200 bg-white p-5 text-slate-900"
            data-testid="submission-preview-html"
            dangerouslySetInnerHTML={{ __html: previewDoc.html || "" }}
          />
        )}
        {!previewBusy &&
          !previewError &&
          previewDoc?.render === "unsupported" && (
            <div
              className="border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800"
              data-testid="submission-preview-unsupported"
            >
              <FileText className="mb-2 h-5 w-5" />
              <p>{previewDoc.message}</p>
            </div>
          )}
      </CardContent>
    </Card>
  );
});

function GradingPage({
  data,
  forms,
  setForms,
  gradeSubmission,
  bulkGradeSubmissions,
  markReviewed,
  requestRevision,
  token,
}) {
  const progress = useActionProgress();
  const [gradeRows, setGradeRows] = useState({});
  const [filter, setFilter] = useState({
    assignment_id: "",
    status: "all",
    query: "",
  });
  const [selectedClassId, setSelectedClassId] = useState("");
  const [previewTarget, setPreviewTarget] = useState(null);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [previewBusy, setPreviewBusy] = useState(false);
  const [previewError, setPreviewError] = useState("");
  const initializedClassRef = useRef("");
  const classOptions = useMemo(() => data.classes || [], [data.classes]);
  const selectedClass = classOptions.find((c) => c.id === selectedClassId);
  const gradingReadOnly = Boolean(selectedClass && selectedClass.allows_grading === false);

  const classGroups = useMemo(() => {
    const map = new Map();
    (data.assignments || []).forEach((a) => {
      const cid = a.class_id || "tanpa";
      if (!map.has(cid))
        map.set(cid, {
          classId: cid,
          courseName: a.course_name || "Mapel",
          className: a.class_name || "Kelas",
          status: a.class_status || "",
          statusLabel: a.class_status_label || "",
          assignments: 0,
          total: 0,
          ungraded: 0,
          graded: 0,
        });
      const g = map.get(cid);
      g.assignments += 1;
    });
    (data.submissions || []).forEach((s) => {
      const assignment = (data.assignments || []).find(
        (a) => a.id === s.assignment_id,
      );
      if (!assignment) return;
      const cid = assignment.class_id || "tanpa";
      if (!map.has(cid))
        map.set(cid, {
          classId: cid,
          courseName: assignment.course_name || "Mapel",
          className: assignment.class_name || "Kelas",
          status: assignment.class_status || "",
          statusLabel: assignment.class_status_label || "",
          assignments: 0,
          total: 0,
          ungraded: 0,
          graded: 0,
        });
      const g = map.get(cid);
      if (
        ["Sudah Submit", "Terlambat", "Direvisi", "Dinilai"].includes(s.status)
      ) {
        g.total += 1;
        if (s.grade != null) g.graded += 1;
        else g.ungraded += 1;
      }
    });
    classOptions.forEach((c) => {
      if (!map.has(c.id))
        map.set(c.id, {
          classId: c.id,
          courseName: c.course_name || "Mapel",
          className: c.name || "Kelas",
          status: c.status || "",
          statusLabel: c.status_label || "",
          assignments: 0,
          total: 0,
          ungraded: 0,
          graded: 0,
        });
    });
    return Array.from(map.values()).map((group) => {
      const classDoc = classOptions.find((item) => item.id === group.classId);
      return classDoc
        ? { ...group, status: classDoc.status || group.status, statusLabel: classDoc.status_label || group.statusLabel }
        : group;
    }).sort((a, b) =>
      a.courseName.localeCompare(b.courseName, "id"),
    );
  }, [data.assignments, data.submissions, classOptions]);

  const selectedAssignments = useMemo(
    () =>
      (data.assignments || []).filter((a) => a.class_id === selectedClassId),
    [data.assignments, selectedClassId],
  );
  const classSubmissions = useMemo(() => {
    return (data.submissions || []).filter((s) => {
      const assignment = data.assignments.find((a) => a.id === s.assignment_id);
      return (
        ["Sudah Submit", "Terlambat", "Direvisi", "Dinilai"].includes(
          s.status,
        ) &&
        assignment &&
        assignment.class_id === selectedClassId
      );
    });
  }, [data.submissions, data.assignments, selectedClassId]);
  const ready = useMemo(() => {
    const query = filter.query.trim().toLowerCase();
    return classSubmissions
      .filter((s) => {
        const matchesAssignment =
          !filter.assignment_id || s.assignment_id === filter.assignment_id;
        const matchesStatus =
          filter.status === "all" ||
          (filter.status === "ungraded" && s.grade == null) ||
          (filter.status === "graded" && s.grade != null) ||
          (filter.status === "revision" &&
            s.review_status === "revision_requested");
        const matchesQuery =
          !query ||
          `${s.student_name || ""} ${s.student_nim || ""} ${s.assignment_title || ""}`
            .toLowerCase()
            .includes(query);
        return matchesAssignment && matchesStatus && matchesQuery;
      })
      .sort((a, b) => {
        if ((a.grade == null) !== (b.grade == null)) return a.grade == null ? -1 : 1;
        return new Date(b.submitted_at || 0) - new Date(a.submitted_at || 0);
      });
  }, [classSubmissions, filter]);
  const visibleAssignments = selectedAssignments.filter(
    (a) => !filter.assignment_id || a.id === filter.assignment_id,
  );
  const grouped = visibleAssignments
    .map((a) => ({
      assignment: a,
      rows: ready.filter((s) => s.assignment_id === a.id),
    }))
    .filter((group) => group.rows.length > 0);

  const selectedSubmission =
    ready.find((s) => s.id === forms.grade.submission_id) || null;
  const selectedAssignment = selectedAssignments.find(
    (a) => a.id === selectedSubmission?.assignment_id,
  );
  const updateRow = (id, patch) =>
    setGradeRows((current) => ({
      ...current,
      [id]: {
        score: current[id]?.score ?? "",
        feedback: current[id]?.feedback ?? "",
        revision_note: current[id]?.revision_note ?? "",
        ...patch,
      },
    }));
  const submitRows = () => {
    const grades = ready
      .filter(
        (s) =>
          gradeRows[s.id]?.score !== undefined && gradeRows[s.id]?.score !== "",
      )
      .map((s) => ({
        submission_id: s.id,
        score: Number(clampScoreInput(gradeRows[s.id].score)),
        feedback: gradeRows[s.id]?.feedback || "",
        revision_note: gradeRows[s.id]?.revision_note || "",
      }));
    bulkGradeSubmissions(grades);
  };

  useEffect(() => {
    const id = fileId(previewTarget?.file);
    if (!id) return;
    let cancelled = false;
    const operation = progress.begin(
      "Memuat preview tugas",
      previewTarget?.file?.file_name || "Mengambil lampiran...",
    );
    setPreviewBusy(true);
    setPreviewError("");
    setPreviewDoc(null);
    axios
      .get(`${API}/files/${id}/preview`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then(({ data: preview }) => {
        if (!cancelled) {
          setPreviewDoc(preview);
          progress.finish(operation, "Preview tugas siap");
        }
      })
      .catch((error) => {
        if (!cancelled) {
          const detail =
            error.response?.data?.detail || "Preview file gagal dimuat";
          setPreviewError(detail);
          progress.fail(operation, detail);
        }
      })
      .finally(() => {
        if (!cancelled) setPreviewBusy(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewTarget, token]);

  useEffect(() => {
    if (selectedClassId && !classOptions.some((c) => c.id === selectedClassId))
      setSelectedClassId("");
  }, [classOptions, selectedClassId]);

  useEffect(() => {
    if (!selectedClassId) {
      initializedClassRef.current = "";
      return;
    }
    const current = ready.find((s) => s.id === forms.grade.submission_id);
    if (initializedClassRef.current === selectedClassId && current) return;
    const next = current || ready[0];
    initializedClassRef.current = selectedClassId;
    setForms((current) => ({
      ...current,
      grade: {
        ...current.grade,
        submission_id: next?.id || "",
        score: next?.grade ?? "",
        feedback: next?.feedback || "",
        revision_note: next?.revision_note || "",
      },
    }));
  }, [selectedClassId, ready, forms.grade.submission_id, setForms]);

  function chooseSubmission(submission) {
    setForms((current) => ({
      ...current,
      grade: {
        ...current.grade,
        submission_id: submission.id,
        score: submission.grade ?? "",
        feedback: submission.feedback || "",
        revision_note: submission.revision_note || "",
      },
    }));
  }

  function openClass(classId) {
    setSelectedClassId(classId);
    setFilter({ assignment_id: "", status: "all", query: "" });
    setGradeRows({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function backToOverview() {
    setSelectedClassId("");
    setFilter({ assignment_id: "", status: "all", query: "" });
    setGradeRows({});
    setPreviewTarget(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedClass) {
    return (
      <div className="space-y-5" data-testid="grading-page">
        <section className="meeting-hero" data-testid="grading-hero">
          <div>
            <p className="meeting-overline">Penilaian</p>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="grading-overview-title"
            >
              Mulai dari kelas yang perlu ditinjau
            </h2>
            <p className="meeting-description">
              Submission yang belum dinilai ditampilkan sebagai prioritas agar
              pekerjaan koreksi lebih mudah dilanjutkan.
            </p>
          </div>
          <div
            className="meeting-summary"
            data-testid="grading-overview-summary"
          >
            <div>
              <strong>{classGroups.length}</strong>
              <span>Kelas</span>
            </div>
            <div className="attention">
              <strong>{(data.assignments || []).length}</strong>
              <span>Tugas</span>
            </div>
            <div>
              <strong>
                {classGroups.reduce((total, group) => total + group.ungraded, 0)}
              </strong>
              <span>Perlu dinilai</span>
            </div>
          </div>
        </section>
        {classGroups.length === 0 ? (
          <EmptyState
            title="Belum ada kelas"
            description="Buat kelas dan tugas terlebih dahulu."
          />
        ) : (
          <div className="grading-class-grid" data-testid="grading-class-grid">
            {classGroups.map((g) => {
              const completion = g.total
                ? Math.round((g.graded / g.total) * 100)
                : 0;
              return (
                <button
                  type="button"
                  key={g.classId}
                  className="grading-class-card"
                  data-testid={`grading-class-card-${g.classId}`}
                  onClick={() => openClass(g.classId)}
                >
                  <span className="grading-class-card-topline">
                    <span className="grading-class-card-icon">
                      <CheckCircle2 />
                    </span>
                    <span className="grading-class-card-copy">
                      <strong data-testid={`grading-class-course-${g.classId}`}>
                        {g.courseName}
                      </strong>
                      <small data-testid={`grading-class-name-${g.classId}`}>
                        {g.className}
                      </small>
                    </span>
                    <Badge
                      className={
                        g.status !== "active"
                          ? "border-slate-200 bg-slate-50 text-slate-700"
                          : g.ungraded > 0
                          ? "border-amber-200 bg-amber-50 text-amber-700"
                          : g.total > 0
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-slate-200 bg-slate-50 text-slate-700"
                      }
                    >
                      {g.status !== "active"
                        ? g.statusLabel || "Read-only"
                        : g.ungraded > 0
                        ? `${g.ungraded} antre`
                        : g.total > 0
                          ? "Selesai"
                          : "Kosong"}
                    </Badge>
                  </span>
                  <span
                    className="grading-class-card-meta"
                    data-testid={`grading-class-meta-${g.classId}`}
                  >
                    <span>{g.assignments} tugas</span>
                    <span>{g.total} submission</span>
                    <span>{g.graded} dinilai</span>
                  </span>
                  <span className="grading-progress-track" aria-hidden="true">
                    <span style={{ width: `${completion}%` }} />
                  </span>
                  <span className="grading-class-card-footer">
                    <span>{g.total ? `${completion}% selesai` : "Belum ada submission"}</span>
                    <strong>{g.total ? "Buka penilaian" : "Lihat kelas"}</strong>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="grading-detail-page">
      <section className="grading-detail-hero" data-testid="grading-detail-header">
        <Button
          variant="outline"
          size="sm"
          data-testid="grading-back-button"
          onClick={backToOverview}
        >
          <ArrowLeft /> Kembali
        </Button>
        <div className="grading-detail-heading">
          <p
            className="meeting-overline"
            data-testid="grading-detail-overline"
          >
            Ruang penilaian
          </p>
          <h2
            data-testid="grading-detail-title"
          >
            {selectedClass.course_name || "Mata kuliah"}
          </h2>
          <p>
            Kelas {selectedClass.name || "-"}
            {selectedClass.semester ? ` · ${selectedClass.semester}` : ""}
            {selectedClass.academic_year
              ? ` · ${selectedClass.academic_year}`
              : ""}
          </p>
          {gradingReadOnly && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Kelas {selectedClass.status_label || "sudah difinalisasi"}. Submission dan nilai tetap dapat dilihat, tetapi perubahan penilaian sudah dikunci.
            </p>
          )}
        </div>
        <div className="grading-detail-summary" data-testid="grading-detail-stats">
          <div>
            <strong>{classSubmissions.length}</strong>
            <span>Submission</span>
          </div>
          <div>
            <strong>{classSubmissions.filter((s) => s.grade == null).length}</strong>
            <span>Belum dinilai</span>
          </div>
          <div>
            <strong>{classSubmissions.filter((s) => s.grade != null).length}</strong>
            <span>Selesai</span>
          </div>
        </div>
      </section>
      <Card
        className="grading-filter-card rounded-md shadow-none"
        data-testid="grading-filter-card"
      >
        <CardContent className="grading-filter-content">
          <div className="grading-filter-heading">
            <span>1</span>
            <div>
              <strong>Pilih tugas dan status</strong>
              <p>Persempit antrean submission yang ingin dikerjakan.</p>
            </div>
          </div>
          <Field id="grading-filter-assignment" label="Tugas">
            <select
              id="grading-filter-assignment"
              className="form-select"
              data-testid="grading-filter-assignment-select"
              value={filter.assignment_id}
              onChange={(e) =>
                setFilter((current) => ({
                  ...current,
                  assignment_id: e.target.value,
                }))
              }
            >
              <option value="">Semua tugas</option>
              {selectedAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title}
                </option>
              ))}
            </select>
          </Field>
          <div className="grading-status-filter" aria-label="Filter status nilai">
            {[
              ["all", "Semua"],
              ["ungraded", "Belum dinilai"],
              ["graded", "Sudah dinilai"],
              ["revision", "Revisi"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                className={filter.status === value ? "active" : ""}
                aria-pressed={filter.status === value}
                onClick={() =>
                  setFilter((current) => ({ ...current, status: value }))
                }
              >
                {label}
              </button>
            ))}
          </div>
          <label className="grading-search" htmlFor="grading-search-input">
            <Search />
            <Input
              id="grading-search-input"
              data-testid="grading-search-input"
              aria-label="Cari submission"
              placeholder="Cari nama, NIM, atau tugas"
              value={filter.query}
              onChange={(e) =>
                setFilter((current) => ({ ...current, query: e.target.value }))
              }
            />
          </label>
        </CardContent>
      </Card>
      <div className="grading-workspace">
        <Card
          className="grading-queue-card rounded-md shadow-none"
          data-testid="submission-list-card"
        >
          <CardHeader className="grading-queue-header">
            <div className="grading-section-title">
              <span>2</span>
              <div>
                <CardTitle data-testid="submission-list-title">
                  Pilih mahasiswa
                </CardTitle>
                <p>{ready.length} submission pada filter ini</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="grading-queue-content">
            <select
              id="grading-submission"
              className="form-select grading-submission-jump"
              aria-label="Pilih submission mahasiswa"
              data-testid="grading-submission-select"
              value={selectedSubmission?.id || ""}
              onChange={(event) => {
                const submission = ready.find((s) => s.id === event.target.value);
                if (submission) chooseSubmission(submission);
              }}
            >
              {!ready.length && <option value="">Tidak ada submission</option>}
              {ready.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.student_name} — {s.assignment_title}
                </option>
              ))}
            </select>
            {ready.length === 0 ? (
              <div className="grading-queue-empty">
                <ClipboardList />
                <strong>Tidak ada submission</strong>
                <p>Ubah filter tugas, status, atau kata pencarian.</p>
              </div>
            ) : (
              <div className="grading-queue-list">
                {ready.map((submission) => {
                  const isSelected = selectedSubmission?.id === submission.id;
                  return (
                    <button
                      type="button"
                      key={submission.id}
                      className={`grading-queue-item ${isSelected ? "active" : ""}`}
                      data-testid={`submission-row-${submission.id}`}
                      aria-pressed={isSelected}
                      onClick={() => chooseSubmission(submission)}
                    >
                      <span className="grading-queue-item-topline">
                        <span>
                          <strong data-testid={`submission-student-${submission.id}`}>
                            {submission.student_name}
                          </strong>
                          <small>{submission.student_nim || "NIM belum tersedia"}</small>
                        </span>
                        <span
                          className={`grading-queue-score ${submission.grade == null ? "pending" : ""}`}
                          data-testid={`submission-grade-${submission.id}`}
                        >
                          {submission.grade ?? "—"}
                        </span>
                      </span>
                      <span
                        className="grading-queue-assignment"
                        data-testid={`submission-assignment-${submission.id}`}
                      >
                        {submission.assignment_title}
                      </span>
                      <span className="grading-queue-item-meta">
                        <Badge
                          className={statusClass(submission.status)}
                          data-testid={`submission-status-${submission.id}`}
                        >
                          {submissionStatusLabel(submission.status)}
                        </Badge>
                        <span data-testid={`submission-review-status-${submission.id}`}>
                          {reviewStatusLabel(submission.review_status)}
                        </span>
                        <span>{fmtDate(submission.submitted_at)}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <form
          className={`grading-editor ${gradingReadOnly ? "grading-editor-readonly" : ""}`}
          data-testid="grading-form"
          onSubmit={(event) => {
            if (gradingReadOnly) {
              event.preventDefault();
              toast.error("Nilai kelas ini sudah dikunci");
              return;
            }
            gradeSubmission(event);
          }}
        >
          <header className="grading-editor-header">
            <div className="grading-section-title">
              <span>3</span>
              <div>
                <p>Ruang kerja</p>
                <h2 data-testid="grading-form-title">
                  {selectedSubmission
                    ? `Nilai ${selectedSubmission.student_name}`
                    : "Pilih submission untuk dinilai"}
                </h2>
              </div>
            </div>
            {selectedSubmission && (
              <Badge className={statusClass(selectedSubmission.status)}>
                {reviewStatusLabel(selectedSubmission.review_status)}
              </Badge>
            )}
          </header>

          {!selectedSubmission ? (
            <div className="grading-editor-empty">
              <ClipboardList />
              <strong>Belum ada mahasiswa yang dipilih</strong>
              <p>Pilih submission dari antrean di sebelah kiri.</p>
            </div>
          ) : (
            <>
              <section className="grading-submission-summary">
                <div>
                  <span>Tugas</span>
                  <strong>{selectedSubmission.assignment_title}</strong>
                </div>
                <div>
                  <span>Waktu kirim</span>
                  <strong>{fmtDate(selectedSubmission.submitted_at)}</strong>
                  <small>{selectedSubmission.late_text || "Status waktu tidak tersedia"}</small>
                </div>
                <div>
                  <span>Revisi</span>
                  <strong>{selectedSubmission.revision_count || 0} kali</strong>
                </div>
              </section>

              {selectedSubmission.note && (
                <div className="grading-student-note">
                  <MessageSquare />
                  <div>
                    <strong>Catatan mahasiswa</strong>
                    <p>{selectedSubmission.note}</p>
                  </div>
                </div>
              )}

              <section className="grading-files" data-testid={`submission-file-${selectedSubmission.id}`}>
                <div className="grading-block-heading">
                  <div>
                    <strong>Lampiran jawaban</strong>
                    <p>Periksa file sebelum memberi nilai.</p>
                  </div>
                  <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                    {submissionFiles(selectedSubmission).length} file
                  </Badge>
                </div>
                {submissionFiles(selectedSubmission).length ? (
                  <div className="grading-file-list">
                    {submissionFiles(selectedSubmission).map((file) => (
                      <button
                        type="button"
                        key={fileId(file)}
                        className="grading-file-button"
                        data-testid={`submission-file-preview-${fileId(file)}-button`}
                        onClick={() => setPreviewTarget({ submission: selectedSubmission, file })}
                      >
                        <span className="grading-file-icon"><FileText /></span>
                        <span>
                          <strong>{file.file_name || "File submission"}</strong>
                          <small>{fileStatusLabel(file.upload_status)}</small>
                        </span>
                        <Eye />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="grading-files-empty">Tidak ada file terlampir.</p>
                )}
              </section>

              <section className="grading-score-block">
                <div className="grading-block-heading">
                  <div>
                    <strong>Nilai akhir</strong>
                    <p>Masukkan skor 0–100. Potongan keterlambatan diterapkan otomatis.</p>
                  </div>
                  {selectedSubmission.grade_predicate && (
                    <Badge
                      className="border-blue-200 bg-blue-50 text-blue-700"
                      data-testid={`submission-predicate-${selectedSubmission.id}`}
                    >
                      Predikat {selectedSubmission.grade_predicate}
                    </Badge>
                  )}
                </div>
                <div className="grading-score-input-wrap">
                  <Input
                    id="grading-score"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="0"
                    aria-label="Nilai akhir"
                    data-testid="grading-score-input"
                    disabled={gradingReadOnly}
                    value={forms.grade.score}
                    onChange={(e) =>
                      setForms((current) => ({
                        ...current,
                        grade: {
                          ...current.grade,
                          score: clampScoreInput(e.target.value),
                        },
                      }))
                    }
                  />
                  <span>/ 100</span>
                </div>
                {!!selectedAssignment?.rubric?.length && (
                  <div className="grading-rubric-summary">
                    <BookOpen />
                    <span>
                      Rubrik: {selectedAssignment.rubric
                        .map((item) => `${item.criterion} (${item.weight}%)`)
                        .join(" · ")}
                    </span>
                  </div>
                )}
              </section>

              <div className="grading-writing-grid">
                <Field id="grading-feedback" label="Feedback untuk mahasiswa">
                  <Textarea
                    id="grading-feedback"
                    rows={5}
                    placeholder="Jelaskan bagian yang sudah baik dan yang perlu diperbaiki."
                    data-testid="grading-feedback-input"
                    disabled={gradingReadOnly}
                    value={forms.grade.feedback}
                    onChange={(e) =>
                      setForms((current) => ({
                        ...current,
                        grade: { ...current.grade, feedback: e.target.value },
                      }))
                    }
                  />
                </Field>
                <Field id="grading-revision-note" label="Catatan revisi (opsional)">
                  <Textarea
                    id="grading-revision-note"
                    rows={5}
                    placeholder="Isi jika tugas perlu dikembalikan untuk direvisi."
                    data-testid="grading-revision-note-input"
                    disabled={gradingReadOnly}
                    value={forms.grade.revision_note}
                    onChange={(e) =>
                      setForms((current) => ({
                        ...current,
                        grade: { ...current.grade, revision_note: e.target.value },
                      }))
                    }
                  />
                </Field>
              </div>

              <footer className="grading-editor-actions">
                <div>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid={`submission-review-${selectedSubmission.id}-button`}
                    disabled={gradingReadOnly}
                    onClick={() => markReviewed(selectedSubmission.id)}
                  >
                    <Eye /> Tandai dilihat
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    data-testid={`submission-revision-${selectedSubmission.id}-button`}
                    disabled={gradingReadOnly}
                    onClick={() =>
                      requestRevision(
                        selectedSubmission.id,
                        forms.grade.revision_note,
                      )
                    }
                  >
                    <Reply /> Minta revisi
                  </Button>
                </div>
                <Button disabled={gradingReadOnly} data-testid="grading-submit-button">
                  <CheckCircle2 /> Simpan nilai
                </Button>
              </footer>
            </>
          )}
        </form>
      </div>
      {previewTarget && (
        <FilePreviewPanel
          previewTarget={previewTarget}
          previewDoc={previewDoc}
          previewBusy={previewBusy}
          previewError={previewError}
          token={token}
          onClose={() => setPreviewTarget(null)}
        />
      )}
      <details className="grading-bulk-panel" data-testid="bulk-grading-card">
        <summary>
          <span className="grading-bulk-icon"><Users /></span>
          <span>
            <strong data-testid="bulk-grading-title">Nilai beberapa mahasiswa sekaligus</strong>
            <small>Mode cepat untuk memasukkan nilai per tugas.</small>
          </span>
          <Badge className="border-slate-200 bg-slate-50 text-slate-700">
            {ready.length} submission
          </Badge>
        </summary>
        <div className="grading-bulk-content">
          {grouped.length === 0 && (
            <p className="grading-bulk-empty" data-testid="bulk-grading-empty">
              Belum ada submission pada filter ini.
            </p>
          )}
          {grouped.map((group) => (
            <section
              key={group.assignment.id}
              className="grading-bulk-group"
              data-testid={`bulk-grade-group-${group.assignment.id}`}
            >
              <header>
                <strong data-testid={`bulk-grade-group-title-${group.assignment.id}`}>
                  {group.assignment.title}
                </strong>
                <span>{group.rows.length} mahasiswa</span>
              </header>
              {group.rows.map((submission) => (
                <div
                  key={submission.id}
                  className="grading-bulk-row"
                  data-testid={`bulk-grade-row-${submission.id}`}
                >
                  <div>
                    <strong data-testid={`bulk-grade-student-${submission.id}`}>
                      {submission.student_name}
                    </strong>
                    <small data-testid={`bulk-grade-assignment-${submission.id}`}>
                      {submission.student_nim || reviewStatusLabel(submission.review_status)}
                    </small>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    placeholder="Nilai"
                    aria-label={`Nilai ${submission.student_name}`}
                    data-testid={`bulk-grade-score-${submission.id}-input`}
                    disabled={gradingReadOnly}
                    value={gradeRows[submission.id]?.score ?? submission.grade ?? ""}
                    onChange={(e) =>
                      updateRow(submission.id, {
                        score: clampScoreInput(e.target.value),
                      })
                    }
                  />
                  <Input
                    placeholder="Feedback singkat"
                    aria-label={`Feedback ${submission.student_name}`}
                    data-testid={`bulk-grade-feedback-${submission.id}-input`}
                    disabled={gradingReadOnly}
                    value={gradeRows[submission.id]?.feedback ?? submission.feedback ?? ""}
                    onChange={(e) =>
                      updateRow(submission.id, { feedback: e.target.value })
                    }
                  />
                </div>
              ))}
            </section>
          ))}
          <div className="grading-bulk-actions">
            <p>Hanya baris yang nilainya Anda ubah yang akan disimpan.</p>
            <Button
              type="button"
              variant="outline"
              data-testid="bulk-grading-submit-button"
              disabled={gradingReadOnly}
              onClick={submitRows}
            >
              <CheckCircle2 /> Simpan nilai yang terisi
            </Button>
          </div>
        </div>
      </details>
    </div>
  );
}

const GRADE_CHART_COLORS = {
  A: "#10b981",
  B: "#3b82f6",
  C: "#f59e0b",
  D: "#f97316",
  E: "#ef4444",
};
const DIST_COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"];

const GradeRecapPage = memo(function GradeRecapPage({ data, exportGradeRecap }) {
  const [selectedClass, setSelectedClass] = useState(null);
  const recapData = data.gradeRecap || [];

  if (!selectedClass) {
    return (
      <div className="space-y-5" data-testid="grade-recap-page">
        <section className="meeting-hero" data-testid="grade-recap-hero">
          <div>
            <p className="meeting-overline">Rekap Nilai</p>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="grade-recap-title"
            >
              Rekap nilai per mata kuliah
            </h2>
            <p className="meeting-description">
              Lihat rata-rata nilai, distribusi grade, dan grafik nilai
              mahasiswa per kelas.
            </p>
          </div>
          <div className="meeting-summary" data-testid="grade-recap-summary">
            <div>
              <strong>{recapData.length}</strong>
              <span>Kelas</span>
            </div>
            <div>
              <strong>
                {recapData.reduce((sum, c) => sum + c.student_count, 0)}
              </strong>
              <span>Mahasiswa</span>
            </div>
          </div>
        </section>
        {recapData.length === 0 ? (
          <EmptyState
            title="Belum ada rekap nilai"
            description="Nilai dari tugas yang sudah dinilai akan muncul di sini."
          />
        ) : (
          <div
            className="course-card-grid"
            data-testid="grade-recap-class-grid"
          >
            {recapData.map((g) => (
              <Card
                key={g.class_id}
                className="course-material-card rounded-md shadow-none cursor-pointer hover:shadow-md transition-shadow"
                data-testid={`grade-recap-card-${g.class_id}`}
                onClick={() => setSelectedClass(g)}
              >
                <CardContent className="course-material-card-content">
                  <div className="course-material-card-main">
                    <span className="course-material-card-icon">
                      <BarChart3 />
                    </span>
                    <div className="course-material-card-header">
                      <div>
                        <h3 data-testid={`grade-recap-course-${g.class_id}`}>
                          {g.course_name}
                        </h3>
                        <p data-testid={`grade-recap-class-${g.class_id}`}>
                          {g.class_name}
                        </p>
                      </div>
                      {g.class_status && g.class_status !== "active" && (
                        <Badge className="border-slate-200 bg-white text-slate-700">
                          {g.class_status_label || (g.class_status === "ended" ? "Berakhir" : g.class_status === "finalized" ? "Nilai difinalisasi" : "Arsip")}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div
                    className="course-material-card-meta"
                    data-testid={`grade-recap-meta-${g.class_id}`}
                  >
                    <span>{g.student_count} mahasiswa</span>
                    <span>{g.total_assignments} tugas</span>
                    <span>
                      Rata-rata:{" "}
                      <strong className="text-emerald-600">
                        {g.class_average}
                      </strong>
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  const {
    students,
    grade_distribution: dist,
    class_average: classAvg,
  } = selectedClass;
  const gradeWeights = { ...DEFAULT_GRADE_WEIGHTS, ...(selectedClass.grade_weights || {}) };
  const recapAssignments = selectedClass.assignments || [];
  const allAssignmentIds = recapAssignments.length
    ? recapAssignments.map((assignment) => assignment.id)
    : [
        ...new Set(students.flatMap((s) => s.scores.map((sc) => sc.assignment_id))),
      ];
  const assignmentTitles = {};
  recapAssignments.forEach((assignment) => {
    assignmentTitles[assignment.id] = assignment.title;
  });
  students.forEach((s) =>
    s.scores.forEach((sc) => {
      assignmentTitles[sc.assignment_id] = sc.assignment_title;
    }),
  );
  const allAssignments = allAssignmentIds.map((id) => ({
    id,
    title: assignmentTitles[id] || "Tugas",
  }));

  const chartData = [...students]
    .sort((a, b) => b.average - a.average)
    .map((s) => ({
      name: s.student_name.split(" ").slice(0, 2).join(" "),
      average: s.average,
      nim: s.student_nim,
    }));

  const distData = Object.entries(dist).map(([name, value]) => ({
    name,
    value,
    fill: GRADE_CHART_COLORS[name] || "#94a3b8",
  }));

  return (
    <div className="space-y-6" data-testid="grade-recap-detail">
      <div
        className="flex flex-wrap items-center gap-3"
        data-testid="grade-recap-detail-header"
      >
        <Button
          variant="outline"
          size="sm"
          data-testid="grade-recap-back-button"
          onClick={() => setSelectedClass(null)}
        >
          <ArrowLeft /> Kembali
        </Button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Rekap Nilai
          </p>
          <h2
            className="font-display text-2xl font-bold text-slate-950"
            data-testid="grade-recap-detail-title"
          >
            {selectedClass.course_name}{" "}
            <span className="text-slate-400">·</span> {selectedClass.class_name}
          </h2>
          {selectedClass.class_status && selectedClass.class_status !== "active" && (
            <p className="mt-1 text-sm text-slate-600">
              Status: {selectedClass.class_status_label || selectedClass.class_status}. Rekap menampilkan snapshot bobot dan nilai pada saat finalisasi bila tersedia.
            </p>
          )}
        </div>
        <div className="ml-auto flex flex-wrap gap-2" data-testid="grade-recap-export-actions">
          <Button type="button" variant="outline" size="sm" data-testid="grade-recap-export-excel-button" onClick={() => exportGradeRecap("xlsx", selectedClass.class_id)}>
            <FileSpreadsheet /> Excel
          </Button>
          <Button type="button" variant="outline" size="sm" data-testid="grade-recap-export-pdf-button" onClick={() => exportGradeRecap("pdf", selectedClass.class_id)}>
            <FileText /> PDF
          </Button>
          <Button type="button" size="sm" data-testid="grade-recap-print-button" onClick={() => window.print()}>
            <Printer /> Cetak
          </Button>
        </div>
      </div>

      <div
        className="grid gap-4 md:grid-cols-4"
        data-testid="grade-recap-stats"
      >
        <StatCard
          icon={Users}
          label="Mahasiswa"
          value={selectedClass.student_count}
          hint="Terdaftar di kelas ini"
          testid="recap-stat-students"
        />
        <StatCard
          icon={ClipboardList}
          label="Tugas dinilai"
          value={selectedClass.total_assignments}
          hint="Total tugas yang sudah dinilai"
          testid="recap-stat-assignments"
        />
        <StatCard
          icon={BarChart3}
          label="Rata-rata kelas"
          value={classAvg}
          hint="Nilai rata-rata seluruh mahasiswa"
          testid="recap-stat-average"
        />
        <StatCard
          icon={GraduationCap}
          label="Nilai tertinggi"
          value={Math.max(...students.map((s) => s.average), 0)}
          hint="Rata-rata tertinggi mahasiswa"
          testid="recap-stat-max"
        />
      </div>

      <Card className="rounded-md shadow-none" data-testid="grade-recap-weights-card">
        <CardHeader>
          <CardTitle>Komposisi nilai mata kuliah</CardTitle>
          <p className="text-sm text-slate-500">
            Nilai sementara dinormalisasi dari komponen yang sudah dinilai. Setelah Tugas, UTS, dan UAS lengkap, sistem menerapkan bobot penuh.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3">
          {GRADE_WEIGHT_COMPONENTS.map((component) => (
            <Badge key={component.key} className="border-blue-200 bg-blue-50 px-3 py-2 text-blue-800" data-testid={`grade-recap-weight-${component.key}`}>
              {component.label} {gradeWeights[component.key]}%
            </Badge>
          ))}
          <Badge className={selectedClass.grade_weights_customized ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"} data-testid="grade-recap-weight-source">
            {selectedClass.grade_weights_customized ? "Bobot custom" : "Bobot default"}
          </Badge>
        </CardContent>
      </Card>

      <div
        className="grid gap-6 xl:grid-cols-2"
        data-testid="grade-recap-charts"
      >
        <Card
          className="rounded-md shadow-none"
          data-testid="recap-chart-student-card"
        >
          <CardHeader>
            <CardTitle data-testid="recap-chart-student-title">
              Rata-rata nilai per mahasiswa
            </CardTitle>
          </CardHeader>
          <CardContent>
            {chartData.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada data nilai.</p>
            ) : (
              <ResponsiveContainer
                width="100%"
                height={Math.max(200, Math.min(500, students.length * 36))}
              >
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 100, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => [
                      `${value} (${props.payload.nim})`,
                      "Rata-rata",
                    ]}
                  />
                  <Bar dataKey="average" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card
          className="rounded-md shadow-none"
          data-testid="recap-chart-dist-card"
        >
          <CardHeader>
            <CardTitle data-testid="recap-chart-dist-title">
              Distribusi grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={distData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip formatter={(value) => [`${value} nilai`, "Jumlah"]} />
                <Bar
                  dataKey="value"
                  name="Jumlah mahasiswa"
                  radius={[4, 4, 0, 0]}
                >
                  {distData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        entry.fill || DIST_COLORS[index % DIST_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-md shadow-none" data-testid="recap-table-card">
        <CardHeader>
          <CardTitle data-testid="recap-table-title">
            Detail nilai mahasiswa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table data-testid="recap-students-table">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">NIM</TableHead>
                  <TableHead className="whitespace-nowrap">Nama</TableHead>
                  <TableHead className="whitespace-nowrap text-center">Tugas</TableHead>
                  <TableHead className="whitespace-nowrap text-center">UTS</TableHead>
                  <TableHead className="whitespace-nowrap text-center">UAS</TableHead>
                  {allAssignments.map((a) => (
                    <TableHead
                      key={a.id}
                      className="whitespace-nowrap text-center"
                    >
                      {a.title}
                    </TableHead>
                  ))}
                  <TableHead className="whitespace-nowrap text-center">
                    Nilai akhir berbobot
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const scoreMap = {};
                  s.scores.forEach((sc) => {
                    scoreMap[sc.assignment_id] = sc;
                  });
                  const componentScores = s.component_scores || {};
                  return (
                    <TableRow
                      key={s.student_id}
                      data-testid={`recap-student-row-${s.student_id}`}
                    >
                      <TableCell className="font-mono text-sm whitespace-nowrap">
                        {s.student_nim}
                      </TableCell>
                      <TableCell className="font-medium whitespace-nowrap">
                        {s.student_name}
                      </TableCell>
                      {GRADE_WEIGHT_COMPONENTS.map((component) => (
                        <TableCell key={component.key} className="text-center whitespace-nowrap">
                          {componentScores[component.key] == null ? <span className="text-slate-300">-</span> : componentScores[component.key]}
                        </TableCell>
                      ))}
                      {allAssignments.map((a) => {
                        const sc = scoreMap[a.id];
                        return (
                          <TableCell
                            key={a.id}
                            className="text-center whitespace-nowrap"
                          >
                            {sc ? (
                              <Badge
                                className={
                                  sc.grade >= 70
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                    : "border-amber-200 bg-amber-50 text-amber-700"
                                }
                              >
                                {sc.grade}
                              </Badge>
                            ) : (
                              <span className="text-slate-300">-</span>
                            )}
                          </TableCell>
                        );
                      })}
                      <TableCell className="text-center font-bold whitespace-nowrap">
                        {s.weighted_grade ?? s.average}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
});

const CalendarPage = memo(function CalendarPage({ events }) {
  return (
    <Card className="rounded-md shadow-none" data-testid="calendar-page">
      <CardHeader>
        <CardTitle data-testid="calendar-title">
          Kalender akademik & deadline
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.length === 0 ? (
          <EmptyState
            title="Kalender kosong"
            description="Deadline dan jadwal materi akan muncul di sini."
          />
        ) : (
          events.map((event) => (
            <div
              key={`${event.type}-${event.id}`}
              className="grid gap-2 border border-slate-200 p-4 md:grid-cols-[160px_1fr_140px]"
              data-testid={`calendar-event-${event.id}`}
            >
              <p
                className="font-mono text-sm text-slate-600"
                data-testid={`calendar-event-date-${event.id}`}
              >
                {fmtDate(event.date)}
              </p>
              <p
                className="font-semibold"
                data-testid={`calendar-event-title-${event.id}`}
              >
                {event.title}
              </p>
              <Badge
                className={
                  event.type === "deadline"
                    ? "bg-red-50 text-red-700"
                    : "bg-blue-50 text-blue-700"
                }
                data-testid={`calendar-event-type-${event.id}`}
              >
                {event.type}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
});

const REPORT_STATUS_COLORS = {
  Dinilai: "#10b981",
  "Menunggu nilai": "#f59e0b",
  "Perlu revisi": "#8b5cf6",
};

function reportDateKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function reportShortDate(value) {
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
  }).format(value);
}

function isGradedSubmission(submission) {
  return (
    typeof submission?.grade === "number" ||
    submission?.review_status === "graded" ||
    submission?.status === "Dinilai"
  );
}

function isRevisionSubmission(submission) {
  return (
    submission?.review_status === "revision_requested" ||
    submission?.status === "Direvisi"
  );
}

const ReportsPage = memo(function ReportsPage({
  data,
  exportGrades,
  exportGradeRecap,
}) {
  const [selectedClassId, setSelectedClassId] = useState("");
  const [trendDays, setTrendDays] = useState("14");
  const submissions = useMemo(
    () =>
      (data.submissions || []).filter(
        (submission) =>
          !selectedClassId || submission.class_id === selectedClassId,
      ),
    [data.submissions, selectedClassId],
  );
  const classOptions = useMemo(
    () =>
      [...(data.classes || [])].sort((left, right) =>
        `${left.course_name || ""} ${left.name || ""}`.localeCompare(
          `${right.course_name || ""} ${right.name || ""}`,
          "id",
        ),
      ),
    [data.classes],
  );
  const selectedClass = classOptions.find(
    (classItem) => classItem.id === selectedClassId,
  );
  const gradedCount = submissions.filter(isGradedSubmission).length;
  const revisionCount = submissions.filter(isRevisionSubmission).length;
  const waitingCount = submissions.filter(
    (submission) =>
      !isGradedSubmission(submission) && !isRevisionSubmission(submission),
  ).length;
  const lateCount = submissions.filter(
    (submission) =>
      Number(submission.late_hours || 0) > 0 ||
      submission.status === "Terlambat",
  ).length;
  const gradingRate = submissions.length
    ? Math.round((gradedCount / submissions.length) * 100)
    : 0;
  const lateRate = submissions.length
    ? Math.round((lateCount / submissions.length) * 100)
    : 0;

  const statusData = [
    { name: "Dinilai", value: gradedCount },
    { name: "Menunggu nilai", value: waitingCount },
    { name: "Perlu revisi", value: revisionCount },
  ].filter((item) => item.value > 0);

  const trendData = useMemo(() => {
    const days = Number(trendDays);
    const totals = new Map();
    submissions.forEach((submission) => {
      const key = reportDateKey(submission.submitted_at);
      if (!key) return;
      const current = totals.get(key) || { masuk: 0, dinilai: 0, terlambat: 0 };
      current.masuk += 1;
      if (isGradedSubmission(submission)) current.dinilai += 1;
      if (
        Number(submission.late_hours || 0) > 0 ||
        submission.status === "Terlambat"
      )
        current.terlambat += 1;
      totals.set(key, current);
    });
    const today = new Date();
    today.setHours(12, 0, 0, 0);
    return Array.from({ length: days }, (_, index) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (days - index - 1));
      return {
        tanggal: reportShortDate(date),
        ...(totals.get(reportDateKey(date)) || {
          masuk: 0,
          dinilai: 0,
          terlambat: 0,
        }),
      };
    });
  }, [submissions, trendDays]);

  const classPerformance = useMemo(
    () =>
      (data.gradeRecap || [])
        .filter(
          (classItem) =>
            !selectedClassId || classItem.class_id === selectedClassId,
        )
        .map((classItem) => {
          const classSubmissions = (data.submissions || []).filter(
            (submission) => submission.class_id === classItem.class_id,
          );
          const classGraded = classSubmissions.filter(isGradedSubmission).length;
          return {
            id: classItem.class_id,
            name: `${classItem.course_name || "Mata kuliah"} · ${classItem.class_name || "Kelas"}`,
            rataRata: Number(classItem.class_average || 0),
            ketuntasan: classSubmissions.length
              ? Math.round((classGraded / classSubmissions.length) * 100)
              : 0,
            mahasiswa: Number(classItem.student_count || 0),
          };
        })
        .sort((left, right) => right.rataRata - left.rataRata),
    [data.gradeRecap, data.submissions, selectedClassId],
  );
  const bestClass = classPerformance.find((classItem) => classItem.rataRata > 0);
  const totalStudents = selectedClassId
    ? classPerformance.reduce(
        (total, classItem) => total + classItem.mahasiswa,
        0,
      )
    : data.report?.total_students || 0;
  const totalAssignments = selectedClassId
    ? (data.assignments || []).filter(
        (assignment) => assignment.class_id === selectedClassId,
      ).length
    : data.report?.total_assignments || 0;
  const exportClassId = selectedClassId || "";
  const exportRecap = (format) => {
    if (exportGradeRecap) return exportGradeRecap(format, exportClassId);
    if (format === "xlsx") return exportGrades?.();
    return undefined;
  };

  return (
    <div className="reports-analytics-page" data-testid="reports-page">
      <section className="reports-hero" data-testid="reports-hero">
        <div>
          <p className="reports-overline">Analitik Akademik</p>
          <h2 data-testid="reports-title">Laporan yang siap dianalisis</h2>
          <p>
            Pantau arus submission, progres penilaian, keterlambatan, dan
            performa kelas dalam satu tampilan.
          </p>
        </div>
        <div className="reports-export-actions" data-testid="reports-export-actions">
          <Button
            type="button"
            variant="outline"
            data-testid="report-export-excel-button"
            onClick={() => exportRecap("xlsx")}
          >
            <FileSpreadsheet /> Excel
          </Button>
          <Button
            type="button"
            variant="outline"
            data-testid="report-export-pdf-button"
            onClick={() => exportRecap("pdf")}
          >
            <FileText /> PDF
          </Button>
          <Button
            type="button"
            data-testid="report-print-button"
            onClick={() => window.print()}
          >
            <Printer /> Cetak
          </Button>
        </div>
      </section>

      <section className="reports-filter-bar" aria-label="Filter laporan">
        <div>
          <label htmlFor="report-class-filter">Kelas</label>
          <select
            id="report-class-filter"
            className="form-select"
            data-testid="report-class-filter"
            value={selectedClassId}
            onChange={(event) => setSelectedClassId(event.target.value)}
          >
            <option value="">Semua kelas</option>
            {classOptions.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.course_name || "Mata kuliah"} · {classItem.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="report-period-filter">Rentang tren</label>
          <select
            id="report-period-filter"
            className="form-select"
            data-testid="report-period-filter"
            value={trendDays}
            onChange={(event) => setTrendDays(event.target.value)}
          >
            <option value="7">7 hari terakhir</option>
            <option value="14">14 hari terakhir</option>
            <option value="30">30 hari terakhir</option>
          </select>
        </div>
        <p data-testid="report-filter-description">
          {selectedClass
            ? `Menampilkan ${selectedClass.course_name || "mata kuliah"} · ${selectedClass.name}. Export mengikuti filter kelas ini.`
            : "Menampilkan ringkasan seluruh kelas yang dapat Anda akses."}
        </p>
      </section>

      <div className="reports-stat-grid" data-testid="report-summary-stats">
        <StatCard
          icon={Users}
          label="Mahasiswa"
          value={totalStudents}
          hint={selectedClassId ? "Terdaftar di kelas" : "Total terdaftar"}
          testid="report-total-students"
        />
        <StatCard
          icon={ClipboardList}
          label="Tugas"
          value={totalAssignments}
          hint={selectedClassId ? "Pada kelas terpilih" : "Aktif dan arsip"}
          testid="report-total-assignments"
        />
        <StatCard
          icon={Upload}
          label="Submission"
          value={submissions.length}
          hint="Masuk sesuai filter"
          testid="report-total-submissions"
        />
        <StatCard
          icon={CheckCircle2}
          label="Dinilai"
          value={`${gradingRate}%`}
          hint={`${gradedCount} dari ${submissions.length} submission`}
          testid="report-graded-submissions"
        />
      </div>

      <section className="reports-insight-grid" data-testid="report-insights">
        <article className="report-insight report-insight-amber">
          <span><Clock /></span>
          <div>
            <small>Perlu ditindaklanjuti</small>
            <strong data-testid="report-waiting-count">{waitingCount} submission</strong>
            <p>Belum mendapat nilai dari dosen.</p>
          </div>
        </article>
        <article className="report-insight report-insight-red">
          <span><AlertTriangle /></span>
          <div>
            <small>Keterlambatan</small>
            <strong data-testid="report-late-rate">{lateRate}% submission</strong>
            <p>{lateCount} pengumpulan melewati deadline.</p>
          </div>
        </article>
        <article className="report-insight report-insight-blue">
          <span><BarChart3 /></span>
          <div>
            <small>Performa terbaik</small>
            <strong data-testid="report-best-class">
              {bestClass ? `${bestClass.rataRata} rata-rata` : "Belum tersedia"}
            </strong>
            <p>{bestClass?.name || "Nilai kelas belum dapat dibandingkan."}</p>
          </div>
        </article>
      </section>

      <div className="reports-chart-grid">
        <Card className="report-chart-card report-trend-card" data-testid="report-trend-card">
          <CardHeader className="report-chart-header">
            <div>
              <p>Aktivitas harian</p>
              <CardTitle>Tren submission {trendDays} hari</CardTitle>
            </div>
            <Badge className="border-blue-200 bg-blue-50 text-blue-700">
              {submissions.length} total
            </Badge>
          </CardHeader>
          <CardContent className="report-chart-content">
            <ResponsiveContainer width="100%" height={310}>
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="reportSubmissionGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" vertical={false} />
                <XAxis dataKey="tanggal" tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} minTickGap={22} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend iconType="circle" iconSize={8} />
                <Area type="monotone" dataKey="masuk" name="Submission masuk" stroke="#2563eb" strokeWidth={3} fill="url(#reportSubmissionGradient)" />
                <Area type="monotone" dataKey="dinilai" name="Sudah dinilai" stroke="#10b981" strokeWidth={2} fill="transparent" />
                <Area type="monotone" dataKey="terlambat" name="Terlambat" stroke="#ef4444" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="report-chart-card" data-testid="report-status-card">
          <CardHeader className="report-chart-header">
            <div>
              <p>Komposisi pekerjaan</p>
              <CardTitle>Status submission</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="report-chart-content report-status-content">
            {statusData.length ? (
              <>
                <div className="report-donut-wrap">
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={68} outerRadius={94} paddingAngle={3} stroke="none">
                        {statusData.map((entry) => (
                          <Cell key={entry.name} fill={REPORT_STATUS_COLORS[entry.name]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} submission`, "Jumlah"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="report-donut-center" aria-hidden="true">
                    <strong>{submissions.length}</strong>
                    <span>Total</span>
                  </div>
                </div>
                <div className="report-status-legend">
                  {statusData.map((entry) => (
                    <div key={entry.name}>
                      <span style={{ backgroundColor: REPORT_STATUS_COLORS[entry.name] }} />
                      <p>{entry.name}</p>
                      <strong>{entry.value}</strong>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="report-chart-empty">
                <Upload />
                <strong>Belum ada submission</strong>
                <p>Grafik status akan muncul setelah mahasiswa mengumpulkan tugas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="report-chart-card" data-testid="report-class-performance-card">
        <CardHeader className="report-chart-header report-performance-header">
          <div>
            <p>Perbandingan kelas</p>
            <CardTitle>Rata-rata nilai dan ketuntasan penilaian</CardTitle>
          </div>
          <p>Skala 0–100 · arahkan kursor ke grafik untuk detail.</p>
        </CardHeader>
        <CardContent className="report-chart-content">
          {classPerformance.length ? (
            <ResponsiveContainer width="100%" height={Math.max(260, Math.min(560, classPerformance.length * 64))}>
              <BarChart data={classPerformance} layout="vertical" margin={{ top: 10, right: 24, left: 24, bottom: 0 }}>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: "#334155" }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => [`${value}${name === "Ketuntasan penilaian" ? "%" : ""}`, name]} />
                <Legend iconType="circle" iconSize={8} />
                <Bar dataKey="rataRata" name="Rata-rata nilai" fill="#2563eb" radius={[0, 5, 5, 0]} barSize={14} />
                <Bar dataKey="ketuntasan" name="Ketuntasan penilaian" fill="#10b981" radius={[0, 5, 5, 0]} barSize={14} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="report-chart-empty">
              <BarChart3 />
              <strong>Belum ada data kelas</strong>
              <p>Perbandingan akan tersedia setelah kelas dan nilai dibuat.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
});

const SettingsPage = memo(function SettingsPage({
  forms,
  setForms,
  saveSettings,
}) {
  const s = forms.settings;
  return (
    <form
      onSubmit={saveSettings}
      className="space-y-6"
      data-testid="settings-page"
    >
      <Card className="rounded-md shadow-none" data-testid="settings-card">
        <CardHeader>
          <CardTitle data-testid="settings-title">Settings aplikasi</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field id="settings-app-name" label="Nama aplikasi">
            <Input
              id="settings-app-name"
              data-testid="settings-app-name-input"
              value={s.app_name || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, app_name: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-campus-name" label="Nama kampus">
            <Input
              id="settings-campus-name"
              data-testid="settings-campus-name-input"
              value={s.campus_name || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, campus_name: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-program-name" label="Mapel / Prodi">
            <Input
              id="settings-program-name"
              data-testid="settings-program-name-input"
              value={s.program_name || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, program_name: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-lecturer-name" label="Nama dosen">
            <Input
              id="settings-lecturer-name"
              data-testid="settings-lecturer-name-input"
              value={s.lecturer_name || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, lecturer_name: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-lecturer-email" label="Email dosen">
            <Input
              id="settings-lecturer-email"
              data-testid="settings-lecturer-email-input"
              value={s.lecturer_email || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, lecturer_email: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-logo-url" label="Logo kampus URL">
            <Input
              id="settings-logo-url"
              data-testid="settings-logo-url-input"
              value={s.campus_logo_url || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, campus_logo_url: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-year" label="Tahun ajaran aktif">
            <Input
              id="settings-year"
              data-testid="settings-year-input"
              value={s.active_academic_year || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, active_academic_year: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-semester" label="Semester aktif">
            <Input
              id="settings-semester"
              data-testid="settings-semester-input"
              value={s.active_semester || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, active_semester: e.target.value },
                })
              }
            />
          </Field>
          <Field id="settings-address" label="Alamat kampus">
            <Textarea
              id="settings-address"
              data-testid="settings-address-input"
              value={s.campus_address || ""}
              onChange={(e) =>
                setForms({
                  ...forms,
                  settings: { ...s, campus_address: e.target.value },
                })
              }
            />
          </Field>
        </CardContent>
      </Card>
      <Card
        className="rounded-md shadow-none"
        data-testid="academic-rollover-card"
      >
        <CardContent className="p-5">
          <h3
            className="font-display text-xl font-semibold"
            data-testid="academic-rollover-title"
          >
            Alur ganti tahun ajaran
          </h3>
          <ol
            className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-600"
            data-testid="academic-rollover-list"
          >
            <li>Export rekap nilai dan arsip kelas semester lama.</li>
            <li>Ubah tahun ajaran dan semester aktif di settings ini.</li>
            <li>
              Buat/duplikasi kelas baru sehingga kode kelas baru terbentuk.
            </li>
            <li>
              Mahasiswa masuk memakai kode kelas baru dan menunggu ACC dosen.
            </li>
            <li>
              Materi/tugas lama tetap menjadi arsip; submission baru mengikuti
              deadline kelas baru.
            </li>
          </ol>
        </CardContent>
      </Card>
      <Button data-testid="settings-save-button">
        <Settings /> Simpan settings
      </Button>
    </form>
  );
});

function GuidePage({ role = "student", classes = [], onNavigate }) {
  const isAdmin = role === "admin";
  const isLecturer = role === "lecturer";
  const title = isAdmin ? "Panduan Admin Kampus" : isLecturer ? "Panduan Dosen" : "Panduan Mahasiswa";
  const intro = isAdmin
    ? "Kelola struktur akademik, pengguna, dan penutupan semester secara tertib."
    : isLecturer
      ? "Ikuti urutan kerja kelas dari persiapan hingga finalisasi nilai."
      : "Ikuti langkah sederhana untuk masuk kelas, belajar, mengumpulkan tugas, dan melihat nilai.";
  const steps = isAdmin
    ? [
        ["1", "Siapkan struktur akademik", "Buat Prodi, Mata Kuliah, lalu kelas semester. Kode kelas dibuat otomatis."],
        ["2", "Kelola pengguna", "Admin dapat membuat/import mahasiswa. Dosen hanya memilih mahasiswa aktif atau memproses request."],
        ["3", "Pantau approval", "Request mahasiswa harus ditinjau dan disetujui sebelum mahasiswa melihat materi dan tugas kelas."],
        ["4", "Tutup dan finalisasi", "Akhiri kelas ketika pembelajaran selesai, selesaikan koreksi, lalu ketik FINALISASI untuk mengunci rekap."],
        ["5", "Arsip dan rollover", "Arsipkan kelas yang sudah difinalisasi. Tahun berikutnya selalu buat kelas baru dengan kode baru."],
      ]
    : isLecturer
      ? [
          ["1", "Buat kelas aktif", "Pilih Mata Kuliah, tahun akademik, semester, nama kelas, dan jadwal. Bagikan kode kelas."],
          ["2", "Setujui anggota", "Buka menu Mahasiswa, tinjau request pending, lalu Approve atau Reject. Tambah langsung hanya untuk mahasiswa aktif."],
          ["3", "Kelola pembelajaran", "Buat materi dan tugas hanya saat kelas Aktif. Atur bobot nilai dan kategori Tugas/UTS/UAS."],
          ["4", "Koreksi submission", "Nilai, feedback, dan permintaan revisi tersedia selama kelas Aktif atau Berakhir. Submission baru ditutup setelah kelas diakhiri."],
          ["5", "Finalisasi semester", "Pastikan seluruh komponen nilai lengkap, klik Finalisasi, ketik FINALISASI, lalu gunakan Arsip. Setelah itu data read-only."],
        ]
      : [
          ["1", "Buat akun", "Daftar sebagai mahasiswa menggunakan NIM, email, dan password."],
          ["2", "Gabung dengan kode", "Masukkan kode kelas. Status akan menjadi Menunggu ACC sampai dosen menyetujui."],
          ["3", "Belajar dan mengumpulkan", "Setelah disetujui, buka Materi dan Tugas. Periksa deadline sebelum mengunggah file."],
          ["4", "Tanggapi revisi", "Jika dosen meminta revisi, unggah ulang hanya pada tugas yang berstatus Direvisi."],
          ["5", "Semester berikutnya", "Kelas lama menjadi arsip. Gunakan kode kelas baru untuk semester baru dan tunggu approval kembali."],
        ];
  const rules = [
    "Aksi penting seperti mengakhiri kelas, finalisasi nilai, arsip, hapus data, import, dan perubahan bobot selalu membutuhkan konfirmasi.",
    "Kelas Berakhir menutup anggota baru, materi baru, tugas baru, dan submission baru. Penilaian masih dapat diselesaikan sampai Finalisasi.",
    "Kelas yang sudah Finalisasi/Arsip tidak boleh diubah. Untuk tahun berikutnya, buat kelas baru; histori kelas lama tetap tersimpan.",
  ];
  return (
    <div className="space-y-6" data-testid={`${role}-guide-page`}>
      <section className="meeting-hero" data-testid={`${role}-guide-hero`}>
        <div>
          <p className="meeting-overline">Panduan LMS</p>
          <h2 className="font-display text-2xl font-semibold">{title}</h2>
          <p className="meeting-description">{intro}</p>
        </div>
        <div className="meeting-summary">
          <div><strong>{steps.length}</strong><span>Langkah utama</span></div>
          <div><strong>{classes.length || "—"}</strong><span>Kelas terlihat</span></div>
          <div><strong>1</strong><span>Alur semester</span></div>
        </div>
      </section>
      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <Card className="rounded-md shadow-none" data-testid={`${role}-guide-steps-card`}>
          <CardHeader>
            <CardTitle>Urutan kerja yang disarankan</CardTitle>
            <p className="text-sm text-slate-500">Ikuti dari atas ke bawah agar status kelas dan data nilai tetap konsisten.</p>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map(([number, heading, description]) => (
              <div key={number} className="flex gap-3 border border-slate-200 bg-white p-4">
                <Badge className="h-7 min-w-7 justify-center border-blue-200 bg-blue-50 text-blue-700">{number}</Badge>
                <div><strong className="block text-slate-900">{heading}</strong><p className="mt-1 text-sm text-slate-600">{description}</p></div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="rounded-md shadow-none" data-testid={`${role}-guide-rules-card`}>
          <CardHeader>
            <CardTitle>Aturan penting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rules.map((rule) => <div key={rule} className="flex gap-2 border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><span>{rule}</span></div>)}
            {onNavigate && isAdmin && <Button type="button" variant="outline" onClick={() => onNavigate("classes")}><BookOpen /> Buka konfigurasi kelas</Button>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function assignmentNeedsStudentAction(assignment) {
  if (assignment.class_allows_learning === false) return false;
  return (
    !assignment.my_submission ||
    assignment.my_submission?.status === "Direvisi" ||
    assignment.my_submission?.review_status === "revision_requested"
  );
}

function orderStudentAssignments(assignments) {
  const actionRank = (assignment) => {
    if (
      assignment.my_submission?.status === "Direvisi" ||
      assignment.my_submission?.review_status === "revision_requested"
    )
      return 0;
    if (!assignment.my_submission) return 1;
    return 2;
  };
  const deadlineTime = (assignment) => {
    const value = new Date(assignment.deadline || 0).getTime();
    return Number.isNaN(value) || value <= 0 ? Number.MAX_SAFE_INTEGER : value;
  };
  return [...assignments].sort((left, right) => {
    const priority = actionRank(left) - actionRank(right);
    if (priority) return priority;
    return deadlineTime(left) - deadlineTime(right);
  });
}

function buildAssignmentCourseGroups(assignments) {
  const ordered = [...assignments].sort((left, right) => {
    const classComparison = [left.course_name, left.class_name]
      .filter(Boolean)
      .join(" · ")
      .localeCompare(
        [right.course_name, right.class_name].filter(Boolean).join(" · "),
        "id",
      );
    if (classComparison) return classComparison;
    return (
      new Date(left.deadline || 0).getTime() -
      new Date(right.deadline || 0).getTime()
    );
  });
  return ordered
    .reduce((items, assignment) => {
      const key =
        assignment.class_id ||
        [assignment.course_name, assignment.class_name]
          .filter(Boolean)
          .join("-") ||
        "tanpa-kelas";
      let group = items.find((item) => item.id === key);
      if (!group) {
        group = {
          id: key,
          courseName: assignment.course_name || "Mata kuliah",
          className: assignment.class_name || "Kelas",
          classStatus: assignment.class_status || "",
          classStatusLabel: assignment.class_status_label || "",
          assignments: [],
        };
        items.push(group);
      }
      group.assignments.push(assignment);
      return items;
    }, [])
    .map((group) => {
      const orderedAssignments = orderStudentAssignments(group.assignments);
      return {
        ...group,
        classStatus: group.classStatus || group.assignments[0]?.class_status || "",
        classStatusLabel: group.classStatusLabel || group.assignments[0]?.class_status_label || "",
        assignments: orderedAssignments,
        pending: group.assignments.filter(
        (assignment) => assignmentNeedsStudentAction(assignment),
        ).length,
        revision: group.assignments.filter(
          (assignment) =>
            assignment.my_submission?.status === "Direvisi" ||
            assignment.my_submission?.review_status === "revision_requested",
        ).length,
        graded: group.assignments.filter(
          (assignment) =>
            assignment.my_submission?.grade !== undefined &&
            assignment.my_submission?.grade !== null,
        ).length,
        latestAssignment: orderedAssignments[0],
      };
    })
    .sort(
      (left, right) =>
        right.pending +
        right.revision -
        (left.pending + left.revision),
    );
}

function StudentAssignmentsPage({
  assignments,
  renderAssignmentCard,
  focusAssignmentId,
  onFocusHandled,
}) {
  const groups = useMemo(
    () => buildAssignmentCourseGroups(assignments),
    [assignments],
  );
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const selectedGroup = groups.find((group) => group.id === selectedGroupId);
  const pendingAssignments = assignments.filter(
    (assignment) => assignmentNeedsStudentAction(assignment) && !assignment.my_submission,
  ).length;
  const revisionAssignments = assignments.filter(
    (assignment) => assignmentNeedsStudentAction(assignment) && Boolean(assignment.my_submission),
  ).length;

  useEffect(() => {
    if (
      selectedGroupId &&
      !groups.some((group) => group.id === selectedGroupId)
    ) {
      setSelectedGroupId("");
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!focusAssignmentId) return undefined;
    const focusedGroup = groups.find((group) =>
      group.assignments.some(
        (assignment) => assignment.id === focusAssignmentId,
      ),
    );
    if (!focusedGroup) return undefined;
    setSelectedGroupId(focusedGroup.id);
    const timer = window.setTimeout(() => {
      document
        .getElementById(`assignment-${focusAssignmentId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      onFocusHandled?.();
    }, 120);
    return () => window.clearTimeout(timer);
  }, [focusAssignmentId, groups, onFocusHandled]);

  function openGroup(groupId) {
    setSelectedGroupId(groupId);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function backToGroups() {
    setSelectedGroupId("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  if (!selectedGroup) {
    return (
      <div className="space-y-5" data-testid="student-assignment-page">
        <section className="meeting-hero" data-testid="student-assignment-hero">
          <div>
            <p className="meeting-overline">Tugas mahasiswa</p>
            <h2
              className="font-display text-2xl font-semibold"
              data-testid="student-assignment-title"
            >
              Tugas per mata kuliah
            </h2>
            <p className="meeting-description">
              Buka mata kuliah untuk melihat instruksi, lampiran, dan tempat
              pengumpulan tugas.
            </p>
          </div>
          <div
            className="meeting-summary"
            data-testid="student-assignment-summary"
          >
            <div>
              <strong>{groups.length}</strong>
              <span>Mata kuliah</span>
            </div>
            <div>
              <strong>{assignments.length}</strong>
              <span>Tugas</span>
            </div>
            <div
              className={
                pendingAssignments + revisionAssignments ? "attention" : ""
              }
            >
              <strong>{pendingAssignments + revisionAssignments}</strong>
              <span>Perlu aksi</span>
            </div>
          </div>
        </section>
        {groups.length === 0 ? (
          <EmptyState
            title="Belum ada tugas"
            description="Tugas aktif akan muncul di sini."
          />
        ) : (
          <div
            className="course-card-grid"
            data-testid="student-assignment-course-grid"
          >
            {groups.map((group) => (
              <Card
                key={group.id}
                className="course-material-card rounded-md shadow-none"
                data-testid={`student-assignment-course-card-${group.id}`}
              >
                <CardContent className="course-material-card-content">
                  <div className="course-material-card-main">
                    <span className="course-material-card-icon">
                      <ClipboardList />
                    </span>
                    <div className="course-material-card-header">
                      <div>
                        <h3
                          data-testid={`student-assignment-course-title-${group.id}`}
                        >
                          {group.courseName}
                        </h3>
                        <p
                          data-testid={`student-assignment-course-class-${group.id}`}
                        >
                          {group.className}
                        </p>
                      </div>
                      {group.pending + group.revision > 0 && (
                        <Badge className="border-red-200 bg-red-50 text-red-700">
                          {group.pending + group.revision} perlu aksi
                        </Badge>
                      )}
                      {group.classStatus && group.classStatus !== "active" && (
                        <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                          {group.classStatusLabel || group.classStatus}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="course-material-stats">
                    <div>
                      <strong>{group.assignments.length}</strong>
                      <span>Tugas</span>
                    </div>
                    <div>
                      <strong>{group.pending}</strong>
                      <span>Belum submit</span>
                    </div>
                    <div>
                      <strong>{group.graded}</strong>
                      <span>Dinilai</span>
                    </div>
                  </div>
                  <div className="course-material-footer">
                    <p className="course-material-latest">
                      {group.pending + group.revision > 0
                        ? `Prioritas: ${group.latestAssignment?.title}`
                        : group.latestAssignment?.title || "Belum ada tugas"}
                    </p>
                    <Button
                      type="button"
                      onClick={() => openGroup(group.id)}
                      data-testid={`student-assignment-course-open-${group.id}-button`}
                    >
                      <Eye /> Buka tugas
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5" data-testid="student-assignment-page">
      <section
        className="meeting-hero"
        data-testid="student-assignment-detail-hero"
      >
        <div>
          <Button
            type="button"
            variant="outline"
            className="mb-3"
            onClick={backToGroups}
            data-testid="student-assignment-back-button"
          >
            <ArrowLeft /> Kembali
          </Button>
          <p className="meeting-overline">Detail tugas</p>
          <h2
            className="font-display text-2xl font-semibold"
            data-testid="student-assignment-detail-title"
          >
            {selectedGroup.courseName}
          </h2>
          <p className="meeting-description">{selectedGroup.className}</p>
          {selectedGroup.classStatus && selectedGroup.classStatus !== "active" && (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              Kelas {selectedGroup.classStatusLabel || "sudah berakhir"}. Daftar tugas dan hasil tetap tersedia, tetapi pengumpulan baru ditutup.
            </p>
          )}
        </div>
        <div
          className="meeting-summary"
          data-testid="student-assignment-detail-summary"
        >
          <div>
            <strong>{selectedGroup.assignments.length}</strong>
            <span>Tugas</span>
          </div>
          <div>
            <strong>{selectedGroup.pending}</strong>
            <span>Belum submit</span>
          </div>
          <div>
            <strong>{selectedGroup.graded}</strong>
            <span>Dinilai</span>
          </div>
        </div>
      </section>
      {selectedGroup.pending + selectedGroup.revision > 0 && (
        <section
          className="student-task-priority-banner"
          data-testid="student-assignment-priority-banner"
        >
          <span className="student-task-priority-icon">
            <AlertTriangle />
          </span>
          <div>
            <strong>Mulai dari tugas yang perlu aksi</strong>
            <p>
              Tugas yang belum dikumpulkan atau diminta revisi ditampilkan
              paling atas agar tidak terlewat.
            </p>
          </div>
          <Badge className="border-amber-200 bg-white text-amber-700">
            {selectedGroup.pending + selectedGroup.revision} perlu aksi
          </Badge>
        </section>
      )}
      <div className="space-y-4" data-testid="student-assignment-list">
        {selectedGroup.assignments.map((assignment) =>
          renderAssignmentCard(assignment),
        )}
      </div>
    </div>
  );
}

function StudentGradesPage({ assignments, avgGrade, gradedAssignments }) {
  const groups = useMemo(
    () =>
      buildAssignmentCourseGroups(assignments).filter(
        (group) => group.graded > 0,
      ),
    [assignments],
  );
  return (
    <div className="space-y-5" data-testid="student-grade-page">
      <section className="meeting-hero" data-testid="student-grade-hero">
        <div>
          <p className="meeting-overline">Nilai mahasiswa</p>
          <h2
            className="font-display text-2xl font-semibold"
            data-testid="student-grade-title"
          >
            Nilai per mata kuliah
          </h2>
          <p className="meeting-description">
            Setiap mata kuliah menampilkan rata-rata nilai dari tugas yang sudah
            dinilai.
          </p>
        </div>
        <div className="meeting-summary" data-testid="student-grade-summary">
          <div>
            <strong>{groups.length}</strong>
            <span>Mata kuliah</span>
          </div>
          <div>
            <strong>{gradedAssignments}</strong>
            <span>Sudah dinilai</span>
          </div>
          <div>
            <strong>{avgGrade || 0}</strong>
            <span>Rata-rata</span>
          </div>
        </div>
      </section>
      {groups.length === 0 ? (
        <EmptyState
          title="Belum ada nilai"
          description="Nilai tugas yang telah diperiksa dosen akan muncul di sini."
        />
      ) : (
        <div className="space-y-4" data-testid="student-grade-course-list">
          {groups.map((group) => {
            const gradedInCourse = group.assignments.filter(
              (assignment) =>
                assignment.my_submission?.grade !== undefined &&
                assignment.my_submission?.grade !== null,
            );
            const scores = gradedInCourse
              .map((assignment) => Number(assignment.my_submission?.grade))
              .filter((score) => !Number.isNaN(score));
            const average = scores.length
              ? Math.round(
                  (scores.reduce((sum, score) => sum + score, 0) /
                    scores.length) *
                    10,
                ) / 10
              : 0;
            const averageLabel = Number.isInteger(average)
              ? String(average)
              : average.toFixed(1);
            const ungradedCount =
              group.assignments.length - gradedInCourse.length;
            return (
              <section
                key={group.id}
                className="grade-course-panel"
                data-testid={`student-grade-course-${group.id}`}
              >
                <header className="grade-course-header">
                  <div>
                    <h3>{group.courseName}</h3>
                    <p>{group.className}</p>
                  </div>
                  <div
                    className="grade-course-summary"
                    data-testid={`student-grade-average-${group.id}`}
                  >
                    <span>Rata-rata MK</span>
                    <strong>{averageLabel}</strong>
                  </div>
                </header>
                <div
                  className="grade-course-meta"
                  data-testid={`student-grade-meta-${group.id}`}
                >
                  <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                    {gradedInCourse.length} dari {group.assignments.length}{" "}
                    tugas dinilai
                  </Badge>
                  {ungradedCount > 0 && (
                    <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                      {ungradedCount} belum dinilai
                    </Badge>
                  )}
                </div>
                <div className="grade-course-list">
                  {group.assignments.map((assignment) => {
                    const hasGrade =
                      assignment.my_submission?.grade !== undefined &&
                      assignment.my_submission?.grade !== null;
                    const statusLabel = hasGrade
                      ? assignment.my_submission?.grade_predicate || "Dinilai"
                      : "Belum dinilai";
                    const feedback = hasGrade
                      ? assignment.my_submission?.feedback ||
                        "Belum ada feedback."
                      : assignment.my_submission
                        ? "Menunggu penilaian dosen."
                        : "Belum submit tugas ini.";
                    return (
                      <div
                        key={assignment.id}
                        className={`grade-course-row ${hasGrade ? "" : "pending"}`}
                        data-testid={`student-grade-card-${assignment.id}`}
                      >
                        <div>
                          <h4>{assignment.title}</h4>
                          <p className="grade-course-feedback">{feedback}</p>
                        </div>
                        <div
                          className={`grade-course-score ${hasGrade ? "" : "muted"}`}
                        >
                          <strong>
                            {hasGrade ? assignment.my_submission.grade : "-"}
                          </strong>
                          <Badge
                            className={
                              hasGrade
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                            }
                          >
                            {statusLabel}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentCalendarPage({ events }) {
  const orderedEvents = useMemo(
    () =>
      [...events].sort(
        (left, right) => new Date(left.date) - new Date(right.date),
      ),
    [events],
  );
  const upcomingEvents = orderedEvents.filter(
    (event) => new Date(event.date).getTime() >= Date.now(),
  );

  return (
    <div className="space-y-5" data-testid="student-calendar-page">
      <section className="meeting-hero" data-testid="student-calendar-hero">
        <div>
          <p className="meeting-overline">Agenda akademik</p>
          <h2 className="font-display text-2xl font-semibold">
            Kalender & deadline
          </h2>
          <p className="meeting-description">
            Pantau jadwal pengumpulan tugas agar tidak ada deadline yang
            terlewat.
          </p>
        </div>
        <div className="meeting-summary">
          <div>
            <strong>{events.length}</strong>
            <span>Total agenda</span>
          </div>
          <div className={upcomingEvents.length ? "attention" : ""}>
            <strong>{upcomingEvents.length}</strong>
            <span>Akan datang</span>
          </div>
        </div>
      </section>
      {orderedEvents.length === 0 ? (
        <EmptyState
          title="Belum ada agenda"
          description="Deadline tugas dan agenda kelas akan muncul di sini."
        />
      ) : (
        <div
          className="student-agenda-list"
          data-testid="student-calendar-list"
        >
          {orderedEvents.map((event) => {
            const isPast = new Date(event.date).getTime() < Date.now();
            return (
              <article
                key={event.id}
                className={`student-agenda-item ${isPast ? "past" : ""}`}
                data-testid={`student-calendar-item-${event.id}`}
              >
                <span className="student-agenda-icon">
                  <CalendarDays />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{event.title}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {fmtDate(event.date)}
                  </p>
                </div>
                <Badge
                  className={
                    isPast
                      ? "border-slate-200 bg-slate-50 text-slate-600"
                      : "border-blue-200 bg-blue-50 text-blue-700"
                  }
                >
                  {isPast ? "Selesai" : "Mendatang"}
                </Badge>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StudentApp({ token, user, onLogout, branding, onUserUpdate, version }) {
  const [data, setData] = useState({
    assignments: [],
    materials: [],
    submissions: [],
    calendar: [],
    reminders: [],
    enrollments: [],
    progress: null,
  });
  const [fileMap, setFileMap] = useState({});
  const [noteMap, setNoteMap] = useState({});
  const [uploadMap, setUploadMap] = useState({});
  const [classCode, setClassCode] = useState("");
  const [studentPage, setStudentPage] = useState("home");
  const [assignmentFocusId, setAssignmentFocusId] = useState("");
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );
  const progress = useActionProgress();
  async function loadStudent() {
    const [
      assignments,
      materials,
      submissions,
      calendar,
      reminders,
      progress,
      enrollments,
    ] = await Promise.all([
      axios.get(`${API}/assignments`, auth),
      axios.get(`${API}/materials`, auth),
      axios.get(`${API}/submissions`, auth),
      axios.get(`${API}/calendar`, auth),
      axios.get(`${API}/reminders`, auth),
      axios.get(`${API}/progress`, auth),
      axios.get(`${API}/enrollment-requests`, auth),
    ]);
    setData({
      assignments: assignments.data,
      materials: materials.data,
      submissions: submissions.data,
      calendar: calendar.data,
      reminders: reminders.data,
      progress: progress.data,
      enrollments: enrollments.data,
    });
  }
  useEffect(() => {
    loadStudent().catch(() => toast.error("Gagal memuat ruang mahasiswa"));
    // The authenticated student shell owns one initial aggregate fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  async function requestJoinClass(event) {
    event.preventDefault();
    if (!classCode.trim()) return toast.error("Masukkan kode kelas");
    if (!window.confirm(`Kirim permintaan masuk ke kelas dengan kode ${classCode.trim().toUpperCase()}?`)) return;
    const operation = progress.begin("Mengirim permintaan kelas");
    try {
      await axios.post(
        `${API}/classes/join-request`,
        { class_code: classCode },
        auth,
      );
      await loadStudent();
      progress.finish(operation, "Permintaan kelas dikirim");
      toast.success("Request kelas dikirim, menunggu ACC dosen");
    } catch (error) {
      const detail = error.response?.data?.detail || "Request kelas gagal";
      progress.fail(operation, detail);
      toast.error(detail);
    }
  }
  function fileSizeLabel(bytes) {
    if (!bytes) return "0 KB";
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }
  function updateUploadState(assignmentId, patch) {
    setUploadMap((items) => ({
      ...items,
      [assignmentId]: { ...(items[assignmentId] || {}), ...patch },
    }));
  }
  async function submitAssignment(assignmentId) {
    const assignment = data.assignments.find(
      (item) => item.id === assignmentId,
    );
    if (assignment && !canSubmitAssignment(assignment))
      return toast.error(
        "Tugas sudah dikumpulkan. Pengiriman ulang hanya bisa setelah dosen meminta revisi.",
      );
    const selectedFiles = Array.from(fileMap[assignmentId] || []);
    if (!selectedFiles.length)
      return toast.error("Pilih minimal satu file tugas");
    if (!window.confirm(
      `${assignment?.my_submission ? "Kirim revisi" : "Kumpulkan tugas"} ${assignment?.title || "ini"} dengan ${selectedFiles.length} file? File tidak dapat diganti kecuali dosen meminta revisi.`,
    )) return;
    const totalSize = selectedFiles.reduce(
      (sum, item) => sum + (item.size || 0),
      0,
    );
    const maxFileSizeMb = assignmentMaxSubmissionMb(assignment);
    const maxBytes = maxFileSizeMb * 1024 * 1024;
    const oversizedFile = selectedFiles.find(
      (file) => (file.size || 0) > maxBytes,
    );
    if (oversizedFile)
      return toast.error(
        `Ukuran file ${oversizedFile.name} maksimal ${maxFileSizeMb} MB`,
      );
    const allowedFormats = assignmentAllowedFormats(assignment);
    const invalidFile = selectedFiles.find((file) => {
      const extension = file.name?.includes(".")
        ? file.name.split(".").pop().toLowerCase()
        : "";
      return extension && !allowedFormats.includes(extension);
    });
    if (invalidFile)
      return toast.error(
        `Format file ${invalidFile.name} tidak sesuai. Gunakan: ${assignmentFormatLabel(assignment)}`,
      );
    const fd = new FormData();
    selectedFiles.forEach((item) => fd.append("files", item));
    fd.append("note", noteMap[assignmentId] || "");
    const operation = progress.begin(
      "Mengunggah tugas",
      `${selectedFiles.length} file (${fileSizeLabel(totalSize)}) siap dikirim.`,
    );
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
          const rawPercent = total
            ? Math.round((event.loaded / total) * 100)
            : 0;
          const percent =
            rawPercent >= 100 ? 95 : Math.max(1, Math.min(90, rawPercent));
          updateUploadState(assignmentId, {
            busy: true,
            percent,
            message:
              rawPercent >= 100
                ? "File sudah sampai server. Menyimpan submission..."
                : "Mengunggah file ke server...",
            detail: total
              ? `${fileSizeLabel(event.loaded)} dari ${fileSizeLabel(total)} terkirim.`
              : "Mengirim file...",
          });
          progress.update(
            operation,
            percent,
            rawPercent >= 100 ? "Menyimpan submission" : "Mengunggah tugas",
            total
              ? `${fileSizeLabel(event.loaded)} dari ${fileSizeLabel(total)} terkirim.`
              : "Mengirim file...",
          );
        },
      });
      updateUploadState(assignmentId, {
        busy: false,
        done: true,
        error: false,
        percent: 100,
        message: "Upload selesai",
        detail:
          "Tugas tersimpan. Jika Google Drive aktif, sinkronisasi berjalan di background.",
      });
      setFileMap((items) => ({ ...items, [assignmentId]: [] }));
      progress.finish(
        operation,
        "Upload tugas selesai",
        "File tersimpan di server; sinkron Drive diproses di latar.",
      );
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
      const detail = formatApiError(
        error,
        "Submit gagal. Periksa ukuran file, koneksi, atau konfigurasi Google Drive.",
      );
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
  const canSubmitAssignment = (assignment) =>
    assignmentNeedsStudentAction(assignment);
  const assignmentMeta = (assignment) =>
    [
      assignment.course_name || "Mata kuliah",
      assignment.lecturer_name ? `Dosen: ${assignment.lecturer_name}` : "Dosen",
    ]
      .filter(Boolean)
      .join(" · ");
  const pendingAssignments = (data.assignments || []).filter(
    (item) => assignmentNeedsStudentAction(item) && !item.my_submission,
  ).length;
  const revisionAssignments = (data.assignments || []).filter(
    (item) => assignmentNeedsStudentAction(item) && Boolean(item.my_submission),
  ).length;
  const gradedAssignments = (data.assignments || []).filter(
    (item) =>
      item.my_submission?.grade !== undefined &&
      item.my_submission?.grade !== null,
  ).length;
  const actionAssignments = orderStudentAssignments(
    (data.assignments || []).filter(assignmentNeedsStudentAction),
  );
  const studentActionCount = actionAssignments.length;
  const submittedAssignmentCount = (data.assignments || []).filter(
    (item) => item.my_submission,
  ).length;
  const assignmentCompletion = data.assignments.length
    ? Math.round((submittedAssignmentCount / data.assignments.length) * 100)
    : 0;
  const studentClassSummaries = useMemo(() => {
    const classMap = new Map();
    (data.assignments || []).forEach((assignment) => {
      const key = assignment.class_id || assignment.class_name;
      if (!key) return;
      if (!classMap.has(key))
        classMap.set(key, {
          id: key,
          class_name: assignment.class_name || "Kelas",
          course_name: assignment.course_name || "Mata kuliah",
          assignmentCount: 0,
          submitted: 0,
          graded: 0,
        });
      const entry = classMap.get(key);
      entry.assignmentCount += 1;
      if (assignment.my_submission) entry.submitted += 1;
      if (assignment.my_submission?.grade != null) entry.graded += 1;
    });
    (data.enrollments || [])
      .filter((request) => request.status === "approved")
      .forEach((request) => {
        if (!classMap.has(request.class_id))
          classMap.set(request.class_id, {
            id: request.class_id,
            class_name: request.class_name || "Kelas",
            course_name: request.course_name || "Mata kuliah",
            assignmentCount: 0,
            submitted: 0,
            graded: 0,
          });
      });
    return Array.from(classMap.values());
  }, [data.assignments, data.enrollments]);
  const nextPriorityAssignment = actionAssignments.find(
    (assignment) =>
      Number.isFinite(new Date(assignment.deadline).getTime()) &&
      new Date(assignment.deadline).getTime() >= Date.now() - 3600000,
  );
  const studentUpcomingEvents = useMemo(
    () =>
      [...(data.calendar || [])]
        .filter((event) => {
          const date = new Date(event.date).getTime();
          return Number.isFinite(date) && date >= Date.now() - 3600000;
        })
        .sort(
          (left, right) =>
            new Date(left.date).getTime() - new Date(right.date).getTime(),
        )
        .slice(0, 5),
    [data.calendar],
  );
  const studentRecentGrades = useMemo(
    () =>
      (data.assignments || [])
        .filter((assignment) => assignment.my_submission?.grade != null)
        .sort(
          (left, right) =>
            new Date(
              right.my_submission?.graded_at ||
                right.my_submission?.updated_at ||
                right.my_submission?.submitted_at ||
                0,
            ).getTime() -
            new Date(
              left.my_submission?.graded_at ||
                left.my_submission?.updated_at ||
                left.my_submission?.submitted_at ||
                0,
            ).getTime(),
        )
        .slice(0, 4),
    [data.assignments],
  );
  const nav = [
    ["home", LayoutDashboard, "Beranda"],
    ["courses", BookOpen, "Materi"],
    ["assignments", ClipboardList, "Tugas"],
    ["grades", CheckCircle2, "Nilai"],
    ["calendar", CalendarDays, "Kalender"],
    ["profile", Users, "Profil"],
    ["guide", BookOpen, "Panduan LMS"],
  ];
  const pageTitle =
    nav.find(([key]) => key === studentPage)?.[2] || "Beranda";
  const pageDescriptions = {
    home: "Tugas prioritas, kelas aktif, dan progres belajar Anda.",
    courses: "Materi kuliah tersusun berdasarkan mata kuliah.",
    assignments: "Kerjakan dan kumpulkan tugas pada satu tempat.",
    grades: "Lihat hasil penilaian dan umpan balik dosen.",
    calendar: "Pantau agenda serta deadline terdekat.",
    profile: "Kelola informasi dan keamanan akun Anda.",
    guide: "Pahami alur kelas, approval, tugas, nilai, dan pergantian semester.",
  };
  function openStudentAssignment(assignmentId) {
    setAssignmentFocusId(assignmentId);
    setStudentPage("assignments");
  }
  const renderAssignmentCard = (a) => {
    const uploadState = uploadMap[a.id] || {};
    const classReadOnly = a.class_allows_learning === false;
    const canSubmit = canSubmitAssignment(a) && !classReadOnly;
    const submittedFiles = submissionFiles(a.my_submission);
    const submitLabel = a.my_submission ? "Kirim revisi" : "Kumpulkan tugas";
    const allowedFormats = assignmentAllowedFormats(a);
    const maxSubmissionMb = assignmentMaxSubmissionMb(a);
    return (
      <Card
        id={`assignment-${a.id}`}
        key={a.id}
        className={`student-assignment-card rounded-md shadow-none scroll-mt-24 ${canSubmit ? "student-assignment-card-action" : "student-assignment-card-complete"}`}
        data-testid={`student-assignment-card-${a.id}`}
      >
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3
                className="font-display text-xl font-semibold"
                data-testid={`student-assignment-title-${a.id}`}
              >
                {a.title}
              </h3>
              <p
                className="text-sm font-medium text-blue-700"
                data-testid={`student-assignment-meta-${a.id}`}
              >
                {assignmentMeta(a)}
              </p>
              <p
                className="text-sm text-slate-500"
                data-testid={`student-assignment-deadline-${a.id}`}
              >
                {fmtDate(a.deadline)} ·{" "}
                {a.close_after_deadline
                  ? "Tutup setelah deadline"
                  : "Boleh terlambat"}
              </p>
              <DeadlineCountdown
                deadline={a.deadline}
                testid={`student-assignment-deadline-countdown-${a.id}`}
              />
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Badge
                className={statusClass(
                  a.my_submission?.status || "Belum Submit",
                )}
                data-testid={`student-assignment-status-${a.id}`}
              >
                {a.my_submission
                  ? submissionStatusLabel(a.my_submission?.status)
                  : "Belum dikumpulkan"}
              </Badge>
              {a.my_submission?.review_status === "revision_requested" && (
                <Badge className="border-amber-200 bg-amber-50 text-amber-700">
                  Revisi dibuka
                </Badge>
              )}
              {a.my_submission?.grade != null && (
                <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">
                  Nilai tersedia
                </Badge>
              )}
              {classReadOnly && (
                <Badge className="border-slate-200 bg-slate-50 text-slate-700">
                  {a.class_status_label || "Kelas berakhir"}
                </Badge>
              )}
            </div>
          </div>
          <p className="mt-3 text-sm text-slate-700">{a.description}</p>
          <section
            className="assignment-resource-panel"
            data-testid={`student-assignment-format-${a.id}`}
          >
            <p className="assignment-resource-heading">
              <FileText /> Format jawaban mahasiswa
            </p>
            <p
              className="assignment-resource-note"
              data-testid={`student-assignment-format-text-${a.id}`}
            >
              Format: {assignmentFormatLabel(a)}. Ukuran maksimal:{" "}
              {maxSubmissionMb} MB per file.
            </p>
          </section>
          {(a.attachment_link || a.attachments?.length > 0) && (
            <section
              className="assignment-resource-panel"
              data-testid={`student-assignment-attachments-${a.id}`}
            >
              <p className="assignment-resource-heading">
                <Paperclip /> Lampiran tugas dari dosen
              </p>
              {a.attachment_link && (
                <a
                  href={normalizedExternalLink(a.attachment_link)}
                  target="_blank"
                  rel="noreferrer"
                  className="assignment-resource-link"
                  data-testid={`student-assignment-attachment-link-${a.id}`}
                >
                  <Paperclip /> Lampiran link tugas
                </a>
              )}
              {(a.attachments || []).map((file) => (
                <a
                  key={file.file_id}
                  href={authenticatedFileLink(file.file_url, token)}
                  target="_blank"
                  rel="noreferrer"
                  className="assignment-resource-link"
                  data-testid={`student-assignment-attachment-${file.file_id}-link`}
                >
                  <FileText /> {file.file_name}
                </a>
              ))}
            </section>
          )}
          {submittedFiles.length > 0 && (
            <div
              className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3"
              data-testid={`student-submitted-files-${a.id}`}
            >
              <p className="text-sm font-semibold text-slate-800">
                File yang sudah dikumpulkan
              </p>
              <div className="mt-2 space-y-2">
                {submittedFiles.map((file) => (
                  <div
                    key={fileId(file)}
                    className="flex flex-wrap items-center gap-2 text-sm"
                  >
                    <a
                      href={authenticatedFileLink(file.file_url, token)}
                      target="_blank"
                      rel="noreferrer"
                      className="font-semibold text-blue-700 underline"
                    >
                      {file.file_name || "File tugas"}
                    </a>
                    <Badge className={statusClass(file.drive_sync_status)}>
                      {driveSyncLabel(file.drive_sync_status)}
                    </Badge>
                    {file.drive_sync_status === "failed" && (
                      <span className="text-xs text-red-700">
                        File tetap aman di server lokal, Drive akan dicek dosen.
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          {a.my_submission?.grade != null && (
            <div className="mt-4 border border-emerald-200 bg-emerald-50 p-3">
              <p className="font-semibold text-emerald-800">
                Nilai: {a.my_submission.grade} (
                {a.my_submission.grade_predicate || "-"})
              </p>
              <p className="text-sm text-emerald-700">
                {a.my_submission.feedback}
              </p>
            </div>
          )}
          {canSubmit ? (
            <section
              className="student-submit-panel"
              data-testid={`student-submit-panel-${a.id}`}
            >
              <div className="student-submit-heading">
                <span>
                  <Upload />
                </span>
                <div>
                  <strong>
                    {a.my_submission ? "Kirim perbaikan tugas" : "Kumpulkan tugas"}
                  </strong>
                  <p>
                    Ikuti urutan di bawah. File tidak akan dikirim sebelum Anda
                    menekan tombol kumpulkan.
                  </p>
                </div>
              </div>
              <div className="student-submit-steps">
                <label>
                  <span>1. Pilih file</span>
                  <Input
                    type="file"
                    multiple
                    accept={fileAcceptFromFormats(allowedFormats)}
                    disabled={uploadState.busy}
                    data-testid={`student-submit-file-${a.id}-input`}
                    onChange={(e) =>
                      setFileMap({ ...fileMap, [a.id]: e.target.files })
                    }
                  />
                  <small>
                    {assignmentFormatLabel(a)} · maks. {maxSubmissionMb} MB per
                    file
                  </small>
                </label>
                <label>
                  <span>2. Catatan (opsional)</span>
                  <Input
                    placeholder="Contoh: File revisi sesuai arahan dosen"
                    value={noteMap[a.id] || ""}
                    disabled={uploadState.busy}
                    onChange={(e) =>
                      setNoteMap({ ...noteMap, [a.id]: e.target.value })
                    }
                  />
                </label>
                <Button
                  className="student-submit-button"
                  onClick={() => submitAssignment(a.id)}
                  disabled={uploadState.busy}
                >
                  <Send /> {uploadState.busy ? "Mengupload..." : `3. ${submitLabel}`}
                </Button>
              </div>
            </section>
          ) : (
            <div
              className="student-submit-locked"
              data-testid={`student-submit-locked-${a.id}`}
            >
              <CheckCircle2 />
              <div>
                <strong>{classReadOnly ? "Pengumpulan ditutup" : "Tugas sudah dikumpulkan"}</strong>
                <p>
                  {classReadOnly
                    ? "Kelas sudah berakhir atau difinalisasi. Anda masih dapat membaca instruksi dan melihat file yang sudah dikumpulkan."
                    : "File terkunci agar tidak tertimpa. Pengiriman ulang akan terbuka jika dosen meminta revisi."}
                </p>
              </div>
            </div>
          )}
          {(uploadState.busy || uploadState.done || uploadState.error) && (
            <div
              className={`student-upload-status ${uploadState.done ? "done" : ""} ${uploadState.error ? "error" : ""}`}
              data-testid={`student-upload-status-${a.id}`}
            >
              <div className="student-upload-topline">
                <strong>{uploadState.message}</strong>
                <span>{uploadState.percent || 0}%</span>
              </div>
              <div className="student-upload-bar" aria-hidden="true">
                <span style={{ width: `${uploadState.percent || 0}%` }} />
              </div>
              <p>{uploadState.detail}</p>
              {uploadState.busy && (
                <small>
                  Jangan tutup halaman sampai proses selesai. Jika Google Drive
                  aktif, tahap akhir bisa sedikit lebih lama.
                </small>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };
  return (
    <div
      className="min-h-screen bg-slate-50 text-slate-900"
      data-testid="student-app-shell"
    >
      <aside
        className="student-sidebar admin-sidebar-shell fixed inset-y-0 left-0 z-30 hidden w-72 flex-col bg-slate-950 text-white lg:flex"
        data-testid="student-sidebar"
      >
        <div className="admin-sidebar-brand flex items-center gap-3">
          <div className="admin-sidebar-logo">
            <img
              src={brandingLogo(branding)}
              alt="Logo"
              className="h-9 w-9 object-contain"
            />
          </div>
          <div className="min-w-0">
            <p
              className="truncate font-display text-lg font-bold"
              data-testid="student-sidebar-title"
            >
              {brandingName(branding)}
            </p>
            <p className="mt-0.5 text-xs font-medium text-sky-100/70">
              Ruang Mahasiswa
            </p>
          </div>
        </div>
        <div className="admin-sidebar-nav">
          <nav data-testid="student-desktop-navigation">
            <p className="admin-nav-group-label">Menu belajar</p>
            <div className="space-y-1">
              {nav.map(([key, Icon, label]) => {
                const isActive = studentPage === key;
                return (
                  <Button
                    key={key}
                    variant="ghost"
                    className="admin-nav-item w-full justify-start"
                    data-active={isActive}
                    aria-current={isActive ? "page" : undefined}
                    data-testid={`student-nav-${key}-button`}
                    onClick={() => setStudentPage(key)}
                  >
                    <Icon className="admin-nav-icon" />
                    <span className="truncate">{label}</span>
                  </Button>
                );
              })}
            </div>
          </nav>
          <div
            className="student-join-panel"
            data-testid="student-sidebar-join-class"
          >
            <p className="admin-nav-group-label !mx-0">Gabung Kelas</p>
            <form
              onSubmit={requestJoinClass}
              className="space-y-2"
              data-testid="student-sidebar-join-form"
            >
              <Input
                className="w-full bg-white/10 text-white placeholder:text-slate-400"
                data-testid="student-sidebar-class-code-input"
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Masukkan kode kelas"
              />
              <Button
                type="submit"
                size="sm"
                className="w-full"
                data-testid="student-sidebar-join-submit-button"
              >
                <Send /> Gabung
              </Button>
            </form>
            {data.enrollments.length > 0 && (
              <div
                className="mt-3 space-y-1"
                data-testid="student-sidebar-enrollment-list"
              >
                {data.enrollments.map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 text-xs text-slate-300"
                    data-testid={`student-sidebar-enrollment-${r.id}`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${r.status === "approved" ? "bg-emerald-400" : "bg-amber-400"}`}
                    />
                    <span className="truncate">{r.class_name}</span>
                    <span className="ml-auto shrink-0 text-slate-500">
                      {r.status === "approved" ? "Aktif" : "Proses"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <VersionMeta version={version} className="mt-auto px-5 pb-5" />
      </aside>
      <main className="student-main-content lg:pl-72">
        <header
          className="sticky top-0 z-20 border-b bg-white/95 px-5 py-4 backdrop-blur md:px-8"
          data-testid="student-topbar"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p
                className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500"
                data-testid="student-role-label"
              >
                Mahasiswa
              </p>
              <h1
                className="font-display text-3xl font-bold"
                data-testid="student-page-title"
              >
                {pageTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {pageDescriptions[studentPage]}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {studentActionCount > 0 && (
                <Badge
                  className="border-amber-200 bg-amber-50 text-amber-700"
                  data-testid="student-topbar-activity-badge"
                >
                  {studentActionCount} perlu aksi
                </Badge>
              )}
              <Badge
                className="border-slate-200 bg-white text-slate-700"
                data-testid="student-name-title"
              >
                {user.name}
              </Badge>
              <Button
                variant="outline"
                data-testid="student-profile-button"
                onClick={() => setStudentPage("profile")}
              >
                Profil
              </Button>
              <Button
                variant="outline"
                data-testid="student-logout-button"
                onClick={onLogout}
              >
                <LogOut /> Keluar
              </Button>
            </div>
          </div>
        </header>
        <section
          className="student-page-content space-y-6 p-5 md:p-8"
          data-testid="student-dashboard-section"
        >
          {studentPage === "home" && (
            <>
              <section className="student-welcome-panel" data-testid="student-welcome-panel">
                <div className="student-welcome-copy">
                  <p className="meeting-overline">Selamat datang kembali</p>
                  <h2>Halo, {user.name}</h2>
                  <p>
                    {studentActionCount > 0
                      ? `${studentActionCount} tugas perlu perhatian. Mulai dari deadline terdekat.`
                      : "Semua tugas sudah ditangani. Anda bisa melanjutkan materi berikutnya."}
                  </p>
                  {nextPriorityAssignment && (
                    <div className="student-next-deadline" data-testid="student-next-deadline">
                      <CalendarDays />
                      <div>
                        <small>Deadline prioritas</small>
                        <strong>{nextPriorityAssignment.title}</strong>
                        <span>{fmtDate(nextPriorityAssignment.deadline)}</span>
                      </div>
                      <DeadlineCountdown deadline={nextPriorityAssignment.deadline} compact />
                    </div>
                  )}
                </div>
                <div className="student-welcome-summary">
                  <div
                    className="student-completion-ring"
                    style={{ "--student-progress": `${assignmentCompletion * 3.6}deg` }}
                    data-testid="student-assignment-completion"
                  >
                    <div><strong>{assignmentCompletion}%</strong><span>tugas terkumpul</span></div>
                  </div>
                  <div className="student-quick-actions">
                    <Button onClick={() => setStudentPage("assignments")}>
                      <ClipboardList /> Lihat tugas
                    </Button>
                    <Button variant="outline" onClick={() => setStudentPage("courses")}>
                      <BookOpen /> Buka materi
                    </Button>
                  </div>
                </div>
              </section>
              <Card
                className={`student-focus-card rounded-md shadow-none ${studentActionCount === 0 ? "student-focus-card-complete" : ""}`}
                data-testid="student-activity-card"
              >
                <CardHeader className="student-focus-header">
                  <div>
                    <p className="meeting-overline">
                      {studentActionCount > 0 ? "Prioritas hari ini" : "Status tugas"}
                    </p>
                    <CardTitle data-testid="student-activity-title">
                      {studentActionCount > 0
                        ? "Yang perlu Anda kerjakan"
                        : "Semua tugas sudah ditangani"}
                    </CardTitle>
                    <p
                      className="student-focus-description"
                      data-testid="student-activity-summary"
                    >
                      {studentActionCount > 0
                        ? "Urutan dibuat berdasarkan revisi dan deadline terdekat."
                        : "Tidak ada tugas baru atau revisi yang menunggu."}
                    </p>
                  </div>
                  <div className="student-focus-badges">
                    <Badge
                      className="border-red-200 bg-white text-red-700"
                      data-testid="student-activity-pending"
                    >
                      {pendingAssignments} belum dikumpulkan
                    </Badge>
                    <Badge
                      className="border-amber-200 bg-white text-amber-700"
                      data-testid="student-activity-revision"
                    >
                      {revisionAssignments} revisi
                    </Badge>
                    <Badge
                      className="border-emerald-200 bg-white text-emerald-700"
                      data-testid="student-activity-graded"
                    >
                      {gradedAssignments} dinilai
                    </Badge>
                    <Badge
                      className="border-blue-200 bg-white text-blue-700"
                      data-testid="student-activity-reminders"
                    >
                      {data.reminders.length} pengingat
                    </Badge>
                  </div>
                </CardHeader>
                {studentActionCount > 0 && (
                  <CardContent className="student-focus-list">
                    {actionAssignments.slice(0, 3).map((assignment) => {
                      const isRevision =
                        assignment.my_submission?.status === "Direvisi" ||
                        assignment.my_submission?.review_status ===
                          "revision_requested";
                      return (
                        <article
                          key={assignment.id}
                          className="student-focus-item"
                          data-testid={`student-focus-assignment-${assignment.id}`}
                        >
                          <span className="student-focus-item-icon">
                            {isRevision ? <Reply /> : <AlertTriangle />}
                          </span>
                          <div className="student-focus-item-copy">
                            <div className="student-focus-item-title-row">
                              <strong>{assignment.title}</strong>
                              <Badge
                                className={
                                  isRevision
                                    ? "border-amber-200 bg-amber-50 text-amber-700"
                                    : "border-red-200 bg-red-50 text-red-700"
                                }
                              >
                                {isRevision ? "Perlu revisi" : "Belum dikumpulkan"}
                              </Badge>
                            </div>
                            <p>
                              {[assignment.course_name, assignment.class_name]
                                .filter(Boolean)
                                .join(" · ")}
                            </p>
                            <div className="student-focus-deadline">
                              <CalendarDays /> {fmtDate(assignment.deadline)}
                              <DeadlineCountdown
                                deadline={assignment.deadline}
                                compact
                                testid={`student-focus-deadline-${assignment.id}`}
                              />
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            onClick={() => openStudentAssignment(assignment.id)}
                            data-testid={`student-focus-open-${assignment.id}-button`}
                          >
                            Buka tugas
                          </Button>
                        </article>
                      );
                    })}
                    {studentActionCount > 3 && (
                      <Button
                        variant="ghost"
                        className="student-focus-see-all"
                        onClick={() => setStudentPage("assignments")}
                      >
                        Lihat {studentActionCount - 3} tugas lainnya
                      </Button>
                    )}
                  </CardContent>
                )}
              </Card>
              <Card
                className="rounded-md shadow-none lg:hidden"
                data-testid="student-mobile-join-card"
              >
                <CardContent className="p-5">
                  <form
                    onSubmit={requestJoinClass}
                    className="flex flex-wrap gap-3"
                    data-testid="student-mobile-join-form"
                  >
                    <Input
                      className="max-w-xs flex-1"
                      data-testid="student-mobile-class-code-input"
                      value={classCode}
                      onChange={(e) => setClassCode(e.target.value)}
                      placeholder="Kode kelas"
                    />
                    <Button data-testid="student-mobile-join-submit-button">
                      <Send /> Gabung
                    </Button>
                  </form>
                  <div
                    className="mt-3 flex flex-wrap gap-2"
                    data-testid="student-mobile-enrollment-list"
                  >
                    {data.enrollments.map((r) => (
                      <Badge
                        key={r.id}
                        className={statusClass(
                          r.status === "approved" ? "Aman" : "Risiko Rendah",
                        )}
                        data-testid={`student-mobile-enrollment-${r.id}`}
                      >
                        {r.class_name}: {r.status}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="student-classes-overview-card rounded-md shadow-none" data-testid="student-my-classes-card">
                <CardHeader className="student-class-card-header">
                  <CardTitle data-testid="student-my-classes-title">Kelas aktif</CardTitle>
                  <p>Progres tugas pada setiap kelas yang sedang Anda ikuti.</p>
                </CardHeader>
                <CardContent>
                  {studentClassSummaries.length === 0 ? (
                    <p className="text-sm text-slate-500" data-testid="student-my-classes-empty">
                      Belum ada kelas aktif. Masukkan kode kelas di sidebar untuk bergabung.
                    </p>
                  ) : (
                    <div className="student-class-summary-grid" data-testid="student-my-classes-grid">
                      {studentClassSummaries.map((cls, idx) => {
                        const completion = cls.assignmentCount
                          ? Math.round((cls.submitted / cls.assignmentCount) * 100)
                          : 0;
                        return (
                          <article key={cls.id || idx} data-testid={`student-class-card-${idx}`}>
                            <span className="student-class-summary-icon"><BookOpen /></span>
                            <div className="student-class-summary-copy">
                              <div>
                                <strong data-testid={`student-class-course-${idx}`}>{cls.course_name}</strong>
                                <p data-testid={`student-class-name-${idx}`}>{cls.class_name}</p>
                              </div>
                              <Badge className="border-blue-200 bg-blue-50 text-blue-700" data-testid={`student-class-assignment-count-${idx}`}>
                                {cls.submitted}/{cls.assignmentCount} tugas
                              </Badge>
                              <div className="student-class-progress"><span style={{ width: `${completion}%` }} /></div>
                              <small>{completion}% terkumpul · {cls.graded} nilai tersedia</small>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              <div className="student-home-section-heading">
                <div>
                  <p className="meeting-overline">Perkembangan Anda</p>
                  <h2>Progres belajar</h2>
                </div>
                <p>Ringkasan pengumpulan dan nilai pada semester berjalan.</p>
              </div>
              <div className="student-progress-grid grid gap-4 md:grid-cols-4">
                <StatCard
                  icon={ClipboardList}
                  label="Progres tugas"
                  value={`${assignmentCompletion}%`}
                  hint={`${submittedAssignmentCount} dari ${data.assignments.length} tugas`}
                  testid="student-stat-submitted"
                />
                <StatCard
                  icon={AlertTriangle}
                  label="Perlu aksi"
                  value={studentActionCount}
                  hint={`${revisionAssignments} revisi · ${pendingAssignments} belum submit`}
                  testid="student-stat-missing"
                />
                <StatCard
                  icon={CheckCircle2}
                  label="Rata-rata"
                  value={data.progress?.progress?.avg_grade || 0}
                  hint="Nilai terkini"
                  testid="student-stat-grade"
                />
                <StatCard
                  icon={GraduationCap}
                  label="Nilai tersedia"
                  value={gradedAssignments}
                  hint={`${data.reminders.length} pengingat diterima`}
                  testid="student-stat-reminders"
                />
              </div>
              <div className="student-dashboard-detail-grid">
                <Card className="student-dashboard-detail-card rounded-md shadow-none" data-testid="student-calendar-card">
                  <CardHeader className="student-dashboard-detail-header">
                    <div><p>Jadwal belajar</p><CardTitle>Deadline terdekat</CardTitle></div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStudentPage("calendar")}>Kalender</Button>
                  </CardHeader>
                  <CardContent className="student-dashboard-agenda-list">
                    {studentUpcomingEvents.length === 0 ? (
                      <div className="student-dashboard-empty"><CalendarDays /><strong>Belum ada deadline</strong><p>Agenda baru akan muncul di sini.</p></div>
                    ) : studentUpcomingEvents.map((event) => (
                      <article key={`${event.type}-${event.id}`}>
                        <span><CalendarDays /></span>
                        <div><strong>{event.title}</strong><p>{fmtDate(event.date)}</p></div>
                        <Badge className={event.type === "deadline" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-blue-200 bg-blue-50 text-blue-700"}>{event.type === "deadline" ? "Deadline" : "Agenda"}</Badge>
                      </article>
                    ))}
                  </CardContent>
                </Card>

                <Card className="student-dashboard-detail-card rounded-md shadow-none" data-testid="student-latest-grades-card">
                  <CardHeader className="student-dashboard-detail-header">
                    <div><p>Hasil terbaru</p><CardTitle>Nilai dan feedback</CardTitle></div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setStudentPage("grades")}>Semua nilai</Button>
                  </CardHeader>
                  <CardContent className="student-latest-grade-list">
                    {studentRecentGrades.length === 0 ? (
                      <div className="student-dashboard-empty"><GraduationCap /><strong>Belum ada nilai</strong><p>Nilai dari dosen akan muncul di sini.</p></div>
                    ) : studentRecentGrades.map((assignment) => (
                      <article key={assignment.id}>
                        <div><strong>{assignment.title}</strong><p>{[assignment.course_name, assignment.class_name].filter(Boolean).join(" · ")}</p><small>{assignment.my_submission?.feedback || "Belum ada feedback tertulis."}</small></div>
                        <span><strong>{assignment.my_submission.grade}</strong><small>{assignment.my_submission.grade_predicate || "Nilai"}</small></span>
                      </article>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
          {studentPage === "courses" && (
            <StudentMaterialsPage
              materials={data.materials}
              assignments={data.assignments}
              token={token}
              renderAssignmentCard={renderAssignmentCard}
            />
          )}
          {studentPage === "grades" && (
            <StudentGradesPage
              assignments={data.assignments}
              avgGrade={data.progress?.progress?.avg_grade || 0}
              gradedAssignments={gradedAssignments}
            />
          )}
          {studentPage === "assignments" && (
            <StudentAssignmentsPage
              assignments={data.assignments}
              renderAssignmentCard={renderAssignmentCard}
              focusAssignmentId={assignmentFocusId}
              onFocusHandled={() => setAssignmentFocusId("")}
            />
          )}
          {studentPage === "calendar" && (
            <StudentCalendarPage events={data.calendar} />
          )}
          {studentPage === "profile" && (
            <ProfilePage
              token={token}
              user={user}
              onUserUpdate={onUserUpdate}
              enrollments={data.enrollments}
            />
          )}
          {studentPage === "guide" && <GuidePage role="student" classes={studentClassSummaries} />}
        </section>
      </main>
      <nav
        className="student-mobile-navigation lg:hidden"
        data-testid="student-mobile-navigation"
      >
        {nav
          .filter(([key]) => key !== "profile")
          .map(([key, Icon, label]) => (
            <button
              key={key}
              type="button"
              className={studentPage === key ? "active" : ""}
              data-testid={`student-mobile-nav-${key}-button`}
              onClick={() => setStudentPage(key)}
            >
              <Icon />
              <span>{label}</span>
            </button>
          ))}
      </nav>
    </div>
  );
}

const ChatWidget = memo(function ChatWidget({ token, user }) {
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
  const auth = useMemo(
    () => ({ headers: { Authorization: `Bearer ${token}` } }),
    [token],
  );
  const progress = useActionProgress();
  const emoji = ["😀", "😂", "😊", "👍", "🙏", "🎉", "❤️", "📚"];

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  useEffect(() => {
    queryRef.current = query;
  }, [query]);
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadContacts(search = "") {
    try {
      const { data } = await axios.get(`${API}/chat/contacts`, {
        ...auth,
        params: { q: search },
      });
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
        socket.send(
          JSON.stringify({
            type: "viewing",
            user_id: openRef.current && active ? active.id : "",
          }),
        );
      };
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        if (payload.type === "presence_snapshot") {
          setOnlineIds(payload.online_user_ids || []);
        } else if (payload.type === "presence") {
          setOnlineIds((items) =>
            payload.online
              ? [...new Set([...items, payload.user_id])]
              : items.filter((id) => id !== payload.user_id),
          );
        } else if (payload.type === "chat_focus") {
          setViewingIds((items) =>
            payload.viewing
              ? [...new Set([...items, payload.user_id])]
              : items.filter((id) => id !== payload.user_id),
          );
        } else if (payload.type === "message") {
          const message = payload.message;
          const active = selectedRef.current;
          if (active && message.participant_ids.includes(active.id)) {
            setMessages((items) =>
              items.some((item) => item.id === message.id)
                ? items
                : [...items, message],
            );
          }
          if (
            message.sender_id !== user.id &&
            (!openRef.current || !active || active.id !== message.sender_id)
          ) {
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
    socket.send(
      JSON.stringify({
        type: "viewing",
        user_id: open && selected ? selected.id : "",
      }),
    );
  }, [open, selected]);

  async function chooseContact(contact) {
    const operation = progress.begin("Memuat percakapan", contact.name);
    setSelected(contact);
    setOpen(true);
    setUnread(0);
    try {
      const { data } = await axios.get(
        `${API}/chat/users/${contact.id}/messages`,
        auth,
      );
      setSelected(data.contact);
      setMessages(data.messages || []);
      setViewingIds((items) =>
        data.contact.viewing_chat
          ? [...new Set([...items, data.contact.id])]
          : items.filter((id) => id !== data.contact.id),
      );
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
    const operation = progress.begin(
      "Mengirim pesan",
      photo ? `Mengunggah ${photo.name}...` : "Menyimpan pesan...",
    );
    try {
      const { data } = await axios.post(`${API}/chat/messages`, form, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (upload) =>
          progress.update(
            operation,
            uploadProgressPercent(upload),
            "Mengirim pesan",
          ),
      });
      setMessages((items) =>
        items.some((item) => item.id === data.id) ? items : [...items, data],
      );
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
    return (
      <button
        type="button"
        className="chat-launcher"
        data-testid="chat-launcher-button"
        onClick={() => setOpen(true)}
        aria-label="Buka chat"
      >
        <MessageSquare />
        {unread > 0 && (
          <span data-testid="chat-unread-badge">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <section className="chat-widget" data-testid="chat-widget">
      <header className="chat-widget-header">
        <div>
          <p className="font-display font-semibold">Chat</p>
          <p className="text-xs">
            {selected
              ? `${selected.name} · ${statusLabel()}`
              : "Cari username atau email lengkap"}
          </p>
        </div>
        <button
          type="button"
          data-testid="chat-minimize-button"
          onClick={() => setOpen(false)}
          aria-label="Sembunyikan chat"
        >
          <Minus />
        </button>
      </header>
      {!selected && (
        <div className="chat-contacts">
          {user.role === "student" && lecturers.length > 0 && (
            <div
              className="chat-quick-lecturer"
              data-testid="chat-quick-lecturer-list"
            >
              <p className="chat-hint">Pesan cepat ke dosen</p>
              {lecturers.map((lecturer) => (
                <button
                  type="button"
                  className="chat-lecturer-button"
                  key={lecturer.id}
                  onClick={() => chooseContact(lecturer)}
                  data-testid={`chat-quick-lecturer-${lecturer.id}-button`}
                >
                  <span
                    className={`chat-dot ${onlineIds.includes(lecturer.id) ? "online" : ""}`}
                  />
                  <span>
                    <strong>{lecturer.name}</strong>
                    <small>
                      {onlineIds.includes(lecturer.id)
                        ? "Sedang membuka aplikasi"
                        : "Offline"}
                    </small>
                  </span>
                  <Send />
                </button>
              ))}
            </div>
          )}
          <label className="chat-search">
            <Search />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Username atau email lengkap"
              data-testid="chat-search-input"
            />
          </label>
          <p className="chat-hint">
            {query ? "Hasil pencarian" : "Percakapan terbaru"}
          </p>
          {contacts.length === 0 && (
            <p className="chat-empty">Belum ada pengguna ditemukan.</p>
          )}
          {contacts.map((contact) => (
            <button
              type="button"
              className="chat-contact"
              key={contact.id}
              onClick={() => chooseContact(contact)}
              data-testid={`chat-contact-${contact.id}`}
            >
              <span
                className={`chat-dot ${onlineIds.includes(contact.id) ? "online" : ""}`}
              />
              <span>
                <strong>{contact.name}</strong>
                <small>
                  @{contact.username || contact.email} ·{" "}
                  {["admin", "lecturer"].includes(contact.role)
                    ? "Dosen"
                    : "Mahasiswa"}
                </small>
              </span>
            </button>
          ))}
        </div>
      )}
      {selected && (
        <div className="chat-conversation">
          <button
            type="button"
            className="chat-back"
            data-testid="chat-back-button"
            onClick={() => {
              setSelected(null);
              setMessages([]);
              loadContacts(query);
            }}
          >
            <X /> Kembali dan cari pengguna
          </button>
          <div className="chat-messages" data-testid="chat-message-list">
            {messages.length === 0 && (
              <p className="chat-empty">
                Mulai percakapan dengan {selected.name}.
              </p>
            )}
            {messages.map((message) => (
              <article
                key={message.id}
                className={`chat-bubble ${message.sender_id === user.id ? "mine" : ""}`}
                data-testid={`chat-message-${message.id}`}
              >
                {message.attachment && (
                  <img
                    src={`${BACKEND_URL}${message.attachment.inline_url}?token=${encodeURIComponent(token)}`}
                    alt="Lampiran chat"
                    loading="lazy"
                  />
                )}
                {message.content && <p>{message.content}</p>}
                <time>{fmtDate(message.created_at)}</time>
              </article>
            ))}
            <div ref={endRef} />
          </div>
          <form className="chat-compose" onSubmit={submitMessage}>
            {photo && (
              <div className="chat-photo-selected">
                <ImagePlus /> {photo.name}
                <button
                  type="button"
                  onClick={() => {
                    setPhoto(null);
                    if (photoRef.current) photoRef.current.value = "";
                  }}
                >
                  <X />
                </button>
              </div>
            )}
            {showEmoji && (
              <div className="chat-emoji-picker">
                {emoji.map((item) => (
                  <button
                    type="button"
                    key={item}
                    onClick={() => setContent((value) => `${value}${item}`)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            <div className="chat-compose-row">
              <button
                type="button"
                onClick={() => setShowEmoji((value) => !value)}
                aria-label="Pilih emoticon"
                data-testid="chat-emoji-button"
              >
                <Smile />
              </button>
              <label className="chat-file" aria-label="Lampirkan foto">
                <ImagePlus />
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/*"
                  data-testid="chat-photo-input"
                  onChange={(event) =>
                    setPhoto(event.target.files?.[0] || null)
                  }
                />
              </label>
              <input
                value={content}
                onChange={(event) => setContent(event.target.value)}
                placeholder="Tulis pesan..."
                data-testid="chat-message-input"
              />
              <button
                className="chat-send"
                data-testid="chat-send-button"
                aria-label="Kirim pesan"
              >
                <Send />
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
});

function App() {
  const resetQuery = useMemo(() => getResetPasswordQuery(), []);
  const ssoQuery = useMemo(() => getSsoCallbackQuery(), []);
  const ssoExchangeStarted = useRef(false);
  const [token, setToken] = useState(
    localStorage.getItem("elearn_token") || "",
  );
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("elearn_user") || "null"),
  );
  const [branding, setBranding] = useState(defaultBranding);
  const [appVersion, setAppVersion] = useState(null);
  const [ssoError, setSsoError] = useState(ssoQuery.error);
  useEffect(() => {
    axios
      .get(`${API}/settings/public`)
      .then(({ data }) => setBranding({ ...defaultBranding, ...data }))
      .catch(() => setBranding(defaultBranding));
    axios
      .get(`${API}/version`)
      .then(({ data }) => setAppVersion(data))
      .catch(() => setAppVersion(null));
  }, []);
  useEffect(() => {
    document.title = brandingName(branding);
  }, [branding]);
  useEffect(() => {
    if (resetQuery.active) {
      localStorage.removeItem("elearn_token");
      localStorage.removeItem("elearn_user");
      setToken("");
      setUser(null);
    }
  }, [resetQuery.active]);
  const handleAuth = useCallback((payload) => {
    localStorage.setItem("elearn_token", payload.token);
    localStorage.setItem("elearn_user", JSON.stringify(payload.user));
    setToken(payload.token);
    setUser(payload.user);
  }, []);
  useEffect(() => {
    if (ssoExchangeStarted.current || (!ssoQuery.ticket && !ssoQuery.error))
      return;
    ssoExchangeStarted.current = true;
    window.history.replaceState(null, "", window.location.pathname || "/");
    if (ssoQuery.error) {
      setSsoError(ssoQuery.error);
      return;
    }
    axios
      .post(`${API}/auth/sso/exchange`, { ticket: ssoQuery.ticket })
      .then(({ data }) => {
        handleAuth(data);
        setSsoError("");
        toast.success("Login SCI-ID berhasil");
      })
      .catch((error) =>
        setSsoError(
          error.response?.data?.detail || "Login SCI-ID gagal diselesaikan",
        ),
      );
  }, [handleAuth, ssoQuery.error, ssoQuery.ticket]);
  const handleUserUpdate = useCallback((updated) => {
    localStorage.setItem("elearn_user", JSON.stringify(updated));
    setUser(updated);
  }, []);
  const handleBrandingUpdate = useCallback((updated) => {
    setBranding((current) => ({ ...current, ...updated }));
  }, []);
  const logout = useCallback(async () => {
    let logoutUrl = "";
    try {
      if (token) {
        const { data } = await axios.post(
          `${API}/auth/logout`,
          {},
          { headers: { Authorization: `Bearer ${token}` } },
        );
        logoutUrl = data.logout_url || "";
      }
    } catch {
      logoutUrl = "";
    } finally {
      localStorage.removeItem("elearn_token");
      localStorage.removeItem("elearn_user");
      setToken("");
      setUser(null);
    }
    if (logoutUrl) window.location.assign(logoutUrl);
  }, [token]);
  return (
    <ActionProgressProvider>
      <Toaster richColors position="bottom-center" />
      {!token || !user ? (
        <LoginScreen
          onAuth={handleAuth}
          branding={branding}
          ssoError={ssoError}
          version={appVersion}
        />
      ) : (
        <>
          {["admin", "lecturer"].includes(user.role) ? (
            <AdminApp
              token={token}
              user={user}
              onLogout={logout}
              branding={branding}
              onBrandingUpdate={handleBrandingUpdate}
              onUserUpdate={handleUserUpdate}
              version={appVersion}
            />
          ) : (
            <StudentApp
              token={token}
              user={user}
              onLogout={logout}
              branding={branding}
              onUserUpdate={handleUserUpdate}
              version={appVersion}
            />
          )}
          <ChatWidget token={token} user={user} />
        </>
      )}
    </ActionProgressProvider>
  );
}

export default App;
