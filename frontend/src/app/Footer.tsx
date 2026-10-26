import { Link } from "react-router-dom";

const social =
  "flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white/80 " +
  "backdrop-blur-sm transition hover:border-cyan-200/70 hover:bg-white/10 hover:text-white " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200";

const linkCls = "text-sm text-white/65 transition hover:text-white";

export function Footer() {
  return (
    <footer className="relative border-t border-white/10 bg-[#0b1417] text-white">
      <div className="pointer-events-none absolute left-1/2 top-0 h-px w-2/3 -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-200/50 to-transparent" />

      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-6 px-4 py-10 sm:px-6 md:flex-row">
        <Link to="/" className="text-xl font-bold tracking-tight transition hover:text-cyan-100">
          TrailMatch
        </Link>

        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2" aria-label="Футер">
          <Link to="/tours" className={linkCls}>Тури</Link>
          <Link to="/quiz" className={linkCls}>Квіз</Link>
          <Link to="/profile" className={linkCls}>Профіль</Link>
          <a href="#" className={linkCls}>Умови</a>
          <a href="#" className={linkCls}>Конфіденційність</a>
        </nav>

        <div className="flex items-center gap-3">
          <a href="#" aria-label="Instagram" className={social}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".8" fill="currentColor" /></svg>
          </a>
          <a href="#" aria-label="Facebook" className={social}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8V6.5c0-.7.2-1 1.2-1H17V2.2C16.6 2.15 15.5 2 14.3 2 11.7 2 10 3.6 10 6.3V8H7v3.5h3V22h4V11.5h2.8L17.3 8H14z" /></svg>
          </a>
          <a href="#" aria-label="Telegram" className={social}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true"><path d="M21 4 3 11l5.5 2L10 19l3-3.5 4.5 3.5L21 4z" /></svg>
          </a>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/50">
        © {new Date().getFullYear()} TrailMatch. Усі права захищені.
      </div>
    </footer>
  );
}