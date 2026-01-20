import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { api, type Category } from "@/lib/api"
import { cn } from "@/lib/utils"

export interface CategoryDropdownProps {
  selectedCategory: string | null
  onCategoryChange: (categoryId: string | null) => void
  className?: string
}

export function CategoryDropdown({
  selectedCategory,
  onCategoryChange,
  className,
}: CategoryDropdownProps) {
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchCategories() {
      try {
        const response = await api.getCategories()
        if (!cancelled) {
          setCategories(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch categories:", error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchCategories()

    return () => {
      cancelled = true
    }
  }, [])

  const handleValueChange = (value: string) => {
    onCategoryChange(value === "all" ? null : value)
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">Category</h3>
      <Select
        value={selectedCategory ?? "all"}
        onValueChange={handleValueChange}
        disabled={isLoading}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={isLoading ? "Loading..." : "All Categories"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
