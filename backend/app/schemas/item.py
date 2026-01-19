from datetime import datetime
from pydantic import BaseModel

from app.schemas.tag import TagResponse
from app.schemas.category import CategoryResponse


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
