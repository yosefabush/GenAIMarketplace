import { createBrowserRouter } from "react-router-dom"
import Home from "./pages/Home"
import Search from "./pages/Search"
import ItemDetail from "./pages/ItemDetail"
import NotFound from "./pages/NotFound"
import AdminLogin from "./pages/admin/Login"
import AdminDashboard from "./pages/admin/Dashboard"
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
    path: "*",
    element: <NotFound />,
  },
])
