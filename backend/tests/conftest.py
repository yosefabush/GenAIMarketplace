"""Pytest configuration and fixtures for backend API tests."""

import os
import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

# Set test environment variables before importing app modules
os.environ["ADMIN_TOKEN"] = "test-admin-token"
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.main import app
from app.core.database import get_db
from app.models.base import Base
from app.models import Category, Tag, Item


# Test database setup - use StaticPool to share the in-memory DB across connections
TEST_DATABASE_URL = "sqlite:///:memory:"
test_engine = create_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


def _enable_foreign_keys(dbapi_conn, connection_record):  # type: ignore
    """Enable foreign key constraints for SQLite."""
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# Enable foreign keys for SQLite test database
event.listen(test_engine, "connect", _enable_foreign_keys)


def create_fts5_tables(connection) -> None:  # type: ignore
    """Create FTS5 virtual table and triggers for search functionality."""
    # Create FTS5 virtual table
    connection.execute(text("""
        CREATE VIRTUAL TABLE IF NOT EXISTS items_fts USING fts5(
            title,
            description,
            content,
            content='items',
            content_rowid='id'
        )
    """))

    # Create INSERT trigger
    connection.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_fts_insert AFTER INSERT ON items BEGIN
            INSERT INTO items_fts(rowid, title, description, content)
            VALUES (NEW.id, NEW.title, NEW.description, NEW.content);
        END
    """))

    # Create UPDATE trigger
    connection.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_fts_update AFTER UPDATE ON items BEGIN
            INSERT INTO items_fts(items_fts, rowid, title, description, content)
            VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.content);
            INSERT INTO items_fts(rowid, title, description, content)
            VALUES (NEW.id, NEW.title, NEW.description, NEW.content);
        END
    """))

    # Create DELETE trigger
    connection.execute(text("""
        CREATE TRIGGER IF NOT EXISTS items_fts_delete AFTER DELETE ON items BEGIN
            INSERT INTO items_fts(items_fts, rowid, title, description, content)
            VALUES ('delete', OLD.id, OLD.title, OLD.description, OLD.content);
        END
    """))


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database session for each test."""
    # Create all tables
    Base.metadata.create_all(bind=test_engine)

    # Create FTS5 tables and triggers using raw connection
    with test_engine.connect() as conn:
        create_fts5_tables(conn)
        conn.commit()

    session = TestSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop all tables after each test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database dependency override."""
    # Override get_db to return a generator that yields the test session
    def override_get_db() -> Generator[Session, None, None]:
        try:
            yield db
        finally:
            pass  # Don't close - the db fixture handles cleanup

    app.dependency_overrides[get_db] = override_get_db

    with TestClient(app, raise_server_exceptions=False) as test_client:
        yield test_client

    # Clear overrides
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers() -> dict[str, str]:
    """Return headers with admin token for authenticated requests."""
    return {"Authorization": "Bearer test-admin-token"}


@pytest.fixture
def sample_category(db: Session) -> Category:
    """Create a sample category for testing."""
    category = Category(
        name="Test Category",
        slug="test-category",
        parent_id=None,
    )
    db.add(category)
    db.commit()
    db.refresh(category)
    return category


@pytest.fixture
def sample_tag(db: Session) -> Tag:
    """Create a sample tag for testing."""
    tag = Tag(name="python")
    db.add(tag)
    db.commit()
    db.refresh(tag)
    return tag


@pytest.fixture
def sample_tags(db: Session) -> list[Tag]:
    """Create multiple sample tags for testing."""
    tags = [
        Tag(name="python"),
        Tag(name="testing"),
        Tag(name="automation"),
    ]
    db.add_all(tags)
    db.commit()
    for tag in tags:
        db.refresh(tag)
    return tags


@pytest.fixture
def sample_item(db: Session, sample_category: Category, sample_tag: Tag) -> Item:
    """Create a sample item for testing."""
    item = Item(
        title="Test Agent",
        description="A test agent for unit testing",
        content="# Test Agent\n\nThis is a test agent.",
        type="agent",
        category_id=sample_category.id,
        view_count=10,
    )
    item.tags = [sample_tag]
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@pytest.fixture
def sample_items(db: Session, sample_category: Category, sample_tags: list[Tag]) -> list[Item]:
    """Create multiple sample items for testing."""
    items = [
        Item(
            title="Code Review Agent",
            description="An agent that reviews code",
            content="# Code Review Agent\n\nReviews code for best practices.",
            type="agent",
            category_id=sample_category.id,
            view_count=100,
            tags=[sample_tags[0], sample_tags[1]],  # python, testing
        ),
        Item(
            title="Python Prompt",
            description="A prompt for Python code generation",
            content="# Python Prompt\n\nGenerate Python code.",
            type="prompt",
            category_id=sample_category.id,
            view_count=50,
            tags=[sample_tags[0]],  # python
        ),
        Item(
            title="MCP Integration",
            description="MCP for external integrations",
            content="# MCP Integration\n\nConnect to external services.",
            type="mcp",
            category_id=None,
            view_count=25,
            tags=[sample_tags[2]],  # automation
        ),
        Item(
            title="CI/CD Workflow",
            description="Automated CI/CD workflow",
            content="# CI/CD Workflow\n\nAutomate deployments.",
            type="workflow",
            category_id=sample_category.id,
            view_count=75,
            tags=[sample_tags[1], sample_tags[2]],  # testing, automation
        ),
        Item(
            title="API Documentation",
            description="Documentation for the API",
            content="# API Documentation\n\nComplete API reference.",
            type="doc",
            category_id=sample_category.id,
            view_count=200,
            tags=[],
        ),
    ]
    db.add_all(items)
    db.commit()
    for item in items:
        db.refresh(item)
    return items
