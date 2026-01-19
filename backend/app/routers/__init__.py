from app.routers.items import router as items_router
from app.routers.categories import router as categories_router
from app.routers.tags import router as tags_router
from app.routers.search import router as search_router

__all__ = ["items_router", "categories_router", "tags_router", "search_router"]
