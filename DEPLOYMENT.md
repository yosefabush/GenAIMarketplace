# Deployment Guide

This guide covers deploying the GenAI Marketplace platform to production.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Docker Deployment](#docker-deployment)
- [Manual Deployment](#manual-deployment)
- [Environment Configuration](#environment-configuration)
- [Database Management](#database-management)
- [Reverse Proxy Setup](#reverse-proxy-setup)
- [Backup Strategy](#backup-strategy)
- [Monitoring and Logging](#monitoring-and-logging)
- [Troubleshooting](#troubleshooting)

## Prerequisites

- Docker 20.10+ and Docker Compose v2.0+ (for containerized deployment)
- Python 3.11+ (for manual deployment)
- Node.js 18+ (for building frontend)
- Nginx or similar reverse proxy (for production)

## Docker Deployment

### Quick Start

The fastest way to deploy is using Docker Compose:

```bash
cd backend

# Set your admin token
export ADMIN_TOKEN=your-secure-token-here

# Build and start
docker compose up -d --build

# Verify it's running
docker compose ps
curl http://localhost:8000/health
```

### Docker Compose Configuration

The `docker-compose.yml` provides:

- **Automatic restart**: Container restarts unless manually stopped
- **Health checks**: Monitors `/health` endpoint every 30 seconds
- **Volume persistence**: SQLite database persisted in named volume
- **Environment variables**: Configurable via `.env` file or environment

```yaml
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "${PORT:-8000}:${PORT:-8000}"
    environment:
      - DATABASE_URL=sqlite:///./data/marketplace.db
      - ADMIN_TOKEN=${ADMIN_TOKEN:-changeme}
      - PORT=${PORT:-8000}
    volumes:
      - marketplace_data:/app/data
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health')"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 5s
    restart: unless-stopped

volumes:
  marketplace_data:
    driver: local
```

### Building the Docker Image Manually

```bash
# Build the image
docker build -t genai-marketplace:latest .

# Run the container
docker run -d \
  --name genai-marketplace \
  -p 8000:8000 \
  -e ADMIN_TOKEN=your-secure-token \
  -v marketplace_data:/app/data \
  genai-marketplace:latest
```

### Multi-Architecture Builds

For deploying to different architectures (e.g., ARM64 servers):

```bash
docker buildx build --platform linux/amd64,linux/arm64 \
  -t genai-marketplace:latest \
  --push .
```

## Manual Deployment

### Backend Deployment

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows

# Install production dependencies
pip install -r requirements.txt
pip install gunicorn

# Set environment variables
export DATABASE_URL=sqlite:///./data/marketplace.db
export ADMIN_TOKEN=your-secure-token
export PORT=8000

# Run database migrations
alembic upgrade head

# Start with Gunicorn (production server)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Frontend Deployment

```bash
cd frontend

# Install dependencies
npm ci

# Set API URL for production
echo "VITE_API_BASE_URL=https://your-api-domain.com" > .env

# Build for production
npm run build

# The dist/ folder contains static files for deployment
```

Deploy the `dist/` folder to:
- **Nginx**: Serve as static files
- **CDN**: Upload to S3/CloudFront, Vercel, Netlify, etc.
- **Docker**: Use nginx:alpine image to serve static files

## Environment Configuration

### Backend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | No | `sqlite:///./data/marketplace.db` | SQLAlchemy database URL |
| `ADMIN_TOKEN` | **Yes** | `changeme` | Admin API authentication token |
| `PORT` | No | `8000` | Port for the API server |

### Frontend Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_BASE_URL` | **Yes** | `http://localhost:8000` | Backend API URL |

### Production Environment File

Create a `.env` file in the backend directory:

```bash
# Production settings
DATABASE_URL=sqlite:///./data/marketplace.db
ADMIN_TOKEN=generate-a-strong-random-token-here
PORT=8000
```

Generate a secure admin token:
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Database Management

### Running Migrations

```bash
cd backend

# Activate virtual environment
source venv/bin/activate

# Run all pending migrations
alembic upgrade head

# Check current migration status
alembic current

# View migration history
alembic history
```

### Creating New Migrations

```bash
# Auto-generate migration from model changes
alembic revision --autogenerate -m "Description of changes"

# Create empty migration for manual edits
alembic revision -m "Description of changes"
```

### Database Backup

**Using Docker volume:**
```bash
# Create backup
docker run --rm \
  -v marketplace_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar czf /backup/marketplace-$(date +%Y%m%d-%H%M%S).tar.gz /data

# Restore from backup
docker run --rm \
  -v marketplace_data:/data \
  -v $(pwd)/backups:/backup \
  alpine tar xzf /backup/marketplace-YYYYMMDD-HHMMSS.tar.gz -C /
```

**Direct file backup:**
```bash
# Stop the application first
docker compose stop

# Copy the database file
cp data/marketplace.db backups/marketplace-$(date +%Y%m%d-%H%M%S).db

# Restart the application
docker compose start
```

### Automated Daily Backups

Create a cron job for daily backups:

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/backup-script.sh >> /var/log/marketplace-backup.log 2>&1
```

Example backup script (`backup-script.sh`):
```bash
#!/bin/bash
BACKUP_DIR=/path/to/backups
DATE=$(date +%Y%m%d-%H%M%S)

# Create backup
docker run --rm \
  -v marketplace_data:/data \
  -v ${BACKUP_DIR}:/backup \
  alpine tar czf /backup/marketplace-${DATE}.tar.gz /data

# Keep only last 7 days of backups
find ${BACKUP_DIR} -name "marketplace-*.tar.gz" -mtime +7 -delete
```

## Reverse Proxy Setup

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name marketplace.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name marketplace.example.com;

    ssl_certificate /etc/letsencrypt/live/marketplace.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/marketplace.example.com/privkey.pem;

    # API backend
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:8000/health;
    }

    # API documentation
    location /docs {
        proxy_pass http://localhost:8000/docs;
    }

    location /redoc {
        proxy_pass http://localhost:8000/redoc;
    }

    location /openapi.json {
        proxy_pass http://localhost:8000/openapi.json;
    }

    # Frontend static files
    location / {
        root /var/www/marketplace/dist;
        try_files $uri $uri/ /index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
```

### Obtaining SSL Certificates

Using Let's Encrypt with Certbot:

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d marketplace.example.com

# Auto-renewal is configured automatically
```

## Monitoring and Logging

### Health Check Endpoint

The API provides a health check endpoint:

```bash
curl http://localhost:8000/health
# Response: {"status": "healthy"}
```

### Docker Logs

```bash
# View logs
docker compose logs -f

# View last 100 lines
docker compose logs --tail=100

# View specific service logs
docker compose logs -f api
```

### Log Rotation

Configure Docker log rotation in `/etc/docker/daemon.json`:

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Monitoring Recommendations

- **Uptime monitoring**: Pingdom, UptimeRobot, or similar to monitor `/health`
- **Application metrics**: Consider adding Prometheus metrics endpoint
- **Error tracking**: Sentry or similar for error aggregation

## Troubleshooting

### Container Won't Start

```bash
# Check container status
docker compose ps -a

# View detailed logs
docker compose logs api

# Check for port conflicts
lsof -i :8000
```

### Database Permission Issues

```bash
# Check data directory permissions
docker exec genai-marketplace ls -la /app/data

# Fix permissions if needed
docker exec genai-marketplace chown -R appuser:appuser /app/data
```

### Port Already in Use

```bash
# Find process using port
lsof -i :8000

# Change port in docker-compose.yml or environment
export PORT=9000
docker compose up -d
```

### Database Corruption

```bash
# Stop the application
docker compose stop

# Check database integrity
sqlite3 data/marketplace.db "PRAGMA integrity_check;"

# If corrupted, restore from backup
cp backups/marketplace-latest.db data/marketplace.db

# Restart
docker compose start
```

### API Authentication Issues

```bash
# Verify admin token is set
docker compose exec api printenv | grep ADMIN_TOKEN

# Test admin endpoint
curl -H "Authorization: Bearer your-admin-token" http://localhost:8000/api/analytics/searches
```

## Security Checklist

- [ ] Change default `ADMIN_TOKEN` to a strong, unique value
- [ ] Enable HTTPS with valid SSL certificates
- [ ] Configure firewall to restrict database port access
- [ ] Set up regular database backups
- [ ] Review and restrict CORS settings for production
- [ ] Enable rate limiting on the reverse proxy
- [ ] Monitor logs for suspicious activity
