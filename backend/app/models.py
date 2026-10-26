import enum
import uuid
from datetime import date, datetime, timezone

from sqlalchemy import (
    JSON, Boolean, CheckConstraint, Date, DateTime, Enum, ForeignKey, Index, Integer, String, Text,
    Uuid,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.session import Base


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def _enum(e: type[enum.Enum]) -> Enum:
    return Enum(e, native_enum=False, length=24, values_callable=lambda x: [m.value for m in x])


class Role(str, enum.Enum):
    tourist = "tourist"
    guide = "guide"
    manager = "manager"
    admin = "admin"


class Difficulty(str, enum.Enum):
    easy = "easy"
    moderate = "moderate"
    hard = "hard"


class TourStatus(str, enum.Enum):
    draft = "draft"
    published = "published"
    closed = "closed"  # M-04: route closed (e.g. snow), excluded from catalog/recommendations


class DepartureStatus(str, enum.Enum):
    open = "open"
    cancelled = "cancelled"


class BookingStatus(str, enum.Enum):
    pending_payment = "pending_payment"
    confirmed = "confirmed"
    expired = "expired"


class PaymentStatus(str, enum.Enum):
    succeeded = "succeeded"
    failed = "failed"


class ReviewStatus(str, enum.Enum):
    published = "published"
    hidden = "hidden"


class User(Base):
    __tablename__ = "users"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    phone: Mapped[str | None] = mapped_column(String(20))
    full_name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    role: Mapped[Role] = mapped_column(_enum(Role), default=Role.tourist)
    personalization_consent: Mapped[bool] = mapped_column(Boolean, default=False)  # T-07
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Guide(Base):
    __tablename__ = "guides"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    bio: Mapped[str] = mapped_column(Text, default="")
    experience_years: Mapped[int | None] = mapped_column(Integer)
    photo_url: Mapped[str | None] = mapped_column(String(500))


class Tour(Base):
    __tablename__ = "tours"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    slug: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    title: Mapped[str] = mapped_column(String(200))
    region: Mapped[str] = mapped_column(String(80), index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    difficulty: Mapped[Difficulty] = mapped_column(_enum(Difficulty), index=True)
    duration_days: Mapped[int] = mapped_column(Integer)
    distance_km: Mapped[int | None] = mapped_column(Integer)
    elevation_gain_m: Mapped[int | None] = mapped_column(Integer)
    max_altitude_m: Mapped[int | None] = mapped_column(Integer)
    program: Mapped[list] = mapped_column(JSON, default=list)  # [{day,title,description}]
    required_documents: Mapped[str] = mapped_column(Text, default="")  # T-09
    included: Mapped[list] = mapped_column(JSON, default=list)
    checklist: Mapped[list] = mapped_column(JSON, default=list)
    photo_urls: Mapped[list] = mapped_column(JSON, default=list)
    tags: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[TourStatus] = mapped_column(_enum(TourStatus), default=TourStatus.draft, index=True)
    closed_reason: Mapped[str | None] = mapped_column(String(300))
    created_by: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    departures: Mapped[list["Departure"]] = relationship(back_populates="tour")
    __table_args__ = (CheckConstraint("duration_days > 0", name="ck_tours_duration_pos"),)


class Departure(Base):
    __tablename__ = "departures"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id"), index=True)
    guide_id: Mapped[int | None] = mapped_column(ForeignKey("guides.id"), index=True)
    start_date: Mapped[date] = mapped_column(Date, index=True)
    price_uah: Mapped[int] = mapped_column(Integer)  # per person, whole UAH
    capacity: Mapped[int] = mapped_column(Integer)
    status: Mapped[DepartureStatus] = mapped_column(_enum(DepartureStatus), default=DepartureStatus.open)
    tour: Mapped[Tour] = relationship(back_populates="departures")
    guide: Mapped[Guide | None] = relationship()
    __table_args__ = (
        CheckConstraint("price_uah > 0", name="ck_departures_price_pos"),
        CheckConstraint("capacity > 0", name="ck_departures_capacity_pos"),
    )


class Booking(Base):
    __tablename__ = "bookings"
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    departure_id: Mapped[int] = mapped_column(ForeignKey("departures.id"), index=True)
    participants: Mapped[int] = mapped_column(Integer)
    status: Mapped[BookingStatus] = mapped_column(_enum(BookingStatus), default=BookingStatus.pending_payment)
    hold_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))  # T-16
    total_uah: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    departure: Mapped[Departure] = relationship()
    user: Mapped[User] = relationship()
    __table_args__ = (
        CheckConstraint("participants > 0", name="ck_bookings_participants_pos"),
        Index("ix_bookings_departure_status", "departure_id", "status"),
    )


class Payment(Base):
    __tablename__ = "payments"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    booking_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bookings.id"), index=True)
    provider: Mapped[str] = mapped_column(String(40))
    external_id: Mapped[str | None] = mapped_column(String(120))
    amount_uah: Mapped[int] = mapped_column(Integer)
    status: Mapped[PaymentStatus] = mapped_column(_enum(PaymentStatus))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Review(Base):
    __tablename__ = "reviews"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    tour_id: Mapped[int] = mapped_column(ForeignKey("tours.id"), index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    booking_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("bookings.id"), unique=True)  # 1 review / booking
    rating: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text, default="")
    photo_urls: Mapped[list] = mapped_column(JSON, default=list)
    status: Mapped[ReviewStatus] = mapped_column(_enum(ReviewStatus), default=ReviewStatus.published)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    user: Mapped[User] = relationship()
    __table_args__ = (CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),)


class QuizQuestion(Base):
    """Quiz content is data, not code: the real questions are SPECIFICATION_PENDING."""
    __tablename__ = "quiz_questions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    position: Mapped[int] = mapped_column(Integer, unique=True)
    text: Mapped[str] = mapped_column(String(300))
    options: Mapped[list] = mapped_column(JSON)  # [{value,label}]


class QuizSubmission(Base):
    """Persisted ONLY for authenticated users who gave personalization consent (T-07)."""
    __tablename__ = "quiz_submissions"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), index=True)
    experience_level: Mapped[str] = mapped_column(String(20))
    budget_max_uah: Mapped[int | None] = mapped_column(Integer)
    answers: Mapped[dict] = mapped_column(JSON)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
