from datetime import datetime
from pydantic import BaseModel


class LikeToggleRequest(BaseModel):
    """Request body for toggling a like on an item."""

    user_identifier: str


class LikeToggleResponse(BaseModel):
    """Response for the like toggle endpoint."""

    item_id: int
    liked: bool
    like_count: int


class LikeCheckResponse(BaseModel):
    """Response for checking if a user has liked an item."""

    item_id: int
    liked: bool


class LikeTotals(BaseModel):
    """Total likes statistics."""

    total_likes: int
    last_7_days: int
    last_30_days: int


class TopLikedItem(BaseModel):
    """Top liked item statistics."""

    id: int
    title: str
    type: str
    like_count: int


class LikesOverTime(BaseModel):
    """Likes per day over a time period."""

    date: str
    count: int


class LikeAnalytics(BaseModel):
    """Complete like analytics response."""

    totals: LikeTotals
    top_liked_items: list[TopLikedItem]
    likes_over_time: list[LikesOverTime]
