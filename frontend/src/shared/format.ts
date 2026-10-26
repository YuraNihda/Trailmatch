import type { Difficulty } from "../api/types";

export const formatPrice = (n: number) => `₴${new Intl.NumberFormat("uk-UA").format(n).replace(/\u00a0/g, " ")}`;

export function formatDate(iso: string): string {
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString("uk-UA", { day: "numeric", month: "short", year: "numeric" });
}

export const DIFFICULTY_LABEL: Record<Difficulty, string> = { easy: "Легкий", moderate: "Середній", hard: "Складний" };
export const isPast = (isoDate: string) => new Date(`${isoDate}T00:00:00`).getTime() < new Date().setHours(0, 0, 0, 0);
