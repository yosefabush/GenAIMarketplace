#!/usr/bin/env python
"""
Seed script for GenAI Marketplace.

Creates initial content including categories, tags, and items.
This script is idempotent - it can be run multiple times safely.

Usage:
    cd backend
    python scripts/seed_data.py [--reset]

Options:
    --reset    Clear all existing data before seeding (use with caution)
"""

import argparse
import sys
from pathlib import Path
from typing import Any

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, engine
from app.models import Base, Category, Tag, Item, item_tags


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
    "python", "javascript", "typescript", "go", "rust",
    "api", "rest", "graphql", "database", "sql",
    "docker", "kubernetes", "ci-cd", "automation", "testing",
    "llm", "openai", "anthropic", "langchain", "rag",
    "documentation", "code-review", "refactoring", "debugging", "performance",
]


def get_seed_items() -> list[dict[str, Any]]:
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
        items.append({**doc, "type": "doc"})
    for skill in SKILLS:
        items.append({**skill, "type": "skill"})

    return items


# =============================================================================
# SEEDING FUNCTIONS
# =============================================================================

def seed_categories(db: Session) -> dict[str, int]:
    """Seed categories and return name->id mapping."""
    category_map: dict[str, int] = {}

    for cat_data in CATEGORIES:
        existing = db.query(Category).filter(Category.slug == cat_data["slug"]).first()
        if existing:
            category_map[cat_data["name"]] = existing.id
            print(f"  Category exists: {cat_data['name']}")
        else:
            category = Category(**cat_data)
            db.add(category)
            db.flush()
            category_map[cat_data["name"]] = category.id
            print(f"  Created category: {cat_data['name']}")

    db.commit()
    return category_map


def seed_tags(db: Session) -> dict[str, int]:
    """Seed tags and return name->id mapping."""
    tag_map: dict[str, int] = {}

    for tag_name in TAGS:
        existing = db.query(Tag).filter(Tag.name == tag_name).first()
        if existing:
            tag_map[tag_name] = existing.id
        else:
            tag = Tag(name=tag_name)
            db.add(tag)
            db.flush()
            tag_map[tag_name] = tag.id
            print(f"  Created tag: {tag_name}")

    db.commit()
    print(f"  Total tags: {len(tag_map)}")
    return tag_map


def seed_items(db: Session, category_map: dict[str, int], tag_map: dict[str, int]) -> None:
    """Seed items with categories and tags."""
    items = get_seed_items()
    created_count = 0
    skipped_count = 0

    for item_data in items:
        # Check if item already exists by title
        existing = db.query(Item).filter(Item.title == item_data["title"]).first()
        if existing:
            skipped_count += 1
            continue

        # Create item
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

        # Add tags
        for tag_name in item_data.get("tags", []):
            if tag_name in tag_map:
                db.execute(
                    item_tags.insert().values(
                        item_id=item.id,
                        tag_id=tag_map[tag_name]
                    )
                )

        created_count += 1
        if created_count % 10 == 0:
            print(f"  Created {created_count} items...")

    db.commit()
    print(f"  Created: {created_count}, Skipped (existing): {skipped_count}")


def rebuild_fts_index(db: Session) -> None:
    """Rebuild the FTS5 index after seeding."""
    print("Rebuilding FTS index...")
    try:
        # Delete all FTS entries and rebuild from items
        db.execute(text("DELETE FROM items_fts"))
        db.execute(text("""
            INSERT INTO items_fts(rowid, title, description, content)
            SELECT id, title, description, content FROM items
        """))
        db.commit()
        print("  FTS index rebuilt successfully")
    except Exception as e:
        print(f"  Warning: Could not rebuild FTS index: {e}")
        db.rollback()


def reset_database(db: Session) -> None:
    """Clear all data from the database."""
    print("Resetting database...")
    db.execute(text("DELETE FROM item_tags"))
    db.execute(text("DELETE FROM items"))
    db.execute(text("DELETE FROM tags"))
    db.execute(text("DELETE FROM categories"))
    db.execute(text("DELETE FROM search_logs"))
    try:
        db.execute(text("DELETE FROM items_fts"))
    except Exception:
        pass  # FTS table might not exist
    db.commit()
    print("  Database cleared")


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Seed the GenAI Marketplace database with initial content"
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear all existing data before seeding (use with caution)"
    )
    args = parser.parse_args()

    print("=" * 60)
    print("GenAI Marketplace Database Seeder")
    print("=" * 60)
    print()

    db = SessionLocal()

    try:
        if args.reset:
            reset_database(db)
            print()

        print("Seeding categories...")
        category_map = seed_categories(db)
        print()

        print("Seeding tags...")
        tag_map = seed_tags(db)
        print()

        print("Seeding items...")
        seed_items(db, category_map, tag_map)
        print()

        rebuild_fts_index(db)
        print()

        # Print summary
        item_count = db.query(Item).count()
        category_count = db.query(Category).count()
        tag_count = db.query(Tag).count()

        print("=" * 60)
        print("Seeding Complete!")
        print("=" * 60)
        print(f"  Categories: {category_count}")
        print(f"  Tags: {tag_count}")
        print(f"  Items: {item_count}")

        # Count by type
        for item_type in ["agent", "prompt", "mcp", "workflow", "doc"]:
            count = db.query(Item).filter(Item.type == item_type).count()
            print(f"    - {item_type}s: {count}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
