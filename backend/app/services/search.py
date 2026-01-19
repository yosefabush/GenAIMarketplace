"""Full-text search service using SQLite FTS5."""

from typing import Optional
from sqlalchemy import text
from sqlalchemy.orm import Session


class SearchService:
    """Service for full-text search using SQLite FTS5 with BM25 ranking."""

    @staticmethod
    def search(
        db: Session,
        query: str,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[int], int]:
        """
        Search items using FTS5 full-text search with BM25 ranking.

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

        # Clean and prepare the query for FTS5
        # FTS5 supports multiple keywords separated by spaces (implicit AND)
        # We'll use MATCH with the query as-is for phrase matching,
        # or convert to OR for broader results
        cleaned_query = SearchService._prepare_query(query)

        if not cleaned_query:
            return [], 0

        # Get total count of matching items
        count_sql = text("""
            SELECT COUNT(*)
            FROM items_fts
            WHERE items_fts MATCH :query
        """)
        count_result = db.execute(count_sql, {"query": cleaned_query})
        total_count = count_result.scalar() or 0

        if total_count == 0:
            return [], 0

        # Search with BM25 ranking
        # bm25() returns negative values, so we ORDER BY bm25() ASC
        # (more negative = better match)
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
    def _prepare_query(query: str) -> Optional[str]:
        """
        Prepare a search query for FTS5.

        Handles multiple keywords by joining them with implicit AND.
        Escapes special FTS5 characters.

        Args:
            query: Raw search query

        Returns:
            Prepared query string for FTS5 MATCH
        """
        # Strip whitespace and check if empty
        query = query.strip()
        if not query:
            return None

        # Split into words and filter empty strings
        words = [word.strip() for word in query.split() if word.strip()]

        if not words:
            return None

        # Escape special FTS5 characters in each word
        # FTS5 special characters: " * ^ : ( ) { } -
        escaped_words = []
        for word in words:
            # Escape quotes by doubling them
            escaped = word.replace('"', '""')
            # Wrap each word in quotes to treat as a literal term
            escaped_words.append(f'"{escaped}"')

        # Join with space (implicit AND in FTS5)
        return " ".join(escaped_words)

    @staticmethod
    def rebuild_index(db: Session) -> None:
        """
        Rebuild the FTS5 index from scratch.

        This can be useful after bulk operations or if the index
        becomes corrupted.

        Args:
            db: Database session
        """
        # Delete all entries from FTS table
        db.execute(text("DELETE FROM items_fts"))

        # Re-populate from items table
        db.execute(text("""
            INSERT INTO items_fts(rowid, title, description, content)
            SELECT id, title, description, content FROM items
        """))

        db.commit()
