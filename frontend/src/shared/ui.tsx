import { Link } from "react-router-dom";
import { messageFor } from "../api/errors";
import type { DepartureCard as Card } from "../api/types";
import { DIFFICULTY_LABEL, formatDate, formatPrice } from "./format";

export const Spinner = () => <div role="status" className="py-10 text-center text-sm text-zinc-500">Завантаження…</div>;

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-800">
      {messageFor(error)}
      {onRetry && <button className="ml-3 underline" onClick={onRetry}>Спробувати ще</button>}
    </div>
  );
}

export const Empty = ({ children }: { children: React.ReactNode }) => (
  <div className="rounded-xl border border-dashed border-zinc-300 p-8 text-center text-sm text-zinc-500">{children}</div>
);

/** Wireframe card = a departure: photo + date, name, duration/difficulty, price per person, Book Now. */
export function DepartureCard({ c }: { c: Card }) {
  const full = c.seats_left === 0;
  return (
    <article className="card overflow-hidden">
      <div className="relative h-48 bg-ink">
        {c.cover_photo && <img src={c.cover_photo} alt="" loading="lazy" className="h-full w-full object-cover" />}
        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs">{c.region}</span>
        <span className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-xs">
          {full ? "Місць немає" : `Місць: ${c.seats_left}`}
        </span>
        <span className="absolute bottom-2 left-3 font-medium text-white">{formatDate(c.start_date)}</span>
      </div>
      <div className="space-y-2 p-4">
        <h3 className="text-lg">{c.tour_title}</h3>
        <p className="text-sm text-zinc-500">{c.duration_days} д · {DIFFICULTY_LABEL[c.difficulty]}</p>
        <div className="flex items-center justify-between">
          <p><span className="text-lg">{formatPrice(c.price_uah)}</span> <span className="text-sm text-zinc-500">/особа</span></p>
          <Link to={`/tours/${c.tour_id}`} className="btn-primary">Забронювати</Link>
        </div>
      </div>
    </article>
  );
}

export const CardGrid = ({ children }: { children: React.ReactNode }) => (
  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
);
