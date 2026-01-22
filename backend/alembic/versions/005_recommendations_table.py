"""Create recommendations table for user-submitted item recommendations

Revision ID: 005
Revises: 004
Create Date: 2026-01-22

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "005"
down_revision: Union[str, None] = "004"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create recommendations table
    op.create_table(
        "recommendations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("submitter_email", sa.String(255), nullable=False),
        sa.Column("reason", sa.Text(), nullable=False),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("admin_notes", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.ForeignKeyConstraint(
            ["category_id"], ["categories.id"], ondelete="SET NULL"
        ),
    )

    # Create indexes for efficient queries
    op.create_index("ix_recommendations_status", "recommendations", ["status"])
    op.create_index("ix_recommendations_created_at", "recommendations", ["created_at"])
    op.create_index("ix_recommendations_type", "recommendations", ["type"])


def downgrade() -> None:
    op.drop_index("ix_recommendations_type", table_name="recommendations")
    op.drop_index("ix_recommendations_created_at", table_name="recommendations")
    op.drop_index("ix_recommendations_status", table_name="recommendations")
    op.drop_table("recommendations")
