import { memo, useEffect, useRef } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Item, ItemType } from "@/lib/api"
import { Eye } from "lucide-react"
import { LikeButton } from "./LikeButton"

export interface SearchResultCardProps {
  item: Item
  className?: string
  isHighlighted?: boolean
  itemTypes?: ItemType[]
}

// Color mapping from color name to Tailwind classes (light/dark variants)
const colorClasses: Record<string, string> = {
  blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  purple: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  orange: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  gray: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  yellow: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  pink: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
  indigo: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  cyan: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200",
}

// Fallback colors for legacy type names (when itemTypes not provided)
const fallbackTypeColors: Record<string, string> = {
  agent: colorClasses.blue,
  prompt: colorClasses.green,
  mcp: colorClasses.purple,
  workflow: colorClasses.orange,
  docs: colorClasses.gray,
  skill: colorClasses.indigo,
}

function getTypeBadgeClass(type: string, itemTypes?: ItemType[]): string {
  // If itemTypes provided, look up the color from the matching type
  if (itemTypes && itemTypes.length > 0) {
    const itemType = itemTypes.find(
      (t) => t.slug.toLowerCase() === type.toLowerCase() || t.name.toLowerCase() === type.toLowerCase()
    )
    if (itemType?.color) {
      return colorClasses[itemType.color] || colorClasses.gray
    }
  }
  // Fallback to legacy hardcoded colors
  return fallbackTypeColors[type.toLowerCase()] || colorClasses.gray
}

export const SearchResultCard = memo(function SearchResultCard({ item, className, isHighlighted = false, itemTypes }: SearchResultCardProps) {
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
            getTypeBadgeClass(item.type, itemTypes)
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

        {/* View Count and Like Button - pushed to the right */}
        <div className="ml-auto flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {item.view_count}
          </span>
          <LikeButton
            itemId={item.id}
            initialLikeCount={item.like_count || 0}
            size="sm"
          />
        </div>
      </div>
    </Link>
  )
})
