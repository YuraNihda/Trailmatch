import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { request } from "../api/client";
import { ApiError, messageFor } from "../api/errors";
import type { TourDetail } from "../api/types";
import { Notice, PageShell } from "../shared/blocks";
import { DIFFICULTY_LABEL } from "../shared/format";
import { btnPrimary, container, glass, linkAccent } from "../shared/styles";
import { BookingWidget } from "./tour/BookingWidget";
import { Gallery } from "./tour/Gallery";
import { InfoList } from "./tour/InfoList";
import { Program } from "./tour/Program";
import { Reviews } from "./tour/Reviews";
import { Similar } from "./tour/Similar";

function Loading() {
  return (
    <div className={glass + " animate-pulse overflow-hidden"} aria-busy="true" aria-label="Завантаження">
      <div className="h-72 bg-white/10" />
      <div className="space-y-3 p-6">
        <div className="h-6 w-1/2 rounded-full bg-white/10" />
        <div className="h-4 w-1/3 rounded-full bg-white/10" />
        <div className="h-3 w-full rounded-full bg-white/10" />
      </div>
    </div>
  );
}

export function TourPage() {
  const id = Number(useParams().id);
  const tour = useQuery({
    queryKey: ["tour", id],
    queryFn: () => request<TourDetail>(`/tours/${id}`),
    enabled: Number.isInteger(id),
  });

  if (!Number.isInteger(id)) {
    return (
      <PageShell>
        <Notice action={<Link to="/tours" className={btnPrimary("md")}>До каталогу</Link>}>Некоректне посилання.</Notice>
      </PageShell>
    );
  }
  if (tour.isPending) {
    return (
      <PageShell>
        <Loading />
      </PageShell>
    );
  }
  if (tour.isError) {
    const notFound = tour.error instanceof ApiError && tour.error.status === 404;
    return (
      <PageShell>
        <Notice
          action={
            notFound ? (
              <Link to="/tours" className={btnPrimary("md")}>До каталогу</Link>
            ) : (
              <button type="button" onClick={() => tour.refetch()} className={btnPrimary("md")}>Спробувати ще раз</button>
            )
          }
        >
          {notFound ? "Тур не знайдено або він більше недоступний." : messageFor(tour.error)}
        </Notice>
      </PageShell>
    );
  }

  const t = tour.data;
  const guide = t.departures.find((d) => d.guide)?.guide ?? null;

  const stats: [string, string][] = [
    ["Тривалість", `${t.duration_days} д`],
    ["Складність", DIFFICULTY_LABEL[t.difficulty]],
    ...(t.distance_km != null ? [["Дистанція", `${t.distance_km} км`] as [string, string]] : []),
    ...(t.elevation_gain_m != null ? [["Набір висоти", `${t.elevation_gain_m} м`] as [string, string]] : []),
    ...(t.max_altitude_m != null ? [["Макс. висота", `${t.max_altitude_m} м`] as [string, string]] : []),
    ["Регіон", t.region],
  ];

  return (
    <div className="min-h-screen overflow-x-clip bg-[#0b1417] text-white">
      {/* Hero: gallery + booking */}
      <section className="relative isolate border-b border-white/10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#0b1417] via-[#10202a] to-[#0b1417]" />
        <div className="pointer-events-none absolute left-[10%] top-1/3 -z-10 h-80 w-80 rounded-full bg-cyan-300/15 blur-[120px]" />

        <div className={container + " py-8 sm:py-12"}>
          <Link to="/tours" className={linkAccent}>← Усі тури</Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[2fr_1fr]">
            <div className="min-w-0 space-y-6">
              <Gallery photos={t.photo_urls} title={t.title} />
              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
                <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {stats.map(([k, v]) => (
                    <div key={k} className={glass + " px-4 py-3 text-center"}>
                      <dt className="text-xs text-white/55">{k}</dt>
                      <dd className="mt-0.5 font-semibold">{v}</dd>
                    </div>
                  ))}
                </dl>
                {t.description && (
                  <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-white/80 sm:text-base">{t.description}</p>
                )}
              </div>
            </div>

            <div className="lg:sticky lg:top-24 lg:self-start">
              <BookingWidget tour={t} />
            </div>
          </div>
        </div>
      </section>

      {/* Program + side info */}
      <section className="py-12 sm:py-16">
        <div className={container + " grid gap-10 lg:grid-cols-[2fr_1fr]"}>
          <Program program={t.program} />

          <aside className="space-y-6">
            {guide && (
              <Link to={`/guides/${guide.id}`} className={glass + " flex items-center gap-4 p-4 transition hover:border-cyan-200/40"}>
                {guide.photo_url ? (
                  <img src={guide.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-full border border-white/25 object-cover" />
                ) : (
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200/70 to-slate-500/70 text-lg font-bold text-[#0b1417]">
                    {guide.name[0]}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate font-semibold">{guide.name}</span>
                  <span className="text-xs text-white/60">
                    Ваш гід{guide.experience_years != null ? ` · ${guide.experience_years} р. досвіду` : ""}
                  </span>
                </span>
              </Link>
            )}
            <InfoList title="Що входить" items={t.included} />
            <InfoList title="Чекліст" items={t.checklist} />
            {t.required_documents && (
              <div className={glass + " p-5"}>
                <h3 className="mb-2 text-lg font-semibold">Потрібні документи</h3>
                <p className="whitespace-pre-line text-sm leading-relaxed text-white/70">{t.required_documents}</p>
              </div>
            )}
          </aside>
        </div>
      </section>

      <Reviews tourId={t.id} />
      <Similar tourId={t.id} />
    </div>
  );
}