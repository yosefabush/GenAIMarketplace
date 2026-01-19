# Docker Deployment Guide

This document describes how to build and run the GenAI Marketplace API using Docker.

## Prerequisites

- Docker 20.10 or higher
- Docker Compose v2.0 or higher (optional, for easier deployment)

## Quick Start with Docker Compose

The easiest way to run the application:

```bash
# Build and run
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

The API will be available at http://localhost:8000.

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `ADMIN_TOKEN` | Token for admin API authentication | `changeme` |
| `PORT` | Port to run the API on | `8000` |
| `DATABASE_URL` | SQLAlchemy database URL | `sqlite:///./data/marketplace.db` |

### Setting Environment Variables

Create a `.env` file in the backend directory:

```bash
ADMIN_TOKEN=your-secure-token-here
PORT=8000
```

Or pass them directly to docker compose:

```bash
ADMIN_TOKEN=your-secure-token docker compose up -d
```

## Building Manually

### Build the Image

```bash
docker build -t genai-marketplace:latest .
```

### Run the Container

```bash
# Basic run
docker run -d \
  --name genai-marketplace \
  -p 8000:8000 \
  -e ADMIN_TOKEN=your-secure-token \
  genai-marketplace:latest

# With persistent database volume
docker run -d \
  --name genai-marketplace \
  -p 8000:8000 \
  -e ADMIN_TOKEN=your-secure-token \
  -v marketplace_data:/app/data \
  genai-marketplace:latest
```

### Database Persistence

The SQLite database is stored at `/app/data/marketplace.db` inside the container. To persist data:

**Using Docker volume (recommended):**
```bash
docker run -v marketplace_data:/app/data ...
```

**Using bind mount:**
```bash
docker run -v /path/on/host:/app/data ...
```

## Health Check

The container includes a health check that polls the `/health` endpoint every 30 seconds.

Check container health:
```bash
docker inspect --format='{{.State.Health.Status}}' genai-marketplace
```

Manual health check:
```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

## API Documentation

Once running, access the interactive API documentation at:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Production Considerations

1. **Change the default admin token**: The default `ADMIN_TOKEN=changeme` is insecure. Always set a strong, unique token in production.

2. **Use a proper database**: For production workloads, consider using PostgreSQL instead of SQLite:
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/marketplace
   ```

3. **Run behind a reverse proxy**: Use nginx, Traefik, or similar for TLS termination.

4. **Set resource limits**:
   ```bash
   docker run --memory=512m --cpus=1 ...
   ```

5. **Backup the database volume**:
   ```bash
   docker run --rm -v marketplace_data:/data -v $(pwd):/backup \
     alpine tar czf /backup/marketplace-backup.tar.gz /data
   ```

## Troubleshooting

### Container won't start
Check logs:
```bash
docker logs genai-marketplace
```

### Database permission issues
Ensure the data directory is writable:
```bash
docker exec genai-marketplace ls -la /app/data
```

### Port already in use
Change the host port mapping:
```bash
docker run -p 9000:8000 ...  # Maps host port 9000 to container port 8000
```
