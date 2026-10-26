import uuid

from fastapi import APIRouter, Depends, Query
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import manageable_tour, require_admin, require_staff
from app.core.errors import BusinessRuleViolation, Conflict, NotFound
from app.db.session import get_db
from app.models import (
    Booking, BookingStatus, Departure, Guide, Review, Role, Tour, TourStatus, User,
)
from app.schemas import (
    BookingOut, DepartureIn, DepartureOut, GuideIn, GuideOut, ReviewModerateIn, ReviewOut, RoleUpdateIn,
    TourBase, TourIn, TourUpdateIn, UserOut,
)
from app.services import bookings as booking_svc
from app.api.public import _booking_out, _review_out
from app.services.catalog import seats_taken_map

router = APIRouter(prefix="/admin", tags=["admin"])


# ---- M-01 / M-02 / M-04 tours ----
@router.post("/tours", response_model=TourBase, status_code=201)
def create_tour(body: TourIn, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    if db.scalar(select(Tour.id).where(Tour.slug == body.slug)):
        raise Conflict("Slug already exists")
    data = body.model_dump()
    tour = Tour(**data, created_by=user.id, status=TourStatus.draft)
    db.add(tour)
    db.commit()
    return TourBase.model_validate(tour)


@router.get("/tours", response_model=list[TourBase])
def list_tours(user: User = Depends(require_staff), db: Session = Depends(get_db)):
    q = select(Tour).order_by(Tour.id.desc()).limit(200)
    if user.role != Role.admin:
        q = q.where(Tour.created_by == user.id)
    return [TourBase.model_validate(t) for t in db.scalars(q)]


@router.patch("/tours/{tour_id}", response_model=TourBase)
def update_tour(tour_id: int, body: TourUpdateIn, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    tour = manageable_tour(db, user, tour_id)
    data = body.model_dump(exclude_unset=True)
    if data.get("status") == TourStatus.closed and not (data.get("closed_reason") or tour.closed_reason):
        raise BusinessRuleViolation("closed_reason is required when closing a tour")
    for k, v in data.items():
        setattr(tour, k, v)
    if tour.status != TourStatus.closed:
        tour.closed_reason = None
    db.commit()
    return TourBase.model_validate(tour)


# ---- M-03 departures ----
@router.post("/tours/{tour_id}/departures", response_model=DepartureOut, status_code=201)
def create_departure(tour_id: int, body: DepartureIn, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    from datetime import date
    tour = manageable_tour(db, user, tour_id)
    if body.start_date < date.today():
        raise BusinessRuleViolation("start_date must not be in the past")
    guide = None
    if body.guide_id is not None:
        guide = db.get(Guide, body.guide_id)
        if not guide:
            raise NotFound("Guide not found")
    dep = Departure(tour_id=tour.id, guide_id=body.guide_id, start_date=body.start_date,
                    price_uah=body.price_uah, capacity=body.capacity)
    db.add(dep)
    db.commit()
    return DepartureOut(id=dep.id, start_date=dep.start_date, price_uah=dep.price_uah,
                        capacity=dep.capacity, seats_left=dep.capacity,
                        guide=GuideOut.model_validate(guide) if guide else None)


@router.post("/guides", response_model=GuideOut, status_code=201)
def create_guide(body: GuideIn, _: User = Depends(require_staff), db: Session = Depends(get_db)):
    g = Guide(**body.model_dump())
    db.add(g)
    db.commit()
    return g


# ---- M-05 bookings / M-06 export ----
def _scoped_departure(db: Session, user: User, departure_id: int) -> Departure:
    dep = db.get(Departure, departure_id)
    if not dep:
        raise NotFound("Departure not found")
    manageable_tour(db, user, dep.tour_id)
    return dep


@router.get("/bookings", response_model=list[BookingOut])
def list_bookings(
    departure_id: int | None = None, status: BookingStatus | None = None,
    user: User = Depends(require_staff), db: Session = Depends(get_db),
):
    booking_svc.expire_stale_holds(db)
    db.commit()
    q = select(Booking).join(Departure, Departure.id == Booking.departure_id).join(Tour, Tour.id == Departure.tour_id)
    if user.role != Role.admin:
        q = q.where(Tour.created_by == user.id)
    if departure_id is not None:
        q = q.where(Booking.departure_id == departure_id)
    if status is not None:
        q = q.where(Booking.status == status)
    return [_booking_out(b) for b in db.scalars(q.order_by(Booking.created_at.desc()).limit(500))]


@router.get("/departures/{departure_id}/participants.csv")
def export_participants(departure_id: int, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    """M-06. Only confirmed bookings. Passport data (needed by the border service) is NOT collected: see OPEN_QUESTIONS."""
    dep = _scoped_departure(db, user, departure_id)
    rows = db.execute(
        select(Booking, User).join(User, User.id == Booking.user_id)
        .where(Booking.departure_id == dep.id, Booking.status == BookingStatus.confirmed)
    ).all()
    return Response(booking_svc.participants_csv([(b, u) for b, u in rows]), media_type="text/csv",
                    headers={"Content-Disposition": f'attachment; filename="departure-{dep.id}.csv"'})


# ---- M-07 reviews moderation ----
@router.get("/reviews", response_model=list[ReviewOut])
def list_reviews(user: User = Depends(require_staff), db: Session = Depends(get_db)):
    q = select(Review).join(Tour, Tour.id == Review.tour_id).order_by(Review.created_at.desc()).limit(200)
    if user.role != Role.admin:
        q = q.where(Tour.created_by == user.id)
    return [_review_out(r) for r in db.scalars(q)]


@router.patch("/reviews/{review_id}", response_model=ReviewOut)
def moderate_review(review_id: int, body: ReviewModerateIn, user: User = Depends(require_staff), db: Session = Depends(get_db)):
    r = db.get(Review, review_id)
    if not r:
        raise NotFound("Review not found")
    manageable_tour(db, user, r.tour_id)
    r.status = body.status
    db.commit()
    return _review_out(r)


# ---- M-08 roles ----
@router.patch("/users/{user_id}/role", response_model=UserOut)
def set_role(user_id: uuid.UUID, body: RoleUpdateIn, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    target = db.get(User, user_id)
    if not target:
        raise NotFound("User not found")
    if target.id == admin.id:
        raise BusinessRuleViolation("You cannot change your own role")
    target.role = body.role
    db.commit()
    return target
