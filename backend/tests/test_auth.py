from tests.conftest import login, make_user
from app.models import Role


def test_register_login_me(client):
    r = client.post("/api/v1/auth/register", json={"email": "A@Example.com", "password": "longenough-1", "full_name": "Ann"})
    assert r.status_code == 201 and r.json()["role"] == "tourist"
    h = login(client, "a@example.com", "longenough-1")
    assert client.get("/api/v1/users/me", headers=h).json()["email"] == "a@example.com"


def test_register_cannot_set_role(client):
    r = client.post("/api/v1/auth/register", json={"email": "x@example.com", "password": "longenough-1",
                                                    "full_name": "X", "role": "admin"})
    assert r.status_code == 422  # extra field forbidden


def test_duplicate_email_and_weak_password(client):
    body = {"email": "d@example.com", "password": "longenough-1", "full_name": "D"}
    assert client.post("/api/v1/auth/register", json=body).status_code == 201
    assert client.post("/api/v1/auth/register", json=body).status_code == 409
    assert client.post("/api/v1/auth/register", json={**body, "email": "e@example.com", "password": "short"}).status_code == 422


def test_login_failure_is_generic(client, Session):
    make_user(Session, "u@example.com")
    a = client.post("/api/v1/auth/login", json={"email": "u@example.com", "password": "wrong-password"})
    b = client.post("/api/v1/auth/login", json={"email": "nobody@example.com", "password": "wrong-password"})
    assert a.status_code == b.status_code == 401 and a.json() == b.json()


def test_protected_endpoint_requires_token(client):
    assert client.get("/api/v1/users/me").status_code == 401
    assert client.get("/api/v1/users/me", headers={"Authorization": "Bearer garbage"}).status_code == 401


def test_roles_enforced_on_server(client, Session):
    make_user(Session, "t@example.com", Role.tourist)
    h = login(client, "t@example.com")
    assert client.get("/api/v1/admin/tours", headers=h).status_code == 403
    assert client.get("/api/v1/admin/tours").status_code == 401
