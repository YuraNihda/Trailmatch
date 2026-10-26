import uuid

import jwt
from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.errors import Forbidden, NotFound, Unauthorized
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import Role, Tour, User

bearer = HTTPBearer(auto_error=False)


def get_optional_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer), db: Session = Depends(get_db)
) -> User | None:
    if creds is None:
        return None
    try:
        user_id = decode_access_token(creds.credentials)
    except (jwt.PyJWTError, ValueError):
        raise Unauthorized("Invalid or expired token")
    user = db.get(User, user_id)
    if not user or not user.is_active:
        raise Unauthorized("Invalid or expired token")
    return user


def get_current_user(user: User | None = Depends(get_optional_user)) -> User:
    if user is None:
        raise Unauthorized("Authentication required")
    return user


def require_roles(*roles: Role):
    def dep(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise Forbidden("Insufficient permissions")  # authN != authZ
        return user
    return dep


require_staff = require_roles(Role.manager, Role.admin)
require_admin = require_roles(Role.admin)


def manageable_tour(db: Session, user: User, tour_id: int) -> Tour:
    """M-08: managers only see their own tours; admins see all. 404 (not 403) avoids enumeration."""
    tour = db.get(Tour, tour_id)
    if not tour or (user.role != Role.admin and tour.created_by != user.id):
        raise NotFound("Tour not found")
    return tour


UserId = uuid.UUID
