"""ML integration boundary.

The business layer depends ONLY on this module. Real ML modules are
SPECIFICATION_PENDING (see docs/ML_INTEGRATION_PLAN.md); adapters are plugged in later.
"""
from dataclasses import dataclass, field
from typing import Protocol


@dataclass(frozen=True)
class UserProfile:
    experience_level: str  # "beginner" | "intermediate" | "advanced"  (assumption A-1)
    budget_max_uah: int | None = None
    answers: dict[str, str] = field(default_factory=dict)


@dataclass(frozen=True)
class Candidate:
    tour_id: int
    difficulty: str  # "easy" | "moderate" | "hard"
    region: str
    min_price_uah: int
    tags: tuple[str, ...] = ()


@dataclass(frozen=True)
class Recommendation:
    tour_id: int
    score: float
    reasons: tuple[str, ...] = ()  # T-06 "why recommended"


class RecommendationProvider(Protocol):
    name: str
    is_mock: bool

    def recommend(self, profile: UserProfile, candidates: list[Candidate], limit: int) -> list[Recommendation]: ...

    def similar(self, tour_id: int, candidates: list[Candidate], limit: int) -> list[Recommendation]: ...


class ProviderError(Exception):
    """Raised by adapters on timeout / invalid response / unavailability."""


def apply_safety_rules(profile: UserProfile, candidates: list[Candidate]) -> list[Candidate]:
    """T-04 (rule-based, NOT ML): a beginner must only ever get easy routes."""
    if profile.experience_level == "beginner":
        return [c for c in candidates if c.difficulty == "easy"]
    return list(candidates)


def sanitize_output(
    recs: list[Recommendation], allowed: list[Candidate], limit: int
) -> list[Recommendation]:
    """Never trust ML output: keep only known, allowed tour ids; dedupe; cap length."""
    allowed_ids = {c.tour_id for c in allowed}
    seen: set[int] = set()
    out: list[Recommendation] = []
    for r in sorted(recs, key=lambda r: r.score, reverse=True):
        if r.tour_id in allowed_ids and r.tour_id not in seen:
            seen.add(r.tour_id)
            out.append(r)
    return out[:limit]
