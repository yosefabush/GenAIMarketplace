"""Tests for categories API endpoints."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Category


class TestListCategories:
    """Tests for GET /api/categories endpoint."""

    def test_list_categories_empty(self, client: TestClient) -> None:
        """Test listing categories when database is empty."""
        response = client.get("/api/categories")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"] == []

    def test_list_categories(
        self, client: TestClient, sample_category: Category
    ) -> None:
        """Test listing categories with data."""
        response = client.get("/api/categories")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 1
        assert data["data"][0]["name"] == "Test Category"
        assert data["data"][0]["slug"] == "test-category"
        # Should include item_count
        assert "item_count" in data["data"][0]


class TestCreateCategory:
    """Tests for POST /api/categories endpoint."""

    def test_create_category_success(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating a category with admin auth."""
        payload = {"name": "New Category", "slug": "new-category"}
        response = client.post("/api/categories", json=payload, headers=admin_headers)
        assert response.status_code == 201

        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "New Category"
        assert data["data"]["slug"] == "new-category"
        assert data["data"]["parent_id"] is None

    def test_create_category_with_parent(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_category: Category,
    ) -> None:
        """Test creating a category with a parent."""
        payload = {
            "name": "Child Category",
            "slug": "child-category",
            "parent_id": sample_category.id,
        }
        response = client.post("/api/categories", json=payload, headers=admin_headers)
        assert response.status_code == 201

        data = response.json()
        assert data["data"]["parent_id"] == sample_category.id

    def test_create_category_invalid_parent(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating a category with non-existent parent."""
        payload = {
            "name": "Orphan",
            "slug": "orphan",
            "parent_id": 9999,
        }
        response = client.post("/api/categories", json=payload, headers=admin_headers)
        assert response.status_code == 400
        assert "Parent category not found" in response.json()["detail"]

    def test_create_category_duplicate_slug(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_category: Category,
    ) -> None:
        """Test creating a category with duplicate slug."""
        payload = {"name": "Different Name", "slug": "test-category"}  # Same slug
        response = client.post("/api/categories", json=payload, headers=admin_headers)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_category_no_auth(self, client: TestClient) -> None:
        """Test creating a category without authentication."""
        payload = {"name": "Test", "slug": "test"}
        response = client.post("/api/categories", json=payload)
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401


class TestUpdateCategory:
    """Tests for PUT /api/categories/{id} endpoint."""

    def test_update_category_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_category: Category,
    ) -> None:
        """Test updating a category."""
        payload = {"name": "Updated Name", "slug": "updated-slug"}
        response = client.put(
            f"/api/categories/{sample_category.id}",
            json=payload,
            headers=admin_headers,
        )
        assert response.status_code == 200

        data = response.json()
        assert data["data"]["name"] == "Updated Name"
        assert data["data"]["slug"] == "updated-slug"

    def test_update_category_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test updating a non-existent category."""
        payload = {"name": "Updated"}
        response = client.put(
            "/api/categories/9999", json=payload, headers=admin_headers
        )
        assert response.status_code == 404

    def test_update_category_self_parent(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_category: Category,
    ) -> None:
        """Test that a category cannot be its own parent."""
        payload = {"parent_id": sample_category.id}
        response = client.put(
            f"/api/categories/{sample_category.id}",
            json=payload,
            headers=admin_headers,
        )
        assert response.status_code == 400
        assert "cannot be its own parent" in response.json()["detail"]

    def test_update_category_no_auth(
        self, client: TestClient, sample_category: Category
    ) -> None:
        """Test updating a category without authentication."""
        payload = {"name": "Updated"}
        response = client.put(f"/api/categories/{sample_category.id}", json=payload)
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401


class TestDeleteCategory:
    """Tests for DELETE /api/categories/{id} endpoint."""

    def test_delete_category_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_category: Category,
    ) -> None:
        """Test deleting a category."""
        cat_id = sample_category.id
        response = client.delete(f"/api/categories/{cat_id}", headers=admin_headers)
        assert response.status_code == 200

        # Verify deleted
        response = client.get("/api/categories")
        assert len(response.json()["data"]) == 0

    def test_delete_category_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test deleting a non-existent category."""
        response = client.delete("/api/categories/9999", headers=admin_headers)
        assert response.status_code == 404

    def test_delete_category_no_auth(
        self, client: TestClient, sample_category: Category
    ) -> None:
        """Test deleting a category without authentication."""
        response = client.delete(f"/api/categories/{sample_category.id}")
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401
