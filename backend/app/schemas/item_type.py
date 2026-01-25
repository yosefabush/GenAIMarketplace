from datetime import datetime
from pydantic import BaseModel, Field


class ItemTypeCreate(BaseModel):
    """Schema for creating a new item type."""

    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    description: str | None = None
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=20)


class ItemTypeUpdate(BaseModel):
    """Schema for updating an item type."""

    name: str | None = Field(None, min_length=1, max_length=100)
    slug: str | None = Field(None, min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    description: str | None = None
    icon: str | None = Field(None, max_length=50)
    color: str | None = Field(None, max_length=20)


class ItemTypeResponse(BaseModel):
    """Item type response schema."""

    id: int
    name: str
    slug: str
    description: str | None
    icon: str | None
    color: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItemTypeWithItemCount(ItemTypeResponse):
    """Item type response with item count."""

    item_count: int = 0
