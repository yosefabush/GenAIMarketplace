import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { api, type Item, type ItemType } from "@/lib/api"
import { cn } from "@/lib/utils"
import { useItemTypes } from "@/hooks/useItemTypes"

interface RelatedItemsProps {
  itemId: number
  currentPath: string
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

// Fallback colors for legacy type names
const fallbackTypeColors: Record<string, string> = {
  agent: colorClasses.blue,
  prompt: colorClasses.green,
  mcp: colorClasses.purple,
  workflow: colorClasses.orange,
  docs: colorClasses.gray,
  skill: colorClasses.indigo,
}

function getTypeBadgeClass(type: string, itemTypes?: ItemType[]): string {
  if (itemTypes && itemTypes.length > 0) {
    const itemType = itemTypes.find(
      (t) => t.slug.toLowerCase() === type.toLowerCase() || t.name.toLowerCase() === type.toLowerCase()
    )
    if (itemType?.color) {
      return colorClasses[itemType.color] || colorClasses.gray
    }
  }
  return fallbackTypeColors[type.toLowerCase()] || colorClasses.gray
}

export function RelatedItems({ itemId, currentPath }: RelatedItemsProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const { itemTypes } = useItemTypes()

  useEffect(() => {
    let cancelled = false

    async function fetchRelated() {
      try {
        const response = await api.getRelatedItems(itemId, 5)
        if (!cancelled && response.data.success) {
          setItems(response.data.data)
        }
      } catch (err) {
        // Silently fail - related items are not critical
        console.error("Failed to fetch related items:", err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchRelated()

    return () => {
      cancelled = true
    }
  }, [itemId])

  // Don't render anything if loading or no items
  if (loading || items.length === 0) {
    return null
  }

  return (
    <section className="mt-8">
      <h2 className="text-lg font-semibold text-card-foreground mb-4">
        Related Items
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Link
            key={item.id}
            to={`/items/${item.id}`}
            state={{ from: currentPath }}
            className="group block rounded-lg border border-border bg-card p-4 hover:border-primary/50 hover:shadow-sm transition-all"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-medium text-card-foreground group-hover:text-primary line-clamp-1">
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
            <p className="text-sm text-muted-foreground line-clamp-2">
              {item.description}
            </p>
          </Link>
        ))}
      </div>
    </section>
  )
}
