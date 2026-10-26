import { useInfiniteQuery } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { request } from "../api/client";
import type { Page } from "../api/types";
import { btnGhost, btnPrimary, container, fieldCls, glass, labelCls } from "../shared/styles";

/* ───────── Константи ───────── */

const FILTER_KEYS = ["region", "difficulty", "date_from", "date_to", "price_min", "price_max"] as const;

// Швидкі категорії (фільтр за регіоном)
const REGIONS = ["Чорногора", "Свидовець", "Мармароси", "Горгани", "Закарпаття", "Боржава", "Покутсько-Буковинські Карпати", "Гуцульщина"];

const LEVELS: Record<string, string> = {
  easy: "Легкий",
  moderate: "Середній",
  hard: "Складний",
};

const NO_PHOTO =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=900";
const CTA_IMG =
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1600";

/* ───────── Іконки ───────── */

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const ChevronRight = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
);
const Sliders = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
);
const Mountain = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m3 19 6-10 4 6 2-3 6 7z" /></svg>
);
const Grid = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>
);

/* ───────── Допоміжні компоненти ───────── */

type Departure = Page["items"][number];

function TourCard({ c }: { c: Departure }) {
  const date = new Date(c.start_date).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
  const soldOut = c.seats_left <= 0;
  const few = !soldOut && c.seats_left <= 3;

  return (
    <article className={glass + " group overflow-hidden transition hover:-translate-y-1 hover:border-cyan-200/40"}>
      <Link to={`/tours/${c.tour_id}`} className="relative block h-52 overflow-hidden" aria-label={c.tour_title}>
        <img
          src={c.cover_photo ?? NO_PHOTO}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/5 to-transparent" />
        <span className="absolute left-3 top-3 max-w-[60%] truncate rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
          {c.region}
        </span>
        <span
          className={
            "absolute right-3 top-3 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur-md " +
            (soldOut
              ? "border-red-300/40 bg-red-500/20 text-red-100"
              : few
              ? "border-amber-200/40 bg-amber-400/20 text-amber-100"
              : "border-white/25 bg-white/10")
          }
        >
          {soldOut ? "Місць немає" : `${c.seats_left} місць`}
        </span>
        <span className="absolute bottom-3 left-4 text-sm font-semibold">{date}</span>
      </Link>

      <div className="p-5">
        <h3 className="line-clamp-1 font-semibold">{c.tour_title}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-white/65">
          <span>{c.duration_days} дн.</span>
          <span className="h-1 w-1 rounded-full bg-white/35" />
          <span>{LEVELS[c.difficulty] ?? c.difficulty}</span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold">
            ₴{c.price_uah.toLocaleString("uk-UA")} <span className="text-xs font-normal text-white/60">/ особа</span>
          </p>
          <Link
            to={`/tours/${c.tour_id}`}
            className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0b1417] transition hover:bg-cyan-50"
          >
            {soldOut ? "Детальніше" : "Забронювати"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Завантаження">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={glass + " animate-pulse overflow-hidden"}>
          <div className="h-52 bg-white/10" />
          <div className="space-y-3 p-5">
            <div className="h-4 w-2/3 rounded-full bg-white/10" />
            <div className="h-3 w-1/3 rounded-full bg-white/10" />
            <div className="flex items-center justify-between pt-2">
              <div className="h-5 w-24 rounded-full bg-white/10" />
              <div className="h-8 w-24 rounded-full bg-white/10" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function Notice({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={glass + " mx-auto max-w-lg p-8 text-center"}>
      <p className="text-sm text-white/75">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/* ───────── Сторінка ───────── */

export function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(false);
  const chipsRef = useRef<HTMLDivElement>(null);

  const filters = Object.fromEntries(FILTER_KEYS.map((k) => [k, params.get(k) ?? ""]));
  const activeCount = FILTER_KEYS.filter((k) => k !== "region" && filters[k]).length;

  const q = useInfiniteQuery({
    queryKey: ["departures", filters],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => request<Page>("/departures", { query: { ...filters, page: pageParam, page_size: 9 } }),
    getNextPageParam: (p) => (p.page * p.page_size < p.total ? p.page + 1 : undefined),
  });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.total;

  function setRegion(region: string) {
    const next = new URLSearchParams(params);
    if (region) next.set("region", region);
    else next.delete("region");
    setParams(next);
  }

  function apply(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const next = new URLSearchParams();
    for (const k of FILTER_KEYS) {
      const v = String(fd.get(k) ?? "").trim();
      if (v) next.set(k, v);
    }
    // регіон із чипів зберігаємо, якщо в формі його не змінювали
    if (!next.get("region") && params.get("region")) next.set("region", params.get("region")!);
    setParams(next);
    setOpen(false);
  }

  function reset() {
    setParams(new URLSearchParams());
    setOpen(false);
  }

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0b1417] text-white">
      {/* Категорії + Фільтри */}
      <section className="border-b border-white/10 bg-[#0b1417]/80 backdrop-blur-xl">
        <div className={container + " flex items-center gap-3 py-4"}>
          <div
            ref={chipsRef}
            className="flex flex-1 items-center gap-2 overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Регіони"
          >
            {[{ label: "Усі", value: "" }, ...REGIONS.map((r) => ({ label: r, value: r }))].map((c) => {
              const active = filters.region === c.value;
              return (
                <button
                  key={c.label}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setRegion(c.value)}
                  className={
                    "flex shrink-0 flex-col items-center gap-1.5 rounded-2xl px-3 py-2 text-xs font-medium transition " +
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 " +
                    (active ? "text-white" : "text-white/60 hover:text-white")
                  }
                >
                  <span
                    className={
                      "flex h-11 w-11 items-center justify-center rounded-full border transition " +
                      (active
                        ? "border-cyan-200/70 bg-cyan-200/15 text-cyan-100 shadow-[0_0_18px_rgba(165,243,252,0.35)]"
                        : "border-white/20 bg-white/5")
                    }
                  >
                    {c.value ? <Mountain /> : <Grid />}
                  </span>
                  <span className="max-w-[88px] truncate">{c.label}</span>
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => chipsRef.current?.scrollBy({ left: 280 })}
            aria-label="Прокрутити категорії"
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/25 bg-white/5 transition hover:border-cyan-200/70 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:flex"
          >
            <ChevronRight />
          </button>

          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen(!open)}
            className={btnGhost("md") + " shrink-0"}
          >
            <Sliders />
            <span className="hidden sm:inline">Фільтри</span>
            {activeCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-bold text-[#0b1417]">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Панель фільтрів */}
        {open && (
          <div className={container + " pb-5"}>
            <form key={params.toString()} onSubmit={apply} className={glass + " grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3"}>
              <label className={labelCls}>
                Регіон
                <input name="region" maxLength={80} defaultValue={filters.region} placeholder="Наприклад, Чорногора" className={fieldCls} />
              </label>
              <label className={labelCls}>
                Складність
                <select name="difficulty" defaultValue={filters.difficulty} className={fieldCls}>
                  <option value="">Будь-яка</option>
                  <option value="easy">Легкий</option>
                  <option value="moderate">Середній</option>
                  <option value="hard">Складний</option>
                </select>
              </label>
              <span className="hidden lg:block" />
              <label className={labelCls}>
                Дата від
                <input type="date" name="date_from" defaultValue={filters.date_from} className={fieldCls} />
              </label>
              <label className={labelCls}>
                Дата до
                <input type="date" name="date_to" defaultValue={filters.date_to} className={fieldCls} />
              </label>
              <span className="hidden lg:block" />
              <label className={labelCls}>
                Ціна від, ₴
                <input type="number" min={0} name="price_min" defaultValue={filters.price_min} className={fieldCls} />
              </label>
              <label className={labelCls}>
                Ціна до, ₴
                <input type="number" min={0} name="price_max" defaultValue={filters.price_max} className={fieldCls} />
              </label>
              <div className="flex items-end gap-3">
                <button type="submit" className={btnPrimary("md") + " flex-1"}>Застосувати</button>
                <button type="button" onClick={reset} className={btnGhost("md")}>Скинути</button>
              </div>
            </form>
          </div>
        )}
      </section>

      {/* Каталог */}
      <section className="py-10 sm:py-14">
        <div className={container}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight sm:text-4xl">
              {filters.region || "Усі тури"}
            </h1>
            {typeof total === "number" && (
              <p className="text-sm text-white/60">Знайдено: {total}</p>
            )}
          </div>

          {q.isPending && <SkeletonGrid />}

          {q.isError && (
            <Notice
              action={<button type="button" onClick={() => q.refetch()} className={btnPrimary()}>Спробувати ще раз</button>}
            >
              Не вдалося завантажити тури. Перевірте з'єднання та спробуйте ще раз.
            </Notice>
          )}

          {q.isSuccess && items.length === 0 && (
            <Notice action={<button type="button" onClick={reset} className={btnGhost("md")}>Скинути фільтри</button>}>
              За цими фільтрами турів немає. Спробуйте змінити умови.
            </Notice>
          )}

          {items.length > 0 && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((c) => <TourCard key={c.departure_id} c={c} />)}
            </div>
          )}

          {q.hasNextPage && (
            <div className="mt-10 text-center">
              <button type="button" className={btnPrimary()} disabled={q.isFetchingNextPage} onClick={() => q.fetchNextPage()}>
                {q.isFetchingNextPage ? "Завантаження…" : "Показати ще"}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="relative isolate py-24 sm:py-28">
        <img src={CTA_IMG} alt="" aria-hidden="true" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[#0b1417]/70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1417] via-transparent to-[#0b1417]" />
        <div className={container + " text-center"}>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Не знаєте, що обрати?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Пройдіть короткий квіз — підберемо тури під ваш рівень і бюджет.
          </p>
          <div className="mt-8">
            <Link to="/quiz" className={btnPrimary()}>Пройти квіз <Arrow /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}