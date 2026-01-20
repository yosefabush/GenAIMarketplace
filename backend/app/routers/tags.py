from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Tag
from app.models.item import item_tags
from app.schemas import APIResponse, TagCreate, TagUpdate, TagResponse, TagWithItemCount

router = APIRouter(prefix="/api/tags", tags=["tags"])


@router.get("", response_model=APIResponse[list[TagWithItemCount]])
def list_tags(
    db: Session = Depends(get_db),
) -> APIResponse[list[TagWithItemCount]]:
    """List all tags with item counts."""
    tags = db.query(Tag).order_by(Tag.name).all()

    # Get item counts for each tag
    result = []
    for tag in tags:
        item_count = db.query(item_tags).filter(item_tags.c.tag_id == tag.id).count()
        tag_dict = {
            "id": tag.id,
            "name": tag.name,
            "created_at": tag.created_at,
            "item_count": item_count,
        }
        result.append(TagWithItemCount.model_validate(tag_dict))

    return APIResponse(
        success=True,
        data=result,
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


@router.put("/{tag_id}", response_model=APIResponse[TagResponse])
def update_tag(
    tag_id: int,
    tag_data: TagUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[TagResponse]:
    """Update a tag (admin only)."""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag.name = tag_data.name

    try:
        db.commit()
        db.refresh(tag)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Tag with this name already exists")

    return APIResponse(
        success=True,
        data=TagResponse.model_validate(tag),
    )


@router.delete("/{tag_id}", response_model=APIResponse[None])
def delete_tag(
    tag_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[None]:
    """Delete a tag (admin only). Items using this tag will have it removed from their tags list."""
    tag = db.query(Tag).filter(Tag.id == tag_id).first()
    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    db.delete(tag)
    db.commit()

    return APIResponse(
        success=True,
        data=None,
    )
