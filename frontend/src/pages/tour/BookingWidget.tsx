import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { request } from "../../api/client";
import { messageFor } from "../../api/errors";
import type { Booking, TourDetail } from "../../api/types";
import { useAuth } from "../../auth/AuthContext";
import { formatDate, formatPrice } from "../../shared/format";
import { alertCls, btnPrimary, fieldCls, glass, labelCls } from "../../shared/styles";

export function BookingWidget({ tour }: { tour: TourDetail }) {
  const { user } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const qc = useQueryClient();
  const deps = tour.departures;
  const firstFree = deps.find((d) => d.seats_left > 0)?.id ?? deps[0]?.id ?? 0;
  const [depId, setDepId] = useState(firstFree);
  const [n, setN] = useState(1);
  useEffect(() => { setDepId(firstFree); }, [firstFree]);
  const dep = deps.find((d) => d.id === depId);

  const book = useMutation({
    mutationFn: () => request<Booking>("/bookings", { method: "POST", body: { departure_id: depId, participants: n } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookings"] });
      void qc.invalidateQueries({ queryKey: ["bookings-me"] });
      void qc.invalidateQueries({ queryKey: ["tour", tour.id] });
      nav("/profile");
    },
  });

  if (!dep) {
    return <div className={glass + " p-6 text-sm text-white/70"}>Найближчих виїздів поки немає.</div>;
  }
  const max = Math.min(20, Math.max(dep.seats_left, 1));
  const soldOut = dep.seats_left === 0;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { nav("/login", { state: { from: loc.pathname } }); return; }
    book.mutate();
  }

  return (
    <form onSubmit={submit} className={glass + " space-y-5 p-6"}>
      <label className={labelCls + " block"}>
        Дата виїзду
        <select
          className={fieldCls}
          value={depId}
          onChange={(e) => { setDepId(Number(e.target.value)); setN(1); }}
        >
          {deps.map((d) => (
            <option key={d.id} value={d.id}>
              {formatDate(d.start_date)}{d.seats_left === 0 ? " — місць немає" : ` — місць: ${d.seats_left}`}
            </option>
          ))}
        </select>
      </label>

      <p>
        <span className="text-3xl font-bold">{formatPrice(dep.price_uah)}</span>{" "}
        <span className="text-sm text-white/60">/ особа</span>
      </p>

      <label className={labelCls + " block"}>
        Кількість учасників
        <input
          className={fieldCls}
          type="number"
          min={1}
          max={max}
          value={n}
          disabled={soldOut}
          onChange={(e) => setN(Math.min(max, Math.max(1, Number(e.target.value) || 1)))}
        />
      </label>

      <div className="flex items-center justify-between rounded-2xl border border-white/15 bg-white/[0.06] px-4 py-3 text-sm">
        <span className="text-white/70">Разом</span>
        <b className="text-lg">{formatPrice(dep.price_uah * n)}</b>
      </div>

      {book.isError && <p role="alert" className={alertCls}>{messageFor(book.error)}</p>}

      <button type="submit" className={btnPrimary() + " w-full"} disabled={soldOut || book.isPending}>
        {book.isPending ? "…" : soldOut ? "Місць немає" : user ? "Забронювати" : "Увійти й забронювати"}
      </button>
      <p className="text-center text-xs text-white/55">Місце утримується на час оплати. Оплата — у вашому кабінеті.</p>
    </form>
  );
}