import { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import { api, type Item } from "@/lib/api"
import { cn } from "@/lib/utils"

interface RelatedItemsProps {
  itemId: number
  currentPath: string
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

export function RelatedItems({ itemId, currentPath }: RelatedItemsProps) {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)

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
                  getTypeBadgeClass(item.type)
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
