import { useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Item } from "@/lib/api"
import { Eye } from "lucide-react"

export interface SearchResultCardProps {
  item: Item
  className?: string
  isHighlighted?: boolean
}

const typeColors: Record<string, string> = {
  agent: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  prompt: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  mcp: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  workflow: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  docs: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
}

function getTypeBadgeClass(type: string): string {
  return typeColors[type.toLowerCase()] || typeColors.docs
}

export function SearchResultCard({ item, className, isHighlighted = false }: SearchResultCardProps) {
  const cardRef = useRef<HTMLAnchorElement>(null)

  // Scroll highlighted card into view
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      })
    }
  }, [isHighlighted])

  return (
    <Link
      ref={cardRef}
      to={`/items/${item.id}`}
      className={cn(
        "block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md",
        isHighlighted && "ring-2 ring-primary border-primary/50 shadow-md",
        className
      )}
    >
      {/* Header: Title and Type Badge */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold text-card-foreground line-clamp-1">
          {item.title}
        </h3>
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
            getTypeBadgeClass(item.type)
          )}
        >
          {item.type}
        </span>
      </div>

      {/* Description Preview */}
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {item.description}
      </p>

      {/* Metadata Row: Category, Tags, View Count */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        {/* Category */}
        {item.category && (
          <span className="rounded bg-secondary px-2 py-0.5">
            {item.category.name}
          </span>
        )}

        {/* Tags */}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {item.tags.slice(0, 3).map((tag) => (
              <span
                key={tag.id}
                className="rounded border border-border px-1.5 py-0.5"
              >
                {tag.name}
              </span>
            ))}
            {item.tags.length > 3 && (
              <span className="px-1.5 py-0.5">+{item.tags.length - 3}</span>
            )}
          </div>
        )}

        {/* View Count - pushed to the right */}
        <span className="ml-auto flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {item.view_count}
        </span>
      </div>
    </Link>
  )
}
