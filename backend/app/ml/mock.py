"""DEV/TEST ONLY mock. Config validation forbids it in staging/production.
It is NOT a model: it returns a deterministic ordering and labels results as mock."""
from app.ml.ports import Candidate, Recommendation, UserProfile


class MockRecommender:
    name = "mock"
    is_mock = True

    def recommend(self, profile: UserProfile, candidates: list[Candidate], limit: int) -> list[Recommendation]:
        ordered = sorted(candidates, key=lambda c: (c.min_price_uah, c.tour_id))
        n = len(ordered)
        return [
            Recommendation(c.tour_id, score=float(n - i), reasons=("MOCK: not a real recommendation",))
            for i, c in enumerate(ordered[:limit])
        ]

    def similar(self, tour_id: int, candidates: list[Candidate], limit: int) -> list[Recommendation]:
        same = [c for c in candidates if c.tour_id != tour_id]
        ref = next((c for c in candidates if c.tour_id == tour_id), None)
        same.sort(key=lambda c: (ref is not None and c.region != ref.region, c.tour_id))
        n = len(same)
        return [
            Recommendation(c.tour_id, score=float(n - i), reasons=("MOCK: not a real recommendation",))
            for i, c in enumerate(same[:limit])
        ]
