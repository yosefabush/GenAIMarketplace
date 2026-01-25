from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from sqlalchemy import func

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import ItemType, Item
from app.schemas import (
    APIResponse,
    ItemTypeCreate,
    ItemTypeUpdate,
    ItemTypeResponse,
    ItemTypeWithItemCount,
)


router = APIRouter(prefix="/api/item-types", tags=["item-types"])


@router.get("", response_model=APIResponse[list[ItemTypeWithItemCount]])
def list_item_types(
    db: Session = Depends(get_db),
) -> APIResponse[list[ItemTypeWithItemCount]]:
    """List all item types with item counts."""
    # Single query with LEFT JOIN and GROUP BY to get item counts
    query = (
        db.query(
            ItemType,
            func.count(Item.id).label("item_count"),
        )
        .outerjoin(Item, Item.type_id == ItemType.id)
        .group_by(ItemType.id)
        .order_by(ItemType.name)
    )

    result = []
    for item_type, item_count in query.all():
        type_dict = {
            "id": item_type.id,
            "name": item_type.name,
            "slug": item_type.slug,
            "description": item_type.description,
            "icon": item_type.icon,
            "color": item_type.color,
            "created_at": item_type.created_at,
            "updated_at": item_type.updated_at,
            "item_count": item_count,
        }
        result.append(ItemTypeWithItemCount.model_validate(type_dict))

    return APIResponse(
        success=True,
        data=result,
    )


@router.get("/{item_type_id}", response_model=APIResponse[ItemTypeWithItemCount])
def get_item_type(
    item_type_id: int,
    db: Session = Depends(get_db),
) -> APIResponse[ItemTypeWithItemCount]:
    """Get a single item type by ID with item count."""
    query = (
        db.query(
            ItemType,
            func.count(Item.id).label("item_count"),
        )
        .outerjoin(Item, Item.type_id == ItemType.id)
        .filter(ItemType.id == item_type_id)
        .group_by(ItemType.id)
    )

    result = query.first()
    if not result:
        raise HTTPException(status_code=404, detail="Item type not found")

    item_type, item_count = result
    type_dict = {
        "id": item_type.id,
        "name": item_type.name,
        "slug": item_type.slug,
        "description": item_type.description,
        "icon": item_type.icon,
        "color": item_type.color,
        "created_at": item_type.created_at,
        "updated_at": item_type.updated_at,
        "item_count": item_count,
    }

    return APIResponse(
        success=True,
        data=ItemTypeWithItemCount.model_validate(type_dict),
    )


@router.post("", response_model=APIResponse[ItemTypeResponse], status_code=201)
def create_item_type(
    item_type_data: ItemTypeCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[ItemTypeResponse]:
    """Create a new item type (admin only)."""
    item_type = ItemType(
        name=item_type_data.name,
        slug=item_type_data.slug,
        description=item_type_data.description,
        icon=item_type_data.icon,
        color=item_type_data.color,
    )

    try:
        db.add(item_type)
        db.commit()
        db.refresh(item_type)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Item type with this slug already exists")

    return APIResponse(
        success=True,
        data=ItemTypeResponse.model_validate(item_type),
    )


@router.put("/{item_type_id}", response_model=APIResponse[ItemTypeResponse])
def update_item_type(
    item_type_id: int,
    item_type_data: ItemTypeUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[ItemTypeResponse]:
    """Update an item type (admin only)."""
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(status_code=404, detail="Item type not found")

    # Update fields
    if item_type_data.name is not None:
        item_type.name = item_type_data.name
    if item_type_data.slug is not None:
        item_type.slug = item_type_data.slug
    if item_type_data.description is not None:
        item_type.description = item_type_data.description
    if item_type_data.icon is not None:
        item_type.icon = item_type_data.icon
    if item_type_data.color is not None:
        item_type.color = item_type_data.color

    try:
        db.commit()
        db.refresh(item_type)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Item type with this slug already exists")

    return APIResponse(
        success=True,
        data=ItemTypeResponse.model_validate(item_type),
    )


@router.delete("/{item_type_id}", response_model=APIResponse[dict])
def delete_item_type(
    item_type_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[dict]:
    """Delete an item type and all related items (admin only)."""
    item_type = db.query(ItemType).filter(ItemType.id == item_type_id).first()
    if not item_type:
        raise HTTPException(status_code=404, detail="Item type not found")

    # Delete all items that use this type
    deleted_items_count = db.query(Item).filter(Item.type_id == item_type_id).delete()

    # Delete the item type
    db.delete(item_type)
    db.commit()

    return APIResponse(
        success=True,
        data={"deleted_items_count": deleted_items_count},
    )
