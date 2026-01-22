from app.schemas.base import APIResponse, PaginatedResponse
from app.schemas.tag import TagCreate, TagUpdate, TagResponse, TagWithItemCount
from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.item import ItemCreate, ItemUpdate, ItemResponse, ItemListResponse
from app.schemas.search import SearchResponse
from app.schemas.analytics import (
    AnalyticsOverview,
    ItemsByType,
    SearchesBySource,
    SearchTotals,
    TopSearchQuery,
    TopViewedItem,
)
from app.schemas.like import (
    LikeToggleRequest,
    LikeToggleResponse,
    LikeCheckResponse,
    LikeTotals,
    TopLikedItem,
    LikesOverTime,
    LikeAnalytics,
)

__all__ = [
    "APIResponse",
    "PaginatedResponse",
    "TagCreate",
    "TagUpdate",
    "TagResponse",
    "TagWithItemCount",
    "CategoryCreate",
    "CategoryResponse",
    "ItemCreate",
    "ItemUpdate",
    "ItemResponse",
    "ItemListResponse",
    "SearchResponse",
    "AnalyticsOverview",
    "ItemsByType",
    "SearchesBySource",
    "SearchTotals",
    "TopSearchQuery",
    "TopViewedItem",
    "LikeToggleRequest",
    "LikeToggleResponse",
    "LikeCheckResponse",
    "LikeTotals",
    "TopLikedItem",
    "LikesOverTime",
    "LikeAnalytics",
]
