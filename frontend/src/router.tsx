import { createBrowserRouter } from "react-router-dom"
import Home from "./pages/Home"
import Search from "./pages/Search"
import ItemDetail from "./pages/ItemDetail"
import NotFound from "./pages/NotFound"

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
    path: "*",
    element: <NotFound />,
  },
])
