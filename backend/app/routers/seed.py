"""Seed router for database initialization via API."""

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.auth import verify_admin_token
from app.core.database import get_db
from app.models import Category, Tag, Item, ItemType, item_tags

router = APIRouter(prefix="/api/admin", tags=["admin"])


# =============================================================================
# SEED DATA DEFINITIONS
# =============================================================================

CATEGORIES = [
    {"name": "Development Tools", "slug": "development-tools"},
    {"name": "Code Generation", "slug": "code-generation"},
    {"name": "Documentation", "slug": "documentation"},
    {"name": "Testing & QA", "slug": "testing-qa"},
    {"name": "DevOps & Infrastructure", "slug": "devops-infrastructure"},
    {"name": "Data & Analytics", "slug": "data-analytics"},
    {"name": "Security", "slug": "security"},
]

TAGS = [
    "python",
    "javascript",
    "typescript",
    "go",
    "rust",
    "api",
    "rest",
    "graphql",
    "database",
    "sql",
    "docker",
    "kubernetes",
    "ci-cd",
    "automation",
    "testing",
    "llm",
    "openai",
    "anthropic",
    "langchain",
    "rag",
    "documentation",
    "code-review",
    "refactoring",
    "debugging",
    "performance",
]


ITEM_TYPES = [
    {"name": "Agent", "slug": "agent", "description": "AI agents that can perform tasks autonomously", "icon": "Bot", "color": "blue"},
    {"name": "Prompt", "slug": "prompt", "description": "Reusable prompts for AI models", "icon": "MessageSquare", "color": "green"},
    {"name": "MCP", "slug": "mcp", "description": "Model Context Protocol servers and tools", "icon": "Plug", "color": "purple"},
    {"name": "Workflow", "slug": "workflow", "description": "Multi-step AI workflows and pipelines", "icon": "Workflow", "color": "orange"},
    {"name": "Docs", "slug": "docs", "description": "Documentation and guides", "icon": "FileText", "color": "teal"},
    {"name": "Skill", "slug": "skill", "description": "Reusable skills for AI assistants", "icon": "Zap", "color": "indigo"},
]


# =============================================================================
# RESPONSE MODELS
# =============================================================================


class SeedSummary(BaseModel):
    """Summary of seeding operation."""

    categories_created: int
    categories_existing: int
    tags_created: int
    tags_existing: int
    items_created: int
    items_skipped: int
    total_categories: int
    total_tags: int
    total_items: int
    items_by_type: dict[str, int]
    reset_performed: bool


class ResetSummary(BaseModel):
    """Summary of reset operation."""

    tables_cleared: list[str]
    success: bool
    message: str


# =============================================================================
# SEEDING FUNCTIONS
# =============================================================================


def get_seed_items() -> list[dict]:
    """Return all seed items (agents, prompts, MCPs, workflows, docs, skills)."""
    from scripts.seed_content import AGENTS, PROMPTS, MCPS, WORKFLOWS, DOCS, SKILLS

    items = []
    for agent in AGENTS:
        items.append({**agent, "type": "agent"})
    for prompt in PROMPTS:
        items.append({**prompt, "type": "prompt"})
    for mcp in MCPS:
        items.append({**mcp, "type": "mcp"})
    for workflow in WORKFLOWS:
        items.append({**workflow, "type": "workflow"})
    for doc in DOCS:
        items.append({**doc, "type": "docs"})
    for skill in SKILLS:
        items.append({**skill, "type": "skill"})
    return items


def seed_categories(db: Session) -> tuple[dict[str, int], int, int]:
    """Seed categories and return (name->id mapping, created count, existing count)."""
    category_map: dict[str, int] = {}
    created = 0
    existing = 0

    for cat_data in CATEGORIES:
        cat = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if cat:
            category_map[cat_data["name"]] = cat.id
            existing += 1
        else:
            category = Category(**cat_data)
            db.add(category)
            db.flush()
            category_map[cat_data["name"]] = category.id
            created += 1

    db.commit()
    return category_map, created, existing


def seed_tags(db: Session) -> tuple[dict[str, int], int, int]:
    """Seed tags and return (name->id mapping, created count, existing count)."""
    tag_map: dict[str, int] = {}
    created = 0
    existing = 0

    for tag_name in TAGS:
        tag = db.query(Tag).filter(Tag.name == tag_name).first()
        if tag:
            tag_map[tag_name] = tag.id
            existing += 1
        else:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.flush()
            tag_map[tag_name] = tag.id
            created += 1

    db.commit()
    return tag_map, created, existing


def seed_item_types(db: Session) -> tuple[int, int]:
    """Seed item types and return (created count, existing count)."""
    created = 0
    existing = 0

    for type_data in ITEM_TYPES:
        item_type = db.query(ItemType).filter(ItemType.slug == type_data["slug"]).first()
        if item_type:
            existing += 1
        else:
            item_type = ItemType(**type_data)
            db.add(item_type)
            created += 1

    db.commit()
    return created, existing


def seed_items(
    db: Session, category_map: dict[str, int], tag_map: dict[str, int]
) -> tuple[int, int]:
    """Seed items with categories, tags. Returns (created count, skipped count)."""
    items = get_seed_items()
    created_count = 0
    skipped_count = 0

    for item_data in items:
        existing = db.query(Item).filter(Item.title == item_data["title"]).first()
        if existing:
            skipped_count += 1
            continue

        category_name = item_data.get("category")
        category_id = category_map.get(str(category_name)) if category_name else None
        item = Item(
            title=str(item_data["title"]),
            description=str(item_data["description"]),
            content=str(item_data["content"]),
            type=str(item_data["type"]),
            category_id=category_id,
        )
        db.add(item)
        db.flush()

        for tag_name in item_data.get("tags", []):
            if tag_name in tag_map:
                db.execute(
                    item_tags.insert().values(item_id=item.id, tag_id=tag_map[tag_name])
                )
        created_count += 1

    db.commit()
    return created_count, skipped_count


def rebuild_fts_index(db: Session) -> None:
    """Rebuild the FTS5 index after seeding."""
    try:
        db.execute(text("DELETE FROM items_fts"))
        db.execute(
            text(
                """
            INSERT INTO items_fts(rowid, title, description, content)
            SELECT id, title, description, content FROM items
        """
            )
        )
        db.commit()
    except Exception:
        db.rollback()


def reset_database(db: Session) -> list[str]:
    """Clear all data from the database. Returns list of cleared tables."""
    tables_cleared = []

    # Clear in dependency order (most dependent first)
    db.execute(text("DELETE FROM likes"))
    tables_cleared.append("likes")

    db.execute(text("DELETE FROM item_tags"))
    tables_cleared.append("item_tags")

    db.execute(text("DELETE FROM items"))
    tables_cleared.append("items")

    db.execute(text("DELETE FROM tags"))
    tables_cleared.append("tags")

    db.execute(text("DELETE FROM categories"))
    tables_cleared.append("categories")

    db.execute(text("DELETE FROM search_logs"))
    tables_cleared.append("search_logs")

    db.execute(text("DELETE FROM recommendations"))
    tables_cleared.append("recommendations")

    db.execute(text("DELETE FROM item_types"))
    tables_cleared.append("item_types")

    try:
        db.execute(text("DELETE FROM items_fts"))
        tables_cleared.append("items_fts")
    except Exception:
        pass

    db.commit()
    return tables_cleared


# =============================================================================
# API ENDPOINTS
# =============================================================================


@router.post("/reset", response_model=ResetSummary)
async def reset_all_data(
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> ResetSummary:
    """Reset all data in the database.

    This endpoint clears ALL data including:
    - Items, categories, tags
    - Analytics data (search logs, likes, view counts)
    - Recommendations
    - Item types
    - Full-text search index

    Use with caution - this action cannot be undone.
    """
    tables_cleared = reset_database(db)

    return ResetSummary(
        tables_cleared=tables_cleared,
        success=True,
        message=f"Successfully cleared {len(tables_cleared)} tables. All data has been reset.",
    )


@router.post("/seed", response_model=SeedSummary)
async def seed_database(
    reset: bool = Query(False, description="Clear all existing data before seeding"),
    db: Session = Depends(get_db),
    _: str = Depends(verify_admin_token),
) -> SeedSummary:
    """Seed the database with initial content.

    This endpoint populates the database with categories, tags, and sample items.
    The operation is idempotent - existing items will be skipped.

    Use `reset=true` to clear all data before seeding (use with caution).
    """
    reset_performed = False
    if reset:
        reset_database(db)
        reset_performed = True

    category_map, cats_created, cats_existing = seed_categories(db)
    tag_map, tags_created, tags_existing = seed_tags(db)
    seed_item_types(db)
    items_created, items_skipped = seed_items(db, category_map, tag_map)
    rebuild_fts_index(db)

    # Get totals
    total_categories = db.query(Category).count()
    total_tags = db.query(Tag).count()
    total_items = db.query(Item).count()

    # Count by type
    items_by_type = {}
    for item_type in ["agent", "prompt", "mcp", "workflow", "docs", "skill"]:
        items_by_type[item_type] = db.query(Item).filter(Item.type == item_type).count()

    return SeedSummary(
        categories_created=cats_created,
        categories_existing=cats_existing,
        tags_created=tags_created,
        tags_existing=tags_existing,
        items_created=items_created,
        items_skipped=items_skipped,
        total_categories=total_categories,
        total_tags=total_tags,
        total_items=total_items,
        items_by_type=items_by_type,
        reset_performed=reset_performed,
    )
