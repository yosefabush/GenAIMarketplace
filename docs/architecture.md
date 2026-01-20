# System Architecture

This document describes the architecture of the GenAI Marketplace platform.

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USERS                                       │
│                    (Developers, Admins)                                  │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         REVERSE PROXY (Nginx)                            │
│                    - SSL/TLS Termination                                 │
│                    - Static File Serving                                 │
│                    - Load Balancing                                      │
└─────────────────────────────────────────────────────────────────────────┘
                    │                               │
                    ▼                               ▼
┌──────────────────────────────┐    ┌──────────────────────────────────────┐
│        FRONTEND              │    │           BACKEND                     │
│     React Application        │    │        FastAPI Server                 │
│                              │    │                                       │
│  ┌────────────────────────┐  │    │  ┌─────────────────────────────────┐ │
│  │      Pages             │  │    │  │          Routers                │ │
│  │  - Home                │  │    │  │  - /api/items                   │ │
│  │  - Search              │  │    │  │  - /api/search                  │ │
│  │  - Item Detail         │  │    │  │  - /api/categories              │ │
│  │  - Admin Dashboard     │  │    │  │  - /api/tags                    │ │
│  │  - Content Editor      │  │    │  │  - /api/auth                    │ │
│  │  - Analytics           │  │    │  │  - /api/analytics               │ │
│  └────────────────────────┘  │    │  └─────────────────────────────────┘ │
│                              │    │                  │                    │
│  ┌────────────────────────┐  │    │                  ▼                    │
│  │     Components         │  │    │  ┌─────────────────────────────────┐ │
│  │  - SearchBar           │  │    │  │         Services                │ │
│  │  - ItemCard            │  │    │  │  - SearchService (FTS5)         │ │
│  │  - MarkdownEditor      │  │    │  │  - SearchLoggingService         │ │
│  │  - CodeBlock           │  │    │  └─────────────────────────────────┘ │
│  │  - FilterSidebar       │  │    │                  │                    │
│  └────────────────────────┘  │    │                  ▼                    │
│                              │    │  ┌─────────────────────────────────┐ │
│  ┌────────────────────────┐  │    │  │      SQLAlchemy ORM             │ │
│  │      Contexts          │  │    │  │         Models                  │ │
│  │  - AuthContext         │  │    │  │  - Item                         │ │
│  │  - ThemeContext        │  │    │  │  - Category                     │ │
│  │  - KeyboardShortcuts   │  │    │  │  - Tag                          │ │
│  └────────────────────────┘  │    │  │  - SearchLog                    │ │
│                              │    │  └─────────────────────────────────┘ │
└──────────────────────────────┘    └──────────────────────────────────────┘
              │                                       │
              │                                       ▼
              │                     ┌──────────────────────────────────────┐
              │                     │        SQLite Database               │
              └────────────────────▶│                                      │
                   (via API)        │  - Items table                       │
                                    │  - Categories table                  │
                                    │  - Tags table                        │
                                    │  - item_tags (join table)            │
                                    │  - search_logs table                 │
                                    │  - items_fts (FTS5 virtual table)    │
                                    └──────────────────────────────────────┘
```

## Component Details

### Frontend (React + TypeScript)

**Technology Stack:**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS v4 for styling
- Radix UI for accessible components
- React Router for navigation
- Axios for API communication

**Key Features:**
- Server-state management via API calls
- Client-side routing with URL-based state
- Dark/light theme support
- Keyboard navigation shortcuts
- Code splitting for admin routes

**Directory Structure:**
```
frontend/src/
├── components/       # Reusable UI components
│   ├── ui/          # Base UI primitives (Button, Input, etc.)
│   └── ...          # Feature components
├── contexts/        # React Context providers
├── hooks/           # Custom React hooks
├── lib/             # Utilities and API client
├── pages/           # Route page components
│   └── admin/       # Admin panel pages
└── test/            # Test files and utilities
```

### Backend (FastAPI + Python)

**Technology Stack:**
- FastAPI for REST API framework
- SQLAlchemy 2.0 for ORM
- Alembic for database migrations
- Pydantic v2 for data validation
- SQLite with FTS5 for full-text search

**Key Features:**
- Automatic OpenAPI documentation
- Admin token authentication
- Async-capable (though using sync SQLite)
- Request caching headers
- Background search logging

**Directory Structure:**
```
backend/app/
├── core/            # Configuration, database, auth, caching
├── models/          # SQLAlchemy ORM models
├── routers/         # API route handlers
├── schemas/         # Pydantic request/response schemas
├── services/        # Business logic (search, logging)
└── main.py          # Application entry point
```

### Database (SQLite)

**Why SQLite:**
- Simple deployment (single file)
- No separate database server needed
- Sufficient for 200 developers
- FTS5 for efficient full-text search

**Key Tables:**
- `items` - Marketplace content
- `categories` - Content organization
- `tags` - Content labeling
- `item_tags` - Many-to-many relationship
- `search_logs` - Query analytics
- `items_fts` - FTS5 virtual table

## Data Flow

### Search Flow

```
1. User enters search query
          │
          ▼
2. Frontend sends GET /api/search?q=...
          │
          ▼
3. Backend parses query and filters
          │
          ▼
4. SearchService queries FTS5 virtual table
          │
          ├──▶ 4a. FTS5 MATCH with BM25 ranking
          │
          ▼
5. Results joined with items, categories, tags
          │
          ▼
6. SearchLoggingService logs query (async)
          │
          ▼
7. JSON response returned to frontend
          │
          ▼
8. Frontend renders SearchResultCards
```

### Admin Content Creation Flow

```
1. Admin navigates to /admin/editor
          │
          ▼
2. AuthContext verifies token in localStorage
          │
          ▼
3. Admin fills form with markdown content
          │
          ├──▶ 3a. Auto-save to localStorage (every 30s)
          │
          ▼
4. Admin clicks Save
          │
          ▼
5. Frontend sends POST /api/items with Bearer token
          │
          ▼
6. Backend verify_admin_token validates Authorization header
          │
          ▼
7. SQLAlchemy creates Item with relationships
          │
          ▼
8. FTS5 trigger updates search index
          │
          ▼
9. JSON response confirms creation
          │
          ▼
10. Frontend clears draft, redirects to dashboard
```

## Authentication

### Admin Authentication Flow

```
┌──────────┐         ┌──────────┐         ┌──────────┐
│  Admin   │         │ Frontend │         │ Backend  │
└────┬─────┘         └────┬─────┘         └────┬─────┘
     │                    │                    │
     │ Enter token        │                    │
     │───────────────────▶│                    │
     │                    │                    │
     │                    │ POST /api/auth/    │
     │                    │ validate           │
     │                    │───────────────────▶│
     │                    │                    │
     │                    │     {valid: true}  │
     │                    │◀───────────────────│
     │                    │                    │
     │                    │ Store in           │
     │                    │ localStorage       │
     │                    │                    │
     │ Redirect to        │                    │
     │ dashboard          │                    │
     │◀───────────────────│                    │
     │                    │                    │
     │ Click edit item    │                    │
     │───────────────────▶│                    │
     │                    │                    │
     │                    │ GET /api/items/1   │
     │                    │ Authorization:     │
     │                    │ Bearer <token>     │
     │                    │───────────────────▶│
     │                    │                    │
     │                    │                    │ Verify token
     │                    │                    │ matches
     │                    │                    │ ADMIN_TOKEN
     │                    │                    │
     │                    │     Item data      │
     │                    │◀───────────────────│
```

## Caching Strategy

### Backend Cache Headers

| Endpoint Pattern | Cache Duration | Reason |
|-----------------|----------------|--------|
| `/api/categories` | 5 minutes | Rarely changes |
| `/api/tags` | 5 minutes | Rarely changes |
| `/api/search` | 1 minute | Balance freshness/performance |
| `/api/items` (list) | 1 minute | Balance freshness/performance |
| `/api/items/:id` | 30 seconds | View count updates frequently |
| `/api/analytics/*` | No cache | Admin data, private |

### Frontend Code Splitting

```
Main Bundle (329KB)
├── React core
├── Router
├── Home page
├── Search page
└── Item detail

Admin Bundle (loaded on demand)
├── Dashboard
├── Editor
├── Categories
├── Tags
└── Analytics

Vendor Bundles (cached separately)
├── vendor-react (98KB)
├── vendor-radix (99KB)
├── vendor-markdown (118KB)
└── vendor-syntax (622KB)
```

## Scalability Considerations

### Current Capacity
- Designed for ~200 concurrent developers
- Load tested at 50 concurrent users: 202 req/sec, p95 < 200ms

### Scaling Options

1. **Vertical Scaling**
   - Increase container resources
   - Add Gunicorn workers

2. **Horizontal Scaling**
   - Run multiple API containers
   - Use PostgreSQL instead of SQLite
   - Add Redis for session/cache

3. **CDN/Edge**
   - Serve frontend from CDN
   - Cache API responses at edge

## Security Architecture

### Authentication
- Bearer token authentication for admin endpoints
- Token validated on every admin request
- No user accounts (token-based access control)

### Authorization
- Public endpoints: Read-only access
- Admin endpoints: Require valid ADMIN_TOKEN
- No role-based access (single admin role)

### Data Protection
- SQLite file should be on encrypted volume
- HTTPS required in production
- Admin token should be rotated periodically
