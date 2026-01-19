from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""

    success: bool
    data: T | None = None
    error: str | None = None


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated API response wrapper."""

    success: bool
    data: list[T]
    total: int
    limit: int
    offset: int
