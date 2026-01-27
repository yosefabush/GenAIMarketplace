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

// Color classes mapped by color name (for dynamic itemType colors)
const colorClasses: Record<string, string> = {
  blue: "bg-[#e6f4fa] text-[#1e3a5f] dark:bg-[#1a3d5c] dark:text-[#7dd3fc]",
  green: "bg-[#e6f7f2] text-[#0d6e5b] dark:bg-[#134e4a] dark:text-[#5eead4]",
  purple: "bg-[#f0e6fa] text-[#5b21b6] dark:bg-[#3b2763] dark:text-[#c4b5fd]",
  orange: "bg-[#fff1e6] text-[#c2410c] dark:bg-[#4a2c17] dark:text-[#fdba74]",
  gray: "bg-[#f0f4f8] text-[#475569] dark:bg-[#1e293b] dark:text-[#94a3b8]",
  indigo: "bg-[#e6f0fa] text-[#1e40af] dark:bg-[#1e3a5f] dark:text-[#93c5fd]",
  red: "bg-[#fef2f2] text-[#dc2626] dark:bg-[#450a0a] dark:text-[#fca5a5]",
  yellow: "bg-[#fefce8] text-[#ca8a04] dark:bg-[#422006] dark:text-[#fde047]",
  pink: "bg-[#fdf2f8] text-[#db2777] dark:bg-[#500724] dark:text-[#f9a8d4]",
  teal: "bg-[#f0fdfa] text-[#0d9488] dark:bg-[#134e4a] dark:text-[#5eead4]",
}

// Fallback colors for legacy type names (when itemTypes not provided)
const fallbackTypeColors: Record<string, string> = {
  agent: colorClasses.blue,
  prompt: colorClasses.green,
  mcp: colorClasses.purple,
  workflow: colorClasses.orange,
  docs: colorClasses.teal,
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
