import { useQuery } from "@tanstack/react-query";
import { request } from "../../api/client";
import type { Review } from "../../api/types";
import { Notice, SectionTitle, Star } from "../../shared/blocks";
import { formatDate } from "../../shared/format";
import { btnPrimary, container, glass } from "../../shared/styles";

export function Reviews({ tourId }: { tourId: number }) {
  const q = useQuery({ queryKey: ["reviews", tourId], queryFn: () => request<Review[]>(`/tours/${tourId}/reviews`) });

  return (
    <section className="py-12 sm:py-16">
      <div className={container}>
        <SectionTitle>Відгуки</SectionTitle>
        {q.isPending && <p className="text-sm text-white/60">Завантаження…</p>}
        {q.isError && (
          <Notice action={<button type="button" onClick={() => q.refetch()} className={btnPrimary("md")}>Спробувати ще раз</button>}>
            Не вдалося завантажити відгуки.
          </Notice>
        )}
        {q.isSuccess && q.data.length === 0 && <Notice>Відгуків ще немає.</Notice>}

        {q.isSuccess && q.data.length > 0 && (
          <div className="grid gap-5 md:grid-cols-3">
            {q.data.map((r) => (
              <figure key={r.id} className={glass + " p-6"}>
                <figcaption className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-200/70 to-slate-500/70 text-sm font-bold text-[#0b1417]">
                    {r.author_name[0]}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{r.author_name}</span>
                    <span className="block text-xs text-white/55">{formatDate(r.created_at)}</span>
                  </span>
                </figcaption>
                <div className="mt-4 flex gap-0.5" aria-label={`Оцінка ${r.rating} з 5`}>
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} filled={i < r.rating} />)}
                </div>
                {r.text && (
                  <blockquote className="mt-3 whitespace-pre-line text-sm leading-relaxed text-white/75">«{r.text}»</blockquote>
                )}
              </figure>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}