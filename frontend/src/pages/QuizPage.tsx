import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { request } from "../api/client";
import { messageFor } from "../api/errors";
import type { ExperienceLevel, QuizQuestion, Recommendations } from "../api/types";
import { useAuth } from "../auth/AuthContext";
import { alertCls, btnGhost, btnPrimary, fieldCls, glassStrong, labelCls } from "../shared/styles";

// ASSUMPTION A-1 (see backend docs/OPEN_QUESTIONS Q-2): the backend rule "beginner => easy only" needs an
// explicit experience level, and the budget filter needs a number. These two steps are NOT from the wireframes;
// the remaining steps come from the backend quiz_questions table (content pending, Q-3).
const EXPERIENCE: { value: ExperienceLevel; label: string }[] = [
  { value: "beginner", label: "Новачок — майже не ходив(-ла) в гори" },
  { value: "intermediate", label: "Маю досвід одноденних і коротких походів" },
  { value: "advanced", label: "Досвідчений(-а) — комфортно на складних маршрутах" },
];

const BG_IMG =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=2000";

/* ───────── Layout shell (shared by loading / error / quiz) ───────── */

function Shell({ children, wide = false }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <section className="relative isolate flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden bg-[#0b1417] px-4 py-12 text-white">
      <img src={BG_IMG} alt="" aria-hidden="true" className="absolute inset-0 -z-30 h-full w-full object-cover" />
      <div className="absolute inset-0 -z-20 bg-[#0b1417]/65" />
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/30 via-transparent to-black/60" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[460px] w-[460px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-300/20 blur-[120px]" />
      <div className={"w-full " + (wide ? "max-w-3xl" : "max-w-md")}>{children}</div>
    </section>
  );
}

/* ───────── Page ───────── */

export function QuizPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const questions = useQuery({ queryKey: ["quiz-questions"], queryFn: () => request<QuizQuestion[]>("/quiz/questions") });
  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<ExperienceLevel | null>(null);
  const [budget, setBudget] = useState("");
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const submit = useMutation({
    mutationFn: () => request<Recommendations>("/quiz/submissions", {
      method: "POST",
      body: { experience_level: experience, budget_max_uah: budget ? Number(budget) : undefined, answers },
    }),
    onSuccess: (result) => nav("/recommended", { state: { result } }),
  });

  if (questions.isPending) {
    return (
      <Shell>
        <div className={glassStrong + " flex items-center justify-center gap-3 p-8 text-sm text-white/80"} role="status" aria-live="polite">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/25 border-t-cyan-200" aria-hidden="true" />
          Завантаження квізу…
        </div>
      </Shell>
    );
  }

  if (questions.isError) {
    return (
      <Shell>
        <div className={glassStrong + " p-8 text-center"}>
          <p role="alert" className="text-sm text-white/80">{messageFor(questions.error)}</p>
          <button type="button" onClick={() => questions.refetch()} className={btnPrimary() + " mt-5"}>
            Спробувати ще раз
          </button>
        </div>
      </Shell>
    );
  }

  const qs = [...questions.data].sort((a, b) => a.position - b.position);
  const total = 2 + qs.length;
  const last = step === total - 1;
  const q = step >= 2 ? qs[step - 2] : null;
  const canNext = step === 0 ? experience !== null : step === 1 ? true : !!(q && answers[String(q.id)]);

  return (
    <Shell wide>
      <div className={glassStrong + " space-y-6 p-6 sm:p-10"}>
        {/* Progress */}
        <div>
          <div
            className="h-2 overflow-hidden rounded-full bg-white/15"
            role="progressbar"
            aria-valuemin={1}
            aria-valuemax={total}
            aria-valuenow={step + 1}
            aria-label="Прогрес квізу"
          >
            <div
              className="h-full rounded-full bg-gradient-to-r from-cyan-200 to-white shadow-[0_0_12px_rgba(165,243,252,0.6)] transition-all duration-300"
              style={{ width: `${((step + 1) / total) * 100}%` }}
            />
          </div>
          <p className="mt-3 text-center text-xs text-white/65">Питання {step + 1} з {total}</p>
        </div>

        {/* Steps */}
        {step === 0 && (
          <Choice
            title="Який у вас досвід походів?"
            options={EXPERIENCE}
            value={experience}
            onPick={(v) => setExperience(v as ExperienceLevel)}
          />
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h1 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">Який ваш бюджет на похід?</h1>
            <label className={labelCls + " mx-auto block max-w-sm"}>
              Максимум за особу, ₴ (необов'язково)
              <input
                className={fieldCls + " [appearance:textfield]"}
                type="number"
                inputMode="numeric"
                min={1}
                max={1000000}
                value={budget}
                placeholder="Наприклад, 3000"
                onChange={(e) => setBudget(e.target.value)}
              />
            </label>
          </div>
        )}

        {q && (
          <Choice
            title={q.text}
            options={q.options}
            value={answers[String(q.id)] ?? null}
            onPick={(v) => setAnswers({ ...answers, [String(q.id)]: v })}
          />
        )}

        {submit.isError && (
          <p role="alert" className={alertCls + " text-center"}>
            {messageFor(submit.error)}
          </p>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <button type="button" className={btnGhost()} disabled={step === 0} onClick={() => setStep(step - 1)}>
            Назад
          </button>
          {last ? (
            <button type="button" className={btnPrimary()} disabled={!canNext || submit.isPending} onClick={() => submit.mutate()}>
              {submit.isPending ? "Підбираємо…" : "Показати тури"}
            </button>
          ) : (
            <button type="button" className={btnPrimary()} disabled={!canNext} onClick={() => setStep(step + 1)}>
              Далі
            </button>
          )}
        </div>

        {user && !user.personalization_consent && (
          <p className="text-center text-xs text-white/65">
            Результати не збережуться, бо немає згоди на персоналізацію.{" "}
            <Link to="/profile" className="font-semibold text-white underline underline-offset-2">
              Увімкнути в профілі
            </Link>
          </p>
        )}
      </div>
    </Shell>
  );
}

/* ───────── Choice ───────── */

function Choice({
  title,
  options,
  value,
  onPick,
}: {
  title: string;
  options: { value: string; label: string }[];
  value: string | null;
  onPick: (v: string) => void;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-5 w-full text-center text-2xl font-bold tracking-tight sm:text-3xl">{title}</legend>
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <label
            key={o.value}
            className={
              "flex cursor-pointer items-center justify-between gap-4 rounded-full border px-6 py-4 text-sm transition sm:text-base " +
              "focus-within:ring-2 focus-within:ring-cyan-200 " +
              (selected
                ? "border-cyan-200/70 bg-cyan-200/15 text-white shadow-[0_0_20px_rgba(165,243,252,0.3)]"
                : "border-white/25 bg-white/10 text-white/85 hover:border-white/45 hover:bg-white/15")
            }
          >
            <input
              type="radio"
              name="choice"
              className="sr-only"
              checked={selected}
              onChange={() => onPick(o.value)}
            />
            <span>{o.label}</span>
            <span
              aria-hidden="true"
              className={
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition " +
                (selected ? "border-cyan-200 bg-cyan-200" : "border-white/40")
              }
            >
              {selected && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0b1417" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>
              )}
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}