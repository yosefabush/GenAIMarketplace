"""PostgreSQL full-text search support

Revision ID: 006
Revises: 005
Create Date: 2026-01-22

This migration adds PostgreSQL full-text search support.
It only runs when using PostgreSQL (skips for SQLite).
"""
from typing import Sequence, Union

from alembic import op
from sqlalchemy import text
from sqlalchemy.engine import Connection


# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def is_postgres(connection: Connection) -> bool:
    """Check if the database is PostgreSQL."""
    return connection.dialect.name == "postgresql"


def upgrade() -> None:
    connection = op.get_bind()

    if not is_postgres(connection):
        # Skip for SQLite - it uses FTS5 from migration 002
        return

    # Add tsvector column for full-text search
    op.execute(text("""
        ALTER TABLE items
        ADD COLUMN IF NOT EXISTS search_vector tsvector
    """))

    # Create GIN index for fast full-text search
    op.execute(text("""
        CREATE INDEX IF NOT EXISTS idx_items_search_vector
        ON items USING GIN (search_vector)
    """))

    # Populate search_vector for existing items
    op.execute(text("""
        UPDATE items
        SET search_vector = to_tsvector('english',
            coalesce(title, '') || ' ' ||
            coalesce(description, '') || ' ' ||
            coalesce(content, '')
        )
    """))

    # Create function to update search_vector
    op.execute(text("""
        CREATE OR REPLACE FUNCTION items_search_vector_update()
        RETURNS trigger AS $$
        BEGIN
            NEW.search_vector := to_tsvector('english',
                coalesce(NEW.title, '') || ' ' ||
                coalesce(NEW.description, '') || ' ' ||
                coalesce(NEW.content, '')
            );
            RETURN NEW;
        END
        $$ LANGUAGE plpgsql
    """))

    # Create trigger to auto-update search_vector
    op.execute(text("""
        DROP TRIGGER IF EXISTS items_search_vector_trigger ON items
    """))
    op.execute(text("""
        CREATE TRIGGER items_search_vector_trigger
        BEFORE INSERT OR UPDATE ON items
        FOR EACH ROW EXECUTE FUNCTION items_search_vector_update()
    """))


def downgrade() -> None:
    connection = op.get_bind()

    if not is_postgres(connection):
        return

    # Drop trigger
    op.execute(text("DROP TRIGGER IF EXISTS items_search_vector_trigger ON items"))

    # Drop function
    op.execute(text("DROP FUNCTION IF EXISTS items_search_vector_update()"))

    # Drop index
    op.execute(text("DROP INDEX IF EXISTS idx_items_search_vector"))

    # Drop column
    op.execute(text("ALTER TABLE items DROP COLUMN IF EXISTS search_vector"))
