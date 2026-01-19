from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Tag
from app.schemas import APIResponse, TagCreate, TagResponse

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=APIResponse[list[TagResponse]])
def list_tags(
    db: Session = Depends(get_db),
) -> APIResponse[list[TagResponse]]:
    """List all tags."""
    tags = db.query(Tag).order_by(Tag.name).all()

    return APIResponse(
        success=True,
        data=[TagResponse.model_validate(tag) for tag in tags],
    )


@router.post("", response_model=APIResponse[TagResponse], status_code=201)
def create_tag(
    tag_data: TagCreate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[TagResponse]:
    """Create a new tag (admin only)."""
    tag = Tag(name=tag_data.name)

    try:
        db.add(tag)
        db.commit()
        db.refresh(tag)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    return APIResponse(
        success=True,
        data=TagResponse.model_validate(tag),
    )
