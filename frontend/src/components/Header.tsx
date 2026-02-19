import { Link } from "react-router-dom"
import { Cpu } from "lucide-react"
import { ThemeToggle } from "./ThemeToggle"

interface HeaderProps {
  showBackButton?: boolean
  backTo?: string
  children?: React.ReactNode
}

export function Header({ showBackButton, backTo, children }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Logo/Brand */}
          <div className="flex items-center gap-3">
            {showBackButton && backTo && (
              <Link
                to={backTo}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground mr-2"
                aria-label="Go back"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m12 19-7-7 7-7" />
                  <path d="M19 12H5" />
                </svg>
              </Link>
            )}
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Cpu className="h-4 w-4" />
              </div>
              <span className="font-semibold text-foreground hidden sm:inline">
                AudioCodes AI Marketplace
              </span>
            </Link>
          </div>

          {/* Center: Custom content (e.g., search bar) */}
          {children && <div className="flex-1 flex justify-center">{children}</div>}

          {/* Right: Theme toggle */}
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
