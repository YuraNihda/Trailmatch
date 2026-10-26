import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { request } from "../../api/client";
import type { Recommendations } from "../../api/types";
import { NO_PHOTO, SectionTitle } from "../../shared/blocks";
import { formatPrice } from "../../shared/format";
import { container, glass } from "../../shared/styles";

export function Similar({ tourId }: { tourId: number }) {
  // ML-backed: any failure (501/503) just hides the block; the rest of the page is unaffected.
  const q = useQuery({
    queryKey: ["similar", tourId],
    queryFn: () => request<Recommendations>(`/tours/${tourId}/similar`),
    retry: false,
  });
  if (!q.data || q.data.items.length === 0) return null;

  return (
    <section className="pb-16 pt-4 sm:pb-24">
      <div className={container}>
        <SectionTitle>Схожі тури</SectionTitle>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {q.data.items.map((i) => {
            const c = i.card;
            const date = new Date(c.start_date).toLocaleDateString("uk-UA", { day: "numeric", month: "long" });
            return (
              <article key={c.departure_id} className={glass + " group overflow-hidden transition hover:-translate-y-1 hover:border-cyan-200/40"}>
                <Link to={`/tours/${c.tour_id}`} className="relative block h-44 overflow-hidden" aria-label={c.tour_title}>
                  <img src={c.cover_photo ?? NO_PHOTO} alt="" loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" />
                  <span className="absolute bottom-3 left-4 text-sm font-semibold">{date}</span>
                </Link>
                <div className="p-5">
                  <h3 className="line-clamp-1 font-semibold">{c.tour_title}</h3>
                  <p className="mt-1 text-xs text-white/60">{c.region} · {c.duration_days} дн.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-lg font-bold">{formatPrice(c.price_uah)}</p>
                    <Link to={`/tours/${c.tour_id}`} className="rounded-full bg-white px-4 py-2 text-xs font-semibold text-[#0b1417] transition hover:bg-cyan-50">
                      Детальніше
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}