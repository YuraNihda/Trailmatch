import type { ReactNode } from "react";
import { Link } from "react-router-dom";

/* ───────── Типи (з app/schemas.py) ───────── */

export interface UserApi {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  personalization_consent: boolean;
}
export interface BookingApi {
  id: string;
  departure_id: number;
  tour_id: number;
  tour_title: string;
  start_date: string;
  participants: number;
  status: string;
  hold_expires_at: string | null;
  total_uah: number;
}
export interface ReviewApi {
  id: number;
  tour_id: number;
  rating: number;
  text: string;
  status: string;
  created_at: string;
}
export interface SubmissionApi {
  id: number;
  experience_level: string;
  budget_max_uah: number | null;
  answers: Record<string, string>;
  created_at: string;
}
export interface QuestionApi {
  id: number;
  position: number;
  text: string;
  options: { value: string; label: string }[];
}
export interface CardApi {
  departure_id: number;
  tour_id: number;
  tour_title: string;
  region: string;
  difficulty: string;
  duration_days: number;
  start_date: string;
  price_uah: number;
  seats_left: number;
  cover_photo: string | null;
}
export interface RecommendationsApi {
  items: { card: CardApi; score: number; reasons: string[] }[];
}

/* ───────── Константи ───────── */

// ⚠️ Шлях оновлення профілю — звір у app/api/auth.py (може бути /auth/me або /users/me)
export const USER_ME = "/users/me";

export const NO_PHOTO =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=900";

export const LEVELS: Record<string, string> = { easy: "Легкий", moderate: "Середній", hard: "Складний" };
export const EXPERIENCE: Record<string, string> = {
  beginner: "Новачок",
  intermediate: "Середній рівень",
  advanced: "Досвідчений",
};
// ⚠️ Значення BookingStatus / ReviewStatus звір із models.py
export const BOOKING_STATUS: Record<string, string> = {
  confirmed: "Підтверджено",
  pending: "Очікує оплати",
  held: "Очікує оплати",
  expired: "Прострочено",
  cancelled: "Скасовано",
};
export const REVIEW_STATUS: Record<string, string> = {
  published: "Опубліковано",
  pending: "На модерації",
  hidden: "Прихований",
  rejected: "Відхилено",
};

export const SECTIONS = [
  { id: "details", label: "Мої дані" },
  { id: "quiz", label: "Мій квіз" },
  { id: "bookings", label: "Бронювання" },
  { id: "reviews", label: "Відгуки" },
];

/* ───────── Стилі ───────── */

export const glass =
  "rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]";

export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#0b1417] " +
  "transition hover:bg-cyan-50 hover:shadow-[0_0_20px_rgba(165,243,252,0.45)] disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200";

export const btnGhost =
  "inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white " +
  "backdrop-blur-sm transition hover:border-cyan-200/70 hover:bg-white/10 disabled:opacity-60 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200";

export const fieldCls =
  "mt-1.5 w-full rounded-full border border-white/25 bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/50 " +
  "transition focus:border-cyan-200/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-200/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60";

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/* ───────── Допоміжне ───────── */

export const fmtDate = (
  iso: string,
  opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" },
) => new Date(iso).toLocaleDateString("uk-UA", opts);

export const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "?";

/* ───────── Малі компоненти ───────── */

export function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinejoin="round"
      className={filled ? "text-cyan-200" : "text-white/35"}
      aria-hidden="true"
    >
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}

export function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${value} з 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} filled={i < value} />
      ))}
    </div>
  );
}

export function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mb-5 scroll-mt-24 text-2xl font-bold tracking-tight sm:text-3xl">
      {children}
    </h2>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "good" | "warn" | "bad";
}) {
  const tones = {
    neutral: "border-white/25 bg-white/10 text-white/85",
    good: "border-emerald-200/40 bg-emerald-400/15 text-emerald-100",
    warn: "border-amber-200/40 bg-amber-400/15 text-amber-100",
    bad: "border-red-300/40 bg-red-500/15 text-red-100",
  };
  return <span className={"rounded-full border px-3 py-1 text-xs font-semibold " + tones[tone]}>{children}</span>;
}

export function Notice({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className={glass + " p-6 text-center"}>
      <p className="text-sm text-white/70">{children}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function MiniCard({ c }: { c: CardApi }) {
  return (
    <article className={glass + " group overflow-hidden transition hover:-translate-y-1 hover:border-cyan-200/40"}>
      <Link to={`/tours/${c.tour_id}`} className="relative block h-36 overflow-hidden">
        <img
          src={c.cover_photo ?? NO_PHOTO}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
        <span className="absolute bottom-2.5 left-3.5 text-sm font-semibold">
          {fmtDate(c.start_date, { day: "numeric", month: "long" })}
        </span>
      </Link>
      <div className="p-4">
        <h3 className="line-clamp-1 text-sm font-semibold">{c.tour_title}</h3>
        <p className="mt-1 text-xs text-white/60">
          {c.duration_days} дн. · {LEVELS[c.difficulty] ?? c.difficulty}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-base font-bold">₴{c.price_uah.toLocaleString("uk-UA")}</p>
          <Link
            to={`/tours/${c.tour_id}`}
            className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0b1417] transition hover:bg-cyan-50"
          >
            Забронювати
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ───────── Рядок бронювання ─────────
   Раніше був оголошений всередині ProfilePage, через що React
   перестворював усі рядки на кожному рендері. Тепер це окремий
   компонент, а все потрібне передається через props. */

interface BookingRowProps {
  b: BookingApi;
  isPast: boolean;
  alreadyReviewed: boolean;
  paying: boolean;
  onPay: (id: string) => void;
  onReview: (b: BookingApi) => void;
}

export function BookingRow({ b, isPast, alreadyReviewed, paying, onPay, onReview }: BookingRowProps) {
  const holdActive = !!b.hold_expires_at && new Date(b.hold_expires_at) > new Date();
  const needsPayment = !isPast && b.status !== "confirmed" && holdActive;
  const canReview = isPast && b.status === "confirmed" && !alreadyReviewed;
  const tone =
    b.status === "confirmed"
      ? "good"
      : needsPayment
        ? "warn"
        : b.status === "expired" || b.status === "cancelled"
          ? "bad"
          : "neutral";

  return (
    <article className={glass + " flex flex-col gap-4 p-4 sm:flex-row sm:items-center"}>
      <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-200/20 to-slate-500/20 text-cyan-100 sm:w-32">
        <svg
          width="34"
          height="34"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="m3 19 6-10 4 6 2-3 6 7z" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/55">{fmtDate(b.start_date)}</p>
        <h3 className="mt-0.5 truncate text-base font-semibold">{b.tour_title}</h3>
        <p className="mt-1 text-xs text-white/60">Учасників: {b.participants}</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={tone}>{BOOKING_STATUS[b.status] ?? b.status}</Badge>
          {needsPayment && b.hold_expires_at && (
            <span className="text-xs text-white/55">
              Місце утримується до{" "}
              {new Date(b.hold_expires_at).toLocaleTimeString("uk-UA", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
        <p className="text-lg font-bold">₴{b.total_uah.toLocaleString("uk-UA")}</p>
        {needsPayment ? (
          <button type="button" disabled={paying} onClick={() => onPay(b.id)} className={btnPrimary}>
            {paying ? "Оплата…" : "Оплатити"}
          </button>
        ) : canReview ? (
          <button type="button" onClick={() => onReview(b)} className={btnGhost}>
            Залишити відгук
          </button>
        ) : (
          <Link to={`/tours/${b.tour_id}`} className={btnGhost}>
            Детальніше
          </Link>
        )}
      </div>
    </article>
  );
}
