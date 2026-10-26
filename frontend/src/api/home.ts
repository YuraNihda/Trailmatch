import { request } from "./client";

/* ---------- Типи з app/schemas.py ---------- */
interface DepartureCardApi {
  departure_id: number;
  tour_id: number;
  tour_title: string;
  region: string;
  difficulty: string;
  duration_days: number;
  start_date: string;
  price_uah: number;
  seats_left: number;
  cover_photo: string | null;
}
interface PageApi { items: DepartureCardApi[]; page: number; page_size: number; total: number }
interface RecommendationsApi {
  source: string;
  is_mock: boolean;
  items: { card: DepartureCardApi; score: number; reasons: string[] }[];
}
interface ReviewApi {
  id: number;
  tour_id: number;
  author_name: string;
  rating: number;
  text: string;
  created_at: string;
}

/* ---------- Типи для UI ---------- */
export type TripCard = {
  id: number;          // id туру → /tours/:id
  departureId: number;
  name: string;
  date: string;
  days: string;
  level: string;
  price: number;
  seatsLeft: number;
  img: string;
};
export type ReviewCard = { id: number; name: string; rating: number; date: string; text: string };

const NO_PHOTO =
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=900";

// ⚠️ Значення enum Difficulty у models.py я не бачив — підправ ключі, якщо вони інші
const LEVELS: Record<string, string> = {
  easy: "Легкий",
  moderate: "Середній",
  medium: "Середній",
  hard: "Складний",
  difficult: "Складний",
  extreme: "Екстремальний",
};

function toTrip(c: DepartureCardApi): TripCard {
  return {
    id: c.tour_id,
    departureId: c.departure_id,
    name: c.tour_title,
    date: new Date(c.start_date).toLocaleDateString("uk-UA", { day: "numeric", month: "short" }),
    days: `${c.duration_days}д`,
    level: LEVELS[c.difficulty] ?? c.difficulty,
    price: c.price_uah,
    seatsLeft: c.seats_left,
    img: c.cover_photo ?? NO_PHOTO,
  };
}

/* ---------- Запити ---------- */
export async function fetchUpcomingTrips(limit = 3): Promise<TripCard[]> {
  const data = await request<PageApi>("/departures", { query: { page: 1, page_size: limit } });
  return data.items.map(toTrip);
}

// Тільки для залогінених + згода на персоналізацію + пройдений квіз
export async function fetchRecommendedTrips(limit = 4): Promise<TripCard[]> {
  const data = await request<RecommendationsApi>("/recommendations");
  return data.items.slice(0, limit).map((i) => toTrip(i.card));
}

export async function fetchLatestReviews(limit = 3): Promise<ReviewCard[]> {
  const rows = await request<ReviewApi[]>("/reviews", { query: { limit } });
  return rows.map((r) => ({
    id: r.id,
    name: r.author_name,
    rating: r.rating,
    text: r.text,
    date: new Date(r.created_at).toLocaleDateString("uk-UA", { day: "numeric", month: "long" }),
  }));
}