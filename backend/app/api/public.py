from datetime import date

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_optional_user
from app.core.errors import BusinessRuleViolation, NotFound
from app.db.session import get_db
from app.ml.ports import UserProfile
from app.models import (
    Booking, BookingStatus, Departure, Difficulty, Guide, QuizQuestion, QuizSubmission, Review,
    ReviewStatus, Tour, TourStatus, User,
)
from app.schemas import (
    BookingIn, BookingOut, DepartureCard, GuideOut, Page, PaymentOut, QuizQuestionOut, QuizSubmitIn,
    RecommendationsOut, ReviewIn, ReviewOut, SubmissionOut, TourDetail,
)
from app.services import bookings as booking_svc
from app.services import catalog, recommendations

router = APIRouter()


# ---------------- catalog (public) ----------------
@router.get("/departures", response_model=Page, tags=["catalog"])
def list_departures(
    region: str | None = Query(default=None, max_length=80),
    difficulty: Difficulty | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    price_min: int | None = Query(default=None, ge=0),
    price_max: int | None = Query(default=None, ge=0),
    page: int = Query(default=1, ge=1, le=1000),
    page_size: int = Query(default=9, ge=1, le=50),
    db: Session = Depends(get_db),
):
    return catalog.search_departures(
        db, region=region, difficulty=difficulty, date_from=date_from, date_to=date_to,
        price_min=price_min, price_max=price_max, page=page, page_size=page_size,
    )


@router.get("/tours/{tour_id}", response_model=TourDetail, tags=["catalog"])
def get_tour(tour_id: int, db: Session = Depends(get_db)):
    return catalog.tour_detail(db, tour_id)


@router.get("/tours/{tour_id}/reviews", response_model=list[ReviewOut], tags=["reviews"])
def tour_reviews(tour_id: int, db: Session = Depends(get_db)):
    catalog.get_published_tour(db, tour_id)
    rows = db.scalars(
        select(Review).where(Review.tour_id == tour_id, Review.status == ReviewStatus.published)
        .order_by(Review.created_at.desc()).limit(100)
    ).all()
    return [_review_out(r) for r in rows]


@router.get("/tours/{tour_id}/similar", response_model=RecommendationsOut, tags=["ml"])
def similar(tour_id: int, db: Session = Depends(get_db)):
    """T-10. ML-backed; failure yields 503/501 for THIS endpoint only, the rest of the page works."""
    catalog.get_published_tour(db, tour_id)
    return recommendations.similar_tours(db, tour_id)


@router.get("/guides/{guide_id}", response_model=GuideOut, tags=["catalog"])
def guide_profile(guide_id: int, db: Session = Depends(get_db)):
    g = db.get(Guide, guide_id)
    if not g:
        raise NotFound("Guide not found")
    return g


@router.get("/guides/{guide_id}/departures", response_model=list[DepartureCard], tags=["catalog"])
def guide_departures(guide_id: int, db: Session = Depends(get_db)):
    q = catalog._bookable_departures().where(Departure.guide_id == guide_id).order_by(Departure.start_date).limit(50)
    return catalog.to_cards(db, [(d, t) for d, t in db.execute(q).all()])


# ---------------- quiz / recommendations ----------------
@router.get("/quiz/questions", response_model=list[QuizQuestionOut], tags=["quiz"])
def quiz_questions(db: Session = Depends(get_db)):
    return db.scalars(select(QuizQuestion).order_by(QuizQuestion.position)).all()


@router.post("/quiz/submissions", response_model=RecommendationsOut, tags=["quiz"])
def submit_quiz(body: QuizSubmitIn, user: User | None = Depends(get_optional_user), db: Session = Depends(get_db)):
    """T-03 (+T-04 rule). Guests allowed. Data is stored only for users who gave consent (T-07)."""
    questions = {str(q.id): {o["value"] for o in q.options} for q in db.scalars(select(QuizQuestion))}
    for qid, val in body.answers.items():
        if qid not in questions or val not in questions[qid]:
            raise BusinessRuleViolation(f"Invalid answer for question {qid}")
    profile = UserProfile(body.experience_level, body.budget_max_uah, dict(body.answers))
    result = recommendations.recommend_for_profile(db, profile)
    if user and user.personalization_consent:
        db.add(QuizSubmission(user_id=user.id, experience_level=body.experience_level,
                              budget_max_uah=body.budget_max_uah, answers=dict(body.answers)))
        db.commit()
    return result


@router.get("/quiz/submissions/me", response_model=list[SubmissionOut], tags=["quiz"])
def my_submissions(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.scalars(select(QuizSubmission).where(QuizSubmission.user_id == user.id)
                      .order_by(QuizSubmission.created_at.desc()).limit(20)).all()


@router.get("/recommendations", response_model=RecommendationsOut, tags=["ml"])
def my_recommendations(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """T-05: 'Recommended for You'. Requires consent + a saved quiz result."""
    if not user.personalization_consent:
        raise BusinessRuleViolation("Personalization consent is required")
    sub = db.scalars(select(QuizSubmission).where(QuizSubmission.user_id == user.id)
                     .order_by(QuizSubmission.created_at.desc())).first()
    if not sub:
        raise BusinessRuleViolation("Take the quiz first")
    return recommendations.recommend_for_profile(
        db, UserProfile(sub.experience_level, sub.budget_max_uah, dict(sub.answers)))


# ---------------- bookings ----------------
def _booking_out(b: Booking) -> BookingOut:
    return BookingOut(
        id=b.id, departure_id=b.departure_id, tour_id=b.departure.tour_id,
        tour_title=b.departure.tour.title, start_date=b.departure.start_date,
        participants=b.participants, status=b.status, hold_expires_at=b.hold_expires_at, total_uah=b.total_uah,
    )


@router.post("/bookings", response_model=BookingOut, status_code=201, tags=["bookings"])
def create_booking(body: BookingIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    b = booking_svc.create_booking(db, user, body.departure_id, body.participants)
    return _booking_out(b)


@router.get("/bookings/me", response_model=list[BookingOut], tags=["bookings"])
def my_bookings(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """T-19. Owner-scoped. Expired holds are shown as expired."""
    booking_svc.expire_stale_holds(db)
    db.commit()
    rows = db.scalars(select(Booking).where(Booking.user_id == user.id)
                      .order_by(Booking.created_at.desc()).limit(200)).all()
    return [_booking_out(b) for b in rows]


@router.post("/bookings/{booking_id}/payments", response_model=PaymentOut, tags=["bookings"])
def pay(booking_id: str, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    import uuid
    try:
        bid = uuid.UUID(booking_id)
    except ValueError:
        raise NotFound("Booking not found")
    p = booking_svc.pay_booking(db, user, bid)
    return PaymentOut(booking_id=p.booking_id, status=p.status.value, provider=p.provider)


# ---------------- reviews ----------------
def _review_out(r: Review) -> ReviewOut:
    return ReviewOut(id=r.id, tour_id=r.tour_id, author_name=r.user.full_name.split()[0], rating=r.rating,
                     text=r.text, photo_urls=r.photo_urls, status=r.status, created_at=r.created_at)


@router.get("/reviews", response_model=list[ReviewOut], tags=["reviews"])
def latest_reviews(limit: int = Query(default=3, ge=1, le=20), db: Session = Depends(get_db)):
    """Latest published reviews for the home page."""
    rows = db.scalars(
        select(Review).where(Review.status == ReviewStatus.published)
        .order_by(Review.created_at.desc()).limit(limit)
    ).all()
    return [_review_out(r) for r in rows]

@router.post("/reviews", response_model=ReviewOut, status_code=201, tags=["reviews"])
def create_review(body: ReviewIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """T-20: only a participant (confirmed booking) of a finished departure, one review per booking."""
    from datetime import timedelta
    b = db.scalar(select(Booking).where(Booking.id == body.booking_id, Booking.user_id == user.id))
    if not b or b.status != BookingStatus.confirmed:
        raise NotFound("Booking not found")
    end = b.departure.start_date + timedelta(days=b.departure.tour.duration_days)
    if end > date.today():
        raise BusinessRuleViolation("You can review a tour after it has finished")
    if db.scalar(select(Review.id).where(Review.booking_id == b.id)):
        raise BusinessRuleViolation("This booking already has a review")
    r = Review(tour_id=b.departure.tour_id, user_id=user.id, booking_id=b.id, rating=body.rating,
               text=body.text, photo_urls=body.photo_urls)
    db.add(r)
    db.commit()
    return _review_out(r)


@router.get("/reviews/me", response_model=list[ReviewOut], tags=["reviews"])
def my_reviews(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(select(Review).where(Review.user_id == user.id).order_by(Review.created_at.desc())).all()
    return [_review_out(r) for r in rows]
