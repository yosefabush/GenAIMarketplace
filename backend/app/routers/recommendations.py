from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Item, Tag, Recommendation
from app.schemas import (
    APIResponse,
    RecommendationCreate,
    RecommendationUpdate,
    RecommendationResponse,
    RecommendationListResponse,
    RecommendationApprovalRequest,
    RecommendationRejectionRequest,
    ItemResponse,
)
from app.services.email import EmailService


router = APIRouter(prefix="/api/recommendations", tags=["recommendations"])


def _recommendation_to_response(rec: Recommendation) -> RecommendationResponse:
    """Convert a Recommendation model to response format."""
    return RecommendationResponse(
        id=rec.id,
        title=rec.title,
        description=rec.description,
        type=rec.type,
        category_id=rec.category_id,
        category_name=rec.category.name if rec.category else None,
        submitter_email=rec.submitter_email,
        reason=rec.reason,
        status=rec.status,
        admin_notes=rec.admin_notes,
        created_at=rec.created_at,
        updated_at=rec.updated_at,
    )


@router.post("", response_model=APIResponse[RecommendationResponse], status_code=201)
def create_recommendation(
    rec_data: RecommendationCreate,
    db: Session = Depends(get_db),
) -> APIResponse[RecommendationResponse]:
    """Submit a new item recommendation. No authentication required."""
    # Validate type
    valid_types = ["agent", "prompt", "mcp", "workflow", "docs"]
    if rec_data.type not in valid_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid type. Must be one of: {', '.join(valid_types)}",
        )

    # Create recommendation
    recommendation = Recommendation(
        title=rec_data.title,
        description=rec_data.description,
        type=rec_data.type,
        category_id=rec_data.category_id,
        submitter_email=rec_data.submitter_email,
        reason=rec_data.reason,
        status="pending",
    )
    db.add(recommendation)
    db.commit()
    db.refresh(recommendation)

    # Reload with category relationship
    reloaded = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.category))
        .filter(Recommendation.id == recommendation.id)
        .first()
    )
    assert reloaded is not None

    # Send email notification to admin
    EmailService.send_admin_notification(reloaded)

    return APIResponse(
        success=True,
        data=_recommendation_to_response(reloaded),
    )


@router.get("", response_model=APIResponse[RecommendationListResponse])
def list_recommendations(
    status: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[RecommendationListResponse]:
    """List all recommendations with optional status filter (admin only)."""
    query = db.query(Recommendation).options(joinedload(Recommendation.category))

    # Apply status filter if provided
    if status:
        valid_statuses = ["pending", "approved", "rejected"]
        if status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
            )
        query = query.filter(Recommendation.status == status)

    # Get total count
    total = query.count()

    # Apply pagination
    offset = (page - 1) * limit
    recommendations = (
        query.order_by(Recommendation.created_at.desc()).offset(offset).limit(limit).all()
    )

    return APIResponse(
        success=True,
        data=RecommendationListResponse(
            items=[_recommendation_to_response(rec) for rec in recommendations],
            total=total,
            page=page,
            limit=limit,
        ),
    )


@router.get("/{rec_id}", response_model=APIResponse[RecommendationResponse])
def get_recommendation(
    rec_id: int,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[RecommendationResponse]:
    """Get a single recommendation by ID (admin only)."""
    recommendation = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.category))
        .filter(Recommendation.id == rec_id)
        .first()
    )

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    return APIResponse(
        success=True,
        data=_recommendation_to_response(recommendation),
    )


@router.put("/{rec_id}", response_model=APIResponse[RecommendationResponse])
def update_recommendation(
    rec_id: int,
    update_data: RecommendationUpdate,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[RecommendationResponse]:
    """Update a recommendation's status or admin notes (admin only)."""
    recommendation = db.query(Recommendation).filter(Recommendation.id == rec_id).first()

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    # Validate status if provided
    if update_data.status is not None:
        valid_statuses = ["pending", "approved", "rejected"]
        if update_data.status not in valid_statuses:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: {', '.join(valid_statuses)}",
            )
        recommendation.status = update_data.status

    if update_data.admin_notes is not None:
        recommendation.admin_notes = update_data.admin_notes

    db.commit()
    db.refresh(recommendation)

    # Reload with category relationship
    reloaded = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.category))
        .filter(Recommendation.id == recommendation.id)
        .first()
    )
    assert reloaded is not None

    return APIResponse(
        success=True,
        data=_recommendation_to_response(reloaded),
    )


@router.post("/{rec_id}/approve", response_model=APIResponse[ItemResponse])
def approve_recommendation(
    rec_id: int,
    approval_data: RecommendationApprovalRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[ItemResponse]:
    """Approve a recommendation and create a new item from it (admin only)."""
    recommendation = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.category))
        .filter(Recommendation.id == rec_id)
        .first()
    )

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    if recommendation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Recommendation is already {recommendation.status}",
        )

    # Fetch tags if provided
    tags = []
    if approval_data.tag_ids:
        tags = db.query(Tag).filter(Tag.id.in_(approval_data.tag_ids)).all()
        if len(tags) != len(approval_data.tag_ids):
            raise HTTPException(status_code=400, detail="One or more tag IDs not found")

    # Create the item from the recommendation
    item = Item(
        title=recommendation.title,
        description=recommendation.description,
        content=approval_data.content,
        type=recommendation.type,
        category_id=recommendation.category_id,
        tags=tags,
    )
    db.add(item)

    # Update recommendation status
    recommendation.status = "approved"
    if approval_data.admin_notes:
        recommendation.admin_notes = approval_data.admin_notes

    db.commit()
    db.refresh(item)

    # Send approval email to submitter
    EmailService.send_approval_notification(recommendation, item)

    # Reload item with relationships
    reloaded_item = (
        db.query(Item)
        .options(joinedload(Item.category), joinedload(Item.tags))
        .filter(Item.id == item.id)
        .first()
    )
    assert reloaded_item is not None

    return APIResponse(
        success=True,
        data=ItemResponse.model_validate(
            {
                "id": reloaded_item.id,
                "title": reloaded_item.title,
                "description": reloaded_item.description,
                "content": reloaded_item.content,
                "type": reloaded_item.type,
                "category_id": reloaded_item.category_id,
                "category": reloaded_item.category,
                "tags": reloaded_item.tags,
                "view_count": reloaded_item.view_count,
                "like_count": 0,
                "created_at": reloaded_item.created_at,
                "updated_at": reloaded_item.updated_at,
            }
        ),
    )


@router.post("/{rec_id}/reject", response_model=APIResponse[RecommendationResponse])
def reject_recommendation(
    rec_id: int,
    rejection_data: RecommendationRejectionRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> APIResponse[RecommendationResponse]:
    """Reject a recommendation with a reason (admin only)."""
    recommendation = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.category))
        .filter(Recommendation.id == rec_id)
        .first()
    )

    if not recommendation:
        raise HTTPException(status_code=404, detail="Recommendation not found")

    if recommendation.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Recommendation is already {recommendation.status}",
        )

    # Update recommendation status and notes
    recommendation.status = "rejected"
    recommendation.admin_notes = rejection_data.admin_notes

    db.commit()
    db.refresh(recommendation)

    # Send rejection email to submitter
    EmailService.send_rejection_notification(recommendation)

    # Reload with category relationship
    reloaded = (
        db.query(Recommendation)
        .options(joinedload(Recommendation.category))
        .filter(Recommendation.id == recommendation.id)
        .first()
    )
    assert reloaded is not None

    return APIResponse(
        success=True,
        data=_recommendation_to_response(reloaded),
    )
