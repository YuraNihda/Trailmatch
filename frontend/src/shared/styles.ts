/* Single source of truth for the TrailMatch look (dark glass + cyan accent). */

export const container = "mx-auto w-full max-w-6xl px-4 sm:px-6";

/* ───────── Surfaces ───────── */

// Cards on content pages (catalog, profile, home)
export const glass =
  "rounded-3xl border border-white/15 bg-white/[0.07] backdrop-blur-xl " +
  "shadow-[0_8px_32px_rgba(0,0,0,0.35),inset_0_1px_0_rgba(255,255,255,0.18)]";

// Focused cards over a full-screen photo (login, quiz)
export const glassStrong =
  "rounded-3xl border border-white/20 bg-white/10 backdrop-blur-2xl " +
  "shadow-[0_8px_40px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.25)]";

/* ───────── Buttons ───────── */

const btnBase =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

const sizes = {
  sm: "px-5 py-2 text-sm",
  md: "px-5 py-2.5 text-sm",
  lg: "px-6 py-3 text-sm",
} as const;

export type BtnSize = keyof typeof sizes;

export const btnPrimary = (size: BtnSize = "lg") =>
  `${btnBase} ${sizes[size]} bg-white text-[#0b1417] ` +
  "hover:bg-cyan-50 hover:shadow-[0_0_24px_rgba(165,243,252,0.45)] disabled:hover:shadow-none";

export const btnGhost = (size: BtnSize = "lg") =>
  `${btnBase} ${sizes[size]} border border-white/30 bg-white/5 text-white backdrop-blur-sm ` +
  "hover:border-cyan-200/70 hover:bg-white/10";

/* ───────── Inputs ───────── */

// Placeholder-only inputs (login / register)
export const inputCls =
  "w-full rounded-full border border-white/25 bg-white/10 px-5 py-3 text-sm text-white placeholder-white/60 " +
  "backdrop-blur-sm transition " +
  "focus:border-cyan-200/70 focus:bg-white/15 focus:outline-none focus:ring-2 focus:ring-cyan-200/30 " +
  "disabled:cursor-not-allowed disabled:opacity-60 [color-scheme:dark] " +
  "[&:-webkit-autofill]:[-webkit-text-fill-color:#fff] " +
  "[&:-webkit-autofill]:shadow-[inset_0_0_0_1000px_rgba(24,36,40,0.85)]";

// Inputs with a label above (filters, profile, quiz budget)
export const fieldCls = "mt-1.5 " + inputCls;

export const labelCls = "text-xs font-medium text-white/75";

/* ───────── Small pieces ───────── */

export const alertCls =
  "rounded-2xl border border-red-300/40 bg-red-500/20 px-4 py-2.5 text-xs font-medium text-red-100 backdrop-blur-sm";

export const linkAccent = "text-sm font-semibold text-cyan-100 hover:text-white";