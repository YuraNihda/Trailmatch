import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_mock_forbidden_in_production():
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="x" * 40, ml_mode="mock")
    with pytest.raises(ValidationError):
        Settings(environment="production", jwt_secret="x" * 40, payment_mode="mock")


def test_short_secret_rejected():
    with pytest.raises(ValidationError):
        Settings(environment="development", jwt_secret="short")
