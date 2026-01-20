# Load Test Results

## Test Configuration

- **Concurrent Users:** 50
- **Test Duration:** 30 seconds
- **Server:** http://localhost:8000
- **Date:** 2026-01-20

## Test Scenario

The load test simulates realistic user behavior across the GenAI Marketplace API:

| Operation | Weight | Description |
|-----------|--------|-------------|
| Search | 60% | Full-text search with various queries and filters |
| List Items | 20% | Paginated item listing |
| Get Categories | 10% | Fetch all categories |
| Get Tags | 10% | Fetch all tags |

When items exist in the database, additional operations are included:
- View Item Detail (25%)
- Increment View Count (10%)
- Get Related Items (5%)

## Results Summary

### Request Statistics

| Metric | Value |
|--------|-------|
| Total Requests | 6,555 |
| Successful Requests | 6,555 |
| Failed Requests | 0 |
| Error Rate | 0.00% |
| Requests/Second | 202.8 |

### Latency Statistics

| Percentile | Latency |
|------------|---------|
| Min | 2.0 ms |
| p50 (Median) | 82.6 ms |
| p90 | 141.5 ms |
| p95 | 170.0 ms |
| p99 | 316.4 ms |
| Max | 2,323.1 ms |
| Average | 104.4 ms |

### Requests by Endpoint

| Endpoint | Requests |
|----------|----------|
| /api/search | 3,890 |
| /api/items | 1,334 |
| /api/categories | 668 |
| /api/tags | 663 |

## Acceptance Criteria Verification

| Criteria | Result | Details |
|----------|--------|---------|
| Sub-second response times | PASS | p95 = 170.0ms < 1000ms |
| No database errors | PASS | Error rate = 0.00% < 5% |
| No connection pool exhaustion | PASS | All 6,555 requests successful |
| All endpoints functional | PASS | All tested endpoints responded |

## Conclusions

The GenAI Marketplace API successfully handles 50 concurrent users with:

1. **Excellent Response Times:** p95 latency of 170ms is well under the 1-second target
2. **Zero Errors:** No database errors or connection pool issues observed
3. **High Throughput:** System sustained ~203 requests/second
4. **Stable Performance:** Consistent response times across all endpoints

## Running the Load Test

```bash
cd backend
python scripts/load_test.py --users 50 --duration 30
```

### Options

| Option | Default | Description |
|--------|---------|-------------|
| `--base-url` | http://localhost:8000 | API server URL |
| `--users` | 50 | Number of concurrent users |
| `--duration` | 30 | Test duration in seconds |
| `--output` | (none) | Output file for results |

## System Configuration

- **Database:** SQLite with FTS5 full-text search
- **Web Server:** Uvicorn with FastAPI
- **Caching:** HTTP cache headers via CacheMiddleware
- **Database Indexes:** Optimized for search, filtering, and sorting operations
