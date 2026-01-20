# Admin Guide

This guide covers how to manage content in the GenAI Marketplace as an administrator.

## Table of Contents

- [Getting Started](#getting-started)
- [Dashboard Overview](#dashboard-overview)
- [Managing Content Items](#managing-content-items)
- [Managing Categories](#managing-categories)
- [Managing Tags](#managing-tags)
- [Using the Markdown Editor](#using-the-markdown-editor)
- [Analytics](#analytics)
- [Best Practices](#best-practices)

## Getting Started

### Accessing the Admin Panel

1. Navigate to `/admin/login` in your browser
2. Enter your admin token (provided by your system administrator)
3. Click "Login"

You'll be redirected to the admin dashboard upon successful authentication.

### Logging Out

Click the "Logout" button in the top-right corner of any admin page. This clears your session and returns you to the home page.

## Dashboard Overview

The admin dashboard (`/admin/dashboard`) provides:

- **Item Table**: View all content items with title, type, category, tags, view count, and last updated date
- **Search**: Filter items by title
- **Type Filter**: Show only specific content types
- **Sortable Columns**: Click column headers to sort
- **Pagination**: Navigate through large item lists
- **Quick Actions**: Edit or delete items directly from the table

### Navigation

The dashboard header provides links to:

- **Add New Item**: Create new content
- **Categories**: Manage content categories
- **Tags**: Manage content tags
- **Analytics**: View usage statistics

## Managing Content Items

### Content Types

The marketplace supports five content types:

| Type | Description | Examples |
|------|-------------|----------|
| **Agent** | AI agents and autonomous systems | Code review agent, data extraction agent |
| **Prompt** | Prompt templates and engineering patterns | System prompts, few-shot examples |
| **MCP** | Model Context Protocol configurations | Tool definitions, API integrations |
| **Workflow** | Multi-step automation workflows | CI/CD pipelines, data processing |
| **Docs** | Documentation and guides | How-to guides, best practices |

### Creating a New Item

1. Click **"Add New Item"** from the dashboard
2. Fill in the required fields:
   - **Title**: Clear, descriptive name (max 200 characters)
   - **Description**: Brief summary for search results and previews
   - **Type**: Select the content type from the dropdown
3. Optionally add:
   - **Category**: Organize content by category
   - **Tags**: Add relevant keywords for search
4. Write the content using the **Markdown Editor**
5. Click **"Save"** to publish

### Editing an Item

1. Click the **pencil icon** next to the item in the dashboard
2. Modify any fields as needed
3. Click **"Save"** to update

The "Updated" timestamp will automatically refresh.

### Deleting an Item

1. Click the **trash icon** next to the item
2. Review the confirmation dialog
3. Click **"Delete"** to confirm

**Warning**: Deletion is permanent and cannot be undone.

## Managing Categories

Categories organize content into logical groups. Navigate to `/admin/categories` to manage them.

### Creating a Category

1. Click **"Add Category"**
2. Enter the category name
3. The slug is auto-generated (can be edited)
4. Optionally select a parent category for hierarchy
5. Click **"Add"**

### Editing a Category

1. Click the **pencil icon** next to the category
2. Modify the name, slug, or parent
3. Click **"Update"**

### Deleting a Category

1. Click the **trash icon** next to the category
2. If items use this category, you'll see a warning
3. Click **"Delete"** to confirm

**Note**: Items in a deleted category will have their category set to "None".

### Category Hierarchy

Categories support one level of parent-child relationships:

```
Development Tools
├── Code Assistants
├── Testing Tools
└── Documentation

Data & Analytics
├── Data Processing
└── Visualization
```

## Managing Tags

Tags provide flexible labeling for search and discovery. Navigate to `/admin/tags` to manage them.

### Creating a Tag

1. Enter the tag name in the "New tag name" field
2. Click **"Add"**

Tag names must be:
- Unique (case-insensitive)
- Maximum 50 characters
- No special characters recommended

### Deleting a Tag

1. Click the **trash icon** next to the tag
2. If items use this tag, you'll see a warning with the count
3. Click **"Delete"** to confirm

**Note**: The tag will be removed from all items that use it.

### Tag Naming Conventions

Recommended tag patterns:

| Pattern | Examples |
|---------|----------|
| Technology | `python`, `javascript`, `sql` |
| Framework | `react`, `fastapi`, `langchain` |
| Use Case | `code-review`, `data-extraction` |
| Difficulty | `beginner`, `advanced` |
| Status | `production-ready`, `experimental` |

## Using the Markdown Editor

The content editor provides a split-pane markdown editing experience.

### Editor Layout

- **Left Pane**: Markdown source with line numbers
- **Right Pane**: Live preview
- **Toolbar**: Formatting buttons

### View Modes

Toggle between modes using the buttons in the top-right:

| Mode | Description |
|------|-------------|
| **Edit** | Source only (full width) |
| **Split** | Source and preview side-by-side |
| **Preview** | Preview only (full width) |

### Formatting Toolbar

| Button | Action | Markdown |
|--------|--------|----------|
| **B** | Bold | `**text**` |
| *I* | Italic | `*text*` |
| `</>` | Inline code | `` `code` `` |
| H1 | Heading 1 | `# Heading` |
| H2 | Heading 2 | `## Heading` |
| H3 | Heading 3 | `### Heading` |
| • | Bullet list | `- item` |
| 1. | Numbered list | `1. item` |
| Link | Insert link | `[text](url)` |
| Quote | Blockquote | `> quote` |
| — | Horizontal rule | `---` |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` | Bold |
| `Ctrl+I` | Italic |
| `Tab` | Indent (2 spaces) |

### Code Blocks

Use fenced code blocks with language specification for syntax highlighting:

````markdown
```python
def hello():
    print("Hello, World!")
```
````

Supported languages: Python, JavaScript, TypeScript, JSON, Bash, SQL, YAML, Go, Rust, Java

### Auto-Save Drafts

The editor automatically saves drafts to your browser's local storage:

- Saves every 30 seconds while editing
- Restored automatically when returning to an unsaved item
- Drafts are cleared when you successfully save
- Drafts expire after 24 hours

## Analytics

The analytics dashboard (`/admin/analytics`) provides insights into platform usage.

### Available Metrics

**Search Statistics**
- Total searches: Last 7 days, last 30 days, all time
- Top 10 search queries with result counts

**Content Statistics**
- Items by type (distribution chart)
- Top 10 most viewed items

### Date Filtering

1. Set the start and end dates
2. Click **"Apply"** to filter
3. Click **"Clear"** to reset to all-time view

### Exporting Data

Click **"Export CSV"** to download a report containing:
- Search totals
- Top search queries
- Search sources
- Items by type
- Top viewed items

## Best Practices

### Writing Effective Content

1. **Clear Titles**: Be specific and descriptive
   - Good: "Python Code Review Agent for PR Comments"
   - Bad: "Code Agent"

2. **Useful Descriptions**: Summarize what the content does and when to use it

3. **Complete Documentation**: Include:
   - Overview/purpose
   - Requirements/prerequisites
   - Installation/setup steps
   - Usage examples
   - Configuration options
   - Troubleshooting tips

4. **Code Examples**: Provide working, tested code samples

### Organizing Content

1. **Use Categories Consistently**: Assign every item to a category
2. **Apply Relevant Tags**: Use 3-5 tags per item
3. **Keep Tags Standardized**: Use existing tags when possible
4. **Review Regularly**: Archive or update outdated content

### Content Quality Checklist

Before publishing, verify:

- [ ] Title is clear and descriptive
- [ ] Description summarizes the content accurately
- [ ] Correct content type selected
- [ ] Category assigned
- [ ] Relevant tags added (3-5 recommended)
- [ ] Code examples are tested and working
- [ ] Links are valid
- [ ] No sensitive information included

### Search Optimization

To help users find your content:

1. Use keywords in the title and description
2. Include common synonyms in the content
3. Add technology-specific tags
4. Describe use cases in plain language
