"""Full-text search service supporting SQLite FTS5 and PostgreSQL."""

from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings


class SearchService:
    """Service for full-text search supporting SQLite FTS5 and PostgreSQL."""

    @staticmethod
    def _is_postgres() -> bool:
        """Check if using PostgreSQL database."""
        return settings.DATABASE_URL.startswith("postgresql")

    @staticmethod
    def search(
        db: Session,
        query: str,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[int], int]:
        """
        Search items using full-text search with ranking.

        Args:
            db: Database session
            query: Search query string (supports multiple keywords)
            limit: Maximum number of results to return
            offset: Number of results to skip

        Returns:
            Tuple of (list of item IDs ordered by relevance, total count)
        """
        if not query or not query.strip():
            return [], 0

        if SearchService._is_postgres():
            return SearchService._search_postgres(db, query, limit, offset)
        else:
            return SearchService._search_sqlite(db, query, limit, offset)

    @staticmethod
    def _search_sqlite(
        db: Session,
        query: str,
        limit: int,
        offset: int,
    ) -> tuple[list[int], int]:
        """Search using SQLite FTS5 with BM25 ranking."""
        cleaned_query = SearchService._prepare_query_sqlite(query)

        if not cleaned_query:
            return [], 0

        count_sql = text("""
            SELECT COUNT(*)
            FROM items_fts
            WHERE items_fts MATCH :query
        """)
        count_result = db.execute(count_sql, {"query": cleaned_query})
        total_count = count_result.scalar() or 0

        if total_count == 0:
            return [], 0

        search_sql = text("""
            SELECT rowid
            FROM items_fts
            WHERE items_fts MATCH :query
            ORDER BY bm25(items_fts) ASC
            LIMIT :limit OFFSET :offset
        """)

        result = db.execute(
            search_sql,
            {"query": cleaned_query, "limit": limit, "offset": offset}
        )

        item_ids = [row[0] for row in result.fetchall()]
        return item_ids, total_count

    @staticmethod
    def _search_postgres(
        db: Session,
        query: str,
        limit: int,
        offset: int,
    ) -> tuple[list[int], int]:
        """Search using PostgreSQL full-text search with ts_rank."""
        cleaned_query = SearchService._prepare_query_postgres(query)

        if not cleaned_query:
            return [], 0

        count_sql = text("""
            SELECT COUNT(*)
            FROM items
            WHERE search_vector @@ to_tsquery('english', :query)
        """)
        count_result = db.execute(count_sql, {"query": cleaned_query})
        total_count = count_result.scalar() or 0

        if total_count == 0:
            return [], 0

        search_sql = text("""
            SELECT id
            FROM items
            WHERE search_vector @@ to_tsquery('english', :query)
            ORDER BY ts_rank(search_vector, to_tsquery('english', :query)) DESC
            LIMIT :limit OFFSET :offset
        """)

        result = db.execute(
            search_sql,
            {"query": cleaned_query, "limit": limit, "offset": offset}
        )

        item_ids = [row[0] for row in result.fetchall()]
        return item_ids, total_count

    @staticmethod
    def _prepare_query_sqlite(query: str) -> Optional[str]:
        """Prepare a search query for SQLite FTS5."""
        query = query.strip()
        if not query:
            return None

        words = [word.strip() for word in query.split() if word.strip()]

        if not words:
            return None

        escaped_words = []
        for word in words:
            escaped = word.replace('"', '""')
            escaped_words.append(f'"{escaped}"')

        return " ".join(escaped_words)

    @staticmethod
    def _prepare_query_postgres(query: str) -> Optional[str]:
        """Prepare a search query for PostgreSQL tsquery."""
        query = query.strip()
        if not query:
            return None

        words = [word.strip() for word in query.split() if word.strip()]

        if not words:
            return None

        # Escape special characters and join with AND operator
        escaped_words = []
        for word in words:
            # Remove characters that could break tsquery
            cleaned = ''.join(c for c in word if c.isalnum())
            if cleaned:
                escaped_words.append(cleaned)

        if not escaped_words:
            return None

        return " & ".join(escaped_words)

    @staticmethod
    def rebuild_index(db: Session) -> None:
        """Rebuild the search index from scratch."""
        if SearchService._is_postgres():
            # PostgreSQL: Update the search_vector column
            db.execute(text("""
                UPDATE items
                SET search_vector = to_tsvector('english',
                    coalesce(title, '') || ' ' ||
                    coalesce(description, '') || ' ' ||
                    coalesce(content, '')
                )
            """))
        else:
            # SQLite: Rebuild FTS5 index
            db.execute(text("DELETE FROM items_fts"))
            db.execute(text("""
                INSERT INTO items_fts(rowid, title, description, content)
                SELECT id, title, description, content FROM items
            """))

        db.commit()

    @staticmethod
    def index_item(db: Session, item_id: int, title: str, description: str, content: str) -> None:
        """Add or update an item in the search index."""
        if SearchService._is_postgres():
            # PostgreSQL: search_vector is updated automatically via trigger
            pass
        else:
            # SQLite: Manual FTS5 update
            db.execute(
                text("DELETE FROM items_fts WHERE rowid = :id"),
                {"id": item_id}
            )
            db.execute(
                text("""
                    INSERT INTO items_fts(rowid, title, description, content)
                    VALUES (:id, :title, :description, :content)
                """),
                {"id": item_id, "title": title, "description": description, "content": content}
            )

    @staticmethod
    def remove_from_index(db: Session, item_id: int) -> None:
        """Remove an item from the search index."""
        if SearchService._is_postgres():
            # PostgreSQL: Row deletion handles it automatically
            pass
        else:
            # SQLite: Manual FTS5 deletion
            db.execute(
                text("DELETE FROM items_fts WHERE rowid = :id"),
                {"id": item_id}
            )
