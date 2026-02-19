import { memo } from "react"
import { Link } from "react-router-dom"
import { cn } from "@/lib/utils"
import type { Item, ItemType } from "@/lib/api"
import { LikeButton } from "./LikeButton"

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

function getFullImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  if (url.startsWith('http')) return url
  return `${API_BASE_URL}${url}`
}

export interface ItemCardProps {
  item: Item
  className?: string
  itemTypes?: ItemType[]
}

const colorClasses: Record<string, string> = {
  blue: "bg-[#e6f4fa] text-[#1e3a5f] dark:bg-[#1a3d5c] dark:text-[#7dd3fc]",
  green: "bg-[#e6f7f2] text-[#0d6e5b] dark:bg-[#134e4a] dark:text-[#5eead4]",
  purple: "bg-[#f0e6fa] text-[#5b21b6] dark:bg-[#3b2763] dark:text-[#c4b5fd]",
  orange: "bg-[#fff1e6] text-[#c2410c] dark:bg-[#4a2c17] dark:text-[#fdba74]",
  gray: "bg-[#f0f4f8] text-[#475569] dark:bg-[#1e293b] dark:text-[#94a3b8]",
  indigo: "bg-[#e6f0fa] text-[#1e40af] dark:bg-[#1e3a5f] dark:text-[#93c5fd]",
  red: "bg-[#fde8e8] text-[#991b1b] dark:bg-[#4a1d1d] dark:text-[#fca5a5]",
  yellow: "bg-[#fef9c3] text-[#854d0e] dark:bg-[#422006] dark:text-[#fde047]",
  pink: "bg-[#fce7f3] text-[#9d174d] dark:bg-[#4a1d34] dark:text-[#f9a8d4]",
  cyan: "bg-[#e0f7fa] text-[#155e75] dark:bg-[#164e63] dark:text-[#67e8f9]",
  white: "bg-[#f0f4f8] text-[#475569] dark:bg-[#1e293b] dark:text-[#94a3b8]",
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
  const imageUrl = getFullImageUrl(item.image_url)

  return (
    <Link
      to={`/items/${item.id}`}
      className={cn(
        "block rounded-lg border border-border bg-card overflow-hidden transition-all hover:border-primary/50 hover:shadow-md",
        className
      )}
    >
      {imageUrl && (
        <img
          src={imageUrl}
          alt={item.title}
          className="w-full h-36 object-cover"
        />
      )}
      <div className="p-4">
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
      </div>
    </Link>
  )
})
