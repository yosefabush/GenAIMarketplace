from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Item, Tag
from app.schemas import (
    APIResponse,
    PaginatedResponse,
    ItemCreate,
    ItemUpdate,
    ItemResponse,
    ItemListResponse,
)

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


@router.post("", response_model=APIResponse[ItemResponse], status_code=201)
def create_item(
    item_data: ItemCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[ItemResponse]:
    """Create a new item (admin only)."""
    # Fetch tags if provided
    tags = []
    if item_data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(item_data.tag_ids)).all()
        if len(tags) != len(item_data.tag_ids):
            raise HTTPException(status_code=400, detail="One or more tag IDs not found")

    # Create item
    item = Item(
        title=item_data.title,
        description=item_data.description,
        content=item_data.content,
        type=item_data.type,
        category_id=item_data.category_id,
        tags=tags,
    )
    db.add(item)
    db.commit()
    db.refresh(item)

    # Reload with relationships
    reloaded_item = (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.tags))
        .filter(Item.id == item.id)
        .first()
    )
    assert reloaded_item is not None  # Item was just created

    return APIResponse(
        success=True,
        data=ItemResponse.model_validate(reloaded_item),
    )


@router.put("/{item_id}", response_model=APIResponse[ItemResponse])
def update_item(
    item_id: int,
    item_data: ItemUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[ItemResponse]:
    """Update an existing item (admin only)."""
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Update fields if provided
    if item_data.title is not None:
        item.title = item_data.title
    if item_data.description is not None:
        item.description = item_data.description
    if item_data.content is not None:
        item.content = item_data.content
    if item_data.type is not None:
        item.type = item_data.type
    if item_data.category_id is not None:
        item.category_id = item_data.category_id
    if item_data.tag_ids is not None:
        tags = db.query(Tag).filter(Tag.id.in_(item_data.tag_ids)).all()
        if len(tags) != len(item_data.tag_ids):
            raise HTTPException(status_code=400, detail="One or more tag IDs not found")
        item.tags = tags

    db.commit()
    db.refresh(item)

    # Reload with relationships
    reloaded_item = (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.tags))
        .filter(Item.id == item.id)
        .first()
    )
    assert reloaded_item is not None  # Item was just updated

    return APIResponse(
        success=True,
        data=ItemResponse.model_validate(reloaded_item),
    )


@router.delete("/{item_id}", response_model=APIResponse[None])
def delete_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[None]:
    """Delete an item (admin only)."""
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    db.delete(item)
    db.commit()

    return APIResponse(
        success=True,
        data=None,
    )
