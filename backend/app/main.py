from fastapi import FastAPI
from app.core.config import settings
from app.core.database import engine
from app.models.base import Base
from app.routers import items_router, categories_router, tags_router

app = FastAPI(
    title="GenAI Marketplace",
    description="Internal AI capabilities platform for developers",
    version="0.1.0",
)

# Register routers
app.include_router(items_router)
app.include_router(categories_router)
app.include_router(tags_router)


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
