# PRD: GenAI Marketplace

## Introduction

The GenAI Marketplace is an internal web platform that enables 200 developers to discover, share, and integrate AI capabilities including agents, prompts, Model Context Protocols (MCPs), workflows, and documentation. The platform provides a centralized, searchable repository with markdown content rendering, syntax highlighting, and one-click copy-to-clipboard functionality.

**Key Changes from Original Scope:**
- Simplified to keyword-based search only (SQLite FTS5) - no LLM embeddings required
- VS Code extension moved to v2.0
- Estimated timeline: 5-6 weeks (reduced from 7-8 weeks)

The system will be built with FastAPI (Python), React with Shadcn/ui, SQLite database, and deployed as a single Docker container.

---

## Goals

- Centralize discovery of AI assets in a single searchable platform
- Enable fast keyword-based search with filtering by type, category, and tags
- Provide markdown rendering with syntax highlighting and copy-to-clipboard
- Simplify deployment with single Docker container
- Achieve 80% developer adoption (160/200 users) within 30 days of launch
- Maintain sub-second search response times
- Support admin-only content management with simple token-based auth

---

## User Stories

### Phase 1: Foundation (Week 1)

#### US-001: Database schema and models
**Description:** As a developer, I need a database schema to store marketplace content so data persists across sessions.

**Acceptance Criteria:**
- [ ] SQLite database created with SQLAlchemy ORM
- [ ] Items table: id, title, description, content (markdown), type, category_id, view_count, created_at, updated_at
- [ ] Categories table: id, name, slug, parent_id (nullable)
- [ ] Tags table: id, name (unique)
- [ ] item_tags join table: item_id, tag_id
- [ ] search_logs table: id, query, result_count, source, created_at
- [ ] Foreign key constraints properly defined
- [ ] Migrations work successfully
- [ ] Typecheck passes

#### US-002: Core API endpoints
**Description:** As a developer, I need REST API endpoints to interact with marketplace data.

**Acceptance Criteria:**
- [ ] FastAPI project structure with routers folder
- [ ] GET /api/items - list items with pagination (limit, offset)
- [ ] GET /api/items/{id} - get single item by ID
- [ ] GET /api/categories - list all categories
- [ ] GET /api/tags - list all tags
- [ ] All endpoints return consistent JSON format with success/error structure
- [ ] API documentation auto-generated at /docs
- [ ] Typecheck passes

#### US-003: Admin CRUD endpoints
**Description:** As an admin, I need endpoints to create, update, and delete content.

**Acceptance Criteria:**
- [ ] POST /api/items - create new item (admin only)
- [ ] PUT /api/items/{id} - update item (admin only)
- [ ] DELETE /api/items/{id} - delete item (admin only)
- [ ] POST /api/categories - create category (admin only)
- [ ] POST /api/tags - create tag (admin only)
- [ ] Admin token validation middleware
- [ ] Returns 401 Unauthorized without valid ADMIN_TOKEN
- [ ] Typecheck passes

#### US-004: Docker configuration
**Description:** As a DevOps engineer, I need a Docker container to deploy the application easily.

**Acceptance Criteria:**
- [ ] Dockerfile builds successfully
- [ ] Multi-stage build (build + runtime)
- [ ] SQLite database persisted via volume mount
- [ ] Environment variables for configuration (ADMIN_TOKEN, PORT)
- [ ] Health check endpoint at /health
- [ ] Container runs and serves API on specified port
- [ ] Documentation for building and running container

---

### Phase 2: Search Infrastructure (Week 2)

#### US-005: SQLite FTS5 full-text search
**Description:** As a user, I need to search content by keywords so I can find relevant items quickly.

**Acceptance Criteria:**
- [ ] FTS5 virtual table created for items (title, description, content)
- [ ] Triggers to keep FTS table in sync with items table on INSERT/UPDATE/DELETE
- [ ] Search supports multiple keywords
- [ ] Search ranks by relevance (BM25)
- [ ] Typecheck passes

#### US-006: Search API endpoint
**Description:** As a user, I need a search endpoint that supports filtering and sorting.

**Acceptance Criteria:**
- [ ] GET /api/search with query parameter 'q'
- [ ] Filter by type: ?type=agent,prompt (comma-separated)
- [ ] Filter by category: ?category=uuid1,uuid2
- [ ] Filter by tags: ?tags=python,testing
- [ ] Sort options: relevance (default), date, views
- [ ] Pagination: ?page=1&limit=20 (default limit=20, max=100)
- [ ] Response includes total count, page, limit metadata
- [ ] Empty query returns all items sorted by date
- [ ] Typecheck passes

#### US-007: Search logging
**Description:** As an admin, I need to track search queries to understand usage patterns.

**Acceptance Criteria:**
- [ ] Every search query logged to search_logs table
- [ ] Log includes: query text, result count, source (web), timestamp
- [ ] Logging happens asynchronously (doesn't slow search)
- [ ] Failed searches are logged with 0 result count
- [ ] Typecheck passes

---

### Phase 3: Frontend Core (Week 3)

#### US-008: React project setup
**Description:** As a developer, I need a React frontend to build the user interface.

**Acceptance Criteria:**
- [ ] React 18 + TypeScript project initialized with Vite
- [ ] Shadcn/ui installed and configured
- [ ] Tailwind CSS configured with theme
- [ ] React Router for navigation
- [ ] Axios or fetch wrapper for API calls
- [ ] Environment variable for API base URL
- [ ] Dev server runs successfully
- [ ] Typecheck passes

#### US-009: Home page with search
**Description:** As a user, I want a home page with a prominent search bar to find AI capabilities.

**Acceptance Criteria:**
- [ ] Homepage layout with centered search bar
- [ ] Search input with placeholder: "Search for AI capabilities..."
- [ ] Quick filter chips for content types (All, Agents, Prompts, MCPs, Workflows, Docs)
- [ ] Clicking type chip filters search results
- [ ] Recent additions section showing 5 most recent items
- [ ] Featured section showing pinned/popular items
- [ ] Responsive layout (mobile, tablet, desktop)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-010: Search results page
**Description:** As a user, I want to see search results with filtering options.

**Acceptance Criteria:**
- [ ] Search results display as card list
- [ ] Each card shows: title, type badge, description preview, category, tags, view count
- [ ] Filter sidebar with: Type checkboxes, Category dropdown, Tag multi-select
- [ ] Sort dropdown: Relevance, Newest, Most Viewed
- [ ] Pagination controls at bottom
- [ ] Shows "No results found" message when empty
- [ ] Loading state while fetching results
- [ ] URL params update with search and filters (shareable URLs)
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-011: Item detail page
**Description:** As a user, I want to view full item content with markdown rendering and copy functionality.

**Acceptance Criteria:**
- [ ] Item detail page at /items/{id}
- [ ] Markdown content rendered with react-markdown or similar
- [ ] Syntax highlighting for code blocks (use Prism.js or highlight.js)
- [ ] Support languages: Python, JavaScript, TypeScript, JSON, Bash, SQL, YAML, Go, Rust, Java
- [ ] Copy button on every code block with visual feedback ("Copied!")
- [ ] Metadata displayed: type, category, tags, view count, last updated
- [ ] Related items section (same category or tags)
- [ ] Back navigation to search results
- [ ] Increments view_count on page load
- [ ] 404 page for invalid item IDs
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 4: Admin Interface (Week 4)

#### US-012: Admin authentication
**Description:** As an admin, I need to authenticate to access content management features.

**Acceptance Criteria:**
- [ ] Login page at /admin/login
- [ ] Token input field (password type)
- [ ] "Login" button sends token to backend for validation
- [ ] Token stored in localStorage on successful login
- [ ] Axios interceptor adds token to all admin API requests (Authorization: Bearer {token})
- [ ] Redirect to /admin/dashboard on success
- [ ] Show error message on invalid token
- [ ] "Logout" clears localStorage and redirects to home
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-013: Admin dashboard
**Description:** As an admin, I need a dashboard to view and manage all content items.

**Acceptance Criteria:**
- [ ] Admin dashboard at /admin/dashboard (protected route)
- [ ] Table view of all items with columns: Title, Type, Category, Tags, Views, Updated
- [ ] Search box filters table by title
- [ ] Filter by type dropdown
- [ ] Sort columns clickable
- [ ] "Add New Item" button navigates to editor
- [ ] Edit icon on each row navigates to editor
- [ ] Delete icon shows confirmation modal before deletion
- [ ] Shows success/error toast notifications
- [ ] Pagination for large item lists
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-014: Content editor - basic form
**Description:** As an admin, I need a form to create and edit content items.

**Acceptance Criteria:**
- [ ] Editor page at /admin/editor (new) and /admin/editor/{id} (edit)
- [ ] Form fields: Title (required), Description (textarea, required), Type (dropdown, required)
- [ ] Category dropdown (populated from API)
- [ ] Tags multi-select or tag input component
- [ ] Form validation shows errors inline
- [ ] "Save" button submits to POST /api/items or PUT /api/items/{id}
- [ ] "Cancel" button navigates back to dashboard
- [ ] Shows success message and redirects on save
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-015: Content editor - markdown editor
**Description:** As an admin, I need a markdown editor with preview to write content.

**Acceptance Criteria:**
- [ ] Split-pane editor: markdown source on left, preview on right
- [ ] Resizable panes or toggle between edit/preview modes
- [ ] Markdown preview renders exactly like item detail page
- [ ] Syntax highlighting works in preview
- [ ] Toolbar with common markdown buttons: bold, italic, code, heading, list, link
- [ ] Textarea with monospace font and line numbers
- [ ] Auto-save draft to localStorage every 30 seconds
- [ ] Restore draft on page reload if present
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-016: Category and tag management
**Description:** As an admin, I need to create and manage categories and tags.

**Acceptance Criteria:**
- [ ] Categories management page at /admin/categories
- [ ] List of categories with edit/delete buttons
- [ ] "Add Category" form: name, slug (auto-generated), parent category (optional)
- [ ] Tags management page at /admin/tags
- [ ] List of tags with delete buttons
- [ ] "Add Tag" form: name (unique)
- [ ] Confirmation modal before deleting category/tag
- [ ] Shows warning if deleting category/tag used by items
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

---

### Phase 5: Polish and Analytics (Week 5)

#### US-017: Dark mode support
**Description:** As a user, I want to toggle between light and dark themes.

**Acceptance Criteria:**
- [ ] Theme toggle button in header (sun/moon icon)
- [ ] Dark theme colors defined in Tailwind config
- [ ] Theme preference saved to localStorage
- [ ] Theme loads from localStorage on page load
- [ ] All pages render correctly in both themes
- [ ] Code syntax highlighting works in both themes
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-018: Keyboard shortcuts
**Description:** As a user, I want keyboard shortcuts for common actions.

**Acceptance Criteria:**
- [ ] "/" or "Ctrl+K" focuses search bar
- [ ] "Esc" clears search or closes modals
- [ ] Arrow keys navigate search results
- [ ] "Enter" on highlighted result opens item detail
- [ ] "?" shows keyboard shortcuts help modal
- [ ] Shortcuts documented in help modal
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-019: Analytics dashboard
**Description:** As an admin, I need to view usage analytics to understand platform adoption.

**Acceptance Criteria:**
- [ ] Analytics page at /admin/analytics
- [ ] Total searches (last 7 days, last 30 days, all time)
- [ ] Top 10 search queries with result counts
- [ ] Searches by source chart (web only for v1.0)
- [ ] Total items by type (pie chart or bar chart)
- [ ] Total views by item (top 10 most viewed)
- [ ] Date range filter for analytics
- [ ] Export analytics as CSV
- [ ] Typecheck passes
- [ ] Verify in browser using dev-browser skill

#### US-020: Performance optimization
**Description:** As a user, I need the application to load and respond quickly.

**Acceptance Criteria:**
- [ ] API response caching headers set appropriately
- [ ] Database indexes added: items(type), items(category_id), items(created_at DESC)
- [ ] React components use React.memo for expensive renders
- [ ] Search results implement virtual scrolling or pagination
- [ ] Images lazy loaded
- [ ] Bundle size analyzed and optimized (code splitting for admin routes)
- [ ] Lighthouse performance score > 90
- [ ] Search p95 latency < 500ms (measured with 100 queries)
- [ ] Typecheck passes

---

### Phase 6: Testing and Launch (Week 6)

#### US-021: End-to-end testing
**Description:** As a developer, I need automated tests to ensure quality.

**Acceptance Criteria:**
- [ ] Pytest tests for all API endpoints (happy path and error cases)
- [ ] Test database fixtures with sample data
- [ ] Frontend tests for critical user flows using React Testing Library
- [ ] Test: Search and view item
- [ ] Test: Admin login and create item
- [ ] Test: Filter and sort results
- [ ] All tests pass
- [ ] Test coverage > 70% for backend
- [ ] Typecheck passes

#### US-022: Load testing
**Description:** As a developer, I need to verify the system handles concurrent users.

**Acceptance Criteria:**
- [ ] Load test script simulating 50 concurrent users
- [ ] Load test includes: search queries, item views, pagination
- [ ] System maintains sub-second response times under load
- [ ] No database errors or connection pool exhaustion
- [ ] CPU and memory usage remain acceptable
- [ ] Results documented in load-test-results.md

#### US-023: Documentation
**Description:** As a new team member, I need documentation to deploy and use the platform.

**Acceptance Criteria:**
- [ ] README.md with project overview and quick start
- [ ] DEPLOYMENT.md with Docker deployment instructions
- [ ] ADMIN_GUIDE.md with content management instructions
- [ ] API documentation at /docs (FastAPI auto-generated)
- [ ] Environment variables documented
- [ ] Architecture diagram in docs/
- [ ] Database schema diagram in docs/
- [ ] Typecheck passes

#### US-024: Initial content seeding
**Description:** As a user, I need sample content on launch to see platform value immediately.

**Acceptance Criteria:**
- [ ] Seed script creates 50+ initial items
- [ ] Content includes: 15 agents, 20 prompts, 10 MCPs, 5 workflows, 5 docs
- [ ] At least 5 categories created
- [ ] At least 20 tags created
- [ ] Real-world useful examples (not just test data)
- [ ] Seed script idempotent (can run multiple times)
- [ ] Documentation for running seed script

#### US-025: Production deployment
**Description:** As a DevOps engineer, I need to deploy the application to production.

**Acceptance Criteria:**
- [ ] Docker image built and tagged
- [ ] Production environment variables configured
- [ ] SQLite database volume mounted persistently
- [ ] Container deployed and accessible at production URL
- [ ] Health check endpoint returns 200 OK
- [ ] Admin token set securely (not in code)
- [ ] HTTPS configured (if applicable)
- [ ] Backup strategy implemented (daily SQLite backups)
- [ ] Monitoring/logging configured
- [ ] Smoke tests pass in production

---

## Functional Requirements

### Content Management
- FR-CM-01: Admin-only content creation, editing, and deletion via token authentication
- FR-CM-02: Support content types: Agents, Prompts, MCPs, Workflows, Documentation
- FR-CM-03: Markdown content with syntax highlighting for 10+ languages
- FR-CM-04: Category hierarchy and tag system for organization
- FR-CM-05: Simple file-based SQLite database with persistent volume

### Search and Discovery
- FR-SD-01: Keyword-based full-text search using SQLite FTS5
- FR-SD-02: Filter by content type, category, and tags
- FR-SD-03: Sort by relevance (BM25), date, and view count
- FR-SD-04: Pagination with configurable page size
- FR-SD-05: Search query logging for analytics

### User Interface
- FR-UI-01: Responsive web interface (desktop and tablet)
- FR-UI-02: Copy-to-clipboard for all code blocks with visual feedback
- FR-UI-03: Syntax highlighting for Python, JS, TS, Go, Rust, Java, SQL, YAML, JSON, Bash
- FR-UI-04: Dark and light theme toggle
- FR-UI-05: Keyboard shortcuts for navigation

### Administration
- FR-AD-01: Token-based admin authentication (ADMIN_TOKEN env var)
- FR-AD-02: Admin dashboard for content management
- FR-AD-03: Usage analytics: searches, views, top queries
- FR-AD-04: Category and tag management

### Performance
- FR-PE-01: Search response time < 500ms (p95)
- FR-PE-02: Page load time < 2 seconds
- FR-PE-03: Support 50 concurrent users
- FR-PE-04: Database capacity for 10,000+ items

---

## Non-Goals (Out of Scope for v1.0)

- VS Code extension (moved to v2.0)
- Semantic search with LLM embeddings
- User authentication and personalization
- Community contributions with approval workflow
- Ratings and reviews
- Multi-user admin system
- File attachments and uploads
- Version control for content items
- AI-powered recommendations
- Integration with external IDEs beyond web browser
- Multi-tenant support
- Federated search
- Public internet deployment (internal network only)

---

## Design Considerations

### UI/UX Requirements
- Clean, minimal interface inspired by GitHub or GitBook
- Prominent search bar on home page
- Card-based layout for search results
- Split-pane markdown editor for admins
- Toast notifications for user feedback
- Loading states and error messages
- Accessible components from Shadcn/ui (WCAG AA)

### Component Reuse
- Shadcn/ui button, input, dropdown, dialog, toast components
- React-markdown for content rendering
- Prism.js or highlight.js for syntax highlighting
- React Router for navigation
- Tailwind CSS for styling

---

## Technical Considerations

### Technology Stack
- **Backend:** FastAPI (Python 3.11+), SQLAlchemy, SQLite
- **Frontend:** React 18, TypeScript, Vite, Shadcn/ui, Tailwind CSS
- **Search:** SQLite FTS5 (no external search engine)
- **Deployment:** Single Docker container with multi-stage build
- **File Storage:** SQLite database file on persistent volume

### Architecture Decisions
- **Single container:** Backend serves API + static frontend files
- **SQLite:** File-based database, zero configuration, sufficient for 200 users
- **No embeddings:** Keyword search only, eliminates LLM dependency and complexity
- **Token auth:** Simple ADMIN_TOKEN environment variable, no user database needed
- **Internal network:** No need for complex security, OAuth, or rate limiting

### Performance Optimizations
- Database indexes on frequently queried fields
- React code splitting for admin routes
- API response caching headers
- Virtual scrolling for long result lists
- Lazy loading for images

### Scalability Path
- Current architecture supports 200-500 users
- Can migrate to PostgreSQL if SQLite becomes bottleneck
- Can add Redis caching layer if needed
- Horizontal scaling possible with load balancer + shared database

---

## Success Metrics

### Adoption (30 days post-launch)
| Metric | Target |
|--------|--------|
| Active weekly users | 160 (80%) |
| Total searches per week | 1,000+ |
| Content items in catalog | 100+ |
| Average searches per user | 6+ |

### Performance
| Metric | Target |
|--------|--------|
| Search latency (p95) | < 500ms |
| Page load time | < 2 seconds |
| Uptime during business hours | > 99.5% |

### Business Impact
- Time saved per developer: 2+ hours/week (measured via survey)
- Duplicate work reduction: 50% fewer redundant AI implementations
- Knowledge sharing: 5+ new content items per week

---

## Open Questions

1. **Content moderation:** Should there be a review/approval process for admin-created content, or trust all admins?
2. **Backup frequency:** Daily database backups sufficient, or need more frequent snapshots?
3. **Search ranking:** Should view count influence search relevance, or pure BM25 keyword matching?
4. **Category hierarchy:** Do we need nested categories (2+ levels), or flat structure sufficient?
5. **Featured content:** How should admins mark items as "featured" on homepage? Manual flag or automatic based on views?
6. **Content versioning:** Should we track edit history for items, or single current version only?

---

## Appendix: Development Timeline

| Phase | Focus | Duration | Key User Stories |
|-------|-------|----------|------------------|
| 1 | Foundation | Week 1 | US-001 to US-004 |
| 2 | Search | Week 2 | US-005 to US-007 |
| 3 | Frontend | Week 3 | US-008 to US-011 |
| 4 | Admin | Week 4 | US-012 to US-016 |
| 5 | Polish | Week 5 | US-017 to US-020 |
| 6 | Launch | Week 6 | US-021 to US-025 |

**Total Duration:** 6 weeks (reduced from original 7-8 weeks)

---

*Document created: January 2026*
*Last updated: January 2026*
*Status: Ready for implementation*
