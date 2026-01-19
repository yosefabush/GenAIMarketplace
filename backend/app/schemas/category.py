from datetime import datetime
from pydantic import BaseModel


class CategoryResponse(BaseModel):
    """Category response schema."""

    id: int
    name: str
    slug: str
    parent_id: int | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
