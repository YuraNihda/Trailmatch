from functools import lru_cache
from typing import Literal

from pydantic import Field, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: Literal["development", "test", "staging", "production"] = "development"
    database_url: str = "sqlite:///./trailmatch.db"
    jwt_secret: str = Field(min_length=32)  # required, no default on purpose
    jwt_issuer: str = "trailmatch"
    jwt_expire_minutes: int = Field(default=60, ge=5, le=1440)
    ml_mode: Literal["disabled", "mock"] = "disabled"
    payment_mode: Literal["disabled", "mock"] = "disabled"
    booking_hold_minutes: int = Field(default=15, ge=1, le=120)
    cors_origins: list[str] = []

    @model_validator(mode="after")
    def _no_mocks_in_production(self) -> "Settings":
        if self.environment in ("production", "staging"):
            if self.ml_mode == "mock" or self.payment_mode == "mock":
                raise ValueError("Mock ML/payment providers are forbidden in staging/production")
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]
