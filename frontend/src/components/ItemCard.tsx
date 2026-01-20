import { memo } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Item } from "@/lib/api"

export interface ItemCardProps {
  item: Item
  className?: string
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

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + "..."
}

export const ItemCard = memo(function ItemCard({ item, className }: ItemCardProps) {
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
            getTypeBadgeClass(item.type)
          )}
        >
          {item.type}
        </span>
      </div>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
        {truncateText(item.description, 120)}
      </p>
    </Link>
  )
})
