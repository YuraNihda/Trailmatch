from tests.conftest import login, make_user
from app.ml.ports import Candidate, Recommendation, UserProfile, apply_safety_rules, sanitize_output


def test_rule_beginner_only_easy_unit():
    c = [Candidate(1, "easy", "r", 1), Candidate(2, "hard", "r", 1), Candidate(3, "moderate", "r", 1)]
    assert [x.tour_id for x in apply_safety_rules(UserProfile("beginner"), c)] == [1]
    assert len(apply_safety_rules(UserProfile("advanced"), c)) == 3


def test_sanitize_drops_unknown_and_disallowed_ml_output():
    allowed = [Candidate(1, "easy", "r", 1)]
    out = sanitize_output([Recommendation(2, 9.0), Recommendation(1, 1.0), Recommendation(1, 0.5)], allowed, 6)
    assert [r.tour_id for r in out] == [1]


def test_quiz_beginner_never_gets_hard_tour(client, seeded):
    r = client.post("/api/v1/quiz/submissions", json={"experience_level": "beginner"})
    assert r.status_code == 200
    body = r.json()
    assert body["is_mock"] is True  # mock output is always labelled
    assert {i["card"]["difficulty"] for i in body["items"]} == {"easy"}


def test_quiz_budget_filter(client, seeded):
    r = client.post("/api/v1/quiz/submissions", json={"experience_level": "advanced", "budget_max_uah": 1500})
    assert [i["card"]["tour_title"] for i in r.json()["items"]] == ["Hard"]


def test_quiz_not_stored_without_consent_and_recommendations_require_it(client, Session, seeded):
    make_user(Session, "a@example.com")
    h = login(client, "a@example.com")
    client.post("/api/v1/quiz/submissions", headers=h, json={"experience_level": "beginner"})
    assert client.get("/api/v1/quiz/submissions/me", headers=h).json() == []
    assert client.get("/api/v1/recommendations", headers=h).status_code == 422
    client.patch("/api/v1/users/me", headers=h, json={"personalization_consent": True})
    client.post("/api/v1/quiz/submissions", headers=h, json={"experience_level": "beginner"})
    assert len(client.get("/api/v1/quiz/submissions/me", headers=h).json()) == 1
    assert client.get("/api/v1/recommendations", headers=h).status_code == 200
    client.patch("/api/v1/users/me", headers=h, json={"personalization_consent": False})
    assert client.get("/api/v1/quiz/submissions/me", headers=h).json() == []  # withdrawal deletes data


def test_ml_failure_does_not_break_catalog(client, seeded, monkeypatch):
    from app.ml import mock
    from app.ml.ports import ProviderError

    def boom(*a, **k):
        raise ProviderError("down")

    monkeypatch.setattr(mock.MockRecommender, "similar", boom)
    assert client.get(f"/api/v1/tours/{seeded['tour_id']}/similar").status_code == 503
    assert client.get(f"/api/v1/tours/{seeded['tour_id']}").status_code == 200
