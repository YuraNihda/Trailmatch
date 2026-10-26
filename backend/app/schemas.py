import uuid
from datetime import date, datetime
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, StringConstraints, field_validator

from app.models import BookingStatus, Difficulty, ReviewStatus, Role, TourStatus

Phone = Annotated[str, StringConstraints(pattern=r"^\+?[0-9]{9,15}$")]
Slug = Annotated[str, StringConstraints(pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$", max_length=120)]


class StrictIn(BaseModel):
    """Base for all request bodies: unknown fields are rejected (anti mass-assignment)."""
    model_config = ConfigDict(extra="forbid")


def _https_urls(v: list[str]) -> list[str]:
    if len(v) > 20:
        raise ValueError("too many URLs (max 20)")
    for u in v:
        if not u.startswith("https://") or len(u) > 500:
            raise ValueError("only https:// URLs up to 500 chars are allowed")
    return v


# ---------- auth / users ----------
class RegisterIn(StrictIn):
    email: EmailStr
    password: str = Field(min_length=10, max_length=128)
    full_name: str = Field(min_length=1, max_length=120)
    phone: Phone | None = None


class LoginIn(StrictIn):
    email: EmailStr
    password: str = Field(max_length=128)


class TokenOut(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    email: EmailStr
    full_name: str
    phone: str | None
    role: Role
    personalization_consent: bool


class UserUpdateIn(StrictIn):
    full_name: str | None = Field(default=None, min_length=1, max_length=120)
    phone: Phone | None = None
    personalization_consent: bool | None = None


class RoleUpdateIn(StrictIn):
    role: Role


# ---------- catalog ----------
class GuideOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    bio: str
    experience_years: int | None
    photo_url: str | None


class GuideIn(StrictIn):
    name: str = Field(min_length=1, max_length=120)
    bio: str = Field(default="", max_length=5000)
    experience_years: int | None = Field(default=None, ge=0, le=80)
    photo_url: str | None = Field(default=None, max_length=500)

    @field_validator("photo_url")
    @classmethod
    def _https(cls, v):
        if v is not None:
            _https_urls([v])
        return v


class DepartureCard(BaseModel):
    departure_id: int
    tour_id: int
    tour_title: str
    region: str
    difficulty: Difficulty
    duration_days: int
    start_date: date
    price_uah: int
    seats_left: int
    cover_photo: str | None


class Page(BaseModel):
    items: list[DepartureCard]
    page: int
    page_size: int
    total: int


class DepartureOut(BaseModel):
    id: int
    start_date: date
    price_uah: int
    capacity: int
    seats_left: int
    guide: GuideOut | None


class TourBase(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    slug: str
    title: str
    region: str
    description: str
    difficulty: Difficulty
    duration_days: int
    distance_km: int | None
    elevation_gain_m: int | None
    max_altitude_m: int | None
    program: list
    required_documents: str
    included: list
    checklist: list
    photo_urls: list
    tags: list
    status: TourStatus


class TourDetail(TourBase):
    departures: list[DepartureOut] = []


class ProgramDay(StrictIn):
    day: int = Field(ge=1, le=60)
    title: str = Field(max_length=200)
    description: str = Field(default="", max_length=3000)


class TourIn(StrictIn):
    slug: Slug
    title: str = Field(min_length=1, max_length=200)
    region: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=10000)
    difficulty: Difficulty
    duration_days: int = Field(ge=1, le=60)
    distance_km: int | None = Field(default=None, ge=0, le=2000)
    elevation_gain_m: int | None = Field(default=None, ge=0, le=10000)
    max_altitude_m: int | None = Field(default=None, ge=0, le=3000)
    program: list[ProgramDay] = []
    required_documents: str = Field(default="", max_length=3000)
    included: list[Annotated[str, StringConstraints(max_length=300)]] = Field(default=[], max_length=50)
    checklist: list[Annotated[str, StringConstraints(max_length=300)]] = Field(default=[], max_length=100)
    photo_urls: list[str] = []
    tags: list[Annotated[str, StringConstraints(max_length=40)]] = Field(default=[], max_length=30)

    _urls = field_validator("photo_urls")(_https_urls)


class TourUpdateIn(StrictIn):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    region: str | None = Field(default=None, min_length=1, max_length=80)
    description: str | None = Field(default=None, max_length=10000)
    difficulty: Difficulty | None = None
    duration_days: int | None = Field(default=None, ge=1, le=60)
    distance_km: int | None = Field(default=None, ge=0, le=2000)
    elevation_gain_m: int | None = Field(default=None, ge=0, le=10000)
    max_altitude_m: int | None = Field(default=None, ge=0, le=3000)
    program: list[ProgramDay] | None = None
    required_documents: str | None = Field(default=None, max_length=3000)
    included: list[Annotated[str, StringConstraints(max_length=300)]] | None = Field(default=None, max_length=50)
    checklist: list[Annotated[str, StringConstraints(max_length=300)]] | None = Field(default=None, max_length=100)
    photo_urls: list[str] | None = None
    tags: list[Annotated[str, StringConstraints(max_length=40)]] | None = Field(default=None, max_length=30)
    status: TourStatus | None = None
    closed_reason: str | None = Field(default=None, max_length=300)

    @field_validator("photo_urls")
    @classmethod
    def _urls(cls, v):
        return _https_urls(v) if v is not None else v


class DepartureIn(StrictIn):
    start_date: date
    price_uah: int = Field(gt=0, le=1_000_000)
    capacity: int = Field(gt=0, le=200)
    guide_id: int | None = None


# ---------- bookings / payments ----------
class BookingIn(StrictIn):
    departure_id: int
    participants: int = Field(ge=1, le=20)


class BookingOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: uuid.UUID
    departure_id: int
    tour_id: int
    tour_title: str
    start_date: date
    participants: int
    status: BookingStatus
    hold_expires_at: datetime | None
    total_uah: int


class PaymentOut(BaseModel):
    booking_id: uuid.UUID
    status: str
    provider: str


# ---------- reviews ----------
class ReviewIn(StrictIn):
    booking_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    text: str = Field(default="", max_length=3000)
    photo_urls: list[str] = []

    _urls = field_validator("photo_urls")(_https_urls)


class ReviewOut(BaseModel):
    id: int
    tour_id: int
    author_name: str
    rating: int
    text: str
    photo_urls: list
    status: ReviewStatus
    created_at: datetime


class ReviewModerateIn(StrictIn):
    status: ReviewStatus


# ---------- quiz / recommendations ----------
class QuizOptionOut(BaseModel):
    value: str
    label: str


class QuizQuestionOut(BaseModel):
    id: int
    position: int
    text: str
    options: list[QuizOptionOut]


class QuizSubmitIn(StrictIn):
    experience_level: Literal["beginner", "intermediate", "advanced"]
    budget_max_uah: int | None = Field(default=None, gt=0, le=1_000_000)
    answers: dict[str, str] = Field(default={}, max_length=30)


class RecommendedTour(BaseModel):
    card: DepartureCard
    score: float
    reasons: list[str]


class RecommendationsOut(BaseModel):
    source: str  # provider name; "mock" must be visible to the client in dev
    is_mock: bool
    items: list[RecommendedTour]


class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    experience_level: str
    budget_max_uah: int | None
    answers: dict
    created_at: datetime


class ParticipantRow(BaseModel):
    booking_id: uuid.UUID
    full_name: str
    phone: str | None
    email: str
    participants: int
    status: BookingStatus
