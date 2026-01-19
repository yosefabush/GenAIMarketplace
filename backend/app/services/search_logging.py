"""Search logging service for tracking search queries asynchronously."""

import threading
from typing import Optional

from app.core.database import SessionLocal
from app.models.search_log import SearchLog


class SearchLoggingService:
    """Service for logging search queries asynchronously."""

    @staticmethod
    def log_search(
        query: str,
        result_count: int,
        source: str = "web",
    ) -> None:
        """
        Log a search query asynchronously.

        This method spawns a background thread to log the search,
        ensuring the main request thread is not blocked.

        Args:
            query: The search query text
            result_count: Number of results returned
            source: Source of the search (default: "web")
        """
        thread = threading.Thread(
            target=SearchLoggingService._log_search_sync,
            args=(query, result_count, source),
            daemon=True,
        )
        thread.start()

    @staticmethod
    def _log_search_sync(
        query: str,
        result_count: int,
        source: str,
    ) -> None:
        """
        Synchronously log a search query to the database.

        This method is called in a background thread.

        Args:
            query: The search query text
            result_count: Number of results returned
            source: Source of the search
        """
        db = SessionLocal()
        try:
            search_log = SearchLog(
                query=query,
                result_count=result_count,
                source=source,
            )
            db.add(search_log)
            db.commit()
        except Exception:
            # Silently fail - logging should not impact search functionality
            db.rollback()
        finally:
            db.close()

    @staticmethod
    def log_search_sync(
        query: str,
        result_count: int,
        source: str = "web",
        db: Optional["SessionLocal"] = None,  # type: ignore[valid-type]
    ) -> None:
        """
        Log a search query synchronously (for testing or special cases).

        Args:
            query: The search query text
            result_count: Number of results returned
            source: Source of the search (default: "web")
            db: Optional database session (creates new one if not provided)
        """
        if db is None:
            db = SessionLocal()
            should_close = True
        else:
            should_close = False

        try:
            search_log = SearchLog(
                query=query,
                result_count=result_count,
                source=source,
            )
            db.add(search_log)
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            if should_close:
                db.close()
