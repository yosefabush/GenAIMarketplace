"""Tests for authentication middleware and auth endpoints."""

from fastapi.testclient import TestClient


class TestAdminTokenValidation:
    """Tests for admin token validation middleware."""

    def test_valid_admin_token(
        self, client: TestClient, admin_headers: dict[str, str]
    ) -> None:
        """Test that valid admin token allows access to protected endpoints."""
        # Create a category to test admin access
        response = client.post(
            "/api/categories",
            json={"name": "Test", "slug": "test"},
            headers=admin_headers,
        )
        assert response.status_code == 201

    def test_invalid_admin_token(self, client: TestClient) -> None:
        """Test that invalid admin token returns 401."""
        headers = {"Authorization": "Bearer invalid-token"}
        response = client.post(
            "/api/categories",
            json={"name": "Test", "slug": "test"},
            headers=headers,
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid admin token"

    def test_missing_auth_header(self, client: TestClient) -> None:
        """Test that missing auth header returns 401 (HTTPBearer behavior)."""
        response = client.post(
            "/api/categories",
            json={"name": "Test", "slug": "test"},
        )
        # HTTPBearer returns 401 for missing auth header
        assert response.status_code == 401

    def test_malformed_auth_header(self, client: TestClient) -> None:
        """Test that malformed auth header is rejected."""
        # No Bearer prefix
        headers = {"Authorization": "test-admin-token"}
        response = client.post(
            "/api/categories",
            json={"name": "Test", "slug": "test"},
            headers=headers,
        )
        # HTTPBearer returns 401 for malformed auth header
        assert response.status_code == 401

    def test_empty_token(self, client: TestClient) -> None:
        """Test that empty token is rejected."""
        headers = {"Authorization": "Bearer "}
        response = client.post(
            "/api/categories",
            json={"name": "Test", "slug": "test"},
            headers=headers,
        )
        assert response.status_code == 401


class TestAuthValidateEndpoint:
    """Tests for POST /api/auth/validate endpoint."""

    def test_validate_valid_token(self, client: TestClient) -> None:
        """Test validating a correct admin token."""
        response = client.post(
            "/api/auth/validate",
            json={"token": "test-admin-token"},
        )
        assert response.status_code == 200

        data = response.json()
        assert data["success"] is True
        assert data["valid"] is True
        assert data["message"] == "Token is valid"

    def test_validate_invalid_token(self, client: TestClient) -> None:
        """Test validating an incorrect admin token."""
        response = client.post(
            "/api/auth/validate",
            json={"token": "wrong-token"},
        )
        assert response.status_code == 401
        assert response.json()["detail"] == "Invalid admin token"

    def test_validate_empty_token(self, client: TestClient) -> None:
        """Test validating an empty token."""
        response = client.post(
            "/api/auth/validate",
            json={"token": ""},
        )
        assert response.status_code == 401

    def test_validate_missing_token(self, client: TestClient) -> None:
        """Test validating without token field."""
        response = client.post(
            "/api/auth/validate",
            json={},
        )
        assert response.status_code == 422  # Validation error
