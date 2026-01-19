from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.database import get_db
from app.models import Item
from app.schemas import APIResponse, PaginatedResponse, ItemResponse, ItemListResponse

router = APIRouter(prefix="/api/items", tags=["items"])


@router.get("", response_model=PaginatedResponse[ItemListResponse])
def list_items(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> PaginatedResponse[ItemListResponse]:
    """List all items with pagination."""
    # Get total count
    total = db.query(Item).count()

    # Get items with relationships
    items = (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.tags))
        .order_by(Item.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    return PaginatedResponse(
        success=True,
        data=[ItemListResponse.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{item_id}", response_model=APIResponse[ItemResponse])
def get_item(
    item_id: int,
    db: Session = Depends(get_db),
) -> APIResponse[ItemResponse]:
    """Get a single item by ID."""
    item = (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.tags))
        .filter(Item.id == item_id)
        .first()
    )

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    return APIResponse(
        success=True,
        data=ItemResponse.model_validate(item),
    )
