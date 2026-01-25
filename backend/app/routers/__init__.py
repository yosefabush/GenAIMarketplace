from app.routers.items import router as items_router
from app.routers.categories import router as categories_router
from app.routers.tags import router as tags_router
from app.routers.item_types import router as item_types_router
from app.routers.search import router as search_router
from app.routers.auth import router as auth_router
from app.routers.analytics import router as analytics_router
from app.routers.recommendations import router as recommendations_router
from app.routers.seed import router as seed_router

__all__ = [
    "items_router",
    "categories_router",
    "tags_router",
    "item_types_router",
    "search_router",
    "auth_router",
    "analytics_router",
    "recommendations_router",
    "seed_router",
]
