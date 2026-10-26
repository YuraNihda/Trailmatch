from datetime import date, timedelta
from concurrent.futures import ThreadPoolExecutor

from app.models import Booking, BookingStatus, Departure
from tests.conftest import login, make_user


def _book(client, h, dep, n):
    return client.post("/api/v1/bookings", headers=h, json={"departure_id": dep, "participants": n})


def test_catalog_lists_and_filters(client, seeded):
    r = client.get("/api/v1/departures")
    assert r.status_code == 200 and r.json()["total"] == 2
    r = client.get("/api/v1/departures", params={"difficulty": "easy"})
    assert [i["tour_title"] for i in r.json()["items"]] == ["T1"]
    r = client.get("/api/v1/departures", params={"price_max": 1500})
    assert [i["tour_title"] for i in r.json()["items"]] == ["Hard"]


def test_booking_hold_pay_and_capacity(client, Session, seeded):
    make_user(Session, "a@example.com")
    make_user(Session, "b@example.com")
    ha, hb = login(client, "a@example.com"), login(client, "b@example.com")
    r = _book(client, ha, seeded["departure_id"], 3)
    assert r.status_code == 201 and r.json()["total_uah"] == 6600 and r.json()["status"] == "pending_payment"
    assert _book(client, hb, seeded["departure_id"], 2).status_code == 409  # only 1 seat left (held by A)
    assert _book(client, hb, seeded["departure_id"], 1).status_code == 201
    assert _book(client, ha, seeded["departure_id"], 1).status_code == 409  # duplicate active booking
    p = client.post(f"/api/v1/bookings/{r.json()['id']}/payments", headers=ha)
    assert p.status_code == 200 and p.json()["status"] == "succeeded"
    again = client.post(f"/api/v1/bookings/{r.json()['id']}/payments", headers=ha)
    assert again.status_code == 200  # idempotent
    mine = client.get("/api/v1/bookings/me", headers=ha).json()
    assert mine[0]["status"] == "confirmed"


def test_expired_hold_releases_seats(client, Session, seeded):
    make_user(Session, "a@example.com")
    make_user(Session, "b@example.com")
    ha, hb = login(client, "a@example.com"), login(client, "b@example.com")
    bid = _book(client, ha, seeded["departure_id"], 4).json()["id"]
    with Session() as s:
        import uuid
        b = s.get(Booking, uuid.UUID(bid))
        from datetime import datetime, timedelta as td, timezone
        b.hold_expires_at = datetime.now(timezone.utc) - td(minutes=1)
        s.commit()
    assert _book(client, hb, seeded["departure_id"], 4).status_code == 201
    assert client.post(f"/api/v1/bookings/{bid}/payments", headers=ha).status_code == 409


def test_cannot_pay_someone_elses_booking(client, Session, seeded):
    make_user(Session, "a@example.com")
    make_user(Session, "b@example.com")
    ha, hb = login(client, "a@example.com"), login(client, "b@example.com")
    bid = _book(client, ha, seeded["departure_id"], 1).json()["id"]
    assert client.post(f"/api/v1/bookings/{bid}/payments", headers=hb).status_code == 404  # IDOR guard
    assert client.get("/api/v1/bookings/me", headers=hb).json() == []


def test_closed_tour_not_bookable_or_listed(client, Session, seeded):
    from app.models import Tour, TourStatus
    with Session() as s:
        s.get(Tour, seeded["tour_id"]).status = TourStatus.closed
        s.commit()
    make_user(Session, "a@example.com")
    h = login(client, "a@example.com")
    assert _book(client, h, seeded["departure_id"], 1).status_code == 404
    assert client.get(f"/api/v1/tours/{seeded['tour_id']}").status_code == 404
    assert client.get("/api/v1/departures").json()["total"] == 1


def test_invalid_participants(client, Session, seeded):
    make_user(Session, "a@example.com")
    h = login(client, "a@example.com")
    assert _book(client, h, seeded["departure_id"], 0).status_code == 422
    assert _book(client, h, seeded["departure_id"], 99).status_code == 422
