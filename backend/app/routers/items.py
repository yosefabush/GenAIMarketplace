from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session, joinedload

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Item, Tag
from app.models.item import item_tags
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


@router.post("/{item_id}/view", response_model=APIResponse[int])
def increment_view_count(
    item_id: int,
    db: Session = Depends(get_db),
) -> APIResponse[int]:
    """Increment the view count for an item."""
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    item.view_count += 1
    db.commit()
    db.refresh(item)

    return APIResponse(
        success=True,
        data=item.view_count,
    )


@router.get("/{item_id}/related", response_model=APIResponse[list[ItemListResponse]])
def get_related_items(
    item_id: int,
    limit: int = Query(default=5, ge=1, le=10),
    db: Session = Depends(get_db),
) -> APIResponse[list[ItemListResponse]]:
    """Get related items based on same category or shared tags."""
    # Get the source item with its relationships
    source_item = (
        db.query(Item)
        .options(joinedload(Item.tags))
        .filter(Item.id == item_id)
        .first()
    )

    if not source_item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Build conditions for related items
    conditions: list[Any] = []

    # Same category (if item has a category)
    if source_item.category_id:
        conditions.append(Item.category_id == source_item.category_id)

    # Shared tags (if item has tags)
    tag_ids = [tag.id for tag in source_item.tags]
    if tag_ids:
        # Find items that share at least one tag
        items_with_shared_tags = (
            db.query(item_tags.c.item_id)
            .filter(item_tags.c.tag_id.in_(tag_ids))
            .distinct()
        )
        conditions.append(Item.id.in_(items_with_shared_tags))

    # If no conditions (no category and no tags), return empty list
    if not conditions:
        return APIResponse(
            success=True,
            data=[],
        )

    # Query related items (excluding the source item)
    related_items = (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.tags))
        .filter(
            Item.id != item_id,
            or_(*conditions),
        )
        .order_by(Item.view_count.desc())  # Order by popularity
        .limit(limit)
        .all()
    )

    return APIResponse(
        success=True,
        data=[ItemListResponse.model_validate(item) for item in related_items],
    )
