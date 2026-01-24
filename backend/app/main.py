import logging

from fastapi import FastAPI
from sqlalchemy import text
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
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
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event() -> None:
    """Create database tables on startup if they don't exist."""
    Base.metadata.create_all(bind=engine)

    # Initialize search index based on database type
    with engine.connect() as conn:
        if settings.is_postgres():
            # PostgreSQL: search_vector is handled via migration 006
            # Just ensure data is indexed if column exists but is empty
            try:
                empty_count = conn.execute(text(
                    "SELECT COUNT(*) FROM items WHERE search_vector IS NULL"
                )).scalar()
                if empty_count and empty_count > 0:
                    conn.execute(text("""
                        UPDATE items
                        SET search_vector = to_tsvector('english',
                            coalesce(title, '') || ' ' ||
                            coalesce(description, '') || ' ' ||
                            coalesce(content, '')
                        )
                        WHERE search_vector IS NULL
                    """))
                    conn.commit()
            except Exception:
                # Column may not exist yet (migrations not run)
                pass
        else:
            # SQLite: Create FTS5 virtual table for full-text search
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
