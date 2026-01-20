from pydantic import BaseModel


class SearchTotals(BaseModel):
    """Total search counts for different time periods."""

    last_7_days: int
    last_30_days: int
    all_time: int


class TopSearchQuery(BaseModel):
    """Top search query with count and average results."""

    query: str
    count: int
    avg_result_count: float


class SearchesBySource(BaseModel):
    """Search counts grouped by source."""

    source: str
    count: int


class ItemsByType(BaseModel):
    """Item counts grouped by type."""

    type: str
    count: int


class TopViewedItem(BaseModel):
    """Top viewed item with basic info."""

    id: int
    title: str
    type: str
    view_count: int


class AnalyticsOverview(BaseModel):
    """Combined analytics overview response."""

    search_totals: SearchTotals
    top_searches: list[TopSearchQuery]
    searches_by_source: list[SearchesBySource]
    items_by_type: list[ItemsByType]
    top_viewed_items: list[TopViewedItem]
