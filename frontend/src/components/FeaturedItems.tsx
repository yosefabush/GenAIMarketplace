import { useEffect, useState } from "react"
import { Star } from "lucide-react"
import { api, type Item } from "@/lib/api"
import { ItemCard } from "./ItemCard"

export function FeaturedItems() {
  const [items, setItems] = useState<Item[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchFeaturedItems() {
      try {
        setLoading(true)
        setError(null)
        // Get most popular items (sorted by views) as featured
        const response = await api.search({ sort: "views", limit: 5 })
        setItems(response.data.data)
      } catch (err) {
        console.error("Failed to fetch featured items:", err)
        setError("Failed to load featured items")
      } finally {
        setLoading(false)
      }
    }
    fetchFeaturedItems()
  }, [])

  if (loading) {
    return (
      <section className="py-8 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Featured</h2>
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
      <section className="py-8 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Featured</h2>
          </div>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </section>
    )
  }

  if (items.length === 0) {
    return (
      <section className="py-8 bg-secondary/30">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-2 mb-6">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-semibold text-foreground">Featured</h2>
          </div>
          <p className="text-muted-foreground">No featured items yet.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-2 mb-6">
          <Star className="h-5 w-5 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Featured</h2>
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
