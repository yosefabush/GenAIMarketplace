"""Tests for tags API endpoints."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Tag


class TestListTags:
    """Tests for GET /api/tags endpoint."""

    def test_list_tags_empty(self, client: TestClient) -> None:
        """Test listing tags when database is empty."""
        response = client.get("/api/tags")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"] == []

    def test_list_tags(self, client: TestClient, sample_tags: list[Tag]) -> None:
        """Test listing tags with data."""
        response = client.get("/api/tags")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 3
        # Should include item_count
        for tag in data["data"]:
            assert "item_count" in tag


class TestCreateTag:
    """Tests for POST /api/tags endpoint."""

    def test_create_tag_success(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating a tag with admin auth."""
        payload = {"name": "newtag"}
        response = client.post("/api/tags", json=payload, headers=admin_headers)
        assert response.status_code == 201

        data = response.json()
        assert data["success"] is True
        assert data["data"]["name"] == "newtag"

    def test_create_tag_duplicate(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_tag: Tag,
    ) -> None:
        """Test creating a tag with duplicate name."""
        payload = {"name": "python"}  # Already exists in sample_tag
        response = client.post("/api/tags", json=payload, headers=admin_headers)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_create_tag_no_auth(self, client: TestClient) -> None:
        """Test creating a tag without authentication."""
        payload = {"name": "test"}
        response = client.post("/api/tags", json=payload)
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401

    def test_create_tag_empty_name(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating a tag with empty name."""
        payload = {"name": ""}
        response = client.post("/api/tags", json=payload, headers=admin_headers)
        assert response.status_code == 422  # Validation error

    def test_create_tag_too_long(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test creating a tag with name exceeding max length."""
        payload = {"name": "a" * 51}  # Max is 50
        response = client.post("/api/tags", json=payload, headers=admin_headers)
        assert response.status_code == 422


class TestUpdateTag:
    """Tests for PUT /api/tags/{id} endpoint."""

    def test_update_tag_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_tag: Tag,
    ) -> None:
        """Test updating a tag."""
        payload = {"name": "updated-python"}
        response = client.put(
            f"/api/tags/{sample_tag.id}", json=payload, headers=admin_headers
        )
        assert response.status_code == 200

        data = response.json()
        assert data["data"]["name"] == "updated-python"

    def test_update_tag_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test updating a non-existent tag."""
        payload = {"name": "updated"}
        response = client.put("/api/tags/9999", json=payload, headers=admin_headers)
        assert response.status_code == 404

    def test_update_tag_duplicate_name(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_tags: list[Tag],
    ) -> None:
        """Test updating a tag to a duplicate name."""
        # Try to rename first tag to second tag's name
        payload = {"name": sample_tags[1].name}
        response = client.put(
            f"/api/tags/{sample_tags[0].id}", json=payload, headers=admin_headers
        )
        assert response.status_code == 400

    def test_update_tag_no_auth(
        self, client: TestClient, sample_tag: Tag
    ) -> None:
        """Test updating a tag without authentication."""
        payload = {"name": "updated"}
        response = client.put(f"/api/tags/{sample_tag.id}", json=payload)
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401


class TestDeleteTag:
    """Tests for DELETE /api/tags/{id} endpoint."""

    def test_delete_tag_success(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_tag: Tag,
    ) -> None:
        """Test deleting a tag."""
        tag_id = sample_tag.id
        response = client.delete(f"/api/tags/{tag_id}", headers=admin_headers)
        assert response.status_code == 200

        # Verify deleted
        response = client.get("/api/tags")
        tag_ids = [t["id"] for t in response.json()["data"]]
        assert tag_id not in tag_ids

    def test_delete_tag_not_found(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test deleting a non-existent tag."""
        response = client.delete("/api/tags/9999", headers=admin_headers)
        assert response.status_code == 404

    def test_delete_tag_no_auth(
        self, client: TestClient, sample_tag: Tag
    ) -> None:
        """Test deleting a tag without authentication."""
        response = client.delete(f"/api/tags/{sample_tag.id}")
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401
