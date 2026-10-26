from datetime import date, timedelta

from app.models import Role
from tests.conftest import login, make_user

TOUR = {"slug": "new-tour", "title": "New", "region": "Gorgany", "difficulty": "easy", "duration_days": 2}


def test_manager_creates_tour_and_departure_and_publishes(client, Session):
    make_user(Session, "m@example.com", Role.manager)
    h = login(client, "m@example.com")
    t = client.post("/api/v1/admin/tours", headers=h, json=TOUR)
    assert t.status_code == 201 and t.json()["status"] == "draft"
    tid = t.json()["id"]
    assert client.get(f"/api/v1/tours/{tid}").status_code == 404  # drafts are not public
    d = client.post(f"/api/v1/admin/tours/{tid}/departures", headers=h,
                    json={"start_date": str(date.today() + timedelta(days=5)), "price_uah": 2000, "capacity": 10})
    assert d.status_code == 201
    assert client.patch(f"/api/v1/admin/tours/{tid}", headers=h, json={"status": "published"}).status_code == 200
    assert client.get(f"/api/v1/tours/{tid}").json()["departures"][0]["seats_left"] == 10


def test_close_requires_reason(client, Session):
    make_user(Session, "m@example.com", Role.manager)
    h = login(client, "m@example.com")
    tid = client.post("/api/v1/admin/tours", headers=h, json=TOUR).json()["id"]
    assert client.patch(f"/api/v1/admin/tours/{tid}", headers=h, json={"status": "closed"}).status_code == 422
    assert client.patch(f"/api/v1/admin/tours/{tid}", headers=h,
                        json={"status": "closed", "closed_reason": "snow"}).status_code == 200


def test_manager_cannot_touch_other_managers_tour(client, Session):
    make_user(Session, "m1@example.com", Role.manager)
    make_user(Session, "m2@example.com", Role.manager)
    make_user(Session, "adm@example.com", Role.admin)
    h1, h2, ha = (login(client, e) for e in ("m1@example.com", "m2@example.com", "adm@example.com"))
    tid = client.post("/api/v1/admin/tours", headers=h1, json=TOUR).json()["id"]
    assert client.patch(f"/api/v1/admin/tours/{tid}", headers=h2, json={"title": "x"}).status_code == 404
    assert client.get("/api/v1/admin/tours", headers=h2).json() == []
    assert client.patch(f"/api/v1/admin/tours/{tid}", headers=ha, json={"title": "ok"}).status_code == 200


def test_tour_validation_rejects_bad_input(client, Session):
    make_user(Session, "m@example.com", Role.manager)
    h = login(client, "m@example.com")
    assert client.post("/api/v1/admin/tours", headers=h, json={**TOUR, "photo_urls": ["javascript:alert(1)"]}).status_code == 422
    assert client.post("/api/v1/admin/tours", headers=h, json={**TOUR, "slug": "Bad Slug"}).status_code == 422
    assert client.post("/api/v1/admin/tours", headers=h, json={**TOUR, "created_by": "x"}).status_code == 422


def test_only_admin_changes_roles(client, Session):
    mid = make_user(Session, "m@example.com", Role.manager)
    tid = make_user(Session, "t@example.com", Role.tourist)
    make_user(Session, "adm@example.com", Role.admin)
    hm, ha = login(client, "m@example.com"), login(client, "adm@example.com")
    assert client.patch(f"/api/v1/admin/users/{tid}/role", headers=hm, json={"role": "manager"}).status_code == 403
    assert client.patch(f"/api/v1/admin/users/{tid}/role", headers=ha, json={"role": "manager"}).json()["role"] == "manager"


def test_csv_export_is_confirmed_only_and_formula_safe(client, Session, seeded):
    from app.models import User
    make_user(Session, "evil@example.com")
    with Session() as s:
        u = s.query(User).filter_by(email="evil@example.com").one()
        u.full_name = "=HYPERLINK(\"http://x\")"
        s.commit()
    h, hm = login(client, "evil@example.com"), login(client, "mgr@example.com")
    bid = client.post("/api/v1/bookings", headers=h, json={"departure_id": seeded["departure_id"], "participants": 1}).json()["id"]
    url = f"/api/v1/admin/departures/{seeded['departure_id']}/participants.csv"
    assert "evil@example.com" not in client.get(url, headers=hm).text  # unpaid -> not exported
    client.post(f"/api/v1/bookings/{bid}/payments", headers=h)
    csv_text = client.get(url, headers=hm).text
    assert "evil@example.com" in csv_text and "'=HYPERLINK" in csv_text
    assert client.get(url, headers=h).status_code == 403
