import os

os.environ.update(
    ENVIRONMENT="test", JWT_SECRET="t" * 48, ML_MODE="mock", PAYMENT_MODE="mock",
    DATABASE_URL="sqlite://", BOOKING_HOLD_MINUTES="15",
)

from datetime import date, timedelta  # noqa: E402

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402
from sqlalchemy import create_engine  # noqa: E402
from sqlalchemy.orm import sessionmaker  # noqa: E402
from sqlalchemy.pool import StaticPool  # noqa: E402

from app.core.security import hash_password  # noqa: E402
from app.db.session import Base, get_db  # noqa: E402
from app.main import create_app  # noqa: E402
from app.models import Departure, Difficulty, Role, Tour, TourStatus, User  # noqa: E402


@pytest.fixture()
def Session():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    return sessionmaker(bind=engine, expire_on_commit=False)


@pytest.fixture()
def client(Session):
    app = create_app()

    def _db():
        with Session() as s:
            yield s

    app.dependency_overrides[get_db] = _db
    return TestClient(app)


def make_user(Session, email, role=Role.tourist, password="correct-horse-1"):
    with Session() as s:
        u = User(email=email, full_name="Test User", role=role, password_hash=hash_password(password))
        s.add(u)
        s.commit()
        return u.id


def login(client, email, password="correct-horse-1"):
    r = client.post("/api/v1/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.text
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


@pytest.fixture()
def seeded(Session):
    """manager + one published tour with one departure (capacity 4)."""
    mgr_id = make_user(Session, "mgr@example.com", Role.manager)
    with Session() as s:
        tour = Tour(slug="t1", title="T1", region="Gorgany", difficulty=Difficulty.easy, duration_days=3,
                    status=TourStatus.published, created_by=mgr_id, tags=[], photo_urls=[])
        s.add(tour)
        s.flush()
        dep = Departure(tour_id=tour.id, start_date=date.today() + timedelta(days=10), price_uah=2200, capacity=4)
        hard = Tour(slug="t2", title="Hard", region="Gorgany", difficulty=Difficulty.hard, duration_days=3,
                    status=TourStatus.published, created_by=mgr_id, tags=[], photo_urls=[])
        s.add_all([dep, hard])
        s.flush()
        s.add(Departure(tour_id=hard.id, start_date=date.today() + timedelta(days=11), price_uah=1000, capacity=4))
        s.commit()
        return {"tour_id": tour.id, "departure_id": dep.id, "hard_tour_id": hard.id, "mgr_id": mgr_id}
