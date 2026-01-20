"""Caching utilities for API responses."""

from typing import Any, Awaitable, Callable
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Type alias for ASGI call_next
RequestResponseEndpoint = Callable[[Request], Awaitable[Response]]


class CacheMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add Cache-Control headers to API responses.

    Caching strategy:
    - Static reference data (categories, tags): 5 minutes cache (semi-static)
    - Search results: 1 minute cache (dynamic but can tolerate slight staleness)
    - Item listings: 1 minute cache
    - Individual items: 30 seconds cache (more dynamic due to view counts)
    - Admin endpoints: No cache (private data)
    - Health check: No cache
    """

    # Endpoints that should have longer cache times (reference data)
    STATIC_ENDPOINTS = [
        "/api/categories",
        "/api/tags",
    ]

    # Endpoints that should have short cache times
    SHORT_CACHE_ENDPOINTS = [
        "/api/items",
        "/api/search",
    ]

    # Endpoints that should never be cached
    NO_CACHE_ENDPOINTS = [
        "/api/auth",
        "/api/analytics",
        "/health",
    ]

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process request and add caching headers to response."""
        response = await call_next(request)

        # Only cache GET requests
        if request.method != "GET":
            response.headers["Cache-Control"] = "no-store"
            return response

        path = request.url.path

        # Check for admin endpoints (URL or header-based)
        auth_header = request.headers.get("Authorization", "")
        if auth_header or "/admin" in path:
            response.headers["Cache-Control"] = "no-store, private"
            return response

        # Check for no-cache endpoints
        for no_cache_path in self.NO_CACHE_ENDPOINTS:
            if path.startswith(no_cache_path):
                response.headers["Cache-Control"] = "no-store"
                return response

        # Check for static/reference data endpoints
        for static_path in self.STATIC_ENDPOINTS:
            if path == static_path:
                # 5 minutes public cache, must revalidate after
                response.headers["Cache-Control"] = "public, max-age=300, must-revalidate"
                response.headers["Vary"] = "Accept-Encoding"
                return response

        # Check for short cache endpoints
        for short_path in self.SHORT_CACHE_ENDPOINTS:
            if path.startswith(short_path):
                # Individual item endpoints (e.g., /api/items/123)
                if path.count("/") > 2 and any(c.isdigit() for c in path):
                    # 30 seconds cache for individual items
                    response.headers["Cache-Control"] = "public, max-age=30, must-revalidate"
                else:
                    # 1 minute cache for listings and search
                    response.headers["Cache-Control"] = "public, max-age=60, must-revalidate"
                response.headers["Vary"] = "Accept-Encoding"
                return response

        # Default: short cache for unknown GET endpoints
        response.headers["Cache-Control"] = "public, max-age=60"
        return response
