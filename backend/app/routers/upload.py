"""Image upload router for admin file uploads."""

import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from app.core.auth import verify_admin_token
from app.core.config import settings

router = APIRouter(prefix="/api/upload", tags=["upload"])

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
}

EXTENSION_MAP: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
}

MAX_FILE_SIZE = 5 * 1024 * 1024  # 5MB


def get_upload_dir() -> str:
    """Get the upload directory path, creating it if necessary."""
    # Use data directory relative to the app root
    upload_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "images")
    os.makedirs(upload_dir, exist_ok=True)
    return upload_dir


@router.post("/image")
async def upload_image(
    file: UploadFile = File(...),
    _: str = Depends(verify_admin_token),
) -> dict[str, str]:
    """Upload an image file (admin only).

    Accepts JPEG, PNG, WebP, and GIF files up to 5MB.
    Returns the URL path to the uploaded image.
    """
    # Validate content type
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type: {file.content_type}. Allowed types: JPEG, PNG, WebP, GIF",
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size is 5MB, got {len(content) / (1024*1024):.1f}MB",
        )

    # Generate unique filename
    ext = EXTENSION_MAP.get(file.content_type, ".bin")
    filename = f"{uuid.uuid4().hex}{ext}"

    # Save file
    upload_dir = get_upload_dir()
    file_path = os.path.join(upload_dir, filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Return the URL path
    image_url = f"/uploads/images/{filename}"

    return {"url": image_url}
