import { container, glass } from "./styles";

export const NO_PHOTO =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1400";

export function Notice({ children, action }: { children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className={glass + " mx-auto max-w-lg p-8 text-center"}>
      <p className="text-sm text-white/75">{children}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen overflow-x-clip bg-[#0b1417] text-white">
      <div className={container + " py-16"}>{children}</div>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-5 text-2xl font-bold tracking-tight sm:text-3xl">{children}</h2>;
}

export function Star({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" className={filled ? "text-cyan-200" : "text-white/35"} aria-hidden="true">
      <path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" />
    </svg>
  );
}

export const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-cyan-200" aria-hidden="true"><path d="m5 12 5 5 9-10" /></svg>
);

export const ChevronIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 transition-transform group-open:rotate-180" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
);