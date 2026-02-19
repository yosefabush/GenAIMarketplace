import logging
import os

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
from app.core.database import engine
from app.core.caching import CacheMiddleware
# Import all models to ensure they are registered with Base metadata before create_all()
from app.models import Base, Item, Category, Tag, ItemType, SearchLog, Like, Recommendation
from app.routers import (
    items_router,
    categories_router,
    tags_router,
    item_types_router,
    search_router,
    auth_router,
    analytics_router,
    recommendations_router,
    seed_router,
    upload_router,
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
app.include_router(item_types_router)
app.include_router(search_router)
app.include_router(auth_router)
app.include_router(analytics_router)
app.include_router(recommendations_router)
app.include_router(seed_router)
app.include_router(upload_router)

# Mount static files for uploaded images
uploads_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(os.path.join(uploads_dir, "images"), exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

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
                    content,
                    content='items',
                    content_rowid='id'
                )
            """))

            # Recreate FTS sync triggers (may be lost after batch_alter_table operations)
            conn.execute(text("DROP TRIGGER IF EXISTS items_fts_insert"))
            conn.execute(text("DROP TRIGGER IF EXISTS items_fts_update"))
            conn.execute(text("DROP TRIGGER IF EXISTS items_fts_delete"))

            conn.execute(text("""
                CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
                    INSERT INTO items_fts(rowid, title, description, content)
                    VALUES (NEW.id, NEW.title, NEW.description, NEW.content);
                END
            """))
            conn.execute(text("""
                CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
                    INSERT INTO items_fts(items_fts, rowid, title, description, content)
                    VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.content);
                    INSERT INTO items_fts(rowid, title, description, content)
                    VALUES (NEW.id, NEW.title, NEW.description, NEW.content);
                END
            """))
            conn.execute(text("""
                CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
                    INSERT INTO items_fts(items_fts, rowid, title, description, content)
                    VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.content);
                END
            """))

            # Always rebuild FTS index to ensure it's in sync
            items_count = conn.execute(text("SELECT COUNT(*) FROM items")).scalar()
            if items_count and items_count > 0:
                conn.execute(text("INSERT INTO items_fts(items_fts) VALUES('rebuild')"))

            conn.commit()


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=settings.PORT)
