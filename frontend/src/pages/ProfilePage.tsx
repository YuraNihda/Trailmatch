import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { request } from "../api/client";
import { messageFor } from "../api/errors";
import { useAuth } from "../auth/AuthContext";
import {
  Badge,
  BookingRow,
  EXPERIENCE,
  MiniCard,
  Notice,
  REVIEW_STATUS,
  SECTIONS,
  SectionTitle,
  Stars,
  USER_ME,
  btnGhost,
  btnPrimary,
  container,
  fieldCls,
  fmtDate,
  glass,
  initials,
} from "./profileParts";
import type {
  BookingApi,
  QuestionApi,
  RecommendationsApi,
  ReviewApi,
  SubmissionApi,
  UserApi,
} from "./profileParts";
import { Star } from "./profileParts";

export function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const qc = useQueryClient();

  const [active, setActive] = useState("details");
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<UserApi | null>((user as UserApi | null) ?? null);
  const [reviewFor, setReviewFor] = useState<BookingApi | null>(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  const bookings = useQuery({ queryKey: ["bookings-me"], queryFn: () => request<BookingApi[]>("/bookings/me"), enabled: !!user });
  const reviews = useQuery({ queryKey: ["reviews-me"], queryFn: () => request<ReviewApi[]>("/reviews/me"), enabled: !!user });
  const submissions = useQuery({ queryKey: ["submissions-me"], queryFn: () => request<SubmissionApi[]>("/quiz/submissions/me"), enabled: !!user });
  const questions = useQuery({ queryKey: ["quiz-questions"], queryFn: () => request<QuestionApi[]>("/quiz/questions"), enabled: !!user });

  const lastSubmission = submissions.data?.[0];
  const recs = useQuery({
    queryKey: ["recommendations-me"],
    queryFn: () => request<RecommendationsApi>("/recommendations"),
    enabled: !!user && !!lastSubmission && !!profile?.personalization_consent,
    retry: false,
  });

  const saveProfile = useMutation({
    mutationFn: (body: { full_name: string; phone: string | null; personalization_consent: boolean }) =>
      request<UserApi>(USER_ME, { method: "PATCH", body }),
    onSuccess: (u) => {
      setProfile(u);
      setEditing(false);
      qc.invalidateQueries({ queryKey: ["recommendations-me"] });
    },
  });

  const pay = useMutation({
    mutationFn: (id: string) => request(`/bookings/${id}/payments`, { method: "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["bookings-me"] }),
  });

  const sendReview = useMutation({
    mutationFn: () =>
      request("/reviews", { method: "POST", body: { booking_id: reviewFor!.id, rating, text: reviewText.trim() } }),
    onSuccess: () => {
      setReviewFor(null);
      setReviewText("");
      setRating(5);
      qc.invalidateQueries({ queryKey: ["reviews-me"] });
    },
  });

  if (!user || !profile) return <Navigate to="/login" replace state={{ from: "/profile" }} />;

  const today = new Date().toISOString().slice(0, 10);
  const all = bookings.data ?? [];
  const future = all.filter((b) => b.start_date >= today);
  const past = all.filter((b) => b.start_date < today);
  const reviewedTours = new Set((reviews.data ?? []).map((r) => r.tour_id));

  function go(id: string) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startReview(b: BookingApi) {
    setReviewFor(b);
    go("reviews");
  }

  function submitProfile(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const full_name = `${String(fd.get("first_name") ?? "").trim()} ${String(fd.get("last_name") ?? "").trim()}`.trim();
    const phone = String(fd.get("phone") ?? "").trim();
    saveProfile.mutate({
      full_name,
      phone: phone || null,
      personalization_consent: fd.get("consent") === "on",
    });
  }

  function answerRows(): { q: string; a: string }[] {
    if (!lastSubmission) return [];
    const rows = [
      { q: "Досвід", a: EXPERIENCE[lastSubmission.experience_level] ?? lastSubmission.experience_level },
      { q: "Бюджет", a: lastSubmission.budget_max_uah ? `до ₴${lastSubmission.budget_max_uah.toLocaleString("uk-UA")}` : "Без обмежень" },
    ];
    for (const [qid, val] of Object.entries(lastSubmission.answers)) {
      const question = questions.data?.find((x) => String(x.id) === qid);
      rows.push({
        q: question?.text ?? `Питання ${qid}`,
        a: question?.options.find((o) => o.value === val)?.label ?? val,
      });
    }
    return rows;
  }

  const [firstName, ...rest] = profile.full_name.split(" ");
  const lastName = rest.join(" ");

  // Одна спільна кнопка "Оплатити" більше не блокує всі рядки:
  // "в процесі" лише той рядок, чий id зараз оплачується.
  const renderBooking = (b: BookingApi, isPast: boolean) => (
    <BookingRow
      key={b.id}
      b={b}
      isPast={isPast}
      alreadyReviewed={reviewedTours.has(b.tour_id)}
      paying={pay.isPending && pay.variables === b.id}
      onPay={(id) => pay.mutate(id)}
      onReview={startReview}
    />
  );

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0b1417] text-white">
      {/* Банер профілю */}
      <section className="relative isolate border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b1417] via-[#10202a] to-[#0b1417]" />
        <div className="pointer-events-none absolute left-[12%] top-1/2 -z-10 h-72 w-72 -translate-y-1/2 rounded-full bg-cyan-300/15 blur-[110px]" />
        <div className={container + " flex flex-col gap-6 py-10 sm:flex-row sm:items-center sm:justify-between"}>
          <div className="flex items-center gap-5">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-white/25 bg-gradient-to-br from-cyan-200/70 to-slate-500/70 text-2xl font-bold text-[#0b1417] sm:h-24 sm:w-24 sm:text-3xl">
              {initials(profile.full_name)}
            </span>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight sm:text-4xl">{profile.full_name}</h1>
              <p className="mt-1 truncate text-sm text-white/65">
                {profile.email}{profile.phone ? ` · ${profile.phone}` : ""}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={() => { setEditing(true); go("details"); }} className={btnPrimary}>Редагувати</button>
            <button type="button" onClick={() => { logout(); nav("/"); }} className={btnGhost}>Вийти</button>
          </div>
        </div>
      </section>

      <div className={container + " grid gap-8 py-10 lg:grid-cols-[220px_1fr] lg:gap-10"}>
        {/* Бічне меню */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav
            aria-label="Розділи профілю"
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:rounded-3xl lg:border lg:border-white/15 lg:bg-white/[0.07] lg:p-2 lg:backdrop-blur-xl [&::-webkit-scrollbar]:hidden"
          >
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => go(s.id)}
                aria-current={active === s.id ? "true" : undefined}
                className={
                  "shrink-0 rounded-full px-4 py-2.5 text-left text-sm font-medium transition lg:rounded-2xl " +
                  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 " +
                  (active === s.id ? "bg-white text-[#0b1417]" : "text-white/70 hover:bg-white/10 hover:text-white")
                }
              >
                {s.label}
              </button>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 space-y-14">
          {/* Мої дані */}
          <section>
            <SectionTitle id="details">Мої дані</SectionTitle>
            <form key={String(editing) + profile.full_name} onSubmit={submitProfile} className={glass + " p-5 sm:p-6"}>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <label className="text-xs font-medium text-white/75">
                  Ім'я
                  <input name="first_name" required maxLength={60} defaultValue={firstName} disabled={!editing} className={fieldCls} autoComplete="given-name" />
                </label>
                <label className="text-xs font-medium text-white/75">
                  Прізвище
                  <input name="last_name" maxLength={60} defaultValue={lastName} disabled={!editing} className={fieldCls} autoComplete="family-name" />
                </label>
                <label className="text-xs font-medium text-white/75">
                  Телефон
                  <input name="phone" type="tel" inputMode="tel" pattern="\+?[0-9]{9,15}" defaultValue={profile.phone ?? ""} disabled={!editing} placeholder="+380501234567" className={fieldCls} autoComplete="tel" />
                </label>
                <label className="text-xs font-medium text-white/75">
                  Email
                  <input value={profile.email} disabled readOnly className={fieldCls} />
                </label>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-2.5 text-xs text-white/75">
                <input
                  type="checkbox"
                  name="consent"
                  defaultChecked={profile.personalization_consent}
                  disabled={!editing}
                  className="mt-0.5 h-4 w-4 rounded border-white/40 bg-white/10 text-cyan-300 focus:ring-cyan-200/50 focus:ring-offset-0"
                />
                Згоден(-на) на персоналізацію: зберігати результати квізу та показувати рекомендації.
              </label>

              {saveProfile.isError && (
                <p role="alert" className="mt-4 rounded-2xl border border-red-300/40 bg-red-500/20 px-4 py-2.5 text-xs font-medium text-red-100">
                  {messageFor(saveProfile.error)}
                </p>
              )}

              <div className="mt-5 flex gap-3">
                {editing ? (
                  <>
                    <button type="submit" disabled={saveProfile.isPending} className={btnPrimary}>
                      {saveProfile.isPending ? "Збереження…" : "Зберегти"}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className={btnGhost}>Скасувати</button>
                  </>
                ) : (
                  <button type="button" onClick={() => setEditing(true)} className={btnGhost}>Редагувати</button>
                )}
              </div>
            </form>
          </section>

          {/* Мій квіз */}
          <section>
            <SectionTitle id="quiz">Мій квіз</SectionTitle>
            <div className={glass + " p-5 sm:p-6"}>
              {submissions.isPending && <p className="text-sm text-white/60">Завантаження…</p>}
              {submissions.isError && <p className="text-sm text-red-200">Не вдалося завантажити результати квізу.</p>}

              {submissions.isSuccess && !lastSubmission && (
                <Notice action={<Link to="/quiz" className={btnPrimary}>Пройти квіз</Link>}>
                  {profile.personalization_consent
                    ? "Ви ще не проходили квіз."
                    : "Результати квізу зберігаються лише за згоди на персоналізацію. Увімкніть її вище й пройдіть квіз."}
                </Notice>
              )}

              {lastSubmission && (
                <>
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <Badge>Остання відповідь: {fmtDate(lastSubmission.created_at)}</Badge>
                    <Link to="/quiz" className="text-sm font-semibold text-cyan-100 hover:text-white">Пройти знову</Link>
                  </div>
                  <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    {answerRows().map((r, i) => (
                      <div key={i} className="rounded-2xl border border-white/15 bg-white/[0.06] p-3.5">
                        <p className="line-clamp-2 text-[11px] text-white/55">{r.q}</p>
                        <p className="mt-1.5 text-sm font-semibold">{r.a}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 flex items-end justify-between gap-4">
                    <h3 className="text-xl font-bold tracking-tight">Рекомендовані тури</h3>
                    <Link to="/recommended" className="text-sm font-semibold text-cyan-100 hover:text-white">Дивитись усі →</Link>
                  </div>
                  <div className="mt-4">
                    {recs.isPending && recs.fetchStatus !== "idle" && <p className="text-sm text-white/60">Підбираємо тури…</p>}
                    {recs.isError && <p className="text-sm text-white/60">Рекомендації тимчасово недоступні.</p>}
                    {recs.isSuccess && recs.data.items.length === 0 && <p className="text-sm text-white/60">Поки що немає відповідних турів.</p>}
                    {recs.isSuccess && recs.data.items.length > 0 && (
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {recs.data.items.slice(0, 3).map((i) => <MiniCard key={i.card.departure_id} c={i.card} />)}
                      </div>
                    )}
                    {!profile.personalization_consent && (
                      <p className="text-sm text-white/60">Увімкніть згоду на персоналізацію, щоб бачити рекомендації.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Бронювання */}
          <section>
            <SectionTitle id="bookings">Мої бронювання</SectionTitle>
            {bookings.isPending && <p className="text-sm text-white/60">Завантаження…</p>}
            {bookings.isError && (
              <Notice action={<button type="button" onClick={() => bookings.refetch()} className={btnPrimary}>Спробувати ще раз</button>}>
                Не вдалося завантажити бронювання.
              </Notice>
            )}
            {pay.isError && <p role="alert" className="mb-4 text-sm text-red-200">{messageFor(pay.error)}</p>}

            {bookings.isSuccess && all.length === 0 && (
              <Notice action={<Link to="/tours" className={btnPrimary}>Переглянути тури</Link>}>
                У вас ще немає бронювань.
              </Notice>
            )}

            {future.length > 0 && (
              <>
                <h3 className="mb-3 text-lg font-semibold">Майбутні</h3>
                <div className="space-y-4">{future.map((b) => renderBooking(b, false))}</div>
              </>
            )}
            {past.length > 0 && (
              <>
                <h3 className="mb-3 mt-8 text-lg font-semibold">Минулі</h3>
                <div className="space-y-4">{past.map((b) => renderBooking(b, true))}</div>
              </>
            )}
          </section>

          {/* Відгуки */}
          <section>
            <SectionTitle id="reviews">Мої відгуки</SectionTitle>

            {reviewFor && (
              <form
                onSubmit={(e) => { e.preventDefault(); sendReview.mutate(); }}
                className={glass + " mb-8 p-5 sm:p-6"}
              >
                <h3 className="text-lg font-semibold">{reviewFor.tour_title}</h3>
                <p className="mt-0.5 text-xs text-white/55">{fmtDate(reviewFor.start_date)}</p>

                <p className="mt-5 text-xs font-medium text-white/75">Ваша оцінка</p>
                <div className="mt-1.5 flex gap-1" role="radiogroup" aria-label="Оцінка">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={rating === n}
                      aria-label={`${n} з 5`}
                      onClick={() => setRating(n)}
                      className="rounded-md p-0.5 transition hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
                    >
                      <Star filled={n <= rating} />
                    </button>
                  ))}
                </div>

                <label className="mt-5 block text-xs font-medium text-white/75">
                  Ваш відгук
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    maxLength={3000}
                    rows={4}
                    placeholder="Розкажіть, як минув похід"
                    className="mt-1.5 w-full rounded-3xl border border-white/25 bg-white/10 px-4 py-3 text-sm text-white placeholder-white/50 transition focus:border-cyan-200/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-200/30"
                  />
                </label>

                {sendReview.isError && (
                  <p role="alert" className="mt-4 rounded-2xl border border-red-300/40 bg-red-500/20 px-4 py-2.5 text-xs font-medium text-red-100">
                    {messageFor(sendReview.error)}
                  </p>
                )}

                <div className="mt-5 flex gap-3">
                  <button type="submit" disabled={sendReview.isPending} className={btnPrimary}>
                    {sendReview.isPending ? "Надсилання…" : "Надіслати"}
                  </button>
                  <button type="button" onClick={() => setReviewFor(null)} className={btnGhost}>Скасувати</button>
                </div>
              </form>
            )}

            {reviews.isPending && <p className="text-sm text-white/60">Завантаження…</p>}
            {reviews.isSuccess && (reviews.data?.length ?? 0) === 0 && !reviewFor && (
              <Notice>
                Ви ще не залишали відгуків. Після завершеного походу натисніть «Залишити відгук» у минулих бронюваннях.
              </Notice>
            )}

            {(reviews.data?.length ?? 0) > 0 && (
              <div className="-mx-4 flex snap-x gap-4 overflow-x-auto px-4 pb-3 sm:mx-0 sm:px-0 [scrollbar-width:thin]">
                {reviews.data!.map((r) => (
                  <figure key={r.id} className={glass + " w-[85%] shrink-0 snap-start p-5 sm:w-[48%] lg:w-[360px]"}>
                    <figcaption className="flex items-center gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200/70 to-slate-500/70 text-sm font-bold text-[#0b1417]">
                        {initials(profile.full_name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{profile.full_name}</span>
                        <span className="block text-xs text-white/55">{fmtDate(r.created_at)}</span>
                      </span>
                    </figcaption>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <Stars value={r.rating} />
                      <Badge tone={r.status === "published" ? "good" : r.status === "rejected" ? "bad" : "warn"}>
                        {REVIEW_STATUS[r.status] ?? r.status}
                      </Badge>
                    </div>
                    <blockquote className="mt-3 line-clamp-5 text-sm leading-relaxed text-white/75">
                      {r.text ? `«${r.text}»` : "Без тексту"}
                    </blockquote>
                  </figure>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
