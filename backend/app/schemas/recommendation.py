from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr


class RecommendationCreate(BaseModel):
    """Request body for creating a new recommendation."""

    title: str
    description: str
    type: str
    category_id: Optional[int] = None
    submitter_email: EmailStr
    reason: str


class RecommendationUpdate(BaseModel):
    """Request body for updating a recommendation (admin only)."""

    status: Optional[str] = None
    admin_notes: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Response for a single recommendation."""

    id: int
    title: str
    description: str
    type: str
    category_id: Optional[int]
    category_name: Optional[str]
    submitter_email: str
    reason: str
    status: str
    admin_notes: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class RecommendationListResponse(BaseModel):
    """Response for a list of recommendations with pagination."""

    items: list[RecommendationResponse]
    total: int
    page: int
    limit: int


class RecommendationApprovalRequest(BaseModel):
    """Request body for approving a recommendation and creating an item."""

    content: str
    admin_notes: Optional[str] = None
    tag_ids: Optional[list[int]] = None


class RecommendationRejectionRequest(BaseModel):
    """Request body for rejecting a recommendation."""

    admin_notes: str
