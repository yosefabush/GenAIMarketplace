"""Tests for analytics API endpoints."""

from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models import Item
from app.models.search_log import SearchLog


class TestAnalyticsAuth:
    """Test that analytics endpoints require admin authentication."""

    def test_analytics_requires_auth(self, client: TestClient) -> None:
        """Test that analytics endpoint requires authentication."""
        response = client.get("/api/analytics/searches")
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401

    def test_analytics_invalid_token(self, client: TestClient) -> None:
        """Test that invalid token is rejected."""
        headers = {"Authorization": "Bearer wrong-token"}
        response = client.get("/api/analytics/searches", headers=headers)
        assert response.status_code == 401


class TestSearchAnalytics:
    """Tests for GET /api/analytics/searches endpoint."""

    def test_get_search_analytics_empty(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test getting analytics with no data."""
        response = client.get("/api/analytics/searches", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert "search_totals" in data["data"]
        assert data["data"]["search_totals"]["last_7_days"] == 0
        assert data["data"]["search_totals"]["all_time"] == 0

    def test_get_search_analytics_with_data(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        db: Session,
        sample_items: list[Item],
    ) -> None:
        """Test getting analytics with sample data."""
        # Create some search logs
        logs = [
            SearchLog(query="python", result_count=5, source="web"),
            SearchLog(query="python", result_count=3, source="web"),
            SearchLog(query="testing", result_count=2, source="web"),
        ]
        db.add_all(logs)
        db.commit()

        response = client.get("/api/analytics/searches", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        assert data["data"]["search_totals"]["all_time"] == 3
        assert len(data["data"]["top_searches"]) > 0
        assert len(data["data"]["items_by_type"]) > 0


class TestSearchTotals:
    """Tests for GET /api/analytics/searches/totals endpoint."""

    def test_get_search_totals(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test getting search totals."""
        # Create some search logs
        logs = [
            SearchLog(query="test1", result_count=1, source="web"),
            SearchLog(query="test2", result_count=2, source="web"),
        ]
        db.add_all(logs)
        db.commit()

        response = client.get("/api/analytics/searches/totals", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        assert data["data"]["all_time"] == 2

    def test_search_totals_requires_auth(self, client: TestClient) -> None:
        """Test that endpoint requires authentication."""
        response = client.get("/api/analytics/searches/totals")
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401


class TestTopSearches:
    """Tests for GET /api/analytics/searches/top endpoint."""

    def test_get_top_searches(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test getting top search queries."""
        # Create search logs with repeating queries
        logs = [
            SearchLog(query="python", result_count=5, source="web"),
            SearchLog(query="python", result_count=3, source="web"),
            SearchLog(query="python", result_count=4, source="web"),
            SearchLog(query="javascript", result_count=2, source="web"),
        ]
        db.add_all(logs)
        db.commit()

        response = client.get("/api/analytics/searches/top", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        # Python should be top query with 3 searches
        assert len(data["data"]) >= 1
        assert data["data"][0]["query"] == "python"
        assert data["data"][0]["count"] == 3

    def test_top_searches_limit(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test limiting top searches."""
        # Create many search logs
        for i in range(15):
            log = SearchLog(query=f"query{i}", result_count=1, source="web")
            db.add(log)
        db.commit()

        response = client.get(
            "/api/analytics/searches/top?limit=5", headers=admin_headers
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) == 5


class TestSearchesBySource:
    """Tests for GET /api/analytics/searches/by-source endpoint."""

    def test_get_searches_by_source(
        self, client: TestClient, admin_headers: dict[str, str], db: Session
    ) -> None:
        """Test getting searches grouped by source."""
        # Create search logs
        logs = [
            SearchLog(query="test1", result_count=1, source="web"),
            SearchLog(query="test2", result_count=2, source="web"),
        ]
        db.add_all(logs)
        db.commit()

        response = client.get(
            "/api/analytics/searches/by-source", headers=admin_headers
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) >= 1
        # Should have "web" source with 2 searches
        web_source = next((s for s in data["data"] if s["source"] == "web"), None)
        assert web_source is not None
        assert web_source["count"] == 2


class TestItemsByType:
    """Tests for GET /api/analytics/items/by-type endpoint."""

    def test_get_items_by_type(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_items: list[Item],
    ) -> None:
        """Test getting items grouped by type."""
        response = client.get("/api/analytics/items/by-type", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        # Should have counts for each type in sample_items
        types_count = {item["type"]: item["count"] for item in data["data"]}
        assert "agent" in types_count
        assert "prompt" in types_count


class TestTopViewedItems:
    """Tests for GET /api/analytics/items/top-viewed endpoint."""

    def test_get_top_viewed_items(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_items: list[Item],
    ) -> None:
        """Test getting top viewed items."""
        response = client.get("/api/analytics/items/top-viewed", headers=admin_headers)
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) == 5  # sample_items has 5 items
        # Should be sorted by view_count descending
        views = [item["view_count"] for item in data["data"]]
        assert views == sorted(views, reverse=True)

    def test_top_viewed_items_limit(
        self,
        client: TestClient,
        admin_headers: dict[str, str],
        sample_items: list[Item],
    ) -> None:
        """Test limiting top viewed items."""
        response = client.get(
            "/api/analytics/items/top-viewed?limit=2", headers=admin_headers
        )
        assert response.status_code == 200

        data = response.json()
        assert len(data["data"]) == 2
