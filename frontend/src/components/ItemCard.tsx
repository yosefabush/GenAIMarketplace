import { memo } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Item, ItemType } from "@/lib/api"
import { LikeButton } from "./LikeButton"

export interface ItemCardProps {
  item: Item
  className?: string
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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

export const ItemCard = memo(function ItemCard({ item, className, itemTypes }: ItemCardProps) {
  return (
    <Link
      to={`/items/${item.id}`}
      className={cn(
        "block rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:shadow-md",
        className
      )}
    >
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
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {truncateText(item.description, 120)}
      </p>
      <div className="mt-3 flex items-center justify-end">
        <LikeButton
          itemId={item.id}
          initialLikeCount={item.like_count || 0}
          size="sm"
        />
      </div>
    </Link>
  )
})
