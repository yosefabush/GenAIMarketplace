"""Authentication router for admin token validation."""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.config import settings

router = APIRouter(prefix="/api/auth", tags=["auth"])


class TokenValidationRequest(BaseModel):
    """Request body for token validation."""

    token: str


class TokenValidationResponse(BaseModel):
    """Response body for token validation."""

    success: bool
    valid: bool
    message: str


@router.post("/validate", response_model=TokenValidationResponse)
async def validate_token(request: TokenValidationRequest) -> TokenValidationResponse:
    """Validate an admin token.

    This endpoint allows the frontend to verify if a token is valid
    before storing it and using it for subsequent admin requests.
    """
    if request.token == settings.ADMIN_TOKEN:
        return TokenValidationResponse(
            success=True,
            valid=True,
            message="Token is valid",
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid admin token",
        )
