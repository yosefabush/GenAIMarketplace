"""Make content column nullable on items table

Revision ID: 010
Revises: 009
Create Date: 2026-02-18

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "010"
down_revision: Union[str, None] = "009"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    with op.batch_alter_table("items") as batch_op:
        batch_op.alter_column("content", existing_type=sa.Text(), nullable=True)


def downgrade() -> None:
    # Set any NULL content to empty string before making non-nullable
    op.execute("UPDATE items SET content = '' WHERE content IS NULL")
    with op.batch_alter_table("items") as batch_op:
        batch_op.alter_column("content", existing_type=sa.Text(), nullable=False)
