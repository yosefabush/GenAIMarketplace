from datetime import datetime
from pydantic import BaseModel


class TagResponse(BaseModel):
    """Tag response schema."""

    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}
