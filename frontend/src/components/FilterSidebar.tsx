import { TypeFilterCheckboxes, type ContentTypeValue } from "@/components/TypeFilterCheckboxes"
import { CategoryDropdown } from "@/components/CategoryDropdown"
import { TagMultiSelect } from "@/components/TagMultiSelect"
import { cn } from "@/lib/utils"
import { Filter, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export interface FilterState {
  types: ContentTypeValue[]
  category: string | null
  tags: string[]
}

export interface FilterSidebarProps {
  filters: FilterState
  onFiltersChange: (filters: FilterState) => void
  className?: string
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  className,
}: FilterSidebarProps) {
  const handleTypesChange = (types: ContentTypeValue[]) => {
    onFiltersChange({ ...filters, types })
  }

  const handleCategoryChange = (category: string | null) => {
    onFiltersChange({ ...filters, category })
  }

  const handleTagsChange = (tags: string[]) => {
    onFiltersChange({ ...filters, tags })
  }

  const clearAllFilters = () => {
    onFiltersChange({
      types: [],
      category: null,
      tags: [],
    })
  }

  const hasActiveFilters =
    filters.types.length > 0 || filters.category !== null || filters.tags.length > 0

  return (
    <aside className={cn("space-y-6", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4" />
          <h2 className="font-semibold">Filters</h2>
        </div>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto p-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      <div className="space-y-6">
        <TypeFilterCheckboxes
          selectedTypes={filters.types}
          onTypesChange={handleTypesChange}
        />

        <div className="border-t border-border pt-6">
          <CategoryDropdown
            selectedCategory={filters.category}
            onCategoryChange={handleCategoryChange}
          />
        </div>

        <div className="border-t border-border pt-6">
          <TagMultiSelect
            selectedTags={filters.tags}
            onTagsChange={handleTagsChange}
          />
        </div>
      </div>
    </aside>
  )
}
