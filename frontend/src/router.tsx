import { createBrowserRouter } from "react-router-dom"
import Home from "./pages/Home"
import Search from "./pages/Search"
import ItemDetail from "./pages/ItemDetail"
import NotFound from "./pages/NotFound"
import AdminLogin from "./pages/admin/Login"
import AdminDashboard from "./pages/admin/Dashboard"
import AdminEditor from "./pages/admin/Editor"
import AdminCategories from "./pages/admin/Categories"
import AdminTags from "./pages/admin/Tags"
import AdminAnalytics from "./pages/admin/Analytics"
import ProtectedRoute from "./components/ProtectedRoute"

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
    element: <AdminLogin />,
  },
  {
    path: "/admin/dashboard",
    element: (
      <ProtectedRoute>
        <AdminDashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/editor",
    element: (
      <ProtectedRoute>
        <AdminEditor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/editor/:id",
    element: (
      <ProtectedRoute>
        <AdminEditor />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/categories",
    element: (
      <ProtectedRoute>
        <AdminCategories />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/tags",
    element: (
      <ProtectedRoute>
        <AdminTags />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin/analytics",
    element: (
      <ProtectedRoute>
        <AdminAnalytics />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <NotFound />,
  },
])
