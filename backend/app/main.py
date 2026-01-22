from fastapi import FastAPI
from sqlalchemy import text
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
    seed_router,
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
app.include_router(seed_router)

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

    # Create FTS5 virtual table for full-text search
    with engine.connect() as conn:
        # Create the FTS5 virtual table if it doesn't exist
        conn.execute(text("""
            CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
                title,
                description,
                content
            )
        """))

        # Check if FTS table is empty and items table has data
        fts_count = conn.execute(text("SELECT COUNT(*) FROM items_fts")).scalar()
        items_count = conn.execute(text("SELECT COUNT(*) FROM items")).scalar()

        # Populate FTS table if it's empty but items table has data
        if fts_count == 0 and items_count > 0:
            conn.execute(text("""
                INSERT INTO items_fts(rowid, title, description, content)
                SELECT id, title, description, content FROM items
            """))

        conn.commit()


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
