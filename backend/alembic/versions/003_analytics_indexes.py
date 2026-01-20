"""Add indexes for analytics queries

Revision ID: 003
Revises: 002
Create Date: 2026-01-20

"""
from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Index on items.type for filtering by type
    op.create_index("ix_items_type", "items", ["type"])

    # Index on items.category_id for filtering by category
    op.create_index("ix_items_category_id", "items", ["category_id"])

    # Index on items.created_at DESC for sorting by date
    op.create_index("ix_items_created_at_desc", "items", ["created_at"], postgresql_ops={"created_at": "DESC"})

    # Index on items.view_count DESC for top viewed items query
    op.create_index("ix_items_view_count_desc", "items", ["view_count"], postgresql_ops={"view_count": "DESC"})

    # Index on search_logs.created_at for date range filtering
    op.create_index("ix_search_logs_created_at", "search_logs", ["created_at"])

    # Index on search_logs.query for grouping top queries
    op.create_index("ix_search_logs_query", "search_logs", ["query"])

    # Index on search_logs.source for grouping by source
    op.create_index("ix_search_logs_source", "search_logs", ["source"])


def downgrade() -> None:
    op.drop_index("ix_search_logs_source", "search_logs")
    op.drop_index("ix_search_logs_query", "search_logs")
    op.drop_index("ix_search_logs_created_at", "search_logs")
    op.drop_index("ix_items_view_count_desc", "items")
    op.drop_index("ix_items_created_at_desc", "items")
    op.drop_index("ix_items_category_id", "items")
    op.drop_index("ix_items_type", "items")
