from datetime import date

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import FeatureUnavailable, UpstreamUnavailable
from app.ml.mock import MockRecommender
from app.ml.ports import (
    Candidate, ProviderError, Recommendation, RecommendationProvider, UserProfile,
    apply_safety_rules, sanitize_output,
)
from app.models import Departure, DepartureStatus, Tour, TourStatus
from app.schemas import RecommendationsOut, RecommendedTour
from app.services.catalog import to_cards

LIMIT = 6  # T-03: top-6


def get_provider() -> RecommendationProvider:
    """Composition root for the ML boundary. Real adapters are added here once contracts exist."""
    if get_settings().ml_mode == "mock":
        return MockRecommender()
    raise FeatureUnavailable("Recommendation module is not configured")


def _candidates(db: Session, budget: int | None) -> list[Candidate]:
    """Only published tours (M-04: closed ones are excluded) with a future open departure."""
    rows = db.execute(
        select(Tour, func.min(Departure.price_uah))
        .join(Departure, Departure.tour_id == Tour.id)
        .where(Tour.status == TourStatus.published, Departure.status == DepartureStatus.open,
               Departure.start_date >= date.today())
        .group_by(Tour.id)
    ).all()
    cands = [Candidate(t.id, t.difficulty.value, t.region, int(p), tuple(t.tags or [])) for t, p in rows]
    return [c for c in cands if budget is None or c.min_price_uah <= budget]


def _cards_for(db: Session, recs: list[Recommendation], provider: RecommendationProvider) -> RecommendationsOut:
    by_tour = {}
    if recs:
        rows = db.execute(
            select(Departure, Tour).join(Tour, Tour.id == Departure.tour_id)
            .where(Departure.tour_id.in_([r.tour_id for r in recs]), Departure.status == DepartureStatus.open,
                   Departure.start_date >= date.today())
            .order_by(Departure.start_date)
        ).all()
        for d, t in rows:
            by_tour.setdefault(t.id, (d, t))  # nearest departure per tour
    cards = {c.tour_id: c for c in to_cards(db, list(by_tour.values()))}
    items = [RecommendedTour(card=cards[r.tour_id], score=r.score, reasons=list(r.reasons))
             for r in recs if r.tour_id in cards]
    return RecommendationsOut(source=provider.name, is_mock=provider.is_mock, items=items)


def recommend_for_profile(db: Session, profile: UserProfile) -> RecommendationsOut:
    provider = get_provider()
    allowed = apply_safety_rules(profile, _candidates(db, profile.budget_max_uah))  # rule BEFORE ML
    try:
        raw = provider.recommend(profile, allowed, LIMIT)
    except ProviderError as exc:
        raise UpstreamUnavailable("Recommendations are temporarily unavailable") from exc
    return _cards_for(db, sanitize_output(raw, allowed, LIMIT), provider)  # rule enforced AFTER ML too


def similar_tours(db: Session, tour_id: int, limit: int = 3) -> RecommendationsOut:
    provider = get_provider()
    allowed = _candidates(db, None)
    try:
        raw = provider.similar(tour_id, allowed, limit)
    except ProviderError as exc:
        raise UpstreamUnavailable("Similar tours are temporarily unavailable") from exc
    return _cards_for(db, sanitize_output([r for r in raw if r.tour_id != tour_id], allowed, limit), provider)
