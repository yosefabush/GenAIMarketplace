"""Tests for search API endpoint."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Category, Item


class TestSearch:
    """Tests for GET /api/search endpoint."""

    def test_search_empty_database(self, client: TestClient) -> None:
        """Test search when database is empty."""
        response = client.get("/api/search")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"] == []
        assert data["total"] == 0

    def test_search_without_query(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test search without query parameter returns all items."""
        response = client.get("/api/search")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert len(data["data"]) == 5
        assert data["total"] == 5

    def test_search_with_query(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test search with a query that matches items."""
        response = client.get("/api/search?q=Python")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Should find "Code Review Agent" (has python tag), "Python Prompt" (in title)
        assert len(data["data"]) >= 1

    def test_search_no_results(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test search with query that matches nothing."""
        response = client.get("/api/search?q=xyznonexistent")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["data"] == []
        assert data["total"] == 0

    def test_search_filter_by_type(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test filtering search results by type."""
        response = client.get("/api/search?type=agent")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Should only return items of type "agent"
        for item in data["data"]:
            assert item["type"] == "agent"

    def test_search_filter_by_multiple_types(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test filtering by multiple types."""
        response = client.get("/api/search?type=agent,prompt")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Should return items of type "agent" or "prompt"
        for item in data["data"]:
            assert item["type"] in ["agent", "prompt"]

    def test_search_filter_by_category(
        self, client: TestClient, sample_items: list[Item], sample_category: Category
    ) -> None:
        """Test filtering by category."""
        response = client.get(f"/api/search?category={sample_category.id}")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # All items with a category should have the same category_id
        for item in data["data"]:
            assert item["category_id"] == sample_category.id

    def test_search_filter_by_tags(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test filtering by tag names."""
        response = client.get("/api/search?tags=python")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Should return items that have the "python" tag
        assert len(data["data"]) >= 1
        for item in data["data"]:
            tag_names = [t["name"] for t in item["tags"]]
            assert "python" in tag_names

    def test_search_sort_by_date(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test sorting by date."""
        response = client.get("/api/search?sort=date")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Items should be sorted by created_at descending
        if len(data["data"]) > 1:
            dates = [item["created_at"] for item in data["data"]]
            assert dates == sorted(dates, reverse=True)

    def test_search_sort_by_views(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test sorting by view count."""
        response = client.get("/api/search?sort=views")
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        # Items should be sorted by view_count descending
        if len(data["data"]) > 1:
            views = [item["view_count"] for item in data["data"]]
            assert views == sorted(views, reverse=True)

    def test_search_pagination(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test pagination of search results."""
        # Get first page
        response = client.get("/api/search?page=1&limit=2")
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) == 2
        assert data["page"] == 1
        assert data["limit"] == 2
        assert data["total"] == 5

        first_page_ids = [item["id"] for item in data["data"]]

        # Get second page
        response = client.get("/api/search?page=2&limit=2")
        data = response.json()
        assert len(data["data"]) == 2
        assert data["page"] == 2

        second_page_ids = [item["id"] for item in data["data"]]

        # Pages should have different items
        assert first_page_ids != second_page_ids

    def test_search_pagination_out_of_range(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test pagination beyond available results."""
        response = client.get("/api/search?page=100&limit=20")
        assert response.status_code == 200

        data = response.json()
        assert data["data"] == []
        assert data["total"] == 5

    def test_search_invalid_pagination(self, client: TestClient) -> None:
        """Test invalid pagination parameters."""
        response = client.get("/api/search?page=0")
        assert response.status_code == 422  # Validation error

        response = client.get("/api/search?limit=0")
        assert response.status_code == 422

        response = client.get("/api/search?limit=101")
        assert response.status_code == 422

    def test_search_combined_filters(
        self, client: TestClient, sample_items: list[Item], sample_category: Category
    ) -> None:
        """Test combining multiple filters."""
        response = client.get(
            f"/api/search?type=agent&category={sample_category.id}&sort=views"
        )
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        for item in data["data"]:
            assert item["type"] == "agent"
            assert item["category_id"] == sample_category.id

    def test_search_includes_metadata(
        self, client: TestClient, sample_items: list[Item]
    ) -> None:
        """Test that search results include all expected metadata."""
        response = client.get("/api/search?limit=1")
        assert response.status_code == 200

        data = response.json()
        if data["data"]:
            item = data["data"][0]
            # Check all expected fields are present
            assert "id" in item
            assert "title" in item
            assert "description" in item
            assert "type" in item
            assert "category_id" in item
            assert "category" in item
            assert "tags" in item
            assert "view_count" in item
            assert "created_at" in item
            assert "updated_at" in item
