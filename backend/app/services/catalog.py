from datetime import date, datetime, timezone

from sqlalchemy import Select, and_, func, or_, select
from sqlalchemy.orm import Session

from app.core.errors import NotFound
from app.models import (
    Booking, BookingStatus, Departure, DepartureStatus, Difficulty, Tour, TourStatus,
)
from app.schemas import DepartureCard, DepartureOut, GuideOut, Page, TourBase, TourDetail


def _now() -> datetime:
    return datetime.now(timezone.utc)


def seats_taken_map(db: Session, departure_ids: list[int]) -> dict[int, int]:
    """Seats held = confirmed bookings + pending bookings whose hold has not expired (T-16)."""
    if not departure_ids:
        return {}
    active = or_(
        Booking.status == BookingStatus.confirmed,
        and_(Booking.status == BookingStatus.pending_payment, Booking.hold_expires_at > _now()),
    )
    rows = db.execute(
        select(Booking.departure_id, func.coalesce(func.sum(Booking.participants), 0))
        .where(Booking.departure_id.in_(departure_ids), active)
        .group_by(Booking.departure_id)
    ).all()
    return {dep_id: int(total) for dep_id, total in rows}


def _bookable_departures() -> Select:
    return (
        select(Departure, Tour)
        .join(Tour, Tour.id == Departure.tour_id)
        .where(
            Tour.status == TourStatus.published,
            Departure.status == DepartureStatus.open,
            Departure.start_date >= date.today(),
        )
    )


def to_cards(db: Session, rows: list[tuple[Departure, Tour]]) -> list[DepartureCard]:
    taken = seats_taken_map(db, [d.id for d, _ in rows])
    return [
        DepartureCard(
            departure_id=d.id, tour_id=t.id, tour_title=t.title, region=t.region,
            difficulty=t.difficulty, duration_days=t.duration_days, start_date=d.start_date,
            price_uah=d.price_uah, seats_left=max(d.capacity - taken.get(d.id, 0), 0),
            cover_photo=(t.photo_urls[0] if t.photo_urls else None),
        )
        for d, t in rows
    ]


def search_departures(
    db: Session, *, region: str | None, difficulty: Difficulty | None, date_from: date | None,
    date_to: date | None, price_min: int | None, price_max: int | None, page: int, page_size: int,
) -> Page:
    """T-01 / T-02: catalog of departures (a wireframe card = date + tour + price) with filters."""
    q = _bookable_departures()
    if region:
        q = q.where(Tour.region == region)
    if difficulty:
        q = q.where(Tour.difficulty == difficulty)
    if date_from:
        q = q.where(Departure.start_date >= date_from)
    if date_to:
        q = q.where(Departure.start_date <= date_to)
    if price_min is not None:
        q = q.where(Departure.price_uah >= price_min)
    if price_max is not None:
        q = q.where(Departure.price_uah <= price_max)
    total = db.scalar(select(func.count()).select_from(q.subquery())) or 0
    rows = db.execute(
        q.order_by(Departure.start_date, Departure.id).limit(page_size).offset((page - 1) * page_size)
    ).all()
    return Page(items=to_cards(db, [(d, t) for d, t in rows]), page=page, page_size=page_size, total=total)


def get_published_tour(db: Session, tour_id: int) -> Tour:
    tour = db.get(Tour, tour_id)
    if not tour or tour.status != TourStatus.published:
        raise NotFound("Tour not found")
    return tour


def tour_detail(db: Session, tour_id: int) -> TourDetail:
    tour = get_published_tour(db, tour_id)
    deps = db.scalars(
        select(Departure).where(
            Departure.tour_id == tour.id, Departure.status == DepartureStatus.open,
            Departure.start_date >= date.today(),
        ).order_by(Departure.start_date)
    ).all()
    taken = seats_taken_map(db, [d.id for d in deps])
    base = TourBase.model_validate(tour).model_dump()
    return TourDetail(**base, departures=[
        DepartureOut(
            id=d.id, start_date=d.start_date, price_uah=d.price_uah, capacity=d.capacity,
            seats_left=max(d.capacity - taken.get(d.id, 0), 0), guide=GuideOut.model_validate(d.guide) if d.guide else None,
        )
        for d in deps
    ])
