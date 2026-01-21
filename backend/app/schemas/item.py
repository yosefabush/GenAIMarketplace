from datetime import datetime
from pydantic import BaseModel, Field

from app.schemas.tag import TagResponse
from app.schemas.category import CategoryResponse


class ItemCreate(BaseModel):
    """Schema for creating a new item."""

    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(..., min_length=1)
    content: str = Field(..., min_length=1)
    type: str = Field(..., pattern="^(agent|prompt|mcp|workflow|doc|skill)$")
    category_id: int | None = None
    tag_ids: list[int] = Field(default_factory=list)


class ItemUpdate(BaseModel):
    """Schema for updating an existing item."""

    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, min_length=1)
    content: str | None = Field(default=None, min_length=1)
    type: str | None = Field(default=None, pattern="^(agent|prompt|mcp|workflow|doc|skill)$")
    category_id: int | None = None
    tag_ids: list[int] | None = None


class ItemResponse(BaseModel):
    """Item response schema."""

    id: int
    title: str
    description: str
    content: str
    type: str
    category_id: int | None
    category: CategoryResponse | None
    tags: list[TagResponse]
    view_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ItemListResponse(BaseModel):
    """Item list response schema (without full content)."""

    id: int
    title: str
    description: str
    type: str
    category_id: int | None
    category: CategoryResponse | None
    tags: list[TagResponse]
    view_count: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
