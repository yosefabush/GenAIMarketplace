"""Create likes table for item likes feature

Revision ID: 004
Revises: 003
Create Date: 2026-01-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create likes table with unique constraint included at creation time (SQLite limitation)
    op.create_table(
        "likes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("item_id", sa.Integer(), nullable=False),
        sa.Column("user_identifier", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(["item_id"], ["items.id"], ondelete="CASCADE"),
        sa.UniqueConstraint("item_id", "user_identifier", name="uq_likes_item_user"),
    )

    # Create indexes for efficient queries
    op.create_index("ix_likes_item_id", "likes", ["item_id"])
    op.create_index("ix_likes_user_identifier", "likes", ["user_identifier"])
    op.create_index("ix_likes_created_at", "likes", ["created_at"])


def downgrade() -> None:
    op.drop_index("ix_likes_created_at", table_name="likes")
    op.drop_index("ix_likes_user_identifier", table_name="likes")
    op.drop_index("ix_likes_item_id", table_name="likes")
    op.drop_table("likes")
