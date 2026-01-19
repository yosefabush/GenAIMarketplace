"""Search-related schemas."""

from typing import Generic, TypeVar
from pydantic import BaseModel

T = TypeVar("T")


class SearchResponse(BaseModel, Generic[T]):
    """Search API response with page-based pagination."""

    success: bool
    data: list[T]
    total: int
    page: int
    limit: int
