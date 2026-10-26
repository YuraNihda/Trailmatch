import { useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

const navCls = ({ isActive }: { isActive: boolean }) =>
  "rounded-full px-4 py-2 text-sm font-medium transition " +
  (isActive ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white");

const btnGhost =
  "inline-flex items-center justify-center rounded-full border border-white/30 bg-white/5 px-5 py-2 text-sm font-semibold text-white " +
  "backdrop-blur-sm transition hover:border-cyan-200/70 hover:bg-white/10 " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200";

const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-[#0b1417] " +
  "transition hover:bg-cyan-50 hover:shadow-[0_0_20px_rgba(165,243,252,0.45)] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200";

export function Header() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0b1417]/75 text-white backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" onClick={close} className="text-xl font-bold tracking-tight transition hover:text-cyan-100">
          TrailMatch
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Основна навігація">
          <NavLink to="/tours" className={navCls}>Тури</NavLink>
          <NavLink to="/quiz" className={navCls}>Квіз</NavLink>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <Link to="/profile" className={btnGhost}>Профіль</Link>
          ) : (
            <Link to="/login" className={btnGhost}>Увійти</Link>
          )}
          <Link to="/quiz" className={btnPrimary}>
            Пройти квіз
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label={open ? "Закрити меню" : "Відкрити меню"}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-[#0b1417]/95 px-4 pb-5 pt-3 backdrop-blur-xl md:hidden">
          <nav className="flex flex-col gap-1" aria-label="Мобільна навігація">
            <NavLink to="/tours" onClick={close} className={navCls}>Тури</NavLink>
            <NavLink to="/quiz" onClick={close} className={navCls}>Квіз</NavLink>
          </nav>
          <div className="mt-4 flex flex-col gap-3">
            {user ? (
              <Link to="/profile" onClick={close} className={btnGhost}>Профіль</Link>
            ) : (
              <Link to="/login" onClick={close} className={btnGhost}>Увійти</Link>
            )}
            <Link to="/quiz" onClick={close} className={btnPrimary}>Пройти квіз</Link>
          </div>
        </div>
      )}
    </header>
  );
}