from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Category
from app.schemas import APIResponse, CategoryCreate, CategoryResponse

router = APIRouter(prefix="/api/categories", tags=["categories"])


@router.get("", response_model=APIResponse[list[CategoryResponse]])
def list_categories(
    db: Session = Depends(get_db),
) -> APIResponse[list[CategoryResponse]]:
    """List all categories."""
    categories = db.query(Category).order_by(Category.name).all()

    return APIResponse(
        success=True,
        data=[CategoryResponse.model_validate(cat) for cat in categories],
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
