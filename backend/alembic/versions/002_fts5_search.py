"""FTS5 full-text search for items

Revision ID: 002
Revises: 001
Create Date: 2026-01-19

This migration only runs on SQLite. PostgreSQL FTS is handled by migration 006.
"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name != "sqlite":
        return

    # Create FTS5 virtual table for full-text search
    # Index title, description, and content fields
    # Use content="" for external content table (contentless FTS5)
    # This means the FTS table stores only the index, not the actual content
    op.execute("""
        CREATE VIRTUAL TABLE items_fts USING fts5(
            title,
            description,
            content,
            content='items',
            content_rowid='id'
        )
    """)

    # Populate FTS table with existing items
    op.execute("""
        INSERT INTO items_fts(rowid, title, description, content)
        SELECT id, title, description, content FROM items
    """)

    # Create trigger to keep FTS index in sync on INSERT
    op.execute("""
        CREATE TRIGGER items_fts_insert AFTER INSERT ON items BEGIN
            INSERT INTO items_fts(rowid, title, description, content)
            VALUES (NEW.id, NEW.title, NEW.description, NEW.content);
        END
    """)

    # Create trigger to keep FTS index in sync on UPDATE
    op.execute("""
        CREATE TRIGGER items_fts_update AFTER UPDATE ON items BEGIN
            INSERT INTO items_fts(items_fts, rowid, title, description, content)
            VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.content);
            INSERT INTO items_fts(rowid, title, description, content)
            VALUES (NEW.id, NEW.title, NEW.description, NEW.content);
        END
    """)

    # Create trigger to keep FTS index in sync on DELETE
    op.execute("""
        CREATE TRIGGER items_fts_delete AFTER DELETE ON items BEGIN
            INSERT INTO items_fts(items_fts, rowid, title, description, content)
            VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.content);
        END
    """)


def downgrade() -> None:
    connection = op.get_bind()
    if connection.dialect.name != "sqlite":
        return

    # Drop triggers first
    op.execute("DROP TRIGGER IF EXISTS items_fts_delete")
    op.execute("DROP TRIGGER IF EXISTS items_fts_update")
    op.execute("DROP TRIGGER IF EXISTS items_fts_insert")

    # Drop FTS5 virtual table
    op.execute("DROP TABLE IF EXISTS items_fts")
