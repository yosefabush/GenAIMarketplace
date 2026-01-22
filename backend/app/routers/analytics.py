from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, cast, Date
from sqlalchemy.orm import Session

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Item, Like
from app.models.search_log import SearchLog
from app.schemas.analytics import (
    AnalyticsOverview,
    ItemsByType,
    SearchesBySource,
    SearchTotals,
    TopSearchQuery,
    TopViewedItem,
)
from app.schemas.like import (
    LikeTotals,
    TopLikedItem,
    LikesOverTime,
    LikeAnalytics,
)
from app.schemas.base import APIResponse

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


def get_search_totals(db: Session) -> SearchTotals:
    """Get total search counts for different time periods."""
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # Total searches in last 7 days
    last_7_days = (
        db.query(func.count(SearchLog.id))
        .filter(SearchLog.created_at >= seven_days_ago)
        .scalar()
    ) or 0

    # Total searches in last 30 days
    last_30_days = (
        db.query(func.count(SearchLog.id))
        .filter(SearchLog.created_at >= thirty_days_ago)
        .scalar()
    ) or 0

    # Total searches all time
    all_time = db.query(func.count(SearchLog.id)).scalar() or 0

    return SearchTotals(
        last_7_days=last_7_days,
        last_30_days=last_30_days,
        all_time=all_time,
    )


def get_top_search_queries(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    limit: int = 10,
) -> list[TopSearchQuery]:
    """Get top search queries with counts and average result counts."""
    query = db.query(
        SearchLog.query,
        func.count(SearchLog.id).label("count"),
        func.avg(SearchLog.result_count).label("avg_result_count"),
    )

    # Apply date filters if provided
    if start_date:
        query = query.filter(SearchLog.created_at >= start_date)
    if end_date:
        query = query.filter(SearchLog.created_at <= end_date)

    # Group by query, order by count, limit to top N
    results = (
        query.filter(SearchLog.query != "")  # Exclude empty queries
        .group_by(SearchLog.query)
        .order_by(func.count(SearchLog.id).desc())
        .limit(limit)
        .all()
    )

    return [
        TopSearchQuery(
            query=row[0],
            count=row[1],
            avg_result_count=round(float(row[2]), 2),
        )
        for row in results
    ]


def get_searches_by_source(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> list[SearchesBySource]:
    """Get search counts grouped by source."""
    query = db.query(
        SearchLog.source,
        func.count(SearchLog.id).label("count"),
    )

    # Apply date filters if provided
    if start_date:
        query = query.filter(SearchLog.created_at >= start_date)
    if end_date:
        query = query.filter(SearchLog.created_at <= end_date)

    results = query.group_by(SearchLog.source).order_by(func.count(SearchLog.id).desc()).all()

    return [SearchesBySource(source=row[0], count=row[1]) for row in results]


def get_items_by_type(db: Session) -> list[ItemsByType]:
    """Get total items grouped by type."""
    results = (
        db.query(Item.type, func.count(Item.id).label("count"))
        .group_by(Item.type)
        .order_by(func.count(Item.id).desc())
        .all()
    )

    return [ItemsByType(type=row[0], count=row[1]) for row in results]


def get_top_viewed_items(db: Session, limit: int = 10) -> list[TopViewedItem]:
    """Get top viewed items."""
    results = (
        db.query(Item.id, Item.title, Item.type, Item.view_count)
        .order_by(Item.view_count.desc())
        .limit(limit)
        .all()
    )

    return [
        TopViewedItem(
            id=row[0],
            title=row[1],
            type=row[2],
            view_count=row[3],
        )
        for row in results
    ]


@router.get("/searches", response_model=APIResponse[AnalyticsOverview])
def get_search_analytics(
    start_date: Optional[datetime] = Query(
        default=None, description="Start date for filtering (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        default=None, description="End date for filtering (ISO format)"
    ),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[AnalyticsOverview]:
    """
    Get comprehensive search analytics data.

    Returns:
    - Total searches (last 7 days, last 30 days, all time)
    - Top 10 search queries with result counts
    - Searches by source
    - Total items by type
    - Top 10 most viewed items
    """
    overview = AnalyticsOverview(
        search_totals=get_search_totals(db),
        top_searches=get_top_search_queries(db, start_date, end_date),
        searches_by_source=get_searches_by_source(db, start_date, end_date),
        items_by_type=get_items_by_type(db),
        top_viewed_items=get_top_viewed_items(db),
    )

    return APIResponse(success=True, data=overview)


@router.get("/searches/totals", response_model=APIResponse[SearchTotals])
def get_search_totals_endpoint(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[SearchTotals]:
    """Get total search counts for different time periods."""
    return APIResponse(success=True, data=get_search_totals(db))


@router.get("/searches/top", response_model=APIResponse[list[TopSearchQuery]])
def get_top_searches_endpoint(
    start_date: Optional[datetime] = Query(
        default=None, description="Start date for filtering (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        default=None, description="End date for filtering (ISO format)"
    ),
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[list[TopSearchQuery]]:
    """Get top search queries with counts and average result counts."""
    return APIResponse(
        success=True,
        data=get_top_search_queries(db, start_date, end_date, limit),
    )


@router.get("/searches/by-source", response_model=APIResponse[list[SearchesBySource]])
def get_searches_by_source_endpoint(
    start_date: Optional[datetime] = Query(
        default=None, description="Start date for filtering (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        default=None, description="End date for filtering (ISO format)"
    ),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[list[SearchesBySource]]:
    """Get search counts grouped by source."""
    return APIResponse(
        success=True,
        data=get_searches_by_source(db, start_date, end_date),
    )


@router.get("/items/by-type", response_model=APIResponse[list[ItemsByType]])
def get_items_by_type_endpoint(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[list[ItemsByType]]:
    """Get total items grouped by type."""
    return APIResponse(success=True, data=get_items_by_type(db))


@router.get("/items/top-viewed", response_model=APIResponse[list[TopViewedItem]])
def get_top_viewed_items_endpoint(
    limit: int = Query(default=10, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[list[TopViewedItem]]:
    """Get top viewed items."""
    return APIResponse(success=True, data=get_top_viewed_items(db, limit))


def get_like_totals(db: Session) -> LikeTotals:
    """Get total like counts for different time periods."""
    now = datetime.utcnow()
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)

    # Total likes in last 7 days
    last_7_days = (
        db.query(func.count(Like.id))
        .filter(Like.created_at >= seven_days_ago)
        .scalar()
    ) or 0

    # Total likes in last 30 days
    last_30_days = (
        db.query(func.count(Like.id))
        .filter(Like.created_at >= thirty_days_ago)
        .scalar()
    ) or 0

    # Total likes all time
    total_likes = db.query(func.count(Like.id)).scalar() or 0

    return LikeTotals(
        total_likes=total_likes,
        last_7_days=last_7_days,
        last_30_days=last_30_days,
    )


def get_top_liked_items(db: Session, limit: int = 10) -> list[TopLikedItem]:
    """Get top liked items."""
    results = (
        db.query(
            Item.id,
            Item.title,
            Item.type,
            func.count(Like.id).label("like_count"),
        )
        .join(Like, Like.item_id == Item.id)
        .group_by(Item.id, Item.title, Item.type)
        .order_by(func.count(Like.id).desc())
        .limit(limit)
        .all()
    )

    return [
        TopLikedItem(
            id=row[0],
            title=row[1],
            type=row[2],
            like_count=row[3],
        )
        for row in results
    ]


def get_likes_over_time(
    db: Session,
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
) -> list[LikesOverTime]:
    """Get likes per day over a time period."""
    # Default to last 30 days if no date range provided
    if not end_date:
        end_date = datetime.utcnow()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    # SQLite uses date() function for date extraction
    results = (
        db.query(
            func.date(Like.created_at).label("date"),
            func.count(Like.id).label("count"),
        )
        .filter(Like.created_at >= start_date, Like.created_at <= end_date)
        .group_by(func.date(Like.created_at))
        .order_by(func.date(Like.created_at))
        .all()
    )

    return [
        LikesOverTime(
            date=str(row[0]),
            count=row[1],
        )
        for row in results
    ]


@router.get("/likes", response_model=APIResponse[LikeAnalytics])
def get_like_analytics(
    start_date: Optional[datetime] = Query(
        default=None, description="Start date for filtering (ISO format)"
    ),
    end_date: Optional[datetime] = Query(
        default=None, description="End date for filtering (ISO format)"
    ),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[LikeAnalytics]:
    """
    Get comprehensive like analytics data.

    Returns:
    - Total likes (all time, last 7 days, last 30 days)
    - Top 10 most liked items
    - Likes over time
    """
    analytics = LikeAnalytics(
        totals=get_like_totals(db),
        top_liked_items=get_top_liked_items(db),
        likes_over_time=get_likes_over_time(db, start_date, end_date),
    )

    return APIResponse(success=True, data=analytics)
