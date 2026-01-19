from datetime import datetime
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    """Schema for creating a new category."""

    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    parent_id: int | None = None


class CategoryResponse(BaseModel):
    """Category response schema."""

    id: int
    name: str
    slug: str
    parent_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
