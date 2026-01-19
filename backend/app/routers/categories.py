from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from pydantic import BaseModel, Field

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Category, Item
from app.schemas import APIResponse, CategoryCreate, CategoryResponse


class CategoryUpdate(BaseModel):
    """Schema for updating a category."""

    name: str | None = Field(None, min_length=1, max_length=100)
    slug: str | None = Field(None, min_length=1, max_length=100, pattern="^[a-z0-9-]+$")
    parent_id: int | None = None


class CategoryWithItemCount(CategoryResponse):
    """Category response with item count."""

    item_count: int


router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=APIResponse[list[CategoryWithItemCount]])
def list_categories(
    db: Session = Depends(get_db),
) -> APIResponse[list[CategoryWithItemCount]]:
    """List all categories with item counts."""
    categories = db.query(Category).order_by(Category.name).all()

    # Get item counts for each category
    result = []
    for cat in categories:
        item_count = db.query(Item).filter(Item.category_id == cat.id).count()
        cat_dict = {
            "id": cat.id,
            "name": cat.name,
            "slug": cat.slug,
            "parent_id": cat.parent_id,
            "created_at": cat.created_at,
            "updated_at": cat.updated_at,
            "item_count": item_count,
        }
        result.append(CategoryWithItemCount.model_validate(cat_dict))

    return APIResponse(
        success=True,
        data=result,
    )


@router.post("", response_model=APIResponse[CategoryResponse], status_code=201)
def create_category(
    category_data: CategoryCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[CategoryResponse]:
    """Create a new category (admin only)."""
    # Validate parent_id if provided
    if category_data.parent_id is not None:
        parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")

    category = Category(
        name=category_data.name,
        slug=category_data.slug,
        parent_id=category_data.parent_id,
    )

    try:
        db.add(category)
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category with this slug already exists")

    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category),
    )


@router.put("/{category_id}", response_model=APIResponse[CategoryResponse])
def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[CategoryResponse]:
    """Update a category (admin only)."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Validate parent_id if provided
    if category_data.parent_id is not None:
        if category_data.parent_id == category_id:
            raise HTTPException(status_code=400, detail="Category cannot be its own parent")
        parent = db.query(Category).filter(Category.id == category_data.parent_id).first()
        if not parent:
            raise HTTPException(status_code=400, detail="Parent category not found")

    # Update fields
    if category_data.name is not None:
        category.name = category_data.name
    if category_data.slug is not None:
        category.slug = category_data.slug
    if category_data.parent_id is not None:
        category.parent_id = category_data.parent_id

    try:
        db.commit()
        db.refresh(category)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Category with this slug already exists")

    return APIResponse(
        success=True,
        data=CategoryResponse.model_validate(category),
    )


@router.delete("/{category_id}", response_model=APIResponse[None])
def delete_category(
    category_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[None]:
    """Delete a category (admin only). Items using this category will have their category_id set to NULL."""
    category = db.query(Category).filter(Category.id == category_id).first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    db.delete(category)
    db.commit()

    return APIResponse(
        success=True,
        data=None,
    )
