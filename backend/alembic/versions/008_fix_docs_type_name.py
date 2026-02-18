"""Fix docs type name (doc -> docs) and add skill type

Revision ID: 008
Revises: 007
Create Date: 2026-01-25

This migration fixes the item type mismatch where items were stored
with type 'doc' but the frontend expects 'docs'. Also adds the 'skill' type.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "008"
down_revision: Union[str, None] = "007"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Update item_types table: change 'doc' to 'docs'
    op.execute("UPDATE item_types SET slug = 'docs', name = 'Docs' WHERE slug = 'doc'")

    # Update all items with type 'doc' to 'docs'
    op.execute("UPDATE items SET type = 'docs' WHERE type = 'doc'")

    # Add 'skill' item type if it doesn't exist
    op.execute("""
        INSERT INTO item_types (name, slug, description, icon, color, created_at, updated_at)
        SELECT 'Skill', 'skill', 'Reusable skills and capabilities', 'Zap', 'yellow',
               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        WHERE NOT EXISTS (SELECT 1 FROM item_types WHERE slug = 'skill')
    """)


def downgrade() -> None:
    # Remove skill type
    op.execute("DELETE FROM item_types WHERE slug = 'skill'")

    # Revert items back to 'doc'
    op.execute("UPDATE items SET type = 'doc' WHERE type = 'docs'")

    # Revert item_types back to 'doc'
    op.execute("UPDATE item_types SET slug = 'doc', name = 'Doc' WHERE slug = 'docs'")
