"""Search API router with filtering, sorting, and pagination."""

from typing import Literal
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case, or_

from app.core.database import get_db
from app.models import Item, Tag
from app.schemas import ItemListResponse
from app.schemas.search import SearchResponse
from app.services.search import SearchService
from app.services.search_logging import SearchLoggingService

router = APIRouter(prefix="/api/search", tags=["search"])


@router.get("", response_model=SearchResponse[ItemListResponse])
def search(
    q: str = Query(default="", description="Search query"),
    type: str | None = Query(
        default=None,
        description="Filter by type (comma-separated, e.g., 'agent,prompt')",
    ),
    category: str | None = Query(
        default=None,
        description="Filter by category IDs (comma-separated)",
    ),
    tags: str | None = Query(
        default=None,
        description="Filter by tag names (comma-separated, e.g., 'python,testing')",
    ),
    sort: Literal["relevance", "date", "views"] = Query(
        default="relevance",
        description="Sort order: relevance (default), date, views",
    ),
    page: int = Query(default=1, ge=1, description="Page number (1-indexed)"),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db),
) -> SearchResponse[ItemListResponse]:
    """
    Search items with filtering, sorting, and pagination.

    - Empty query returns all items
    - Multiple keywords in query are searched with AND logic
    - Filters can be combined (AND logic between filters)
    - Relevance sorting only works with non-empty query
    """
    offset = (page - 1) * limit

    # Parse filter values
    type_filters: list[str] = []
    if type:
        type_filters = [t.strip() for t in type.split(",") if t.strip()]

    category_filters: list[int] = []
    if category:
        for c in category.split(","):
            c = c.strip()
            if c.isdigit():
                category_filters.append(int(c))

    tag_filters: list[str] = []
    if tags:
        tag_filters = [t.strip().lower() for t in tags.split(",") if t.strip()]

    # Determine if we're doing FTS search or just listing
    has_query = bool(q and q.strip())

    if has_query and sort == "relevance":
        # Use FTS5 search with relevance ranking
        # First get matching item IDs with total count (without filters for count)
        item_ids, fts_total = SearchService.search(db, q)

        if not item_ids:
            # Log failed search with 0 results
            SearchLoggingService.log_search(query=q, result_count=0, source="web")
            return SearchResponse(
                success=True,
                data=[],
                total=0,
                page=page,
                limit=limit,
            )

        # Build query for items in the result set
        query = (
            db.query(Item)
            .options(joinedload(Item.category), joinedload(Item.tags))
            .filter(Item.id.in_(item_ids))
        )

        # Apply filters
        if type_filters:
            query = query.filter(Item.type.in_(type_filters))

        if category_filters:
            query = query.filter(Item.category_id.in_(category_filters))

        if tag_filters:
            # Find tag IDs by name (case-insensitive using OR with ILIKE)
            tag_conditions = [Tag.name.ilike(f"%{t}%") for t in tag_filters]
            tag_objs = db.query(Tag).filter(or_(*tag_conditions)).all()
            if tag_objs:
                tag_ids = [t.id for t in tag_objs]
                query = query.filter(Item.tags.any(Tag.id.in_(tag_ids)))
            else:
                # No matching tags found, log and return empty results
                SearchLoggingService.log_search(query=q, result_count=0, source="web")
                return SearchResponse(
                    success=True,
                    data=[],
                    total=0,
                    page=page,
                    limit=limit,
                )

        # Get total after filters
        total = query.count()

        # Maintain FTS relevance order using CASE expression
        # Create ordering based on position in item_ids list
        order_cases = case(
            {item_id: idx for idx, item_id in enumerate(item_ids)},
            value=Item.id,
        )

        items = query.order_by(order_cases).offset(offset).limit(limit).all()

    else:
        # No query or non-relevance sort - query all items
        query = db.query(Item).options(
            joinedload(Item.category), joinedload(Item.tags)
        )

        # Apply text search filter if query exists (for non-relevance sorts)
        if has_query:
            item_ids, _ = SearchService.search(db, q)
            if item_ids:
                query = query.filter(Item.id.in_(item_ids))
            else:
                # Log failed search with 0 results
                SearchLoggingService.log_search(query=q, result_count=0, source="web")
                return SearchResponse(
                    success=True,
                    data=[],
                    total=0,
                    page=page,
                    limit=limit,
                )

        # Apply filters
        if type_filters:
            query = query.filter(Item.type.in_(type_filters))

        if category_filters:
            query = query.filter(Item.category_id.in_(category_filters))

        if tag_filters:
            # Find tag IDs by name (case-insensitive using OR with ILIKE)
            # Use database-level filtering instead of loading all tags into memory
            tag_conditions = [Tag.name.ilike(f"%{t}%") for t in tag_filters]
            tag_objs = db.query(Tag).filter(or_(*tag_conditions)).all()
            if tag_objs:
                tag_ids = [t.id for t in tag_objs]
                query = query.filter(Item.tags.any(Tag.id.in_(tag_ids)))
            else:
                # Log search with 0 results due to tag filter
                SearchLoggingService.log_search(
                    query=q if q else "", result_count=0, source="web"
                )
                return SearchResponse(
                    success=True,
                    data=[],
                    total=0,
                    page=page,
                    limit=limit,
                )

        # Get total count
        total = query.count()

        # Apply sorting
        if sort == "date":
            query = query.order_by(Item.created_at.desc())
        elif sort == "views":
            query = query.order_by(Item.view_count.desc())
        else:
            # Default to date for empty query
            query = query.order_by(Item.created_at.desc())

        items = query.offset(offset).limit(limit).all()

    # Log the search query asynchronously
    # Log even empty queries to track usage patterns
    SearchLoggingService.log_search(
        query=q if q else "",
        result_count=total,
        source="web",
    )

    return SearchResponse(
        success=True,
        data=[ItemListResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        limit=limit,
    )
