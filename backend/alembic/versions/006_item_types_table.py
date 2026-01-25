"""Create item_types table for custom content types

Revision ID: 006
Revises: 005
Create Date: 2026-01-25

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "006"
down_revision: Union[str, None] = "005"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create item_types table
    op.create_table(
        "item_types",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("slug", sa.String(100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("icon", sa.String(50), nullable=True),
        sa.Column("color", sa.String(20), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug"),
    )

    # Create index on slug for lookups
    op.create_index("ix_item_types_slug", "item_types", ["slug"])

    # Seed default item types
    item_types_table = sa.table(
        "item_types",
        sa.column("id", sa.Integer),
        sa.column("name", sa.String),
        sa.column("slug", sa.String),
        sa.column("description", sa.Text),
        sa.column("icon", sa.String),
        sa.column("color", sa.String),
        sa.column("created_at", sa.DateTime),
        sa.column("updated_at", sa.DateTime),
    )

    from datetime import datetime
    now = datetime.utcnow()

    op.bulk_insert(
        item_types_table,
        [
            {
                "id": 1,
                "name": "Agent",
                "slug": "agent",
                "description": "AI agents that can perform tasks autonomously",
                "icon": "Bot",
                "color": "blue",
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": 2,
                "name": "Prompt",
                "slug": "prompt",
                "description": "Reusable prompts for AI models",
                "icon": "MessageSquare",
                "color": "green",
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": 3,
                "name": "MCP",
                "slug": "mcp",
                "description": "Model Context Protocol servers and tools",
                "icon": "Plug",
                "color": "purple",
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": 4,
                "name": "Workflow",
                "slug": "workflow",
                "description": "Multi-step AI workflows and pipelines",
                "icon": "Workflow",
                "color": "orange",
                "created_at": now,
                "updated_at": now,
            },
            {
                "id": 5,
                "name": "Doc",
                "slug": "doc",
                "description": "Documentation and guides",
                "icon": "FileText",
                "color": "gray",
                "created_at": now,
                "updated_at": now,
            },
        ],
    )

    # Add type_id column to items table (nullable initially for migration)
    op.add_column(
        "items",
        sa.Column("type_id", sa.Integer(), nullable=True),
    )

    # Update existing items to use type_id based on their type slug
    # This needs to be done with raw SQL since we need to match on type string
    op.execute("""
        UPDATE items
        SET type_id = (
            SELECT id FROM item_types WHERE slug = items.type
        )
    """)

    # Add foreign key constraint
    op.create_foreign_key(
        "fk_items_type_id",
        "items",
        "item_types",
        ["type_id"],
        ["id"],
        ondelete="RESTRICT",
    )

    # Create index on type_id for filtering
    op.create_index("ix_items_type_id", "items", ["type_id"])


def downgrade() -> None:
    # Remove foreign key and index
    op.drop_index("ix_items_type_id", table_name="items")
    op.drop_constraint("fk_items_type_id", "items", type_="foreignkey")

    # Remove type_id column
    op.drop_column("items", "type_id")

    # Drop item_types table
    op.drop_index("ix_item_types_slug", table_name="item_types")
    op.drop_table("item_types")
