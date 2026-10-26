import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { messageFor } from "../api/errors";
import { useAuth } from "../auth/AuthContext";

const inputCls =
  "w-full px-5 py-3 rounded-full bg-white/10 border border-white/25 text-sm text-white " +
  "placeholder-white/60 backdrop-blur-sm transition " +
  "focus:outline-none focus:border-cyan-200/70 focus:bg-white/15 focus:ring-2 focus:ring-cyan-200/30 " +
  "[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] " +
  "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgba(24,36,40,0.85)]";

export function LoginPage() {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from ?? "/profile";

  const [mode, setMode] = useState<"login" | "register">("login");
  const [f, setF] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    agree_terms: false,
  });
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={from} replace />;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);

    if (mode === "register") {
      if (f.password.length < 10) {
        setErr("Пароль має містити щонайменше 10 символів.");
        return;
      }
      if (f.password !== f.confirm_password) {
        setErr("Паролі не збігаються.");
        return;
      }
      if (!f.agree_terms) {
        setErr("Необхідно погодитися з Умовами використання.");
        return;
      }
    }

    setBusy(true);
    try {
      if (mode === "login") {
        await login(f.email, f.password);
      } else {
        const full_name = `${f.first_name} ${f.last_name}`.trim();
        await register({ email: f.email, password: f.password, full_name, phone: f.phone });
      }
      nav(from, { replace: true });
    } catch (e2) {
      setErr(messageFor(e2));
    } finally {
      setBusy(false);
    }
  }

  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setF({ ...f, [k]: value });
  };

  const toggleMode = () => {
    setErr(null);
    setMode(mode === "login" ? "register" : "login");
  };

  return (
    // fixed inset-0 + z-50 перекриває хедер і футер лейауту — сторінка на весь екран
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0b1417] isolate">
      <img
        src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover -z-30"
      />
      <div className="fixed inset-0 -z-20 bg-[#0b1417]/60" />
      <div className="fixed inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <div className="pointer-events-none fixed left-1/2 top-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-[120px]" />

      {/* Лого в межах фото */}
      <Link
        to="/"
        className="absolute left-5 top-5 sm:left-8 sm:top-7 text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-lg hover:text-cyan-100 transition-colors"
      >
        TrailMatch
      </Link>

      <div className="min-h-full flex items-center justify-center px-4 py-24">
        {/* Скляна картка */}
        <div
          className={
            "w-full rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl " +
            "shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] " +
            "p-6 sm:p-8 text-white " +
            (mode === "register" ? "max-w-lg" : "max-w-sm")
          }
        >
          <div className="text-center mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {mode === "login" ? "Увійти" : "Реєстрація"}
            </h1>
            <p className="text-xs sm:text-sm text-white/70 mt-1.5">
              {mode === "login"
                ? "Введіть свої дані для входу в особистий кабінет."
                : "Створіть акаунт, щоб отримати доступ до персональних турів."}
            </p>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    maxLength={60}
                    value={f.first_name}
                    onChange={set("first_name")}
                    placeholder="Ім'я"
                    aria-label="Ім'я"
                    autoComplete="given-name"
                    className={inputCls}
                  />
                  <input
                    type="text"
                    maxLength={60}
                    value={f.last_name}
                    onChange={set("last_name")}
                    placeholder="Прізвище"
                    aria-label="Прізвище"
                    autoComplete="family-name"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="tel"
                    inputMode="tel"
                    pattern="\+?[0-9]{9,15}"
                    value={f.phone}
                    onChange={set("phone")}
                    placeholder="Телефон (необов'язково)"
                    aria-label="Телефон (необов'язково)"
                    autoComplete="tel"
                    className={inputCls}
                  />
                  <input
                    type="email"
                    required
                    value={f.email}
                    onChange={set("email")}
                    placeholder="Email"
                    aria-label="Email"
                    autoComplete="email"
                    className={inputCls}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    required
                    maxLength={128}
                    value={f.password}
                    onChange={set("password")}
                    placeholder="Пароль"
                    aria-label="Пароль"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                  <input
                    type="password"
                    required
                    maxLength={128}
                    value={f.confirm_password}
                    onChange={set("confirm_password")}
                    placeholder="Підтвердіть пароль"
                    aria-label="Підтвердіть пароль"
                    autoComplete="new-password"
                    className={inputCls}
                  />
                </div>

                <div className="flex items-start gap-2.5 pt-1 px-1">
                  <input
                    type="checkbox"
                    id="terms"
                    checked={f.agree_terms}
                    onChange={set("agree_terms")}
                    className="mt-0.5 w-4 h-4 rounded border-white/40 bg-white/10 text-cyan-300 focus:ring-cyan-200/50 focus:ring-offset-0"
                  />
                  <label htmlFor="terms" className="text-xs text-white/75 cursor-pointer leading-relaxed">
                    Я погоджуюся з{" "}
                    <a href="#" className="font-semibold text-white underline underline-offset-2">
                      Умовами
                    </a>{" "}
                    та{" "}
                    <a href="#" className="font-semibold text-white underline underline-offset-2">
                      Політикою конфіденційності
                    </a>
                  </label>
                </div>
              </>
            )}

            {mode === "login" && (
              <>
                <input
                  type="email"
                  required
                  value={f.email}
                  onChange={set("email")}
                  placeholder="Email"
                  aria-label="Email"
                  autoComplete="email"
                  className={inputCls}
                />
                <input
                  type="password"
                  required
                  maxLength={128}
                  value={f.password}
                  onChange={set("password")}
                  placeholder="Пароль"
                  aria-label="Пароль"
                  autoComplete="current-password"
                  className={inputCls}
                />
              </>
            )}

            {err && (
              <div
                role="alert"
                className="px-4 py-2.5 rounded-2xl bg-red-500/20 border border-red-300/40 text-xs text-red-100 font-medium backdrop-blur-sm"
              >
                {err}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3 px-4 mt-2 rounded-full bg-white text-[#0b1417] text-sm font-semibold transition hover:bg-cyan-50 hover:shadow-[0_0_24px_rgba(165,243,252,0.45)] focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 disabled:opacity-60"
            >
              {busy ? "…" : mode === "login" ? "Увійти" : "Створити акаунт"}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={toggleMode}
              className="text-xs sm:text-sm text-white/80 hover:text-white transition-colors"
            >
              {mode === "login" ? (
                <>
                  Немає акаунта? <span className="font-semibold text-white underline underline-offset-2">Зареєструватись</span>
                </>
              ) : (
                <>
                  Вже є акаунт? <span className="font-semibold text-white underline underline-offset-2">Увійти</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}