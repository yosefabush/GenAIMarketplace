"""
Seed content data for GenAI Marketplace.

Contains all agents, prompts, MCPs, workflows, and docs content.
"""

# =============================================================================
# AGENTS (15 items)
# =============================================================================

AGENTS = [
    {
        "title": "Code Review Agent",
        "description": "Automated code review agent that analyzes pull requests for best practices, security issues, and performance problems.",
        "tags": ["code-review", "automation", "python", "javascript"],
        "category": "Development Tools",
        "content": """# Code Review Agent

An intelligent agent that performs automated code reviews on pull requests.

## Features

- **Security Analysis**: Detects common vulnerabilities (SQL injection, XSS, etc.)
- **Best Practices**: Checks for coding standards and patterns
- **Performance**: Identifies potential performance bottlenecks
- **Documentation**: Verifies docstrings and comments

## Usage

```python
from agents.code_review import CodeReviewAgent

agent = CodeReviewAgent(
    model="claude-3-opus",
    rules=["security", "performance", "style"]
)

review = agent.review_pr(repo="myorg/myrepo", pr_number=123)

for issue in review.issues:
    print(f"- {issue.severity}: {issue.message}")
```

## Configuration

```yaml
code_review_agent:
  model: claude-3-opus
  max_file_size: 10000
  rules:
    - security
    - performance
    - style
```
"""
    },
    {
        "title": "Test Generation Agent",
        "description": "Automatically generates unit tests and integration tests for your codebase using AI.",
        "tags": ["testing", "automation", "python", "typescript"],
        "category": "Testing & QA",
        "content": """# Test Generation Agent

Generate comprehensive test suites automatically from your source code.

## Features

- Unit test generation for functions and classes
- Integration test scaffolding
- Edge case detection
- Mock generation for dependencies

## Usage

```python
from agents.test_gen import TestGenerationAgent

agent = TestGenerationAgent(model="claude-3-sonnet")

tests = agent.generate_tests(
    source_file="src/utils/parser.py",
    framework="pytest",
    coverage_target=80
)

tests.save("tests/test_parser.py")
```

## Supported Frameworks

| Language | Frameworks |
|----------|------------|
| Python | pytest, unittest |
| JavaScript | Jest, Mocha, Vitest |
| TypeScript | Jest, Vitest |
| Go | testing, testify |
"""
    },
    {
        "title": "Documentation Generator Agent",
        "description": "Generates comprehensive documentation from code including API docs, README files, and architecture diagrams.",
        "tags": ["documentation", "automation", "api"],
        "category": "Documentation",
        "content": """# Documentation Generator Agent

Automatically generate and maintain documentation from your codebase.

## Features

- API documentation from docstrings
- README generation
- Architecture diagram creation
- Changelog generation from commits

## Usage

```python
from agents.doc_gen import DocumentationAgent

agent = DocumentationAgent()

api_docs = agent.generate_api_docs(
    source_dir="src/",
    output_format="markdown"
)

readme = agent.generate_readme(
    project_dir=".",
    include_badges=True
)
```

## Output Formats

- Markdown
- reStructuredText
- HTML
- OpenAPI/Swagger
"""
    },
    {
        "title": "Refactoring Agent",
        "description": "AI-powered code refactoring agent that improves code quality while preserving behavior.",
        "tags": ["refactoring", "code-review", "python", "typescript"],
        "category": "Development Tools",
        "content": """# Refactoring Agent

Intelligent refactoring suggestions and automated code improvements.

## Features

- Extract method/function
- Rename with semantic awareness
- Remove dead code
- Simplify complex conditionals
- Apply design patterns

## Usage

```python
from agents.refactor import RefactoringAgent

agent = RefactoringAgent(model="claude-3-opus")

suggestions = agent.analyze(
    file_path="src/legacy/old_module.py",
    refactoring_types=["extract_method", "simplify_conditionals"]
)

for suggestion in suggestions:
    print(f"{suggestion.type}: {suggestion.description}")
```

## Supported Refactorings

1. **Extract Method** - Break down large functions
2. **Inline Variable** - Remove unnecessary variables
3. **Rename Symbol** - Context-aware renaming
4. **Move to Module** - Better code organization
"""
    },
    {
        "title": "SQL Query Optimizer Agent",
        "description": "Analyzes and optimizes SQL queries for better performance with index recommendations.",
        "tags": ["sql", "database", "performance", "automation"],
        "category": "Data & Analytics",
        "content": """# SQL Query Optimizer Agent

Optimize your database queries with AI-powered analysis.

## Features

- Query performance analysis
- Index recommendations
- Query rewriting suggestions
- Execution plan analysis

## Usage

```python
from agents.sql_optimizer import SQLOptimizerAgent

agent = SQLOptimizerAgent(db_type="postgresql")

analysis = agent.analyze_query('''
    SELECT u.name, COUNT(o.id) as order_count
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    WHERE u.created_at > '2024-01-01'
    GROUP BY u.name
''')

print(f"Suggested indexes: {analysis.index_suggestions}")
print(f"Optimized query:\\n{analysis.optimized_query}")
```

## Supported Databases

- PostgreSQL
- MySQL
- SQLite
- SQL Server
"""
    },
    {
        "title": "API Design Agent",
        "description": "Helps design RESTful and GraphQL APIs following best practices and industry standards.",
        "tags": ["api", "rest", "graphql", "documentation"],
        "category": "Development Tools",
        "content": """# API Design Agent

Design better APIs with AI-assisted best practices.

## Features

- RESTful API design review
- GraphQL schema suggestions
- OpenAPI spec generation
- Versioning strategy recommendations

## Usage

```python
from agents.api_design import APIDesignAgent

agent = APIDesignAgent()

review = agent.review_openapi("openapi.yaml")
for issue in review.issues:
    print(f"{issue.severity}: {issue.message}")

design = agent.design_api(
    resources=["users", "orders", "products"],
    relationships={
        "users": {"orders": "one-to-many"}
    }
)
```
"""
    },
    {
        "title": "Security Scanner Agent",
        "description": "Scans code and configurations for security vulnerabilities and compliance issues.",
        "tags": ["security", "automation", "code-review"],
        "category": "Security",
        "content": """# Security Scanner Agent

Comprehensive security analysis for your codebase.

## Features

- OWASP Top 10 vulnerability detection
- Secrets scanning
- Dependency vulnerability check
- Configuration security audit

## Usage

```python
from agents.security import SecurityScannerAgent

agent = SecurityScannerAgent()

scan = agent.scan_repository(
    repo_path="./",
    checks=["secrets", "vulnerabilities", "owasp"]
)

print(f"Critical: {scan.critical_count}")
print(f"High: {scan.high_count}")

for finding in scan.findings:
    print(f"[{finding.severity}] {finding.title}")
    print(f"  Fix: {finding.remediation}")
```

## Compliance Standards

- OWASP Top 10
- CWE Top 25
- PCI DSS
"""
    },
    {
        "title": "Debugging Assistant Agent",
        "description": "AI agent that helps diagnose and fix bugs by analyzing error messages, logs, and code.",
        "tags": ["debugging", "automation", "python", "javascript"],
        "category": "Development Tools",
        "content": """# Debugging Assistant Agent

Your AI pair programmer for debugging complex issues.

## Features

- Error message analysis
- Stack trace interpretation
- Log pattern detection
- Root cause analysis

## Usage

```python
from agents.debug import DebuggingAgent

agent = DebuggingAgent()

diagnosis = agent.diagnose(
    error_message="TypeError: Cannot read property 'map' of undefined",
    stack_trace=stack_trace,
    source_code=code_snippet
)

print(f"Likely cause: {diagnosis.cause}")
print(f"Suggested fix: {diagnosis.fix}")
```

## Supported Languages

- Python (with traceback analysis)
- JavaScript/TypeScript
- Go
- Rust
"""
    },
    {
        "title": "Migration Agent",
        "description": "Assists with database migrations, framework upgrades, and language version migrations.",
        "tags": ["database", "automation", "python", "typescript"],
        "category": "DevOps & Infrastructure",
        "content": """# Migration Agent

Automate complex migration tasks with AI assistance.

## Features

- Database schema migrations
- Framework version upgrades
- Language version migrations
- Breaking change detection

## Usage

```python
from agents.migration import MigrationAgent

agent = MigrationAgent()

plan = agent.plan_migration(
    from_version="Django 3.2",
    to_version="Django 4.2",
    project_path="./"
)

print(f"Breaking changes: {len(plan.breaking_changes)}")
print(f"Estimated effort: {plan.effort_estimate}")

for step in plan.steps:
    print(f"- {step.description}")
```
"""
    },
    {
        "title": "Performance Profiler Agent",
        "description": "Profiles application performance and suggests optimizations for CPU, memory, and I/O.",
        "tags": ["performance", "debugging", "python", "automation"],
        "category": "Development Tools",
        "content": """# Performance Profiler Agent

AI-powered performance analysis and optimization suggestions.

## Features

- CPU hotspot detection
- Memory leak identification
- I/O bottleneck analysis
- Optimization recommendations

## Usage

```python
from agents.profiler import PerformanceAgent

agent = PerformanceAgent()

profile = agent.profile_function(
    func=my_slow_function,
    args=(data,),
    iterations=100
)

print(f"Avg execution time: {profile.avg_time}ms")
print(f"Memory delta: {profile.memory_delta}MB")

for hotspot in profile.hotspots:
    print(f"Hotspot: {hotspot.location}")
    print(f"  Suggestion: {hotspot.optimization}")
```
"""
    },
    {
        "title": "Dependency Manager Agent",
        "description": "Manages project dependencies, updates packages safely, and detects compatibility issues.",
        "tags": ["automation", "security", "python", "javascript"],
        "category": "DevOps & Infrastructure",
        "content": """# Dependency Manager Agent

Smart dependency management with security awareness.

## Features

- Safe update recommendations
- Vulnerability alerts
- Compatibility analysis
- License compliance check

## Usage

```python
from agents.deps import DependencyAgent

agent = DependencyAgent()

analysis = agent.analyze("requirements.txt")

print(f"Outdated packages: {len(analysis.outdated)}")
print(f"Vulnerabilities: {len(analysis.vulnerabilities)}")

plan = agent.plan_updates(conservative=True)
for update in plan.updates:
    print(f"Update {update.package}: {update.from_ver} -> {update.to_ver}")
```

## Supported Package Managers

- pip (Python)
- npm/yarn (JavaScript)
- cargo (Rust)
- go modules (Go)
"""
    },
    {
        "title": "Git Workflow Agent",
        "description": "Automates Git workflows including branch management, commit messages, and PR descriptions.",
        "tags": ["automation", "ci-cd", "documentation"],
        "category": "Development Tools",
        "content": """# Git Workflow Agent

Streamline your Git workflow with AI assistance.

## Features

- Intelligent commit messages
- PR description generation
- Branch naming suggestions
- Merge conflict resolution help

## Usage

```python
from agents.git import GitWorkflowAgent

agent = GitWorkflowAgent()

message = agent.generate_commit_message(
    staged_changes=git_diff,
    style="conventional"
)

pr_desc = agent.generate_pr_description(
    commits=commit_list,
    template="default"
)
```

## Integration

```bash
git-agent install-hooks
git-agent commit  # Auto-generates message
git-agent pr      # Creates PR with description
```
"""
    },
    {
        "title": "Log Analyzer Agent",
        "description": "Analyzes application logs to detect patterns, anomalies, and potential issues.",
        "tags": ["debugging", "automation", "performance"],
        "category": "DevOps & Infrastructure",
        "content": """# Log Analyzer Agent

AI-powered log analysis for faster incident resolution.

## Features

- Pattern recognition
- Anomaly detection
- Error clustering
- Root cause suggestions

## Usage

```python
from agents.logs import LogAnalyzerAgent

agent = LogAnalyzerAgent()

analysis = agent.analyze_logs(
    log_file="app.log",
    time_range="last_24h"
)

print(f"Error patterns found: {len(analysis.patterns)}")
print(f"Anomalies detected: {len(analysis.anomalies)}")

for pattern in analysis.patterns:
    print(f"Pattern: {pattern.template}")
    print(f"  Severity: {pattern.severity}")
```
"""
    },
    {
        "title": "Schema Design Agent",
        "description": "Helps design database schemas with normalization, indexing, and relationship recommendations.",
        "tags": ["database", "sql", "documentation"],
        "category": "Data & Analytics",
        "content": """# Schema Design Agent

Design optimal database schemas with AI guidance.

## Features

- Normalization analysis
- Index recommendations
- Relationship modeling
- Data type suggestions

## Usage

```python
from agents.schema import SchemaDesignAgent

agent = SchemaDesignAgent(db_type="postgresql")

schema = agent.design_schema(
    entities=["User", "Order", "Product"],
    requirements=\"\"\"
    Users can have multiple orders.
    Orders contain multiple products.
    \"\"\"
)

print(schema.ddl)
print(schema.diagram)
```

## Output Formats

- SQL DDL
- Prisma schema
- SQLAlchemy models
- Mermaid diagrams
"""
    },
    {
        "title": "Code Translation Agent",
        "description": "Translates code between programming languages while preserving logic and idioms.",
        "tags": ["python", "javascript", "typescript", "go", "rust"],
        "category": "Code Generation",
        "content": """# Code Translation Agent

Translate code between languages with idiomatic output.

## Features

- Multi-language support
- Idiomatic translations
- Comment preservation
- Type inference

## Usage

```python
from agents.translate import CodeTranslationAgent

agent = CodeTranslationAgent()

ts_code = agent.translate(
    source_code=python_code,
    from_lang="python",
    to_lang="typescript"
)
```

## Supported Languages

| From | To |
|------|-----|
| Python | JavaScript, TypeScript, Go, Rust |
| JavaScript | Python, TypeScript, Go |
| TypeScript | Python, JavaScript, Go |
"""
    },
]

# =============================================================================
# PROMPTS (20 items)
# =============================================================================

PROMPTS = [
    {
        "title": "Code Review Prompt",
        "description": "Comprehensive prompt for reviewing code quality, security, and best practices.",
        "tags": ["code-review", "security", "python", "javascript"],
        "category": "Development Tools",
        "content": """# Code Review Prompt

Use this prompt to get thorough code reviews from an LLM.

## Prompt Template

```
You are an expert code reviewer. Review the following code for:

1. **Security Issues** - SQL injection, XSS, hardcoded secrets
2. **Code Quality** - Readability, DRY violations, error handling
3. **Performance** - Inefficient algorithms, N+1 queries
4. **Best Practices** - Language idioms, design patterns

Code to review:
{code}

Provide: Critical Issues, Suggestions, Positive Aspects, Summary
```

## Variables

| Variable | Description |
|----------|-------------|
| `{code}` | The code to be reviewed |
"""
    },
    {
        "title": "Bug Fix Prompt",
        "description": "Structured prompt for diagnosing and fixing bugs with step-by-step analysis.",
        "tags": ["debugging", "python", "javascript"],
        "category": "Development Tools",
        "content": """# Bug Fix Prompt

Systematic approach to bug diagnosis and resolution.

## Prompt Template

```
You are a senior software engineer debugging an issue.

**Error Message:** {error_message}
**Stack Trace:** {stack_trace}
**Relevant Code:** {code}
**Expected Behavior:** {expected}
**Actual Behavior:** {actual}

Please analyze by:
1. Identifying the root cause
2. Explaining why the bug occurs
3. Providing a fix with code
4. Suggesting prevention strategies
```
"""
    },
    {
        "title": "API Documentation Prompt",
        "description": "Generate comprehensive API documentation from endpoint definitions.",
        "tags": ["documentation", "api", "rest"],
        "category": "Documentation",
        "content": """# API Documentation Prompt

Generate clear, comprehensive API documentation.

## Prompt Template

```
Generate API documentation for:

**Endpoint:** {method} {path}
**Description:** {description}
**Request Body:** {request_body}
**Response:** {success_response}

Include:
1. Endpoint description
2. Authentication requirements
3. Parameters with types
4. Response schema with examples
5. Usage examples in curl, Python, JavaScript
```
"""
    },
    {
        "title": "Unit Test Generation Prompt",
        "description": "Generate comprehensive unit tests with edge cases and mocking.",
        "tags": ["testing", "python", "javascript", "typescript"],
        "category": "Testing & QA",
        "content": """# Unit Test Generation Prompt

Generate thorough unit tests for any function.

## Prompt Template

```
Generate unit tests for:

```{language}
{code}
```

Requirements:
1. Test all branches and code paths
2. Include edge cases (empty inputs, boundaries, invalid inputs)
3. Mock external dependencies
4. Use {test_framework} framework
5. Arrange-Act-Assert pattern
```
"""
    },
    {
        "title": "SQL Query Optimization Prompt",
        "description": "Analyze and optimize SQL queries for better performance.",
        "tags": ["sql", "database", "performance"],
        "category": "Data & Analytics",
        "content": """# SQL Query Optimization Prompt

Get expert SQL optimization recommendations.

## Prompt Template

```
Analyze and optimize this SQL query:

**Database:** {db_type}
**Schema:** {schema}
**Query:** {query}
**Current Performance:** {exec_time}

Provide:
1. Analysis of performance issues
2. Optimized query
3. Index recommendations
4. Explanation of improvements
```
"""
    },
    {
        "title": "Code Refactoring Prompt",
        "description": "Get suggestions for refactoring code to improve quality and maintainability.",
        "tags": ["refactoring", "code-review", "python", "typescript"],
        "category": "Development Tools",
        "content": """# Code Refactoring Prompt

Transform code into cleaner, more maintainable versions.

## Prompt Template

```
Refactor the following code:

```{language}
{code}
```

Focus on:
1. Readability - Clear naming, logical structure
2. Maintainability - Single responsibility, loose coupling
3. Performance - Remove inefficiencies
4. Testability - Make it easier to test

Provide refactored code with explanation of changes.
```
"""
    },
    {
        "title": "README Generator Prompt",
        "description": "Generate professional README files for open source projects.",
        "tags": ["documentation", "automation"],
        "category": "Documentation",
        "content": """# README Generator Prompt

Create comprehensive README documentation.

## Prompt Template

```
Generate README.md for:

**Project Name:** {name}
**Description:** {description}
**Tech Stack:** {tech_stack}
**Features:** {features}

Include:
1. Title with badges
2. Description (2-3 sentences)
3. Features list
4. Installation instructions
5. Quick start guide
6. Configuration options
7. Contributing guidelines
8. License
```
"""
    },
    {
        "title": "Error Handling Prompt",
        "description": "Design robust error handling strategies for applications.",
        "tags": ["python", "javascript", "debugging"],
        "category": "Development Tools",
        "content": """# Error Handling Prompt

Implement comprehensive error handling.

## Prompt Template

```
Design error handling for:

```{language}
{code}
```

Consider:
1. Error Types - What can go wrong?
2. Handling Strategies - Retry, fallback, circuit breaker
3. User Experience - Clear messages, guidance
4. Logging - What to log, at what level

Provide updated code with error handling.
```
"""
    },
    {
        "title": "Database Migration Prompt",
        "description": "Generate safe database migration scripts with rollback plans.",
        "tags": ["database", "sql", "automation"],
        "category": "Data & Analytics",
        "content": """# Database Migration Prompt

Create safe, reversible database migrations.

## Prompt Template

```
Generate migration for:

**Database:** {db_type}
**Current Schema:** {current_schema}
**Desired Change:** {change_description}

Include:
1. Up migration script
2. Down migration (rollback) script
3. Data migration if needed
4. Zero-downtime considerations
```
"""
    },
    {
        "title": "API Error Response Prompt",
        "description": "Design consistent API error responses following REST best practices.",
        "tags": ["api", "rest", "documentation"],
        "category": "Development Tools",
        "content": """# API Error Response Prompt

Design consistent, informative API errors.

## Prompt Template

```
Design error responses for API:

**Context:** {api_description}
**Endpoints:** {endpoints}

Create:
1. Error response schema
2. HTTP status code mapping
3. Error codes and messages
4. Debug info (dev only)
```

## Standard Schema

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Description",
    "details": [...],
    "requestId": "req_abc123"
  }
}
```
"""
    },
    {
        "title": "Git Commit Message Prompt",
        "description": "Generate clear, conventional commit messages from code changes.",
        "tags": ["automation", "documentation", "ci-cd"],
        "category": "Development Tools",
        "content": """# Git Commit Message Prompt

Generate meaningful commit messages.

## Prompt Template

```
Generate commit message for:

**Files Changed:** {files}
**Diff:** {diff}
**Context:** {context}

Follow Conventional Commits:
- type(scope): description
- Types: feat, fix, docs, style, refactor, test, chore
- Keep subject under 72 characters
- Use imperative mood
```
"""
    },
    {
        "title": "Code Explanation Prompt",
        "description": "Get clear explanations of complex code for documentation or learning.",
        "tags": ["documentation", "python", "javascript"],
        "category": "Documentation",
        "content": """# Code Explanation Prompt

Get clear explanations of complex code.

## Prompt Template

```
Explain this code for a {audience} audience:

```{language}
{code}
```

Provide:
1. Overview - What does this code do?
2. Step-by-Step - Walk through the logic
3. Key Concepts - Important patterns/techniques
4. Complexity - Time and space complexity
5. Usage Example - How to use this code
```
"""
    },
    {
        "title": "Security Audit Prompt",
        "description": "Comprehensive security review prompt for identifying vulnerabilities.",
        "tags": ["security", "code-review", "api"],
        "category": "Security",
        "content": """# Security Audit Prompt

Thorough security analysis for code.

## Prompt Template

```
Security audit for:

```{language}
{code}
```

Check for:
1. Injection Vulnerabilities - SQL, XSS, command injection
2. Authentication/Authorization issues
3. Data Security - Sensitive data exposure, crypto
4. Input Validation - Missing validation, type confusion

Report: Finding, Severity, Location, Remediation
```
"""
    },
    {
        "title": "Docker Optimization Prompt",
        "description": "Optimize Dockerfiles for smaller images and faster builds.",
        "tags": ["docker", "ci-cd", "performance"],
        "category": "DevOps & Infrastructure",
        "content": """# Docker Optimization Prompt

Optimize Docker images for production.

## Prompt Template

```
Optimize this Dockerfile:

```dockerfile
{dockerfile}
```

Optimize for:
1. Image Size - Multi-stage builds, minimal base images
2. Build Speed - Layer caching, parallel operations
3. Security - Non-root user, no secrets in layers
4. Runtime - Health checks, signal handling

Provide optimized Dockerfile with explanations.
```
"""
    },
    {
        "title": "Kubernetes Manifest Prompt",
        "description": "Generate production-ready Kubernetes manifests with best practices.",
        "tags": ["kubernetes", "docker", "ci-cd"],
        "category": "DevOps & Infrastructure",
        "content": """# Kubernetes Manifest Prompt

Generate production-ready K8s manifests.

## Prompt Template

```
Generate Kubernetes manifests for:

**Application:** {app_name}
**Image:** {image}
**Replicas:** {replicas}
**Resources:** CPU: {cpu}, Memory: {memory}

Include:
1. Deployment with health checks, resource limits
2. Service (ClusterIP/LoadBalancer)
3. ConfigMap/Secrets
4. HPA if applicable
5. NetworkPolicy
```
"""
    },
    {
        "title": "GraphQL Schema Prompt",
        "description": "Design GraphQL schemas with types, queries, and mutations.",
        "tags": ["graphql", "api", "typescript"],
        "category": "Development Tools",
        "content": """# GraphQL Schema Prompt

Design comprehensive GraphQL schemas.

## Prompt Template

```
Design GraphQL schema for:

**Domain:** {domain_description}
**Entities:** {entities}
**Relationships:** {relationships}

Include:
1. Types - All entity types with fields
2. Queries - Read operations
3. Mutations - Write operations
4. Input Types - For mutations
5. Pagination - Cursor-based
```
"""
    },
    {
        "title": "Performance Analysis Prompt",
        "description": "Analyze code for performance issues and optimization opportunities.",
        "tags": ["performance", "python", "javascript"],
        "category": "Development Tools",
        "content": """# Performance Analysis Prompt

Identify and fix performance bottlenecks.

## Prompt Template

```
Analyze performance of:

```{language}
{code}
```

Context: Expected load: {load}

Analyze:
1. Time Complexity - Big O analysis
2. Space Complexity - Memory usage
3. I/O Operations - Database, network, file
4. Caching - What can be cached

Provide issues found, optimized code, expected improvement.
```
"""
    },
    {
        "title": "CI/CD Pipeline Prompt",
        "description": "Design CI/CD pipelines for different platforms and use cases.",
        "tags": ["ci-cd", "automation", "docker"],
        "category": "DevOps & Infrastructure",
        "content": """# CI/CD Pipeline Prompt

Design robust CI/CD pipelines.

## Prompt Template

```
Create CI/CD pipeline for:

**Platform:** {platform} (GitHub Actions/GitLab CI/Jenkins)
**Language:** {language}
**Deployment Target:** {target}

Stages:
1. Build - Dependencies, compile, artifacts
2. Test - Unit, integration, coverage
3. Security - SAST, dependency check
4. Deploy - Staging, production, rollback
```
"""
    },
    {
        "title": "Code Comment Generator Prompt",
        "description": "Generate meaningful code comments and documentation strings.",
        "tags": ["documentation", "python", "typescript"],
        "category": "Documentation",
        "content": """# Code Comment Generator Prompt

Add meaningful documentation to code.

## Prompt Template

```
Add documentation to:

```{language}
{code}
```

Style: {style} (Google, NumPy, JSDoc)

Include:
1. Module docstring - Purpose and overview
2. Class docstrings - What the class represents
3. Method docstrings - Description, params, returns, raises
4. Inline comments - Only for complex logic
```
"""
    },
    {
        "title": "Data Validation Prompt",
        "description": "Design comprehensive data validation rules and schemas.",
        "tags": ["api", "python", "typescript"],
        "category": "Development Tools",
        "content": """# Data Validation Prompt

Design robust data validation.

## Prompt Template

```
Design validation for:

**Data:** {data_description}
**Use Case:** {use_case}
**Example:** {example}

Create:
1. Type Validation - Correct data types
2. Format Validation - Patterns, formats
3. Business Rules - Domain-specific rules
4. Sanitization - Clean/normalize data

Output: Pydantic/Zod/JSON Schema with error messages.
```
"""
    },
]

# =============================================================================
# MCPs (10 items)
# =============================================================================

MCPS = [
    {
        "title": "GitHub MCP Server",
        "description": "MCP server for GitHub operations including repos, issues, PRs, and actions.",
        "tags": ["automation", "ci-cd", "api"],
        "category": "Development Tools",
        "content": """# GitHub MCP Server

Model Context Protocol server for GitHub integration.

## Installation

```bash
npm install @mcp/github-server
```

## Configuration

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["@mcp/github-server"],
      "env": { "GITHUB_TOKEN": "your-token" }
    }
  }
}
```

## Tools

- `github_list_repos` - List repositories
- `github_create_issue` - Create issues
- `github_create_pr` - Create pull requests
- `github_list_prs` - List open PRs
- `github_merge_pr` - Merge pull requests
"""
    },
    {
        "title": "Database MCP Server",
        "description": "MCP server for database operations supporting PostgreSQL, MySQL, and SQLite.",
        "tags": ["database", "sql", "api"],
        "category": "Data & Analytics",
        "content": """# Database MCP Server

Query and manage databases through MCP.

## Installation

```bash
npm install @mcp/database-server
```

## Configuration

```json
{
  "mcpServers": {
    "database": {
      "command": "npx",
      "args": ["@mcp/database-server"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost/db"
      }
    }
  }
}
```

## Tools

- `db_query` - Execute SELECT queries
- `db_execute` - Execute INSERT/UPDATE/DELETE
- `db_schema` - Get table schemas
- `db_tables` - List all tables
"""
    },
    {
        "title": "Filesystem MCP Server",
        "description": "MCP server for secure filesystem operations with sandboxing.",
        "tags": ["automation", "api"],
        "category": "Development Tools",
        "content": """# Filesystem MCP Server

Secure filesystem operations through MCP.

## Installation

```bash
npm install @mcp/filesystem-server
```

## Configuration

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["@mcp/filesystem-server", "/allowed/path"]
    }
  }
}
```

## Tools

- `fs_read` - Read file contents
- `fs_write` - Write to files
- `fs_list` - List directory contents
- `fs_search` - Search for files by pattern
- `fs_info` - Get file metadata
"""
    },
    {
        "title": "Docker MCP Server",
        "description": "MCP server for Docker container and image management.",
        "tags": ["docker", "automation", "ci-cd"],
        "category": "DevOps & Infrastructure",
        "content": """# Docker MCP Server

Manage Docker containers and images through MCP.

## Installation

```bash
npm install @mcp/docker-server
```

## Configuration

```json
{
  "mcpServers": {
    "docker": {
      "command": "npx",
      "args": ["@mcp/docker-server"]
    }
  }
}
```

## Tools

- `docker_ps` - List running containers
- `docker_images` - List images
- `docker_run` - Run a container
- `docker_stop` - Stop containers
- `docker_logs` - Get container logs
- `docker_build` - Build images
"""
    },
    {
        "title": "Kubernetes MCP Server",
        "description": "MCP server for Kubernetes cluster management and kubectl operations.",
        "tags": ["kubernetes", "automation", "ci-cd"],
        "category": "DevOps & Infrastructure",
        "content": """# Kubernetes MCP Server

Manage Kubernetes clusters through MCP.

## Installation

```bash
npm install @mcp/kubernetes-server
```

## Configuration

```json
{
  "mcpServers": {
    "kubernetes": {
      "command": "npx",
      "args": ["@mcp/kubernetes-server"],
      "env": { "KUBECONFIG": "~/.kube/config" }
    }
  }
}
```

## Tools

- `k8s_get` - Get resources
- `k8s_apply` - Apply manifests
- `k8s_delete` - Delete resources
- `k8s_logs` - Get pod logs
- `k8s_exec` - Execute in pod
"""
    },
    {
        "title": "AWS MCP Server",
        "description": "MCP server for AWS services including S3, EC2, and Lambda.",
        "tags": ["automation", "api", "ci-cd"],
        "category": "DevOps & Infrastructure",
        "content": """# AWS MCP Server

Interact with AWS services through MCP.

## Installation

```bash
npm install @mcp/aws-server
```

## Configuration

```json
{
  "mcpServers": {
    "aws": {
      "command": "npx",
      "args": ["@mcp/aws-server"],
      "env": {
        "AWS_REGION": "us-east-1",
        "AWS_PROFILE": "default"
      }
    }
  }
}
```

## Tools

- `s3_list` - List S3 buckets/objects
- `s3_get` - Get S3 objects
- `s3_put` - Upload to S3
- `ec2_list` - List EC2 instances
- `lambda_invoke` - Invoke Lambda functions
"""
    },
    {
        "title": "Slack MCP Server",
        "description": "MCP server for Slack messaging and channel management.",
        "tags": ["automation", "api"],
        "category": "Development Tools",
        "content": """# Slack MCP Server

Send messages and manage Slack workspaces through MCP.

## Installation

```bash
npm install @mcp/slack-server
```

## Configuration

```json
{
  "mcpServers": {
    "slack": {
      "command": "npx",
      "args": ["@mcp/slack-server"],
      "env": { "SLACK_TOKEN": "xoxb-your-token" }
    }
  }
}
```

## Tools

- `slack_send` - Send messages
- `slack_channels` - List channels
- `slack_users` - List users
- `slack_search` - Search messages
"""
    },
    {
        "title": "Jira MCP Server",
        "description": "MCP server for Jira issue tracking and project management.",
        "tags": ["automation", "api", "documentation"],
        "category": "Development Tools",
        "content": """# Jira MCP Server

Manage Jira issues and projects through MCP.

## Installation

```bash
npm install @mcp/jira-server
```

## Configuration

```json
{
  "mcpServers": {
    "jira": {
      "command": "npx",
      "args": ["@mcp/jira-server"],
      "env": {
        "JIRA_URL": "https://company.atlassian.net",
        "JIRA_EMAIL": "user@example.com",
        "JIRA_TOKEN": "your-api-token"
      }
    }
  }
}
```

## Tools

- `jira_create` - Create issues
- `jira_search` - Search with JQL
- `jira_update` - Update issues
- `jira_transition` - Change issue status
"""
    },
    {
        "title": "OpenAI MCP Server",
        "description": "MCP server for OpenAI API access including GPT and DALL-E.",
        "tags": ["llm", "openai", "api"],
        "category": "Code Generation",
        "content": """# OpenAI MCP Server

Access OpenAI models through MCP.

## Installation

```bash
npm install @mcp/openai-server
```

## Configuration

```json
{
  "mcpServers": {
    "openai": {
      "command": "npx",
      "args": ["@mcp/openai-server"],
      "env": { "OPENAI_API_KEY": "sk-..." }
    }
  }
}
```

## Tools

- `openai_chat` - Chat completions
- `openai_embed` - Generate embeddings
- `openai_image` - Generate images (DALL-E)
- `openai_transcribe` - Audio transcription
"""
    },
    {
        "title": "Sentry MCP Server",
        "description": "MCP server for Sentry error tracking and monitoring.",
        "tags": ["debugging", "automation", "api"],
        "category": "DevOps & Infrastructure",
        "content": """# Sentry MCP Server

Access Sentry error tracking through MCP.

## Installation

```bash
npm install @mcp/sentry-server
```

## Configuration

```json
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["@mcp/sentry-server"],
      "env": { "SENTRY_AUTH_TOKEN": "your-token" }
    }
  }
}
```

## Tools

- `sentry_issues` - List issues
- `sentry_issue` - Get issue details
- `sentry_events` - Get error events
- `sentry_resolve` - Resolve issues
"""
    },
]

# =============================================================================
# WORKFLOWS (5 items)
# =============================================================================

WORKFLOWS = [
    {
        "title": "PR Review Workflow",
        "description": "Automated workflow for reviewing pull requests with code analysis and security checks.",
        "tags": ["code-review", "automation", "ci-cd", "security"],
        "category": "Development Tools",
        "content": """# PR Review Workflow

Automated pull request review process.

## Workflow Steps

1. **Trigger**: PR opened or updated
2. **Code Analysis**: Run static analysis
3. **Security Scan**: Check for vulnerabilities
4. **Test Results**: Verify all tests pass
5. **Review Summary**: Generate AI review

## GitHub Actions Implementation

```yaml
name: PR Review

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Run Linter
        run: npm run lint

      - name: Security Scan
        uses: snyk/actions/node@master

      - name: Run Tests
        run: npm test

      - name: AI Review
        uses: ai-review/action@v1
        with:
          model: claude-3-sonnet
```

## Integration

Works with GitHub, GitLab, and Bitbucket.
"""
    },
    {
        "title": "Deployment Pipeline Workflow",
        "description": "End-to-end deployment workflow with staging, production, and rollback capabilities.",
        "tags": ["ci-cd", "docker", "kubernetes", "automation"],
        "category": "DevOps & Infrastructure",
        "content": """# Deployment Pipeline Workflow

Complete deployment automation.

## Stages

1. **Build**: Compile and create artifacts
2. **Test**: Run test suite
3. **Staging**: Deploy to staging
4. **Approval**: Manual gate
5. **Production**: Deploy to production
6. **Verify**: Health checks
7. **Rollback**: Auto-rollback on failure

## Implementation

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker build -t app:${{ github.sha }} .
      - run: docker push app:${{ github.sha }}

  staging:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/app app=app:${{ github.sha }}

  production:
    needs: staging
    environment: production
    runs-on: ubuntu-latest
    steps:
      - run: kubectl set image deployment/app app=app:${{ github.sha }}
```
"""
    },
    {
        "title": "Incident Response Workflow",
        "description": "Structured workflow for handling production incidents with escalation and post-mortem.",
        "tags": ["automation", "debugging", "documentation"],
        "category": "DevOps & Infrastructure",
        "content": """# Incident Response Workflow

Structured incident management process.

## Phases

1. **Detection**: Alert triggered
2. **Triage**: Assess severity
3. **Response**: Assign and communicate
4. **Resolution**: Fix and verify
5. **Post-mortem**: Document learnings

## Severity Levels

| Level | Response Time | Escalation |
|-------|---------------|------------|
| P1 | 15 min | Immediate |
| P2 | 1 hour | Team lead |
| P3 | 4 hours | Next standup |
| P4 | 24 hours | Backlog |

## Automation

```yaml
on_alert:
  - create_incident_channel
  - page_on_call
  - start_timer
  - gather_metrics

on_resolution:
  - update_status_page
  - close_incident_channel
  - schedule_postmortem
```
"""
    },
    {
        "title": "Code Migration Workflow",
        "description": "Step-by-step workflow for migrating codebases to new frameworks or languages.",
        "tags": ["refactoring", "automation", "testing"],
        "category": "Development Tools",
        "content": """# Code Migration Workflow

Systematic code migration process.

## Phases

1. **Analysis**: Assess current codebase
2. **Planning**: Create migration plan
3. **Setup**: Prepare new environment
4. **Migration**: Convert code incrementally
5. **Testing**: Verify functionality
6. **Deployment**: Roll out changes

## Migration Checklist

- [ ] Inventory current dependencies
- [ ] Identify breaking changes
- [ ] Set up parallel environments
- [ ] Create test coverage baseline
- [ ] Migrate core modules first
- [ ] Update documentation
- [ ] Train team on new stack

## Example: React Class to Hooks

```javascript
// Before
class Counter extends Component {
  state = { count: 0 };
  increment = () => this.setState({ count: this.state.count + 1 });
  render() {
    return <button onClick={this.increment}>{this.state.count}</button>;
  }
}

// After
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```
"""
    },
    {
        "title": "Documentation Generation Workflow",
        "description": "Automated workflow for generating and maintaining project documentation.",
        "tags": ["documentation", "automation", "ci-cd"],
        "category": "Documentation",
        "content": """# Documentation Generation Workflow

Automated documentation maintenance.

## Components

1. **API Docs**: From code/OpenAPI
2. **README**: Auto-generated sections
3. **Changelog**: From commits
4. **Architecture**: Diagram updates

## Implementation

```yaml
name: Docs

on:
  push:
    branches: [main]
    paths:
      - 'src/**'
      - 'docs/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Generate API Docs
        run: npx typedoc --out docs/api src/

      - name: Generate Changelog
        run: npx conventional-changelog -p angular -i CHANGELOG.md -s

      - name: Deploy Docs
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./docs
```

## Best Practices

- Keep docs close to code
- Automate everything possible
- Version documentation
- Include examples
"""
    },
]

# =============================================================================
# DOCS (5 items)
# =============================================================================

DOCS = [
    {
        "title": "Getting Started with AI Agents",
        "description": "Introduction to building and deploying AI agents for development workflows.",
        "tags": ["llm", "automation", "python"],
        "category": "Documentation",
        "content": """# Getting Started with AI Agents

Learn how to build and deploy AI agents for development.

## What are AI Agents?

AI agents are autonomous programs that use large language models to perform tasks, make decisions, and interact with external systems.

## Core Components

1. **LLM Backend**: The language model (Claude, GPT, etc.)
2. **Tools**: Functions the agent can call
3. **Memory**: Context and conversation history
4. **Planning**: Task decomposition and execution

## Basic Agent Structure

```python
from agents import Agent, Tool

# Define tools
@Tool
def search_code(query: str) -> str:
    \"\"\"Search codebase for relevant code.\"\"\"
    return code_search_api(query)

@Tool
def run_tests(path: str) -> str:
    \"\"\"Run tests at the specified path.\"\"\"
    return subprocess.run(["pytest", path])

# Create agent
agent = Agent(
    model="claude-3-opus",
    tools=[search_code, run_tests],
    system_prompt="You are a helpful coding assistant."
)

# Run agent
result = agent.run("Find and fix failing tests")
```

## Best Practices

- Start with simple, well-defined tasks
- Implement proper error handling
- Log all agent actions for debugging
- Set appropriate timeouts
- Use structured outputs when possible
"""
    },
    {
        "title": "Prompt Engineering Best Practices",
        "description": "Comprehensive guide to writing effective prompts for LLMs.",
        "tags": ["llm", "documentation", "anthropic", "openai"],
        "category": "Documentation",
        "content": """# Prompt Engineering Best Practices

Write effective prompts for better LLM outputs.

## Key Principles

### 1. Be Specific and Clear

```
Bad:  "Write some code"
Good: "Write a Python function that validates email addresses using regex"
```

### 2. Provide Context

```
You are a senior Python developer reviewing code.
The codebase uses FastAPI and SQLAlchemy.
Follow PEP 8 style guidelines.
```

### 3. Use Examples (Few-Shot)

```
Convert these sentences to questions:

Statement: The cat is sleeping.
Question: Is the cat sleeping?

Statement: Python is a programming language.
Question: Is Python a programming language?

Statement: {input}
Question:
```

### 4. Structure Your Output

```
Respond in the following JSON format:
{
  "summary": "brief summary",
  "issues": ["list", "of", "issues"],
  "suggestions": ["list", "of", "suggestions"]
}
```

### 5. Chain of Thought

```
Solve this step by step:
1. First, identify the problem
2. Then, analyze the relevant code
3. Finally, propose a solution with code
```

## Common Patterns

- **Role Assignment**: "You are an expert..."
- **Task Decomposition**: "Break this into steps..."
- **Constraints**: "Use only standard library..."
- **Format Specification**: "Return as JSON/markdown/code"
"""
    },
    {
        "title": "MCP Protocol Reference",
        "description": "Technical reference for the Model Context Protocol specification.",
        "tags": ["api", "llm", "documentation"],
        "category": "Documentation",
        "content": """# MCP Protocol Reference

Model Context Protocol technical specification.

## Overview

MCP enables AI models to interact with external tools and data sources through a standardized protocol.

## Message Types

### Request

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "search_code",
    "arguments": {
      "query": "function handleError"
    }
  }
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Found 3 matches..."
      }
    ]
  }
}
```

## Tool Definition

```json
{
  "name": "search_code",
  "description": "Search codebase for code matching query",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "Search query"
      }
    },
    "required": ["query"]
  }
}
```

## Server Implementation

```typescript
import { Server } from "@modelcontextprotocol/sdk/server";

const server = new Server({
  name: "my-mcp-server",
  version: "1.0.0"
});

server.setRequestHandler("tools/list", async () => ({
  tools: [/* tool definitions */]
}));

server.setRequestHandler("tools/call", async (request) => {
  // Handle tool calls
});
```
"""
    },
    {
        "title": "LangChain Integration Guide",
        "description": "Guide to integrating LangChain with your development workflow.",
        "tags": ["langchain", "llm", "python", "rag"],
        "category": "Code Generation",
        "content": """# LangChain Integration Guide

Integrate LangChain into your development workflow.

## Installation

```bash
pip install langchain langchain-openai langchain-anthropic
```

## Basic Chain

```python
from langchain_anthropic import ChatAnthropic
from langchain_core.prompts import ChatPromptTemplate

# Initialize model
model = ChatAnthropic(model="claude-3-sonnet-20240229")

# Create prompt template
prompt = ChatPromptTemplate.from_messages([
    ("system", "You are a helpful coding assistant."),
    ("user", "{input}")
])

# Create chain
chain = prompt | model

# Run chain
response = chain.invoke({"input": "Explain async/await in Python"})
```

## RAG Pipeline

```python
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Load and split documents
splitter = RecursiveCharacterTextSplitter(chunk_size=1000)
docs = splitter.split_documents(documents)

# Create vector store
vectorstore = Chroma.from_documents(docs, OpenAIEmbeddings())

# Create retriever
retriever = vectorstore.as_retriever()

# Build RAG chain
from langchain.chains import RetrievalQA
qa_chain = RetrievalQA.from_chain_type(
    llm=model,
    retriever=retriever
)
```

## Custom Tools

```python
from langchain.tools import tool

@tool
def search_codebase(query: str) -> str:
    \"\"\"Search the codebase for relevant code.\"\"\"
    # Implementation
    return results
```
"""
    },
    {
        "title": "RAG Architecture Patterns",
        "description": "Architectural patterns for building Retrieval-Augmented Generation systems.",
        "tags": ["rag", "llm", "langchain", "database"],
        "category": "Data & Analytics",
        "content": """# RAG Architecture Patterns

Design patterns for Retrieval-Augmented Generation.

## Basic RAG Architecture

```
User Query
    |
    v
+------------------+
|  Query Embedding |
+------------------+
    |
    v
+------------------+
|  Vector Search   |
+------------------+
    |
    v
+------------------+
|  Context Assembly|
+------------------+
    |
    v
+------------------+
|  LLM Generation  |
+------------------+
    |
    v
Response
```

## Advanced Patterns

### 1. Hybrid Search

Combine vector search with keyword search:

```python
results = vector_search(query, k=5)
keyword_results = bm25_search(query, k=5)
final_results = reciprocal_rank_fusion(results, keyword_results)
```

### 2. Query Rewriting

```python
rewritten_query = llm.invoke(
    f"Rewrite this query for better search results: {query}"
)
results = search(rewritten_query)
```

### 3. Contextual Compression

```python
from langchain.retrievers import ContextualCompressionRetriever

compressor = LLMChainExtractor.from_llm(llm)
compression_retriever = ContextualCompressionRetriever(
    base_retriever=retriever,
    base_compressor=compressor
)
```

### 4. Multi-Index RAG

```python
# Route queries to appropriate index
if is_code_query(query):
    results = code_index.search(query)
elif is_docs_query(query):
    results = docs_index.search(query)
else:
    results = general_index.search(query)
```

## Best Practices

- Chunk documents appropriately (500-1000 tokens)
- Include metadata for filtering
- Implement caching for embeddings
- Monitor retrieval quality
- Use reranking for better precision
"""
    },
]

# =============================================================================
# SKILLS (5 items)
# =============================================================================

SKILLS = [
    {
        "title": "dev-browser-skill",
        "description": "Browser automation and web scraping tool for developers. Enables element discovery, form interaction, screenshot generation, and page state validation.",
        "tags": ["automation", "testing", "web", "javascript", "performance"],
        "category": "Development Tools",
        "content": """# Dev Browser Skill

A comprehensive browser automation tool built on Playwright for developers.

## Features

- **Element Discovery**: Find and interact with DOM elements reliably
- **Form Automation**: Fill forms, submit data, handle authentication
- **Screenshot Generation**: Capture page states for testing and documentation
- **Page State Validation**: Assert page conditions and element properties
- **JavaScript Execution**: Run custom scripts in page context
- **Network Interception**: Monitor and control HTTP requests

## Usage

```typescript
import { BrowserSkill } from '@anthropic/skills/browser';

const browser = new BrowserSkill();
const page = await browser.newPage();

// Navigate and find element
await page.goto('https://example.com');
const element = await page.locator('button:has-text("Submit")');

// Take screenshot
await page.screenshot({ path: 'screenshot.png' });

// Fill form and submit
await page.fill('input[name="email"]', 'user@example.com');
await page.click('button[type="submit"]');

// Validate state
const success = await page.locator('.success-message').isVisible();
console.log('Form submitted:', success);
```

## Real-World Applications

- **Web Application Testing**: E2E test automation with zero flakiness
- **Competitive Analysis**: Scrape competitor websites systematically
- **Screenshot Documentation**: Auto-generate visual docs from live sites
- **Form Validation**: Comprehensive form interaction testing
- **Performance Monitoring**: Capture and analyze page load states

## Supported Browsers

- Chromium
- Firefox
- WebKit
"""
    },
    {
        "title": "api-code-generator-skill",
        "description": "Generate API client code from OpenAPI specifications. Creates type-safe clients in Python, TypeScript, and Go with automatic CRUD operations.",
        "tags": ["code-generation", "api", "typescript", "python", "automation"],
        "category": "Development Tools",
        "content": """# API Code Generator Skill

Automatically generate type-safe API client code from OpenAPI/Swagger specs.

## Features

- **Multi-Language Support**: Generate for Python, TypeScript, Go, Rust
- **Type Safety**: Full type definitions from OpenAPI schemas
- **CRUD Operations**: Automatic implementation of common patterns
- **Error Handling**: Structured error types with proper typing
- **Documentation**: Auto-generated docstrings and examples
- **Authentication**: Support for API keys, OAuth, JWT tokens

## Usage

```typescript
import { APICodeGenerator } from '@anthropic/skills/api-generator';

const generator = new APICodeGenerator();

const result = await generator.generateClient({
  openApiSpec: 'https://api.github.com/openapi.json',
  language: 'typescript',
  packageName: 'github-api-client',
  outputDir: './generated'
});

console.log('Generated client at:', result.outputPath);
```

## Generated Code Example

```typescript
// Auto-generated from OpenAPI spec
export class GitHubClient {
  constructor(private apiKey: string) {}

  async listRepositories(owner: string): Promise<Repository[]> {
    const response = await this.request('GET', `/users/${owner}/repos`);
    return response.data;
  }

  async createIssue(owner: string, repo: string, issue: IssueInput): Promise<Issue> {
    return this.request('POST', `/repos/${owner}/${repo}/issues`, issue);
  }
}
```

## Real-World Applications

- **SDK Development**: Ship official client libraries faster
- **Microservices**: Generate clients for internal service communication
- **Third-Party Integrations**: Quickly scaffold clients for partner APIs
- **Backend Codegen**: Generate server stubs and route handlers

## Supported Specifications

- OpenAPI 3.0+
- Swagger 2.0
- GraphQL schemas (coming soon)
"""
    },
    {
        "title": "docker-containerizer-skill",
        "description": "Analyze source code and generate optimized Dockerfiles with multi-stage builds, layer caching strategies, and security best practices.",
        "tags": ["devops", "docker", "automation", "infrastructure", "python"],
        "category": "Development Tools",
        "content": """# Docker Containerizer Skill

Automatically generate production-ready Dockerfiles from source code analysis.

## Features

- **Intelligent Analysis**: Detect runtime requirements, dependencies, entry points
- **Multi-Stage Builds**: Optimize image size with build/runtime separation
- **Layer Caching**: Arrange layers for maximum cache efficiency
- **Security Hardening**: Non-root users, minimal base images
- **Build Optimization**: Automatic dependency pruning
- **Docker Compose**: Generate compose files for multi-service apps

## Usage

```typescript
import { DockerContainerizer } from '@anthropic/skills/docker';

const containerizer = new DockerContainerizer();

const dockerfile = await containerizer.analyze({
  sourcePath: './my-app',
  framework: 'auto-detect',
  targetRegistry: 'ghcr.io/myorg'
});

console.log('Generated Dockerfile:\\n', dockerfile.content);
console.log('Estimated image size:', dockerfile.estimatedSize);
```

## Generated Dockerfile Example

```dockerfile
# Build stage
FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --user --no-cache-dir -r requirements.txt

# Runtime stage
FROM python:3.11-slim
RUN useradd -m -u 1000 appuser
WORKDIR /app
COPY --from=builder /root/.local /home/appuser/.local
COPY . .
USER appuser
ENV PATH=/home/appuser/.local/bin:$PATH
EXPOSE 8000
CMD ["python", "-m", "uvicorn", "main:app"]
```

## Real-World Applications

- **CI/CD Pipelines**: Automate Docker image generation in GitHub Actions
- **Microservices**: Generate containers for each service automatically
- **Development Environments**: Create consistent local dev containers
- **Legacy Migration**: Containerize existing applications quickly

## Supported Languages

- Python
- Node.js / TypeScript
- Go
- Java
- Ruby
- .NET
"""
    },
    {
        "title": "git-workflow-assistant-skill",
        "description": "Automate git workflows including intelligent commit messages, PR descriptions, branch strategy recommendations, and release automation.",
        "tags": ["git", "ci-cd", "automation", "documentation", "workflow"],
        "category": "Development Tools",
        "content": """# Git Workflow Assistant Skill

Automate and optimize your git workflows with intelligent assistance.

## Features

- **Smart Commit Messages**: Generate meaningful commits from code changes
- **PR Descriptions**: Auto-generate comprehensive PR descriptions
- **Branch Strategies**: Recommend optimal branching patterns
- **Release Automation**: Generate changelog and version bumps
- **Conflict Resolution**: Suggest resolutions for merge conflicts
- **Commit Analysis**: Detect issues and improvements in commit history

## Usage

```typescript
import { GitWorkflowAssistant } from '@anthropic/skills/git-assistant';

const assistant = new GitWorkflowAssistant();

// Generate commit message
const commitMsg = await assistant.generateCommitMessage({
  staged: ['src/api.ts', 'tests/api.test.ts'],
  style: 'conventional' // conventional, imperative, descriptive
});

// Generate PR description
const prDesc = await assistant.generatePRDescription({
  title: 'Add user authentication',
  baseCommits: 5,
  ticketId: 'PROJ-123'
});

// Get release notes
const releaseNotes = await assistant.generateReleaseNotes({
  version: '2.0.0',
  previousVersion: '1.9.5'
});
```

## Generated Outputs

### Commit Messages
```
feat(auth): implement JWT-based authentication

- Add JWT token generation and validation
- Implement refresh token rotation
- Add token blacklist for logout

Closes #456
```

### PR Descriptions
```
## Description
Implements JWT-based authentication system with token refresh mechanism.

## Changes
- 3 new endpoints: /login, /refresh, /logout
- 120+ test cases added
- Updated auth middleware

## Testing
- [ ] Manual testing on staging
- [x] All tests pass (98% coverage)

## Checklist
- [x] Documentation updated
- [x] No breaking changes
```

## Real-World Applications

- **Team Standards**: Enforce consistent commit conventions
- **Documentation**: Auto-generate changelogs for releases
- **Code Review**: Streamline PR creation and review
- **Release Management**: Automate version and release workflows

## Supported Platforms

- GitHub
- GitLab
- Bitbucket
- Gitea
"""
    },
    {
        "title": "performance-analyzer-skill",
        "description": "Profile application code and generate detailed performance reports with optimization suggestions, caching strategies, and bottleneck identification.",
        "tags": ["performance", "debugging", "python", "javascript", "automation"],
        "category": "Development Tools",
        "content": """# Performance Analyzer Skill

Comprehensive performance profiling and optimization analysis for applications.

## Features

- **Code Profiling**: CPU, memory, and I/O profiling across languages
- **Bottleneck Detection**: Automatically identify performance hotspots
- **Optimization Suggestions**: AI-powered recommendations with code examples
- **Caching Strategies**: Suggest appropriate caching layers and TTLs
- **Load Testing**: Generate load test scenarios and analysis
- **Comparative Analysis**: Compare performance across versions or implementations
- **Report Generation**: Beautiful HTML/PDF performance reports

## Usage

```typescript
import { PerformanceAnalyzer } from '@anthropic/skills/performance';

const analyzer = new PerformanceAnalyzer();

// Profile application
const report = await analyzer.analyzeApplication({
  sourcePath: './src',
  language: 'python',
  testScenario: 'e-commerce-checkout',
  iterations: 100
});

// Get optimization recommendations
const recommendations = await analyzer.getRecommendations({
  priority: 'critical', // critical, high, medium, low
  budget: { cpuTime: 50 } // 50% reduction target
});

console.log(report.summary);
recommendations.forEach(rec => {
  console.log(rec.title, ':', rec.estimatedImprovement);
});
```

## Analysis Report Example

```
Performance Analysis Report
===========================

Execution Time: 2.3s (baseline)
Memory Peak: 256MB
CPU Usage: 78%

Top Bottlenecks:
1. Database queries (45% of time)
   - N+1 problem in user loading
   - Suggestion: Implement batch loading

2. Image processing (30% of time)
   - Unoptimized resize operations
   - Suggestion: Use WebP + CDN caching

3. Template rendering (15% of time)
   - Missing caching layer
   - Suggestion: Implement Redis cache

Estimated Improvements:
- With recommendations: 0.8s (65% faster)
- With aggressive caching: 0.3s (87% faster)
```

## Real-World Applications

- **Production Optimization**: Identify real-world performance issues
- **Capacity Planning**: Understand resource requirements at scale
- **Before/After Comparison**: Measure impact of optimizations
- **Performance Regression**: Catch performance degradation in CI/CD
- **Cost Reduction**: Optimize cloud resource usage

## Supported Languages

- Python
- JavaScript / Node.js
- TypeScript
- Go
- Java
- Rust
"""
    },
]
