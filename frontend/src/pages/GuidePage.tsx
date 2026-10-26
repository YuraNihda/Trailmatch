import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { request } from "../api/client";
import type { DepartureCard as Card, Guide } from "../api/types";
import { CardGrid, DepartureCard, Empty, ErrorBox, Spinner } from "../shared/ui";

export function GuidePage() {
  const id = Number(useParams().id);
  const ok = Number.isInteger(id);
  const g = useQuery({ queryKey: ["guide", id], queryFn: () => request<Guide>(`/guides/${id}`), enabled: ok });
  const d = useQuery({ queryKey: ["guide-deps", id], queryFn: () => request<Card[]>(`/guides/${id}/departures`), enabled: ok });
  if (!ok) return <Empty>Некоректне посилання.</Empty>;
  if (g.isPending) return <Spinner />;
  if (g.isError) return <ErrorBox error={g.error} />;
  return (
    <div className="space-y-8">
      <section className="grid gap-6 md:grid-cols-[1fr_2fr]">
        <div className="aspect-square overflow-hidden rounded-2xl bg-ink">{g.data.photo_url && <img src={g.data.photo_url} alt={g.data.name} className="h-full w-full object-cover" />}</div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">{g.data.name}</h1>
          {g.data.experience_years != null && <p className="text-zinc-500">Досвід: {g.data.experience_years} р.</p>}
          <p className="whitespace-pre-line text-zinc-700">{g.data.bio}</p>
        </div>
      </section>
      <section>
        <h2 className="mb-3 text-2xl font-semibold">Тури з цим гідом</h2>
        {d.isPending && <Spinner />}
        {d.isError && <ErrorBox error={d.error} />}
        {d.data?.length === 0 && <Empty>Найближчих турів немає.</Empty>}
        {d.data && d.data.length > 0 && <CardGrid>{d.data.map((c) => <DepartureCard key={c.departure_id} c={c} />)}</CardGrid>}
      </section>
    </div>
  );
}
