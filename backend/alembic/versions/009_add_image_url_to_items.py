"""Add image_url column to items table

Revision ID: 009
Revises: 008
Create Date: 2026-02-17

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "009"
down_revision: Union[str, None] = "008"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("items", sa.Column("image_url", sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column("items", "image_url")
