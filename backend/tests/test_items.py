"""Tests for items API endpoints."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Item, Category, Tag


class TestListItems:
    """Tests for GET /api/items endpoint."""

    def test_list_items_empty(self, client: TestClient) -> None:
        """Test listing items when database is empty."""
        response = client.get("/api/items")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"] == []
        assert data["total"] == 0
        assert data["limit"] == 20
        assert data["offset"] == 0

    def test_list_items_with_data(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test listing items with sample data."""
        response = client.get("/api/items")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 5
        assert data["total"] == 5

    def test_list_items_pagination(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test pagination of items."""
        # Get first 2 items
        response = client.get("/api/items?limit=2&offset=0")
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) == 2
        assert data["total"] == 5
        assert data["limit"] == 2
        assert data["offset"] == 0

        # Get next 2 items
        response = client.get("/api/items?limit=2&offset=2")
        data = response.json()
        assert len(data["data"]) == 2
        assert data["offset"] == 2

    def test_list_items_invalid_limit(self, client: TestClient) -> None:
        """Test listing items with invalid limit."""
        response = client.get("/api/items?limit=0")
        assert response.status_code == 422  # Validation error

        response = client.get("/api/items?limit=101")
        assert response.status_code == 422

    def test_list_items_includes_relationships(
        self, client: TestClient, sample_item: Item
    ) -> None:
        """Test that listed items include category and tags."""
        response = client.get("/api/items")
        data = response.json()

        item = data["data"][0]
        assert item["category"] is not None
        assert item["category"]["name"] == "Test Category"
        assert len(item["tags"]) == 1
        assert item["tags"][0]["name"] == "python"


class TestGetItem:
    """Tests for GET /api/items/{id} endpoint."""

    def test_get_item_success(
        self, client: TestClient, sample_item: Item
    ) -> None:
        """Test getting a single item by ID."""
        response = client.get(f"/api/items/{sample_item.id}")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["id"] == sample_item.id
        assert data["data"]["title"] == "Test Agent"
        assert data["data"]["description"] == "A test agent for unit testing"
        assert data["data"]["content"] == "# Test Agent\n\nThis is a test agent."
        assert data["data"]["type"] == "agent"
        assert data["data"]["view_count"] == 10

    def test_get_item_not_found(self, client: TestClient) -> None:
        """Test getting a non-existent item."""
        response = client.get("/api/items/9999")
        assert response.status_code == 404
        assert response.json()["detail"] == "Item not found"

    def test_get_item_includes_relationships(
        self, client: TestClient, sample_item: Item
    ) -> None:
        """Test that the item includes category and tags."""
        response = client.get(f"/api/items/{sample_item.id}")
        data = response.json()

        assert data["data"]["category"] is not None
        assert data["data"]["category"]["name"] == "Test Category"
        assert len(data["data"]["tags"]) == 1


class TestCreateItem:
    """Tests for POST /api/items endpoint."""

    def test_create_item_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_category: Category,
        sample_tag: Tag,
    ) -> None:
        """Test creating a new item with admin auth."""
        payload = {
            "title": "New Agent",
            "description": "A new test agent",
            "content": "# New Agent\n\nThis is new.",
            "type": "agent",
            "category_id": sample_category.id,
            "tag_ids": [sample_tag.id],
        }
        response = client.post("/api/items", json=payload, headers=admin_headers)
        assert response.status_code == 201

        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "New Agent"
        assert data["data"]["type"] == "agent"
        assert data["data"]["category_id"] == sample_category.id
        assert len(data["data"]["tags"]) == 1

    def test_create_item_minimal(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating an item with minimal required fields."""
        payload = {
            "title": "Minimal Item",
            "description": "Minimal description",
            "content": "Minimal content",
            "type": "prompt",
        }
        response = client.post("/api/items", json=payload, headers=admin_headers)
        assert response.status_code == 201

        data = response.json()
        assert data["data"]["category_id"] is None
        assert data["data"]["tags"] == []

    def test_create_item_no_auth(self, client: TestClient) -> None:
        """Test creating an item without authentication."""
        payload = {
            "title": "Unauthorized Item",
            "description": "Should fail",
            "content": "Content",
            "type": "agent",
        }
        response = client.post("/api/items", json=payload)
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401

    def test_create_item_invalid_token(self, client: TestClient) -> None:
        """Test creating an item with invalid token."""
        payload = {
            "title": "Invalid Token Item",
            "description": "Should fail",
            "content": "Content",
            "type": "agent",
        }
        headers = {"Authorization": "Bearer wrong-token"}
        response = client.post("/api/items", json=payload, headers=headers)
        assert response.status_code == 401

    def test_create_item_invalid_type(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating an item with invalid type."""
        payload = {
            "title": "Invalid Type",
            "description": "Should fail",
            "content": "Content",
            "type": "invalid",
        }
        response = client.post("/api/items", json=payload, headers=admin_headers)
        assert response.status_code == 422  # Validation error

    def test_create_item_invalid_tag_ids(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating an item with non-existent tag IDs."""
        payload = {
            "title": "Invalid Tags",
            "description": "Should fail",
            "content": "Content",
            "type": "agent",
            "tag_ids": [9999],
        }
        response = client.post("/api/items", json=payload, headers=admin_headers)
        assert response.status_code == 400
        assert "tag IDs not found" in response.json()["detail"]


class TestUpdateItem:
    """Tests for PUT /api/items/{id} endpoint."""

    def test_update_item_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_item: Item,
    ) -> None:
        """Test updating an item with admin auth."""
        payload = {"title": "Updated Title", "description": "Updated description"}
        response = client.put(
            f"/api/items/{sample_item.id}", json=payload, headers=admin_headers
        )
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"]["title"] == "Updated Title"
        assert data["data"]["description"] == "Updated description"
        # Original content should remain
        assert data["data"]["content"] == "# Test Agent\n\nThis is a test agent."

    def test_update_item_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test updating a non-existent item."""
        payload = {"title": "Updated Title"}
        response = client.put("/api/items/9999", json=payload, headers=admin_headers)
        assert response.status_code == 404

    def test_update_item_no_auth(
        self, client: TestClient, sample_item: Item
    ) -> None:
        """Test updating an item without authentication."""
        payload = {"title": "Updated Title"}
        response = client.put(f"/api/items/{sample_item.id}", json=payload)
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401

    def test_update_item_tags(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        db: Session,
        sample_category: Category,
    ) -> None:
        """Test updating item tags."""
        # Create tags separately to avoid fixture conflicts
        tag1 = Tag(name="tag1")
        tag2 = Tag(name="tag2")
        tag3 = Tag(name="tag3")
        db.add_all([tag1, tag2, tag3])
        db.commit()
        for tag in [tag1, tag2, tag3]:
            db.refresh(tag)

        # Create item with first tag
        item = Item(
            title="Tag Test Item",
            description="Testing tag updates",
            content="Test content",
            type="agent",
            category_id=sample_category.id,
            view_count=0,
        )
        item.tags = [tag1]
        db.add(item)
        db.commit()
        db.refresh(item)

        # Replace tags with different ones
        new_tag_ids = [tag2.id, tag3.id]
        payload = {"tag_ids": new_tag_ids}
        response = client.put(
            f"/api/items/{item.id}", json=payload, headers=admin_headers
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]["tags"]) == 2


class TestDeleteItem:
    """Tests for DELETE /api/items/{id} endpoint."""

    def test_delete_item_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_item: Item,
    ) -> None:
        """Test deleting an item with admin auth."""
        item_id = sample_item.id
        response = client.delete(f"/api/items/{item_id}", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True

        # Verify item is deleted
        response = client.get(f"/api/items/{item_id}")
        assert response.status_code == 404

    def test_delete_item_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test deleting a non-existent item."""
        response = client.delete("/api/items/9999", headers=admin_headers)
        assert response.status_code == 404

    def test_delete_item_no_auth(
        self, client: TestClient, sample_item: Item
    ) -> None:
        """Test deleting an item without authentication."""
        response = client.delete(f"/api/items/{sample_item.id}")
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401


class TestViewItem:
    """Tests for POST /api/items/{id}/view endpoint."""

    def test_increment_view_count(
        self, client: TestClient, sample_item: Item
    ) -> None:
        """Test incrementing view count."""
        initial_views = sample_item.view_count
        response = client.post(f"/api/items/{sample_item.id}/view")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"] == initial_views + 1

    def test_view_item_not_found(self, client: TestClient) -> None:
        """Test viewing a non-existent item."""
        response = client.post("/api/items/9999/view")
        assert response.status_code == 404


class TestRelatedItems:
    """Tests for GET /api/items/{id}/related endpoint."""

    def test_get_related_items(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test getting related items by category or tags."""
        # Get first item (has category and tags)
        item = sample_items[0]
        response = client.get(f"/api/items/{item.id}/related")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Should return items with same category or shared tags
        assert len(data["data"]) > 0
        # Should not include the source item
        for related_item in data["data"]:
            assert related_item["id"] != item.id

    def test_related_items_not_found(self, client: TestClient) -> None:
        """Test getting related items for non-existent item."""
        response = client.get("/api/items/9999/related")
        assert response.status_code == 404

    def test_related_items_limit(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test limiting related items."""
        item = sample_items[0]
        response = client.get(f"/api/items/{item.id}/related?limit=2")
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) <= 2
