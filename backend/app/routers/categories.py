from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Category
from app.schemas import APIResponse, CategoryResponse

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
