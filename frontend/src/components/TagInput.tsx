import { useEffect, useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { api, type Tag } from "@/lib/api"
import { cn } from "@/lib/utils"
import { ChevronDown, ChevronUp, X } from "lucide-react"

export interface TagInputProps {
  selectedTagIds: number[]
  onTagsChange: (tagIds: number[]) => void
  className?: string
  error?: string
}

export function TagInput({
  selectedTagIds,
  onTagsChange,
  className,
  error,
}: TagInputProps) {
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
      } catch (err) {
        console.error("Failed to fetch tags:", err)
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

  const handleTagToggle = (tagId: number, checked: boolean) => {
    if (checked) {
      onTagsChange([...selectedTagIds, tagId])
    } else {
      onTagsChange(selectedTagIds.filter((id) => id !== tagId))
    }
  }

  const clearAllTags = () => {
    onTagsChange([])
  }

  // Show first 8 tags by default, expand to show all
  const visibleTags = isExpanded ? tags : tags.slice(0, 8)
  const hasMoreTags = tags.length > 8

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label className={cn(error && "text-destructive")}>
          Tags
        </Label>
        {selectedTagIds.length > 0 && (
          <button
            type="button"
            onClick={clearAllTags}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Clear ({selectedTagIds.length})
          </button>
        )}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading tags...</p>
      ) : tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tags available</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 border rounded-md bg-background">
            {visibleTags.map((tag) => (
              <div key={tag.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`editor-tag-${tag.id}`}
                  checked={selectedTagIds.includes(tag.id)}
                  onCheckedChange={(checked) =>
                    handleTagToggle(tag.id, checked === true)
                  }
                />
                <Label
                  htmlFor={`editor-tag-${tag.id}`}
                  className="text-sm font-normal cursor-pointer truncate"
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
                  Show {tags.length - 8} more
                </>
              )}
            </button>
          )}
        </>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
    </div>
  )
}
