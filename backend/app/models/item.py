from datetime import datetime
from typing import Optional, TYPE_CHECKING
from sqlalchemy import String, Text, Integer, ForeignKey, DateTime, Table, Column
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base

if TYPE_CHECKING:
    from app.models.category import Category
    from app.models.tag import Tag
    from app.models.like import Like
    from app.models.item_type import ItemType

# Association table for many-to-many relationship between items and tags
item_tags = Table(
    "item_tags",
    Base.metadata,
    Column("item_id", Integer, ForeignKey("items.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Item(Base):
    """Item model for marketplace content (agents, prompts, MCPs, workflows, docs)."""

    __tablename__ = "items"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)  # Markdown content
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # Legacy field, kept for backwards compatibility
    type_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("item_types.id", ondelete="RESTRICT"), nullable=True
    )
    category_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("categories.id", ondelete="SET NULL"), nullable=True
    )
    view_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False
    )

    # Relationships
    item_type: Mapped[Optional["ItemType"]] = relationship("ItemType", back_populates="items")
    category: Mapped[Optional["Category"]] = relationship("Category", back_populates="items")
    tags: Mapped[list["Tag"]] = relationship(
        "Tag", secondary=item_tags, back_populates="items"
    )
    likes: Mapped[list["Like"]] = relationship(
        "Like", back_populates="item", cascade="all, delete-orphan"
    )
