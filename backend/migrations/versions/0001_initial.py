"""initial MVP schema

Revision ID: 0001
Revises:
"""
import sqlalchemy as sa
from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

TS = sa.DateTime(timezone=True)


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Uuid, primary_key=True),
        sa.Column("email", sa.String(254), nullable=False),
        sa.Column("phone", sa.String(20)),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("role", sa.String(24), nullable=False),
        sa.Column("personalization_consent", sa.Boolean, nullable=False),
        sa.Column("is_active", sa.Boolean, nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)

    op.create_table(
        "guides",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("bio", sa.Text, nullable=False),
        sa.Column("experience_years", sa.Integer),
        sa.Column("photo_url", sa.String(500)),
    )

    op.create_table(
        "tours",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("slug", sa.String(120), nullable=False),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("region", sa.String(80), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("difficulty", sa.String(24), nullable=False),
        sa.Column("duration_days", sa.Integer, nullable=False),
        sa.Column("distance_km", sa.Integer),
        sa.Column("elevation_gain_m", sa.Integer),
        sa.Column("max_altitude_m", sa.Integer),
        sa.Column("program", sa.JSON, nullable=False),
        sa.Column("required_documents", sa.Text, nullable=False),
        sa.Column("included", sa.JSON, nullable=False),
        sa.Column("checklist", sa.JSON, nullable=False),
        sa.Column("photo_urls", sa.JSON, nullable=False),
        sa.Column("tags", sa.JSON, nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("closed_reason", sa.String(300)),
        sa.Column("created_by", sa.Uuid, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", TS, nullable=False),
        sa.CheckConstraint("duration_days > 0", name="ck_tours_duration_pos"),
    )
    op.create_index("ix_tours_slug", "tours", ["slug"], unique=True)
    op.create_index("ix_tours_region", "tours", ["region"])
    op.create_index("ix_tours_difficulty", "tours", ["difficulty"])
    op.create_index("ix_tours_status", "tours", ["status"])
    op.create_index("ix_tours_created_by", "tours", ["created_by"])

    op.create_table(
        "departures",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tour_id", sa.Integer, sa.ForeignKey("tours.id"), nullable=False),
        sa.Column("guide_id", sa.Integer, sa.ForeignKey("guides.id")),
        sa.Column("start_date", sa.Date, nullable=False),
        sa.Column("price_uah", sa.Integer, nullable=False),
        sa.Column("capacity", sa.Integer, nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.CheckConstraint("price_uah > 0", name="ck_departures_price_pos"),
        sa.CheckConstraint("capacity > 0", name="ck_departures_capacity_pos"),
    )
    op.create_index("ix_departures_tour_id", "departures", ["tour_id"])
    op.create_index("ix_departures_guide_id", "departures", ["guide_id"])
    op.create_index("ix_departures_start_date", "departures", ["start_date"])

    op.create_table(
        "bookings",
        sa.Column("id", sa.Uuid, primary_key=True),
        sa.Column("user_id", sa.Uuid, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("departure_id", sa.Integer, sa.ForeignKey("departures.id"), nullable=False),
        sa.Column("participants", sa.Integer, nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("hold_expires_at", TS),
        sa.Column("total_uah", sa.Integer, nullable=False),
        sa.Column("created_at", TS, nullable=False),
        sa.CheckConstraint("participants > 0", name="ck_bookings_participants_pos"),
    )
    op.create_index("ix_bookings_user_id", "bookings", ["user_id"])
    op.create_index("ix_bookings_departure_id", "bookings", ["departure_id"])
    op.create_index("ix_bookings_departure_status", "bookings", ["departure_id", "status"])

    op.create_table(
        "payments",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("booking_id", sa.Uuid, sa.ForeignKey("bookings.id"), nullable=False),
        sa.Column("provider", sa.String(40), nullable=False),
        sa.Column("external_id", sa.String(120)),
        sa.Column("amount_uah", sa.Integer, nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_payments_booking_id", "payments", ["booking_id"])

    op.create_table(
        "reviews",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("tour_id", sa.Integer, sa.ForeignKey("tours.id"), nullable=False),
        sa.Column("user_id", sa.Uuid, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("booking_id", sa.Uuid, sa.ForeignKey("bookings.id"), nullable=False, unique=True),
        sa.Column("rating", sa.Integer, nullable=False),
        sa.Column("text", sa.Text, nullable=False),
        sa.Column("photo_urls", sa.JSON, nullable=False),
        sa.Column("status", sa.String(24), nullable=False),
        sa.Column("created_at", TS, nullable=False),
        sa.CheckConstraint("rating BETWEEN 1 AND 5", name="ck_reviews_rating_range"),
    )
    op.create_index("ix_reviews_tour_id", "reviews", ["tour_id"])
    op.create_index("ix_reviews_user_id", "reviews", ["user_id"])

    op.create_table(
        "quiz_questions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("position", sa.Integer, nullable=False, unique=True),
        sa.Column("text", sa.String(300), nullable=False),
        sa.Column("options", sa.JSON, nullable=False),
    )

    op.create_table(
        "quiz_submissions",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("user_id", sa.Uuid, sa.ForeignKey("users.id"), nullable=False),
        sa.Column("experience_level", sa.String(20), nullable=False),
        sa.Column("budget_max_uah", sa.Integer),
        sa.Column("answers", sa.JSON, nullable=False),
        sa.Column("created_at", TS, nullable=False),
    )
    op.create_index("ix_quiz_submissions_user_id", "quiz_submissions", ["user_id"])


def downgrade() -> None:
    for t in ("quiz_submissions", "quiz_questions", "reviews", "payments", "bookings",
              "departures", "tours", "guides", "users"):
        op.drop_table(t)
