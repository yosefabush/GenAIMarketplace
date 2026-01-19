import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { api, type Tag } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, X } from "lucide-react"

export interface TagMultiSelectProps {
  selectedTags: string[]
  onTagsChange: (tags: string[]) => void
  className?: string
}

export function TagMultiSelect({
  selectedTags,
  onTagsChange,
  className,
}: TagMultiSelectProps) {
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isExpanded, setIsExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function fetchTags() {
      try {
        const response = await api.getTags()
        if (!cancelled) {
          setTags(response.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch tags:", error)
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchTags()

    return () => {
      cancelled = true
    }
  }, [])

  const handleTagToggle = (tagName: string, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTags, tagName])
    } else {
      onTagsChange(selectedTags.filter((t) => t !== tagName))
    }
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  // Show first 5 tags by default, expand to show all
  const visibleTags = isExpanded ? tags : tags.slice(0, 5)
  const hasMoreTags = tags.length > 5

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">Tags</h3>
        {selectedTags.length > 0 && (
          <button
            type="button"
            onClick={clearAllTags}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags available</p>
      ) : (
        <>
          <div className="space-y-2">
            {visibleTags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`tag-${tag.id}`}
                  checked={selectedTags.includes(tag.name)}
                  onCheckedChange={(checked) =>
                    handleTagToggle(tag.name, checked === true)
                  }
                />
                <Label
                  htmlFor={`tag-${tag.id}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {tag.name}
                </Label>
              </div>
            ))}
          </div>

          {hasMoreTags && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4" />
                  Show {tags.length - 5} more
                </>
              )}
            </button>
          )}
        </>
      )}
    </div>
  )
}
