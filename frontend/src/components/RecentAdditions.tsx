import { useEffect, useState } from "react"
import { Clock } from "lucide-react"
import { api, type Item } from "@/lib/api"
import { ItemCard } from "./ItemCard"

export function RecentAdditions() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchRecentItems() {
      try {
        setLoading(true)
        setError(null)
        // Get most recent 5 items (sorted by created_at desc by default)
        const response = await api.getItems({ limit: 5, offset: 0 })
        setItems(response.data.data)
      } catch (err) {
        console.error("Failed to fetch recent items:", err)
        setError("Failed to load recent additions")
      } finally {
        setLoading(false)
      }
    }
    fetchRecentItems()
  }, [])

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Recent Additions</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[120px] animate-pulse rounded-lg bg-secondary"
              />
            ))}
          </div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Recent Additions</h2>
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Clock className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Recent Additions</h2>
          </div>
          <p className="text-muted-foreground">No items added yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Clock className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Recent Additions</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  )
}
