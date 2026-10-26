from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.errors import Conflict, Unauthorized
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import Role, User
from app.schemas import LoginIn, RegisterIn, TokenOut, UserOut, UserUpdateIn

router = APIRouter(tags=["auth"])


@router.post("/auth/register", response_model=UserOut, status_code=201)
def register(body: RegisterIn, db: Session = Depends(get_db)):
    """T-14. Role is never taken from input: everyone registers as tourist."""
    email = body.email.lower()
    if db.scalar(select(User.id).where(User.email == email)):
        raise Conflict("Email is already registered")
    user = User(email=email, full_name=body.full_name, phone=body.phone,
                password_hash=hash_password(body.password), role=Role.tourist)
    db.add(user)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise Conflict("Email is already registered")
    return user


@router.post("/auth/login", response_model=TokenOut)
def login(body: LoginIn, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    ok = verify_password(body.password, user.password_hash if user else None)
    if not user or not ok or not user.is_active:
        raise Unauthorized("Invalid credentials")  # same message for all failures
    return TokenOut(access_token=create_access_token(user.id))


@router.get("/users/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return user


@router.patch("/users/me", response_model=UserOut)
def update_me(body: UserUpdateIn, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    """T-07: manage personalization consent. Withdrawing consent deletes stored quiz data."""
    from app.models import QuizSubmission
    data = body.model_dump(exclude_unset=True)
    if data.get("personalization_consent") is False and user.personalization_consent:
        for sub in db.scalars(select(QuizSubmission).where(QuizSubmission.user_id == user.id)):
            db.delete(sub)
    for k, v in data.items():
        setattr(user, k, v)
    db.commit()
    return user
