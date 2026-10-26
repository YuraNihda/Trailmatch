// Hand-written mirror of backend/app/schemas.py (kept small on purpose).
// When the backend changes, regenerate/compare with /openapi.json.
export type Difficulty = "easy" | "moderate" | "hard";
export type Role = "tourist" | "guide" | "manager" | "admin";
export type BookingStatus = "pending_payment" | "confirmed" | "expired";

export interface User { id: string; email: string; full_name: string; phone: string | null; role: Role; personalization_consent: boolean }
export interface Guide { id: number; name: string; bio: string; experience_years: number | null; photo_url: string | null }
export interface DepartureCard {
  departure_id: number; tour_id: number; tour_title: string; region: string; difficulty: Difficulty;
  duration_days: number; start_date: string; price_uah: number; seats_left: number; cover_photo: string | null;
}
export interface Page { items: DepartureCard[]; page: number; page_size: number; total: number }
export interface DepartureOut { id: number; start_date: string; price_uah: number; capacity: number; seats_left: number; guide: Guide | null }
export interface ProgramDay { day: number; title: string; description: string }
export interface TourDetail {
  id: number; slug: string; title: string; region: string; description: string; difficulty: Difficulty;
  duration_days: number; distance_km: number | null; elevation_gain_m: number | null; max_altitude_m: number | null;
  program: ProgramDay[]; required_documents: string; included: string[]; checklist: string[];
  photo_urls: string[]; tags: string[]; departures: DepartureOut[];
}
export interface Review { id: number; tour_id: number; author_name: string; rating: number; text: string; photo_urls: string[]; created_at: string }
export interface Booking {
  id: string; departure_id: number; tour_id: number; tour_title: string; start_date: string;
  participants: number; status: BookingStatus; hold_expires_at: string | null; total_uah: number;
}
export interface QuizQuestion { id: number; position: number; text: string; options: { value: string; label: string }[] }
export interface RecommendedTour { card: DepartureCard; score: number; reasons: string[] }
export interface Recommendations { source: string; is_mock: boolean; items: RecommendedTour[] }
export interface Submission { id: number; experience_level: string; budget_max_uah: number | null; answers: Record<string, string>; created_at: string }
export type ExperienceLevel = "beginner" | "intermediate" | "advanced";
