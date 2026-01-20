# Database Schema

This document describes the database schema for the GenAI Marketplace platform.

## Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATABASE SCHEMA                                 │
│                            GenAI Marketplace                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────┐         ┌─────────────────────────┐
│       categories        │         │          tags           │
├─────────────────────────┤         ├─────────────────────────┤
│ PK  id          INTEGER │         │ PK  id          INTEGER │
│     name        VARCHAR │         │ UK  name        VARCHAR │
│ UK  slug        VARCHAR │         │     created_at DATETIME │
│ FK  parent_id   INTEGER │◀──┐     └───────────┬─────────────┘
│     created_at DATETIME │   │                 │
│     updated_at DATETIME │   │                 │
└───────────┬─────────────┘   │                 │
            │                 │                 │
            │ self-ref        │                 │
            └─────────────────┘                 │
            │                                   │
            │ 1                                 │ M
            │                                   │
            ▼                                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                            items                                 │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              INTEGER                                      │
│     title           VARCHAR(200)    NOT NULL                     │
│     description     TEXT            NOT NULL                     │
│     content         TEXT            NOT NULL     (Markdown)      │
│     type            VARCHAR(50)     NOT NULL     (enum-like)     │
│ FK  category_id     INTEGER         NULLABLE     → categories.id │
│     view_count      INTEGER         DEFAULT 0                    │
│     created_at      DATETIME        DEFAULT NOW                  │
│     updated_at      DATETIME        DEFAULT NOW  ON UPDATE       │
└─────────────────────────────────────────────────────────────────┘
            │                                   ▲
            │ M                                 │ M
            │                                   │
            ▼                                   │
┌─────────────────────────┐                     │
│       item_tags         │─────────────────────┘
├─────────────────────────┤
│ PK,FK item_id   INTEGER │ → items.id    (CASCADE DELETE)
│ PK,FK tag_id    INTEGER │ → tags.id     (CASCADE DELETE)
└─────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                        search_logs                               │
├─────────────────────────────────────────────────────────────────┤
│ PK  id              INTEGER                                      │
│     query           VARCHAR(500)    NOT NULL                     │
│     result_count    INTEGER         NOT NULL                     │
│     source          VARCHAR(50)     DEFAULT 'web'                │
│     created_at      DATETIME        DEFAULT NOW                  │
└─────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────┐
│                    items_fts (FTS5 Virtual Table)                │
├─────────────────────────────────────────────────────────────────┤
│     title           TEXT            (indexed for search)         │
│     description     TEXT            (indexed for search)         │
│     content         TEXT            (indexed for search)         │
│                                                                  │
│     content='items', content_rowid='id'                          │
│     (External content table - data stored in items table)        │
└─────────────────────────────────────────────────────────────────┘
```

## Table Definitions

### categories

Stores content categories for organizing marketplace items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `slug` | VARCHAR(100) | UNIQUE, NOT NULL | URL-friendly identifier |
| `parent_id` | INTEGER | FK → categories.id, NULLABLE | Parent category for hierarchy |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW | Last update timestamp |

**Relationships:**
- Self-referential: `parent_id` → `categories.id` (ON DELETE SET NULL)
- One-to-many: `categories` → `items`

### tags

Stores tags for labeling and filtering items.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `name` | VARCHAR(50) | UNIQUE, NOT NULL | Tag name |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |

**Relationships:**
- Many-to-many: `tags` ↔ `items` (via `item_tags`)

### items

Stores marketplace content (agents, prompts, MCPs, workflows, docs).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `title` | VARCHAR(200) | NOT NULL | Item title |
| `description` | TEXT | NOT NULL | Short description for previews |
| `content` | TEXT | NOT NULL | Full markdown content |
| `type` | VARCHAR(50) | NOT NULL | Content type (agent/prompt/mcp/workflow/docs) |
| `category_id` | INTEGER | FK → categories.id, NULLABLE | Category assignment |
| `view_count` | INTEGER | NOT NULL, DEFAULT 0 | Number of views |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Creation timestamp |
| `updated_at` | DATETIME | NOT NULL, DEFAULT NOW | Last update timestamp |

**Relationships:**
- Many-to-one: `items` → `categories` (ON DELETE SET NULL)
- Many-to-many: `items` ↔ `tags` (via `item_tags`)

**Type Values:**
- `agent` - AI agents
- `prompt` - Prompt templates
- `mcp` - Model Context Protocol configs
- `workflow` - Automation workflows
- `docs` - Documentation

### item_tags

Join table for many-to-many relationship between items and tags.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `item_id` | INTEGER | PK, FK → items.id | Item reference |
| `tag_id` | INTEGER | PK, FK → tags.id | Tag reference |

**Constraints:**
- Composite primary key: (`item_id`, `tag_id`)
- `item_id` ON DELETE CASCADE
- `tag_id` ON DELETE CASCADE

### search_logs

Stores search query logs for analytics.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | INTEGER | PRIMARY KEY | Auto-increment ID |
| `query` | VARCHAR(500) | NOT NULL | Search query text |
| `result_count` | INTEGER | NOT NULL | Number of results returned |
| `source` | VARCHAR(50) | NOT NULL, DEFAULT 'web' | Query source |
| `created_at` | DATETIME | NOT NULL, DEFAULT NOW | Query timestamp |

### items_fts (Virtual Table)

FTS5 full-text search virtual table for efficient keyword search.

| Column | Type | Description |
|--------|------|-------------|
| `title` | TEXT | Searchable title |
| `description` | TEXT | Searchable description |
| `content` | TEXT | Searchable markdown content |

**Configuration:**
```sql
CREATE VIRTUAL TABLE items_fts USING fts5(
    title,
    description,
    content,
    content='items',
    content_rowid='id'
);
```

**Triggers:**
- `items_ai` - After INSERT: adds new item to FTS index
- `items_ad` - After DELETE: removes item from FTS index
- `items_au` - After UPDATE: deletes old entry, inserts updated entry

## Indexes

| Index Name | Table | Columns | Purpose |
|------------|-------|---------|---------|
| `ix_items_type` | items | type | Filter by content type |
| `ix_items_category_id` | items | category_id | Filter by category |
| `ix_items_created_at` | items | created_at DESC | Sort by date |
| `ix_items_view_count` | items | view_count DESC | Sort by popularity |
| `ix_search_logs_created_at` | search_logs | created_at | Date range queries |
| `ix_search_logs_query` | search_logs | query | Top queries analytics |
| `ix_search_logs_source` | search_logs | source | Source breakdown |

## Migrations

Migrations are managed with Alembic. Migration files:

```
backend/alembic/versions/
├── 001_initial_schema.py      # Tables: categories, tags, items, item_tags, search_logs
├── 002_fts5_search.py         # FTS5 virtual table and triggers
└── 003_analytics_indexes.py   # Performance indexes
```

### Running Migrations

```bash
cd backend

# Apply all migrations
alembic upgrade head

# Check current version
alembic current

# View history
alembic history

# Rollback one migration
alembic downgrade -1
```

## Query Examples

### Full-Text Search with Ranking

```sql
SELECT items.*, bm25(items_fts) as rank
FROM items_fts
JOIN items ON items.id = items_fts.rowid
WHERE items_fts MATCH 'python code review'
ORDER BY rank
LIMIT 20;
```

### Items with Category and Tags

```sql
SELECT
    i.*,
    c.name as category_name,
    GROUP_CONCAT(t.name) as tags
FROM items i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN item_tags it ON i.id = it.item_id
LEFT JOIN tags t ON it.tag_id = t.id
WHERE i.id = 1
GROUP BY i.id;
```

### Top Search Queries (Last 7 Days)

```sql
SELECT
    query,
    COUNT(*) as search_count,
    AVG(result_count) as avg_results
FROM search_logs
WHERE created_at >= datetime('now', '-7 days')
GROUP BY query
ORDER BY search_count DESC
LIMIT 10;
```

### Items by Type Distribution

```sql
SELECT
    type,
    COUNT(*) as count
FROM items
GROUP BY type
ORDER BY count DESC;
```

## Data Types and Constraints

### SQLAlchemy Type Mapping

| Python Type | SQLAlchemy | SQLite |
|-------------|------------|--------|
| `int` | `Integer` | INTEGER |
| `str` | `String(n)` | VARCHAR(n) |
| `str` | `Text` | TEXT |
| `datetime` | `DateTime` | DATETIME |
| `bool` | `Boolean` | INTEGER (0/1) |

### Value Constraints

| Field | Constraint | Reason |
|-------|------------|--------|
| `categories.name` | max 100 chars | Display length |
| `categories.slug` | max 100 chars, unique | URL safety |
| `tags.name` | max 50 chars, unique | UI display |
| `items.title` | max 200 chars | Search/display |
| `items.type` | one of: agent, prompt, mcp, workflow, docs | Enum-like validation |
| `search_logs.query` | max 500 chars | Reasonable query length |

## Backup and Restore

### Backup

```bash
# Stop application to ensure consistency
docker compose stop

# Copy database file
cp data/marketplace.db backups/marketplace-$(date +%Y%m%d).db

# Or use SQLite's backup command
sqlite3 data/marketplace.db ".backup 'backups/marketplace-backup.db'"
```

### Restore

```bash
# Stop application
docker compose stop

# Replace database file
cp backups/marketplace-backup.db data/marketplace.db

# Restart application
docker compose start
```

### Integrity Check

```bash
sqlite3 data/marketplace.db "PRAGMA integrity_check;"
# Should return: ok
```
