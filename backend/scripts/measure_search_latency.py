#!/usr/bin/env python
"""
Script to measure search API p95 latency with 100 queries.

This script measures the performance of the search endpoint by:
1. Running 100 search queries with various parameters
2. Calculating p50, p95, p99, and max latency
3. Reporting whether the p95 is under 500ms target

Usage:
    python scripts/measure_search_latency.py [--base-url URL]

Default base URL is http://localhost:8000
"""

import argparse
import statistics
import sys
import time
from typing import NamedTuple
import urllib.parse
import http.client
import json
from urllib.parse import urlparse


class LatencyResult(NamedTuple):
    """Result of latency measurement."""
    p50: float
    p95: float
    p99: float
    max_latency: float
    min_latency: float
    avg: float
    total_queries: int
    successful_queries: int


# Sample search queries to test various patterns
SAMPLE_QUERIES = [
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
    "code",
    "AI",
    "machine learning",
    "automation",
    "deployment",
    "authentication",
    "security",
    "performance",
    "optimization",
    "debug",
]

# Filter variations to test
FILTER_VARIATIONS = [
    {},
    {"type": "agent"},
    {"type": "prompt"},
    {"type": "mcp"},
    {"sort": "date"},
    {"sort": "views"},
    {"page": "2"},
    {"limit": "10"},
]


def measure_query(conn: http.client.HTTPConnection, query: str, filters: dict) -> float | None:
    """
    Measure the latency of a single search query using persistent connection.

    Returns latency in milliseconds or None if the request failed.
    """
    params = {"q": query, **filters}
    path = f"/api/search?{urllib.parse.urlencode(params)}"

    try:
        start = time.perf_counter()
        conn.request("GET", path)
        response = conn.getresponse()
        response.read()  # Ensure we read the full response
        end = time.perf_counter()
        return (end - start) * 1000  # Convert to milliseconds
    except Exception as e:
        print(f"  Warning: Query failed - {e}", file=sys.stderr)
        return None


def run_latency_test(base_url: str, num_queries: int = 100) -> LatencyResult:
    """
    Run latency test with specified number of queries.

    Distributes queries across various search terms and filter combinations.
    Uses a persistent HTTP connection for accurate latency measurement.
    """
    latencies: list[float] = []
    failed = 0

    # Parse base URL to get host and port
    parsed = urlparse(base_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80

    print(f"Running {num_queries} search queries against {base_url}...")
    print()

    # Use persistent connection
    conn = http.client.HTTPConnection(host, port, timeout=10)

    try:
        for i in range(num_queries):
            # Select query and filters for this iteration
            query = SAMPLE_QUERIES[i % len(SAMPLE_QUERIES)]
            filters = FILTER_VARIATIONS[i % len(FILTER_VARIATIONS)]

            latency = measure_query(conn, query, filters)

            if latency is not None:
                latencies.append(latency)
            else:
                failed += 1
                # Reconnect on failure
                conn.close()
                conn = http.client.HTTPConnection(host, port, timeout=10)

            # Progress indicator (every 10 queries)
            if (i + 1) % 10 == 0 or i == num_queries - 1:
                print(f"  Completed {i + 1}/{num_queries} queries")
    finally:
        conn.close()

    if not latencies:
        print("ERROR: All queries failed!")
        sys.exit(1)

    # Sort latencies for percentile calculations
    sorted_latencies = sorted(latencies)
    n = len(sorted_latencies)

    # Calculate percentiles
    p50_idx = int(n * 0.50)
    p95_idx = int(n * 0.95)
    p99_idx = int(n * 0.99)

    return LatencyResult(
        p50=sorted_latencies[p50_idx] if n > 0 else 0,
        p95=sorted_latencies[p95_idx] if n > 0 else 0,
        p99=sorted_latencies[min(p99_idx, n - 1)] if n > 0 else 0,
        max_latency=max(sorted_latencies),
        min_latency=min(sorted_latencies),
        avg=statistics.mean(sorted_latencies),
        total_queries=num_queries,
        successful_queries=n,
    )


def main() -> None:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Measure search API p95 latency"
    )
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Base URL of the API (default: http://localhost:8000)"
    )
    parser.add_argument(
        "--queries",
        type=int,
        default=100,
        help="Number of queries to run (default: 100)"
    )
    args = parser.parse_args()

    # Parse URL for health check
    parsed = urlparse(args.base_url)
    host = parsed.hostname or "localhost"
    port = parsed.port or 80

    # First, check if the server is running
    try:
        conn = http.client.HTTPConnection(host, port, timeout=5)
        conn.request("GET", "/health")
        response = conn.getresponse()
        health = json.loads(response.read())
        conn.close()
        if health.get("status") != "healthy":
            print(f"ERROR: Server health check failed: {health}")
            sys.exit(1)
    except Exception as e:
        print(f"ERROR: Cannot connect to server at {args.base_url}")
        print(f"  {e}")
        print("\nMake sure the server is running:")
        print("  cd backend && python -m uvicorn app.main:app --reload")
        sys.exit(1)

    print("=" * 60)
    print("Search API Latency Measurement")
    print("=" * 60)
    print(f"Target: p95 < 500ms")
    print(f"Server: {args.base_url}")
    print()

    result = run_latency_test(args.base_url, args.queries)

    print()
    print("=" * 60)
    print("Results")
    print("=" * 60)
    print(f"Total queries:      {result.total_queries}")
    print(f"Successful queries: {result.successful_queries}")
    print(f"Failed queries:     {result.total_queries - result.successful_queries}")
    print()
    print("Latency Statistics:")
    print(f"  Min:    {result.min_latency:7.1f} ms")
    print(f"  Avg:    {result.avg:7.1f} ms")
    print(f"  p50:    {result.p50:7.1f} ms")
    print(f"  p95:    {result.p95:7.1f} ms")
    print(f"  p99:    {result.p99:7.1f} ms")
    print(f"  Max:    {result.max_latency:7.1f} ms")
    print()

    # Check if p95 meets target
    target = 500.0
    if result.p95 < target:
        print(f"PASS: p95 latency ({result.p95:.1f}ms) is under {target}ms target")
        sys.exit(0)
    else:
        print(f"FAIL: p95 latency ({result.p95:.1f}ms) exceeds {target}ms target")
        sys.exit(1)


if __name__ == "__main__":
    main()
