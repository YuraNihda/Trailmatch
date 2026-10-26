import csv
import io
import uuid
from datetime import date, datetime, timedelta, timezone

from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.errors import BusinessRuleViolation, Conflict, FeatureUnavailable, NotFound
from app.models import (
    Booking, BookingStatus, Departure, DepartureStatus, Payment, PaymentStatus, Tour, TourStatus, User,
)
from app.services.catalog import seats_taken_map


def _now() -> datetime:
    return datetime.now(timezone.utc)


def expire_stale_holds(db: Session) -> None:
    db.execute(
        update(Booking)
        .where(Booking.status == BookingStatus.pending_payment, Booking.hold_expires_at <= _now())
        .values(status=BookingStatus.expired)
    )


def create_booking(db: Session, user: User, departure_id: int, participants: int) -> Booking:
    """T-15 + T-16. The departure row is locked (SELECT ... FOR UPDATE on PostgreSQL) so that
    concurrent requests cannot oversell the capacity."""
    dep = db.execute(select(Departure).where(Departure.id == departure_id).with_for_update()).scalar_one_or_none()
    tour = db.get(Tour, dep.tour_id) if dep else None
    if not dep or not tour or tour.status != TourStatus.published or dep.status != DepartureStatus.open:
        raise NotFound("Departure not found")
    if dep.start_date < date.today():
        raise BusinessRuleViolation("Departure already started")

    expire_stale_holds(db)
    existing = db.scalar(
        select(Booking.id).where(
            Booking.user_id == user.id, Booking.departure_id == dep.id,
            Booking.status.in_([BookingStatus.pending_payment, BookingStatus.confirmed]),
        )
    )
    if existing:
        raise Conflict("You already have an active booking for this departure")

    free = dep.capacity - seats_taken_map(db, [dep.id]).get(dep.id, 0)
    if participants > free:
        raise Conflict(f"Not enough free seats (left: {max(free, 0)})")

    booking = Booking(
        user_id=user.id, departure_id=dep.id, participants=participants,
        status=BookingStatus.pending_payment,
        hold_expires_at=_now() + timedelta(minutes=get_settings().booking_hold_minutes),
        total_uah=dep.price_uah * participants,
    )
    db.add(booking)
    db.commit()
    return booking


def get_own_booking(db: Session, user: User, booking_id: uuid.UUID, *, lock: bool = False) -> Booking:
    q = select(Booking).where(Booking.id == booking_id, Booking.user_id == user.id)  # owner-scoped (IDOR)
    booking = db.execute(q.with_for_update() if lock else q).scalar_one_or_none()
    if not booking:
        raise NotFound("Booking not found")
    return booking


# ---- payments: provider boundary (provider is not chosen yet: see OPEN_QUESTIONS) ----
class MockPaymentProvider:
    name = "mock"

    def charge(self, booking: Booking) -> tuple[bool, str]:
        return True, f"mock-{booking.id}"


def get_payment_provider():
    mode = get_settings().payment_mode
    if mode == "mock":
        return MockPaymentProvider()
    raise FeatureUnavailable("Online payment is not configured")


def pay_booking(db: Session, user: User, booking_id: uuid.UUID) -> Payment:
    """T-17. Idempotent: paying an already confirmed booking returns the existing payment."""
    booking = get_own_booking(db, user, booking_id, lock=True)
    if booking.status == BookingStatus.confirmed:
        pay = db.scalar(select(Payment).where(Payment.booking_id == booking.id, Payment.status == PaymentStatus.succeeded))
        if pay:
            return pay
    if booking.status != BookingStatus.pending_payment:
        raise Conflict("Booking cannot be paid in its current state")
    hold = booking.hold_expires_at
    if hold is not None and hold.tzinfo is None:  # SQLite returns naive datetimes
        hold = hold.replace(tzinfo=timezone.utc)
    if hold is None or hold <= _now():
        booking.status = BookingStatus.expired
        db.commit()
        raise Conflict("Seat hold expired, please book again")

    provider = get_payment_provider()
    ok, external_id = provider.charge(booking)
    payment = Payment(
        booking_id=booking.id, provider=provider.name, external_id=external_id,
        amount_uah=booking.total_uah, status=PaymentStatus.succeeded if ok else PaymentStatus.failed,
    )
    db.add(payment)
    if ok:
        booking.status = BookingStatus.confirmed
        booking.hold_expires_at = None
    db.commit()
    return payment


def _csv_safe(value: str | None) -> str:
    """Neutralise spreadsheet formula injection in exported cells."""
    v = value or ""
    return "'" + v if v[:1] in ("=", "+", "-", "@", "\t", "\r") else v


def participants_csv(rows: list[tuple[Booking, User]]) -> str:
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["booking_id", "full_name", "phone", "email", "participants", "status"])
    for b, u in rows:
        w.writerow([b.id, _csv_safe(u.full_name), _csv_safe(u.phone), _csv_safe(u.email), b.participants, b.status.value])
    return buf.getvalue()
