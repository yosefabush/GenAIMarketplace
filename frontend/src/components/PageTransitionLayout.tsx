import { useEffect, useRef } from "react"
import { Outlet, useLocation } from "react-router-dom"

export default function PageTransitionLayout() {
  const location = useLocation()
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    // Remove then re-add the animation class to retrigger on every navigation
    el.classList.remove("page-transition-enter")
    // Force a reflow so the browser recognises the removal
    void el.offsetWidth
    el.classList.add("page-transition-enter")
  }, [location.pathname])

  return (
    <div ref={containerRef} className="page-transition-enter">
      <Outlet />
    </div>
  )
}
