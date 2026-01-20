import { lazy, Suspense } from "react"
import { createBrowserRouter } from "react-router-dom"
import Home from "./pages/Home"
import Search from "./pages/Search"
import ItemDetail from "./pages/ItemDetail"
import NotFound from "./pages/NotFound"
import ProtectedRoute from "./components/ProtectedRoute"

// Lazy load admin routes for code splitting
const AdminLogin = lazy(() => import("./pages/admin/Login"))
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"))
const AdminEditor = lazy(() => import("./pages/admin/Editor"))
const AdminCategories = lazy(() => import("./pages/admin/Categories"))
const AdminTags = lazy(() => import("./pages/admin/Tags"))
const AdminAnalytics = lazy(() => import("./pages/admin/Analytics"))

// Loading fallback for lazy-loaded routes
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    </div>
  )
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/search",
    element: <Search />,
  },
  {
    path: "/items/:id",
    element: <ItemDetail />,
  },
  {
    path: "/admin/login",
    element: (
      <Suspense fallback={<PageLoader />}>
        <AdminLogin />
      </Suspense>
    ),
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminDashboard />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/editor",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminEditor />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/editor/:id",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminEditor />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/categories",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminCategories />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/tags",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminTags />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute>
        <Suspense fallback={<PageLoader />}>
          <AdminAnalytics />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
