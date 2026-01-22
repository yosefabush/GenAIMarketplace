from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine
from app.core.caching import CacheMiddleware
from app.models.base import Base
from app.routers import (
    items_router,
    categories_router,
    tags_router,
    search_router,
    auth_router,
    analytics_router,
    recommendations_router,
)
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="GenAI Marketplace",
    description="Internal AI capabilities platform for developers",
    version="0.1.0",
)

# Register routers
app.include_router(items_router)
app.include_router(categories_router)
app.include_router(tags_router)
app.include_router(search_router)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(recommendations_router)

# Add caching middleware (must be before CORS middleware to properly modify responses)
app.add_middleware(CacheMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event() -> None:
    """Create database tables on startup if they don't exist."""
    Base.metadata.create_all(bind=engine)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
