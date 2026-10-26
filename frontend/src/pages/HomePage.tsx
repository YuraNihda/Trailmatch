import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { btnGhost, btnPrimary, container, glass, linkAccent } from "../shared/styles";
import {
  fetchLatestReviews,
  fetchRecommendedTrips,
  fetchUpcomingTrips,
  type ReviewCard,
  type TripCard as TripData,
} from "../api/home";

/* ───────── Статичні дані та запасні (fallback) дані ───────── */

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&q=80&w=900`;

const HERO_IMG = IMG("photo-1464822759023-fed622ff2c3b");

// Показуються, поки бекенд не відповів (або якщо він недоступний)
const FALLBACK_TRIPS: TripData[] = [
  { id: 1, departureId: 1, name: "Говерла: класичний підйом", date: "12 жовт", days: "1д", level: "Середній", price: 2200, seatsLeft: 6, img: IMG("photo-1506905925346-21bda4d32df4") },
  { id: 2, departureId: 2, name: "Чорногірський хребет", date: "19 жовт", days: "3д", level: "Складний", price: 4800, seatsLeft: 12, img: IMG("photo-1486870591958-9b9d0d1dda99") },
  { id: 3, departureId: 3, name: "Синевир та Закарпаття", date: "26 жовт", days: "2д", level: "Легкий", price: 3100, seatsLeft: 2, img: IMG("photo-1501785888041-af3ef285b470") },
];

const FALLBACK_RECOMMENDED: TripData[] = [
  { id: 4, departureId: 4, name: "Свидовець", date: "2 лист", days: "2д", level: "Середній", price: 2900, seatsLeft: 8, img: IMG("photo-1454496522488-7a8e488e8606") },
  { id: 5, departureId: 5, name: "Мармароси", date: "9 лист", days: "3д", level: "Складний", price: 4200, seatsLeft: 5, img: IMG("photo-1519681393784-d120267933ba") },
  { id: 6, departureId: 6, name: "Горгани", date: "16 лист", days: "2д", level: "Середній", price: 3300, seatsLeft: 9, img: IMG("photo-1500530855697-b586d89ba3ee") },
  { id: 7, departureId: 7, name: "Боржава", date: "23 лист", days: "1д", level: "Легкий", price: 1800, seatsLeft: 14, img: IMG("photo-1469474968028-56623f02e42e") },
];

const FALLBACK_REVIEWS: ReviewCard[] = [
  { id: 1, name: "Олена К.", rating: 5, date: "3 вересня", text: "Квіз підібрав маршрут точно під мій рівень. Група була чудова, гід — супер." },
  { id: 2, name: "Андрій М.", rating: 5, date: "18 серпня", text: "Забронював за дві хвилини. Усе чітко організовано: від збору до повернення." },
  { id: 3, name: "Ірина Л.", rating: 5, date: "2 липня", text: "Вперше пішла в похід у горах і не пошкодувала. Дякую за атмосферу!" },
];

const TILTS = [
  "-rotate-6",
  "rotate-2 lg:-translate-y-4",
  "-rotate-3",
  "rotate-6 lg:translate-y-2",
];

const STEPS = [
  { title: "Пройдіть квіз", text: "Відповісте на кілька запитань про досвід, темп і побажання — це займе пів хвилини.", icon: "pin" },
  { title: "Оберіть виліт", text: "Ми підберемо тури, що підходять саме вам, з датами та вільними місцями.", icon: "calendar" },
  { title: "Забронюйте онлайн", text: "Підтвердіть місце за кілька кліків і отримайте всі деталі на пошту.", icon: "car" },
] as const;

const INSTA = [
  IMG("photo-1472396961693-142e6e269027"),
  IMG("photo-1519681393784-d120267933ba"),
  IMG("photo-1506905925346-21bda4d32df4"),
  IMG("photo-1454496522488-7a8e488e8606"),
];

const TEAM = [
  { name: "Софія Мороз", role: "CEO та співзасновниця" },
  { name: "Тарас Бойко", role: "Головний гід" },
  { name: "Марія Ткач", role: "Маршрути та безпека" },
  { name: "Олег Гнатюк", role: "Гід, Карпати" },
  { name: "Наталя Рудь", role: "Підтримка клієнтів" },
  { name: "Дмитро Савчук", role: "Логістика" },
];

const FAQ = [
  { q: "Як працює підбір туру?", a: "Ви проходите короткий квіз про досвід, бажану тривалість і складність. На основі відповідей ми показуємо тури, що найкраще вам підходять." },
  { q: "Чи потрібен досвід походів?", a: "Ні. У нас є маршрути для новачків, а в описі кожного туру вказано складність, набір висоти та необхідне спорядження." },
  { q: "Що входить у вартість?", a: "Робота гіда, організація маршруту та страхування. Деталі кожного туру (харчування, проживання, трансфер) перелічені на його сторінці." },
  { q: "Чи можна скасувати бронювання?", a: "Так. Умови скасування та повернення коштів залежать від дати туру — вони вказані перед підтвердженням бронювання." },
];

/* ───────── Іконки ───────── */

const Arrow = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
);
const Chevron = ({ open }: { open: boolean }) => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={"shrink-0 transition-transform " + (open ? "rotate-180" : "")} aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);
const Star = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-cyan-200" aria-hidden="true"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
);
const StepIcon = ({ name }: { name: (typeof STEPS)[number]["icon"] }) => {
  const p = { width: 26, height: 26, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
  if (name === "pin") return <svg {...p}><path d="M12 21s-7-6.2-7-11a7 7 0 1 1 14 0c0 4.8-7 11-7 11z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === "calendar") return <svg {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></svg>;
  return <svg {...p}><path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16" /><rect x="3" y="16" width="18" height="4" rx="1.5" /><circle cx="7.5" cy="18" r=".6" /><circle cx="16.5" cy="18" r=".6" /></svg>;
};
const Instagram = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
);

/* ───────── Допоміжні компоненти ───────── */

function SectionHead({ title, text, align = "center" }: { title: string; text?: string; align?: "center" | "left" }) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : ""}>
      <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">{title}</h2>
      {text && <p className="mt-3 text-sm text-white/65 sm:text-base">{text}</p>}
    </div>
  );
}

function TripCard({ t }: { t: TripData }) {
  return (
    <article className={glass + " overflow-hidden transition hover:-translate-y-1 hover:border-cyan-200/40"}>
      <div className="relative h-52">
        <img src={t.img} alt={t.name} loading="lazy" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
        <span className="absolute bottom-3 left-4 text-sm font-semibold">{t.date}</span>
      </div>
      <div className="p-5">
        <h3 className="font-semibold">{t.name}</h3>
        <div className="mt-2 flex items-center gap-3 text-xs text-white/65">
          <span>{t.days}</span>
          <span>{t.level}</span>
          <span className="ml-auto">
            {t.seatsLeft > 0 ? `Залишилось ${t.seatsLeft} місць` : "Місць немає"}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between">
          <p className="text-lg font-bold">
            ₴{t.price.toLocaleString("uk-UA")} <span className="text-xs font-normal text-white/60">/ особа</span>
          </p>
          <Link to={`/tours/${t.id}`} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0b1417] transition hover:bg-cyan-50">
            Забронювати
          </Link>
        </div>
      </div>
    </article>
  );
}

/* ───────── Сторінка ───────── */

export function HomePage() {
  const [open, setOpen] = useState<number | null>(0);
  const [trips, setTrips] = useState<TripData[]>(FALLBACK_TRIPS);
  const [recommended, setRecommended] = useState<TripData[]>(FALLBACK_RECOMMENDED);
  const [reviews, setReviews] = useState<ReviewCard[]>(FALLBACK_REVIEWS);

  useEffect(() => {
    // Якщо запит не вдався або повернув порожньо — лишаються запасні дані
    fetchUpcomingTrips().then((r) => r.length && setTrips(r)).catch(() => {});
    fetchRecommendedTrips().then((r) => r.length && setRecommended(r)).catch(() => {});
    fetchLatestReviews().then((r) => r.length && setReviews(r)).catch(() => {});
  }, []);

  return (
    <div className="overflow-x-clip bg-[#0b1417] text-white">
      {/* Hero */}
      <section className="relative isolate flex min-h-[78vh] items-center">
        <img src={HERO_IMG} alt="" aria-hidden="true" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[#0b1417]/65" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/20 via-transparent to-[#0b1417]" />
        <div className="pointer-events-none absolute left-[20%] top-1/2 -z-10 h-[420px] w-[420px] -translate-y-1/2 rounded-full bg-cyan-300/15 blur-[120px]" />

        <div className={container + " py-24"}>
          <div className={glass + " max-w-2xl p-8 sm:p-10"}>
            <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
              Знайдіть свій ідеальний похід у Карпатах
            </h1>
            <p className="mt-4 max-w-xl text-sm text-white/75 sm:text-base">
              Пройдіть короткий квіз — і TrailMatch підбере тури за вашим досвідом, темпом і настроєм. Без довгого пошуку.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/quiz" className={btnPrimary()}>Пройти квіз <Arrow /></Link>
              <Link to="/tours" className={btnGhost()}>Усі тури</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Найближчі тури */}
      <section className="py-16 sm:py-20">
        <div className={container}>
          <div className="mb-8 flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight sm:text-4xl">Найближчі тури</h2>
            <Link to="/tours" className={linkAccent + " inline-flex items-center gap-1.5"}>
              Дивитись усі <Arrow />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {trips.map((t) => <TripCard key={t.departureId} t={t} />)}
          </div>
        </div>
      </section>

      {/* Рекомендовано для вас */}
      <section className="overflow-hidden py-16 sm:py-20">
        <div className={container}>
          <SectionHead
            title="Рекомендовано для вас"
            text="Добірка маршрутів на основі ваших відповідей у квізі. Пройдіть його, щоб підбірка стала точнішою."
          />
          <div className="mt-4 text-right">
            <Link to="/tours" className={linkAccent + " inline-flex items-center gap-1.5"}>
              Дивитись усі <Arrow />
            </Link>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
            {recommended.slice(0, 4).map((r, i) => (
              <Link
                key={r.departureId}
                to={`/tours/${r.id}`}
                className={
                  "group relative aspect-[3/4] overflow-hidden rounded-3xl border border-white/20 shadow-[0_12px_36px_rgba(0,0,0,0.5)] " +
                  "transition duration-300 hover:rotate-0 hover:scale-[1.03] " +
                  TILTS[i % TILTS.length]
                }
              >
                <img src={r.img} alt={r.name} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-md">
                  {r.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Як це працює */}
      <section className="py-16 sm:py-20">
        <div className={container}>
          <SectionHead title="Як це працює" text="Три кроки від цікавості до квитка на маршрут." />
          <div className="relative mt-12 grid grid-cols-1 gap-10 md:grid-cols-3">
            {/* хвилясті з'єднувальні лінії */}
            <svg className="pointer-events-none absolute left-0 top-6 hidden h-16 w-full md:block" viewBox="0 0 1000 60" preserveAspectRatio="none" fill="none" aria-hidden="true">
              <path d="M190 40 C 270 -10, 350 -10, 430 30" stroke="rgba(165,243,252,0.4)" strokeWidth="1.5" strokeDasharray="5 6" />
              <path d="M570 30 C 650 70, 730 70, 810 25" stroke="rgba(165,243,252,0.4)" strokeWidth="1.5" strokeDasharray="5 6" />
            </svg>
            {STEPS.map((s) => (
              <div key={s.title} className="relative text-center">
                <div className={glass + " mx-auto flex h-16 w-16 items-center justify-center text-cyan-100"}>
                  <StepIcon name={s.icon} />
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mx-auto mt-2 max-w-xs text-sm text-white/65">{s.text}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/quiz" className={btnPrimary()}>Пройти квіз <Arrow /></Link>
          </div>
        </div>
      </section>

      {/* Відгуки */}
      <section className="py-16 sm:py-20">
        <div className={container + " grid grid-cols-1 gap-5 md:grid-cols-3"}>
          {reviews.map((r) => (
            <figure key={r.id} className={glass + " p-6"}>
              <figcaption className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200/70 to-slate-500/70 text-sm font-bold text-[#0b1417]">
                  {r.name[0]}
                </span>
                <span>
                  <span className="block text-sm font-semibold">{r.name}</span>
                  <span className="block text-xs text-white/55">{r.date}</span>
                </span>
              </figcaption>
              <div className="mt-4 flex gap-0.5" aria-label={`${r.rating} з 5`}>
                {Array.from({ length: r.rating }).map((_, i) => <Star key={i} />)}
              </div>
              <blockquote className="mt-3 text-sm leading-relaxed text-white/75">«{r.text}»</blockquote>
            </figure>
          ))}
        </div>
      </section>

      {/* Instagram */}
      <section className="py-16 sm:py-20">
        <div className={container}>
          <SectionHead title="Ми в Instagram" text="Світлини з наших походів — і трохи натхнення для вашого наступного маршруту." />
        </div>
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4">
          {INSTA.map((src, i) => (
            <a key={i} href="#" className="group relative block aspect-square overflow-hidden" aria-label="Відкрити в Instagram">
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              <span className="absolute inset-0 flex items-center justify-center bg-[#0b1417]/0 text-white opacity-0 transition group-hover:bg-[#0b1417]/50 group-hover:opacity-100">
                <Instagram />
              </span>
            </a>
          ))}
        </div>
        <div className="mt-8 text-center">
          <a href="#" className={btnGhost()}>Підписатись</a>
        </div>
      </section>

      {/* Команда */}
      <section className="py-16 sm:py-20">
        <div className={container}>
          <SectionHead title="Наша команда" text="Люди, які щодня прокладають маршрути й ведуть групи." />
          <div className="mt-10 grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3">
            {TEAM.map((m) => (
              <div key={m.name} className={glass + " flex aspect-square flex-col items-center justify-center p-4 text-center transition hover:border-cyan-200/40"}>
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200/70 to-slate-500/70 text-xl font-bold text-[#0b1417] sm:h-20 sm:w-20 sm:text-2xl">
                  {m.name.split(" ").map((p) => p[0]).join("")}
                </span>
                <h3 className="mt-4 text-sm font-semibold sm:text-base">{m.name}</h3>
                <p className="mt-1 text-xs text-white/60">{m.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 sm:py-20">
        <div className={container + " max-w-3xl"}>
          <SectionHead title="Часті запитання" text="Коротко про те, що зазвичай цікавить перед першим туром." />
          <div className="mt-10 space-y-3">
            {FAQ.map((item, i) => {
              const isOpen = open === i;
              return (
                <div key={item.q} className={glass + (isOpen ? " border-cyan-200/40" : "")}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={`faq-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 rounded-3xl px-6 py-5 text-left text-sm font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 sm:text-base"
                  >
                    {item.q}
                    <Chevron open={isOpen} />
                  </button>
                  {isOpen && (
                    <p id={`faq-${i}`} className="px-6 pb-5 text-sm leading-relaxed text-white/70">
                      {item.a}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Фінальний CTA */}
      <section className="relative isolate py-24 sm:py-32">
        <img src={IMG("photo-1519681393784-d120267933ba")} alt="" aria-hidden="true" className="absolute inset-0 -z-30 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-20 bg-[#0b1417]/70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#0b1417] via-transparent to-[#0b1417]" />
        <div className={container + " text-center"}>
          <h2 className="mx-auto max-w-2xl text-3xl font-bold leading-tight tracking-tight sm:text-5xl">
            Готові до гір? Почніть із квізу
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-white/70 sm:text-base">
            Це займе менше хвилини, а маршрут, який вам підійде, ви побачите одразу.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/quiz" className={btnPrimary()}>Пройти квіз <Arrow /></Link>
            <Link to="/tours" className={btnGhost()}>Усі тури</Link>
          </div>
        </div>
      </section>
    </div>
  );
}