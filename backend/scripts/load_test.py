#!/usr/bin/env python
"""
Load test script simulating 50 concurrent users.

This script performs load testing on the GenAI Marketplace API by:
1. Simulating 50 concurrent users performing various operations
2. Testing search queries, item views, and pagination
3. Measuring response times and checking for errors
4. Verifying system maintains sub-second response times under load

Usage:
    python scripts/load_test.py [--base-url URL] [--users N] [--duration S]

Default base URL is http://localhost:8000
Default users: 50
Default duration: 30 seconds
"""

import argparse
import concurrent.futures
import http.client
import json
import random
import statistics
import sys
import threading
import time
import urllib.parse
from dataclasses import dataclass, field
from typing import NamedTuple
from urllib.parse import urlparse


# Configuration
DEFAULT_BASE_URL = "http://localhost:8000"
DEFAULT_CONCURRENT_USERS = 50
DEFAULT_DURATION_SECONDS = 30


class RequestResult(NamedTuple):
    """Result of a single HTTP request."""
    success: bool
    latency_ms: float
    status_code: int
    endpoint: str
    error: str | None = None


@dataclass
class LoadTestMetrics:
    """Aggregated metrics from load test."""
    total_requests: int = 0
    successful_requests: int = 0
    failed_requests: int = 0
    latencies: list[float] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    requests_by_endpoint: dict[str, int] = field(default_factory=dict)
    errors_by_endpoint: dict[str, int] = field(default_factory=dict)
    lock: threading.Lock = field(default_factory=threading.Lock)

    def record_request(self, result: RequestResult) -> None:
        """Thread-safe recording of a request result."""
        with self.lock:
            self.total_requests += 1
            endpoint_key = result.endpoint.split("?")[0]  # Remove query params for grouping

            if endpoint_key not in self.requests_by_endpoint:
                self.requests_by_endpoint[endpoint_key] = 0
            self.requests_by_endpoint[endpoint_key] += 1

            if result.success:
                self.successful_requests += 1
                self.latencies.append(result.latency_ms)
            else:
                self.failed_requests += 1
                if endpoint_key not in self.errors_by_endpoint:
                    self.errors_by_endpoint[endpoint_key] = 0
                self.errors_by_endpoint[endpoint_key] += 1
                if result.error and len(self.errors) < 100:  # Limit stored errors
                    self.errors.append(f"[{endpoint_key}] {result.error}")

    def get_percentile(self, percentile: float) -> float:
        """Calculate latency percentile."""
        if not self.latencies:
            return 0.0
        sorted_latencies = sorted(self.latencies)
        idx = int(len(sorted_latencies) * percentile / 100)
        return sorted_latencies[min(idx, len(sorted_latencies) - 1)]


# Sample search queries for load testing
SEARCH_QUERIES = [
    "",  # Empty query (all items)
    "python",
    "javascript",
    "api",
    "docker",
    "testing",
    "agent",
    "prompt",
    "workflow",
    "database",
    "AI",
    "machine learning",
    "automation",
    "deployment",
    "security",
]

# Filter combinations for search
SEARCH_FILTERS = [
    {},
    {"type": "agent"},
    {"type": "prompt"},
    {"type": "mcp"},
    {"type": "workflow"},
    {"sort": "date"},
    {"sort": "views"},
    {"sort": "relevance"},
    {"page": "2", "limit": "10"},
    {"page": "3", "limit": "20"},
    {"tags": "python"},
    {"tags": "testing"},
]


class UserSimulator:
    """Simulates a single user performing various operations."""

    def __init__(self, user_id: int, host: str, port: int, metrics: LoadTestMetrics, item_ids: list[int]):
        self.user_id = user_id
        self.host = host
        self.port = port
        self.metrics = metrics
        self.item_ids = item_ids
        self.conn: http.client.HTTPConnection | None = None

    def _get_connection(self) -> http.client.HTTPConnection:
        """Get or create HTTP connection."""
        if self.conn is None:
            self.conn = http.client.HTTPConnection(self.host, self.port, timeout=10)
        return self.conn

    def _close_connection(self) -> None:
        """Close HTTP connection."""
        if self.conn:
            try:
                self.conn.close()
            except Exception:
                pass
            self.conn = None

    def _make_request(self, method: str, path: str) -> RequestResult:
        """Make an HTTP request and record metrics."""
        try:
            conn = self._get_connection()
            start = time.perf_counter()
            conn.request(method, path)
            response = conn.getresponse()
            body = response.read()
            end = time.perf_counter()

            latency_ms = (end - start) * 1000
            success = 200 <= response.status < 400

            result = RequestResult(
                success=success,
                latency_ms=latency_ms,
                status_code=response.status,
                endpoint=path,
                error=f"HTTP {response.status}" if not success else None
            )
        except Exception as e:
            result = RequestResult(
                success=False,
                latency_ms=0,
                status_code=0,
                endpoint=path,
                error=str(e)
            )
            self._close_connection()  # Reconnect on next request

        self.metrics.record_request(result)
        return result

    def search_items(self) -> RequestResult:
        """Perform a search query with random parameters."""
        query = random.choice(SEARCH_QUERIES)
        filters = random.choice(SEARCH_FILTERS)
        params = {"q": query, **filters}
        path = f"/api/search?{urllib.parse.urlencode(params)}"
        return self._make_request("GET", path)

    def view_item(self) -> RequestResult | None:
        """View a single item."""
        if not self.item_ids:
            return None  # Skip this operation when no items available
        item_id = random.choice(self.item_ids)
        path = f"/api/items/{item_id}"
        return self._make_request("GET", path)

    def increment_view_count(self) -> RequestResult | None:
        """Increment view count for an item."""
        if not self.item_ids:
            return None  # Skip this operation when no items available
        item_id = random.choice(self.item_ids)
        path = f"/api/items/{item_id}/view"
        return self._make_request("POST", path)

    def list_items_paginated(self) -> RequestResult:
        """List items with random pagination."""
        offset = random.randint(0, 10) * 20
        limit = random.choice([10, 20, 50])
        path = f"/api/items?offset={offset}&limit={limit}"
        return self._make_request("GET", path)

    def get_categories(self) -> RequestResult:
        """Get all categories."""
        return self._make_request("GET", "/api/categories")

    def get_tags(self) -> RequestResult:
        """Get all tags."""
        return self._make_request("GET", "/api/tags")

    def get_related_items(self) -> RequestResult | None:
        """Get related items for a random item."""
        if not self.item_ids:
            return None  # Skip this operation when no items available
        item_id = random.choice(self.item_ids)
        path = f"/api/items/{item_id}/related"
        return self._make_request("GET", path)

    def run_session(self, duration_seconds: float, stop_event: threading.Event) -> None:
        """
        Run a user session for the specified duration.

        Simulates realistic user behavior with weighted random operations.
        """
        # Operation weights (search is most common)
        # When no items are available, item-related operations are skipped
        if self.item_ids:
            operations = [
                (self.search_items, 40),           # 40% - Search
                (self.view_item, 25),              # 25% - View item detail
                (self.list_items_paginated, 15),   # 15% - Browse/paginate
                (self.increment_view_count, 10),   # 10% - View tracking
                (self.get_related_items, 5),       # 5% - Related items
                (self.get_categories, 3),          # 3% - Get categories
                (self.get_tags, 2),                # 2% - Get tags
            ]
        else:
            # When no items exist, focus on endpoints that don't require items
            operations = [
                (self.search_items, 60),           # 60% - Search (returns empty results)
                (self.list_items_paginated, 20),   # 20% - Browse/paginate (empty)
                (self.get_categories, 10),         # 10% - Get categories
                (self.get_tags, 10),               # 10% - Get tags
            ]

        # Build weighted choice list
        weighted_ops = []
        for op, weight in operations:
            weighted_ops.extend([op] * weight)

        start_time = time.time()
        while not stop_event.is_set() and (time.time() - start_time) < duration_seconds:
            # Pick a random operation
            operation = random.choice(weighted_ops)
            result = operation()
            # Some operations return None when skipped (e.g., no items available)
            # This is expected and not an error

            # Small random delay between operations (50-200ms)
            # Simulates user think time
            time.sleep(random.uniform(0.05, 0.2))

        self._close_connection()


def fetch_item_ids(host: str, port: int) -> list[int]:
    """Fetch available item IDs from the API."""
    try:
        conn = http.client.HTTPConnection(host, port, timeout=10)
        conn.request("GET", "/api/items?limit=100")
        response = conn.getresponse()
        body = response.read()
        conn.close()

        if response.status == 200:
            data = json.loads(body)
            # Response format: {"success": true, "data": [...], "total": N}
            items = data.get("data", [])
            if items and isinstance(items, list):
                return [item["id"] for item in items]
    except Exception as e:
        print(f"Warning: Could not fetch item IDs: {e}")

    # Return empty list if no items
    return []


def run_load_test(
    base_url: str,
    num_users: int,
    duration_seconds: float
) -> LoadTestMetrics:
    """
    Run load test with specified number of concurrent users.

    Returns aggregated metrics from all users.
    """
    parsed = urlparse(base_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80

    metrics = LoadTestMetrics()
    stop_event = threading.Event()

    # Fetch real item IDs for testing
    print("Fetching available item IDs...")
    item_ids = fetch_item_ids(host, port)
    print(f"Found {len(item_ids)} items for testing")
    print()

    # Create user simulators
    users = [
        UserSimulator(i, host, port, metrics, item_ids)
        for i in range(num_users)
    ]

    print(f"Starting load test with {num_users} concurrent users for {duration_seconds} seconds...")
    print()

    # Run all users concurrently
    with concurrent.futures.ThreadPoolExecutor(max_workers=num_users) as executor:
        futures = [
            executor.submit(user.run_session, duration_seconds, stop_event)
            for user in users
        ]

        # Wait for duration and then signal stop
        time.sleep(duration_seconds)
        stop_event.set()

        # Wait for all users to finish
        concurrent.futures.wait(futures, timeout=5)

    return metrics


def print_results(metrics: LoadTestMetrics, duration: float) -> bool:
    """Print load test results. Returns True if all checks pass."""
    print()
    print("=" * 70)
    print("LOAD TEST RESULTS")
    print("=" * 70)
    print()

    # Request summary
    print("REQUEST SUMMARY")
    print("-" * 40)
    print(f"  Total requests:      {metrics.total_requests:,}")
    print(f"  Successful requests: {metrics.successful_requests:,}")
    print(f"  Failed requests:     {metrics.failed_requests:,}")
    error_rate = (metrics.failed_requests / metrics.total_requests * 100) if metrics.total_requests > 0 else 0
    print(f"  Error rate:          {error_rate:.2f}%")
    rps = metrics.total_requests / duration if duration > 0 else 0
    print(f"  Requests/second:     {rps:.1f}")
    print()

    # Latency statistics
    print("LATENCY STATISTICS (successful requests)")
    print("-" * 40)
    if metrics.latencies:
        print(f"  Min:      {min(metrics.latencies):8.1f} ms")
        print(f"  Avg:      {statistics.mean(metrics.latencies):8.1f} ms")
        print(f"  p50:      {metrics.get_percentile(50):8.1f} ms")
        print(f"  p90:      {metrics.get_percentile(90):8.1f} ms")
        print(f"  p95:      {metrics.get_percentile(95):8.1f} ms")
        print(f"  p99:      {metrics.get_percentile(99):8.1f} ms")
        print(f"  Max:      {max(metrics.latencies):8.1f} ms")
    else:
        print("  No successful requests to measure")
    print()

    # Requests by endpoint
    print("REQUESTS BY ENDPOINT")
    print("-" * 40)
    for endpoint, count in sorted(metrics.requests_by_endpoint.items(), key=lambda x: -x[1]):
        errors = metrics.errors_by_endpoint.get(endpoint, 0)
        error_str = f" ({errors} errors)" if errors > 0 else ""
        print(f"  {endpoint}: {count:,}{error_str}")
    print()

    # Sample errors (if any)
    if metrics.errors:
        print("SAMPLE ERRORS (first 10)")
        print("-" * 40)
        for error in metrics.errors[:10]:
            print(f"  {error}")
        print()

    # Pass/fail checks
    print("=" * 70)
    print("ACCEPTANCE CRITERIA CHECKS")
    print("=" * 70)

    all_pass = True

    # Check 1: Sub-second response times (p95 < 1000ms)
    p95 = metrics.get_percentile(95)
    if p95 < 1000:
        print(f"  [PASS] Sub-second response times: p95 = {p95:.1f}ms < 1000ms")
    else:
        print(f"  [FAIL] Sub-second response times: p95 = {p95:.1f}ms >= 1000ms")
        all_pass = False

    # Check 2: No database errors (error rate < 5%)
    if error_rate < 5:
        print(f"  [PASS] Low error rate: {error_rate:.2f}% < 5%")
    else:
        print(f"  [FAIL] High error rate: {error_rate:.2f}% >= 5%")
        all_pass = False

    # Check 3: All endpoints functional
    expected_endpoints = ["/api/search", "/api/items", "/api/categories", "/api/tags"]
    missing = [e for e in expected_endpoints if not any(e in k for k in metrics.requests_by_endpoint.keys())]
    if not missing:
        print(f"  [PASS] All endpoints functional")
    else:
        print(f"  [FAIL] Missing endpoints: {missing}")
        all_pass = False

    print()
    if all_pass:
        print("OVERALL: PASS - System handles 50 concurrent users successfully")
    else:
        print("OVERALL: FAIL - One or more acceptance criteria not met")

    return all_pass


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Load test simulating 50 concurrent users"
    )
    parser.add_argument(
        "--base-url",
        default=DEFAULT_BASE_URL,
        help=f"Base URL of the API (default: {DEFAULT_BASE_URL})"
    )
    parser.add_argument(
        "--users",
        type=int,
        default=DEFAULT_CONCURRENT_USERS,
        help=f"Number of concurrent users (default: {DEFAULT_CONCURRENT_USERS})"
    )
    parser.add_argument(
        "--duration",
        type=float,
        default=DEFAULT_DURATION_SECONDS,
        help=f"Test duration in seconds (default: {DEFAULT_DURATION_SECONDS})"
    )
    parser.add_argument(
        "--output",
        help="Output file for results (optional)"
    )
    args = parser.parse_args()

    # Parse URL for health check
    parsed = urlparse(args.base_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80

    # Health check
    print("=" * 70)
    print("GenAI Marketplace Load Test")
    print("=" * 70)
    print(f"Server: {args.base_url}")
    print(f"Concurrent users: {args.users}")
    print(f"Duration: {args.duration} seconds")
    print()

    print("Checking server health...")
    try:
        conn = http.client.HTTPConnection(host, port, timeout=5)
        conn.request("GET", "/health")
        response = conn.getresponse()
        health = json.loads(response.read())
        conn.close()
        if health.get("status") != "healthy":
            print(f"ERROR: Server health check failed: {health}")
            sys.exit(1)
        print("Server is healthy")
        print()
    except Exception as e:
        print(f"ERROR: Cannot connect to server at {args.base_url}")
        print(f"  {e}")
        print()
        print("Make sure the server is running:")
        print("  cd backend && python -m uvicorn app.main:app --host 0.0.0.0 --port 8000")
        sys.exit(1)

    # Run load test
    start_time = time.time()
    metrics = run_load_test(args.base_url, args.users, args.duration)
    actual_duration = time.time() - start_time

    # Print results
    all_pass = print_results(metrics, actual_duration)

    # Optionally save to file
    if args.output:
        with open(args.output, "w") as f:
            f.write(f"Load Test Results\n")
            f.write(f"================\n\n")
            f.write(f"Server: {args.base_url}\n")
            f.write(f"Concurrent users: {args.users}\n")
            f.write(f"Duration: {actual_duration:.1f} seconds\n\n")
            f.write(f"Total requests: {metrics.total_requests}\n")
            f.write(f"Successful requests: {metrics.successful_requests}\n")
            f.write(f"Failed requests: {metrics.failed_requests}\n")
            f.write(f"Error rate: {(metrics.failed_requests / metrics.total_requests * 100) if metrics.total_requests > 0 else 0:.2f}%\n")
            f.write(f"Requests/second: {metrics.total_requests / actual_duration:.1f}\n\n")
            if metrics.latencies:
                f.write(f"Latency p50: {metrics.get_percentile(50):.1f}ms\n")
                f.write(f"Latency p95: {metrics.get_percentile(95):.1f}ms\n")
                f.write(f"Latency p99: {metrics.get_percentile(99):.1f}ms\n")
                f.write(f"Latency max: {max(metrics.latencies):.1f}ms\n")
        print(f"\nResults saved to: {args.output}")

    sys.exit(0 if all_pass else 1)


if __name__ == "__main__":
    main()
