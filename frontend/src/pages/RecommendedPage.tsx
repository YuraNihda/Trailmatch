import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "react-router-dom";
import { request } from "../api/client";
import type { Recommendations } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { DepartureCard, Empty, ErrorBox, Spinner } from "../shared/ui";

export function RecommendedPage() {
  const { user } = useAuth();
  const fresh = (useLocation().state as { result?: Recommendations } | null)?.result;
  // Page refresh loses router state: fall back to the saved result (needs login + consent).
  const saved = useQuery({
    queryKey: ["recommendations"],
    queryFn: () => request<Recommendations>("/recommendations"),
    enabled: !fresh && !!user?.personalization_consent,
    retry: false,
  });
  const data = fresh ?? saved.data;

  if (!fresh && saved.isPending && user?.personalization_consent) return <Spinner />;
  return (
    <section className="space-y-6">
      <header className="text-center">
        <h1 className="text-4xl font-semibold">Підібрано для вас</h1>
        <p className="mt-2 text-zinc-600">Тури, що найкраще підходять під ваші відповіді.</p>
      </header>
      {data?.is_mock && (
        <p role="note" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-center text-sm text-amber-900">
          Тестовий режим: це демонстраційний підбір, а не реальна рекомендація.
        </p>
      )}
      {saved.isError && !fresh && <ErrorBox error={saved.error} />}
      {!data && !saved.isError && <Empty>Пройдіть квіз, щоб отримати персональні рекомендації. <Link to="/quiz" className="underline">Почати</Link></Empty>}
      {data && data.items.length === 0 && <Empty>Під ваші умови нічого не знайшлося. Спробуйте змінити бюджет або <Link to="/tours" className="underline">перегляньте всі тури</Link>.</Empty>}
      {data && data.items.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {data.items.map((i) => (
            <div key={i.card.departure_id} className="space-y-2">
              <DepartureCard c={i.card} />
              {i.reasons.length > 0 && <p className="px-2 text-sm text-zinc-600"><b>Чому саме цей тур:</b> {i.reasons.join("; ")}</p>}
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl bg-ink p-8 text-white">
        <span className="text-xl">Хочете інший підбір?</span>
        <span className="flex gap-3"><Link to="/quiz" className="btn bg-white text-ink">Пройти квіз знову</Link><Link to="/tours" className="btn border border-white text-white">Усі тури</Link></span>
      </div>
    </section>
  );
}
