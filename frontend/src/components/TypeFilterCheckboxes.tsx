import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { useItemTypes } from "@/hooks/useItemTypes"

// ContentTypeValue is now dynamic based on database slugs
export type ContentTypeValue = string

export interface TypeFilterCheckboxesProps {
  selectedTypes: ContentTypeValue[]
  onTypesChange: (types: ContentTypeValue[]) => void
  className?: string
}

export function TypeFilterCheckboxes({
  selectedTypes,
  onTypesChange,
  className,
}: TypeFilterCheckboxesProps) {
  const { itemTypes, isLoading } = useItemTypes()

  const handleCheckChange = (type: ContentTypeValue, checked: boolean) => {
    if (checked) {
      onTypesChange([...selectedTypes, type])
    } else {
      onTypesChange(selectedTypes.filter((t) => t !== type))
    }
  }

  // Show skeleton loading state
  if (isLoading) {
    return (
      <div className={cn("space-y-3", className)}>
        <h3 className="text-sm font-semibold text-foreground">Type</h3>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="h-4 w-4 animate-pulse rounded bg-secondary" />
              <div className="h-4 w-16 animate-pulse rounded bg-secondary" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <h3 className="text-sm font-semibold text-foreground">Type</h3>
      <div className="space-y-2">
        {itemTypes.map((type) => (
          <div key={type.slug} className="flex items-center space-x-2">
            <Checkbox
              id={`type-${type.slug}`}
              checked={selectedTypes.includes(type.slug)}
              onCheckedChange={(checked) =>
                handleCheckChange(type.slug, checked === true)
              }
            />
            <Label
              htmlFor={`type-${type.slug}`}
              className="text-sm font-normal cursor-pointer"
            >
              {type.name}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}
